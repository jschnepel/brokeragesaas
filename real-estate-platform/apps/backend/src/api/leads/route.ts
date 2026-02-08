import { NextRequest, NextResponse } from 'next/server';
import { handleAPIError, ValidationError } from '@/middleware/error-handler';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const agentId = request.headers.get('x-agent-id');
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = Number(searchParams.get('limit')) || 50;
    const offset = Number(searchParams.get('offset')) || 0;

    let sql = `
      SELECT * FROM leads
      WHERE agent_id = $1
    `;
    const params: unknown[] = [agentId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC`;
    sql += ` LIMIT $${paramIndex++}`;
    params.push(limit);
    sql += ` OFFSET $${paramIndex++}`;
    params.push(offset);

    const result = await query(sql, params);

    return NextResponse.json({
      leads: result.rows,
      pagination: {
        limit,
        offset,
        total: result.rowCount,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const agentId = request.headers.get('x-agent-id');
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, message, property_id, source } = body;

    if (!name || !email) {
      throw new ValidationError('Name and email are required');
    }

    const result = await query(
      `INSERT INTO leads (agent_id, name, email, phone, message, property_id, source, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'new')
       RETURNING *`,
      [agentId, name, email, phone, message, property_id, source || 'website']
    );

    return NextResponse.json({ lead: result.rows[0] }, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
