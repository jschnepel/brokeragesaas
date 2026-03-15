/**
 * seed-communities.js
 *
 * Reads prototype JSON + GeoJSON and upserts into RDS community tables.
 * Insert order: regions → sections → amenities → communities → amenity_links
 *
 * Usage:
 *   export $(grep RDS_DATABASE_URL ../../apps/premium-site/.env.local)
 *   node seed-communities.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const JSON_PATH = path.resolve(__dirname, '../../../prototypes/yong/src/data/communities-enriched.json');
const GEOJSON_PATH = path.resolve(__dirname, '../../../prototypes/yong/public/luxury-communities.geojson');

const pool = new Pool({
  connectionString: process.env.RDS_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function loadJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function buildBoundaryMap(geojson) {
  const map = new Map();
  for (const feature of geojson.features) {
    const slug = feature.properties?.slug;
    if (slug) {
      map.set(slug, feature);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Upsert functions
// ---------------------------------------------------------------------------

async function upsertRegions(client, regions) {
  let count = 0;
  for (const r of regions) {
    await client.query(
      `INSERT INTO community_regions (id, name, tagline, description, hero_image, latitude, longitude, display_order, demographics, climate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         tagline = EXCLUDED.tagline,
         description = EXCLUDED.description,
         hero_image = EXCLUDED.hero_image,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         display_order = EXCLUDED.display_order,
         demographics = EXCLUDED.demographics,
         climate = EXCLUDED.climate,
         updated_at = NOW()`,
      [
        r.id,
        r.name,
        r.tagline || null,
        r.description || null,
        r.heroImage || null,
        r.coordinates?.[0] || null,
        r.coordinates?.[1] || null,
        r.displayOrder || null,
        r.enrichment?.demographics ? JSON.stringify(r.enrichment.demographics) : null,
        r.enrichment?.climate ? JSON.stringify(r.enrichment.climate) : null,
      ]
    );
    count++;
  }
  return count;
}

async function upsertSections(client, sections) {
  let count = 0;
  for (const s of sections) {
    await client.query(
      `INSERT INTO community_sections (id, label, description, hero_image, display_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         label = EXCLUDED.label,
         description = EXCLUDED.description,
         hero_image = EXCLUDED.hero_image,
         display_order = EXCLUDED.display_order`,
      [
        s.id,
        s.label,
        s.description || null,
        s.heroImage || null,
        s.displayOrder || null,
      ]
    );
    count++;
  }
  return count;
}

async function upsertAmenities(client, amenities) {
  let count = 0;
  for (const a of amenities) {
    await client.query(
      `INSERT INTO community_amenities (id, name, type, description, tags, access_level, website, address, latitude, longitude, image, stats)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         type = EXCLUDED.type,
         description = EXCLUDED.description,
         tags = EXCLUDED.tags,
         access_level = EXCLUDED.access_level,
         website = EXCLUDED.website,
         address = EXCLUDED.address,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         image = EXCLUDED.image,
         stats = EXCLUDED.stats`,
      [
        a.id,
        a.name,
        a.type || null,
        a.description || null,
        a.tags || null,
        a.access || null,
        a.url || null,
        a.address || null,
        a.coordinates?.[0] || null,
        a.coordinates?.[1] || null,
        null, // image — not in source data
        null, // stats — not in source data
      ]
    );
    count++;
  }
  return count;
}

async function upsertCommunities(client, communities, zipcodes, boundaryMap) {
  let count = 0;
  let withBoundary = 0;
  let withDemographics = 0;

  for (let i = 0; i < communities.length; i++) {
    const c = communities[i];
    const id = c.identity.slug;
    const zipDemo = zipcodes.find(z => z.code === c.identity.zipcodeCode)?.enrichment?.demographics || null;
    const boundary = boundaryMap.get(id) || null;

    if (boundary) withBoundary++;
    if (zipDemo) withDemographics++;

    // Build narrative JSONB
    const narrative = c.narrative ? {
      tagline: c.narrative.tagline || null,
      summary: c.narrative.summary || null,
      body: c.narrative.body || null,
    } : null;

    // Build location_data JSONB
    const locationData = c.location ? {
      airports: c.location.airports || [],
      keyDistances: c.location.keyDistances || [],
    } : null;

    await client.query(
      `INSERT INTO communities (
         id, region_id, section_id, name, city, zip_code,
         latitude, longitude, price_range, gating, hero_image, website,
         elevation, display_order, narrative, location_data,
         residential, golf_info, recognition, gallery,
         quality_of_life, economy, tags, demographics, pois, boundary_geojson
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11, $12,
         $13, $14, $15, $16,
         $17, $18, $19, $20,
         $21, $22, $23, $24, $25, $26
       )
       ON CONFLICT (id) DO UPDATE SET
         region_id = EXCLUDED.region_id,
         section_id = EXCLUDED.section_id,
         name = EXCLUDED.name,
         city = EXCLUDED.city,
         zip_code = EXCLUDED.zip_code,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         price_range = EXCLUDED.price_range,
         gating = EXCLUDED.gating,
         hero_image = EXCLUDED.hero_image,
         website = EXCLUDED.website,
         elevation = EXCLUDED.elevation,
         display_order = EXCLUDED.display_order,
         narrative = EXCLUDED.narrative,
         location_data = EXCLUDED.location_data,
         residential = EXCLUDED.residential,
         golf_info = EXCLUDED.golf_info,
         recognition = EXCLUDED.recognition,
         gallery = EXCLUDED.gallery,
         quality_of_life = EXCLUDED.quality_of_life,
         economy = EXCLUDED.economy,
         tags = EXCLUDED.tags,
         demographics = EXCLUDED.demographics,
         pois = EXCLUDED.pois,
         boundary_geojson = EXCLUDED.boundary_geojson,
         updated_at = NOW()`,
      [
        id,
        c.identity.regionId || null,
        c.identity.sectionId || null,
        c.identity.name,
        c.identity.city || null,
        c.identity.zipcodeCode || null,
        c.identity.coordinates?.[0] || null,
        c.identity.coordinates?.[1] || null,
        c.identity.priceRange || null,
        c.identity.gating || null,
        c.identity.heroImage || null,
        c.identity.website || null,
        c.location?.elevation || null,
        i + 1, // display_order based on array position
        narrative ? JSON.stringify(narrative) : null,
        locationData ? JSON.stringify(locationData) : null,
        c.residential ? JSON.stringify(c.residential) : null,
        c.golf ? JSON.stringify(c.golf) : null,
        c.recognition || null,
        c.gallery ? JSON.stringify(c.gallery) : null,
        c.qualityOfLife ? JSON.stringify(c.qualityOfLife) : null,
        c.economy ? JSON.stringify(c.economy) : null,
        c.identity.tags || null,
        zipDemo ? JSON.stringify(zipDemo) : null,
        c.pois ? JSON.stringify(c.pois) : null,
        boundary ? JSON.stringify(boundary) : null,
      ]
    );
    count++;
  }

  return { count, withBoundary, withDemographics };
}

async function upsertAmenityLinks(client, communities) {
  // Delete all existing links, then re-insert
  await client.query('DELETE FROM community_amenity_links');

  let count = 0;
  for (const c of communities) {
    const communityId = c.identity.slug;
    const amenityIds = c.amenityIds || [];
    const signatureId = c.signatureAmenityId || null;
    const trailId = c.nearestTrailId || null;

    for (const amenityId of amenityIds) {
      await client.query(
        `INSERT INTO community_amenity_links (community_id, amenity_id, is_signature, is_nearest_trail)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (community_id, amenity_id) DO UPDATE SET
           is_signature = EXCLUDED.is_signature,
           is_nearest_trail = EXCLUDED.is_nearest_trail`,
        [
          communityId,
          amenityId,
          amenityId === signatureId,
          amenityId === trailId,
        ]
      );
      count++;
    }

    // Also insert nearestTrailId if not already in amenityIds
    if (trailId && !amenityIds.includes(trailId)) {
      await client.query(
        `INSERT INTO community_amenity_links (community_id, amenity_id, is_signature, is_nearest_trail)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (community_id, amenity_id) DO UPDATE SET
           is_signature = EXCLUDED.is_signature,
           is_nearest_trail = EXCLUDED.is_nearest_trail`,
        [communityId, trailId, false, true]
      );
      count++;
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Loading source data...');
  const data = loadJSON(JSON_PATH);
  const geojson = loadJSON(GEOJSON_PATH);

  console.log(`  JSON: ${data.communities.length} communities, ${data.regions.length} regions, ${data.sections.length} sections, ${data.amenities.length} amenities, ${data.zipcodes.length} zipcodes`);
  console.log(`  GeoJSON: ${geojson.features.length} features`);

  const boundaryMap = buildBoundaryMap(geojson);
  console.log(`  Boundary map: ${boundaryMap.size} slugs matched`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('\n1/5  Upserting regions...');
    const regionCount = await upsertRegions(client, data.regions);
    console.log(`     ${regionCount} regions upserted`);

    console.log('2/5  Upserting sections...');
    const sectionCount = await upsertSections(client, data.sections);
    console.log(`     ${sectionCount} sections upserted`);

    console.log('3/5  Upserting amenities...');
    const amenityCount = await upsertAmenities(client, data.amenities);
    console.log(`     ${amenityCount} amenities upserted`);

    console.log('4/5  Upserting communities...');
    const communityResult = await upsertCommunities(client, data.communities, data.zipcodes, boundaryMap);
    console.log(`     ${communityResult.count} communities upserted (${communityResult.withBoundary} with boundaries, ${communityResult.withDemographics} with demographics)`);

    console.log('5/5  Upserting amenity links...');
    const linkCount = await upsertAmenityLinks(client, data.communities);
    console.log(`     ${linkCount} amenity links inserted`);

    await client.query('COMMIT');
    console.log('\nSeed complete — transaction committed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nSeed FAILED — transaction rolled back.');
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
