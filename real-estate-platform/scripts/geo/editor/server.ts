import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import type { Polygon, MultiPolygon } from 'geojson';
import { computeBoundaryRow } from './geo-compute';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.GEO_EDITOR_PORT ?? 5300);

const pool = new pg.Pool({
  connectionString: process.env.RDS_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 4,
});

if (!process.env.RDS_DATABASE_URL) {
  process.stderr.write('RDS_DATABASE_URL is required\n');
  process.exit(1);
}

const ACTIVE_STATUSES = ['Active', 'Active Under Contract', 'Pending', 'Coming Soon'];

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function getBoundaries(): Promise<unknown> {
  const { rows } = await pool.query(
    `SELECT slug, name, type, geometry, area_sq_mi, properties->>'regionSlug' AS region_slug
       FROM geo_boundaries`,
  );
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    type: r.type,
    regionSlug: r.region_slug,
    areaSqMi: r.area_sq_mi,
    geometry: typeof r.geometry === 'string' ? JSON.parse(r.geometry) : r.geometry,
  }));
}

async function getListings(bbox: number[]): Promise<unknown> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const { rows } = await pool.query(
    `SELECT listing_key,
            longitude::float8 AS lng,
            latitude::float8  AS lat,
            list_price,
            standard_status,
            subdivision_name
       FROM listing_records
      WHERE standard_status = ANY($1)
        AND latitude  BETWEEN $2 AND $3
        AND longitude BETWEEN $4 AND $5
        AND latitude IS NOT NULL AND longitude IS NOT NULL
      LIMIT 60000`,
    [ACTIVE_STATUSES, minLat, maxLat, minLng, maxLng],
  );
  return rows;
}

async function saveCommunity(payload: {
  slug: string;
  name: string;
  regionSlug: string;
  geometry: Polygon | MultiPolygon;
}): Promise<unknown> {
  const row = computeBoundaryRow(payload.geometry);
  const properties = JSON.stringify({ regionSlug: payload.regionSlug });
  await pool.query(
    // geometry_simple intentionally stores the full-resolution geometry for now;
    // vertex simplification (e.g. @turf/simplify) is deferred until a consumer needs it.
    `INSERT INTO geo_boundaries
       (name, slug, type, geometry, geometry_simple, bbox, centroid, properties, source, vertex_count, area_sq_mi)
     VALUES ($1, $2, 'community', $3, $3, $4, $5, $6::jsonb, 'editor', $7, $8)
     ON CONFLICT (slug, type) DO UPDATE SET
       name = EXCLUDED.name,
       geometry = EXCLUDED.geometry,
       geometry_simple = EXCLUDED.geometry_simple,
       bbox = EXCLUDED.bbox,
       centroid = EXCLUDED.centroid,
       properties = geo_boundaries.properties || EXCLUDED.properties,
       source = 'editor',
       vertex_count = EXCLUDED.vertex_count,
       area_sq_mi = EXCLUDED.area_sq_mi`,
    [
      payload.name,
      payload.slug,
      row.geometry,
      row.bbox,
      row.centroid,
      properties,
      row.vertex_count,
      row.area_sq_mi,
    ],
  );
  return { ok: true, areaSqMi: row.area_sq_mi, vertexCount: row.vertex_count };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    if (req.method === 'GET' && url.pathname === '/') {
      const html = await readFile(path.join(__dirname, 'index.html'), 'utf8');
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(html);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/boundaries') {
      return json(res, 200, await getBoundaries());
    }
    if (req.method === 'GET' && url.pathname === '/api/listings') {
      const b = (url.searchParams.get('bbox') ?? '').split(',').map(Number);
      if (b.length !== 4 || b.some(Number.isNaN)) return json(res, 400, { error: 'bad bbox' });
      return json(res, 200, await getListings(b));
    }
    if (req.method === 'POST' && url.pathname === '/api/community') {
      const body = (await readBody(req)) as Parameters<typeof saveCommunity>[0];
      if (!body.slug || !body.name || !body.geometry || !body.regionSlug)
        return json(res, 400, { error: 'slug, name, regionSlug, and geometry required' });
      return json(res, 200, await saveCommunity(body));
    }
    json(res, 404, { error: 'not found' });
  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : 'server error' });
  }
});

server.listen(PORT, () => {
  process.stdout.write(`geo editor running at http://localhost:${PORT}\n`);
});
