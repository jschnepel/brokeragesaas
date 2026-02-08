import { NextRequest, NextResponse } from 'next/server';
import { handleAPIError } from '@/middleware/error-handler';
import { query } from '@/lib/db';
import type { PropertyFilters } from '@platform/shared';

export async function GET(request: NextRequest) {
  try {
    const agentId = request.headers.get('x-agent-id');
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters: PropertyFilters = {
      city: searchParams.get('city') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      beds: searchParams.get('beds') ? Number(searchParams.get('beds')) : undefined,
      baths: searchParams.get('baths') ? Number(searchParams.get('baths')) : undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : 0,
    };

    let sql = `
      SELECT * FROM properties
      WHERE agent_id = $1
    `;
    const params: unknown[] = [agentId];
    let paramIndex = 2;

    if (filters.city) {
      sql += ` AND city = $${paramIndex++}`;
      params.push(filters.city);
    }
    if (filters.minPrice) {
      sql += ` AND price >= $${paramIndex++}`;
      params.push(filters.minPrice);
    }
    if (filters.maxPrice) {
      sql += ` AND price <= $${paramIndex++}`;
      params.push(filters.maxPrice);
    }
    if (filters.beds) {
      sql += ` AND beds >= $${paramIndex++}`;
      params.push(filters.beds);
    }
    if (filters.baths) {
      sql += ` AND baths >= $${paramIndex++}`;
      params.push(filters.baths);
    }
    if (filters.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY created_at DESC`;
    sql += ` LIMIT $${paramIndex++}`;
    params.push(filters.limit);
    sql += ` OFFSET $${paramIndex++}`;
    params.push(filters.offset);

    const result = await query(sql, params);

    return NextResponse.json({
      properties: result.rows,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: result.rowCount,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
