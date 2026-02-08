import type { MLSAdapter, StandardProperty, PropertyFilters } from '../types';
import { query } from '@/lib/db';

export class ManualAdapter implements MLSAdapter {
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  async fetchProperties(filters?: PropertyFilters): Promise<StandardProperty[]> {
    let sql = `
      SELECT * FROM properties
      WHERE agent_id = $1 AND data_source = 'manual'
    `;
    const params: unknown[] = [this.agentId];
    let paramIndex = 2;

    if (filters?.city) {
      sql += ` AND city = $${paramIndex++}`;
      params.push(filters.city);
    }
    if (filters?.minPrice) {
      sql += ` AND price >= $${paramIndex++}`;
      params.push(filters.minPrice);
    }
    if (filters?.maxPrice) {
      sql += ` AND price <= $${paramIndex++}`;
      params.push(filters.maxPrice);
    }
    if (filters?.beds) {
      sql += ` AND beds >= $${paramIndex++}`;
      params.push(filters.beds);
    }
    if (filters?.baths) {
      sql += ` AND baths >= $${paramIndex++}`;
      params.push(filters.baths);
    }
    if (filters?.status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY created_at DESC`;

    if (filters?.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }
    if (filters?.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows.map(this.transformFromDatabase);
  }

  async fetchProperty(propertyId: string): Promise<StandardProperty | null> {
    const result = await query(
      `SELECT * FROM properties WHERE id = $1 AND agent_id = $2 AND data_source = 'manual'`,
      [propertyId, this.agentId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.transformFromDatabase(result.rows[0]);
  }

  async testConnection(): Promise<boolean> {
    try {
      await query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  getRateLimits() {
    return {
      requests_per_period: -1, // unlimited
      period_seconds: 0,
    };
  }

  private transformFromDatabase(row: Record<string, unknown>): StandardProperty {
    return {
      external_id: String(row.id),
      data_source: 'manual',
      address: String(row.address || ''),
      city: String(row.city || ''),
      state: String(row.state || ''),
      zip: String(row.zip || ''),
      price: Number(row.price) || 0,
      beds: Number(row.beds) || 0,
      baths: Number(row.baths) || 0,
      sqft: Number(row.sqft) || 0,
      lot_size_sqft: row.lot_size_sqft ? Number(row.lot_size_sqft) : undefined,
      year_built: row.year_built ? Number(row.year_built) : undefined,
      property_type: String(row.property_type || 'Residential'),
      status: row.status as StandardProperty['status'],
      list_date: new Date(String(row.list_date)),
      sold_date: row.sold_date ? new Date(String(row.sold_date)) : undefined,
      sold_price: row.sold_price ? Number(row.sold_price) : undefined,
      days_on_market: row.days_on_market ? Number(row.days_on_market) : undefined,
      description: String(row.description || ''),
      features: row.features as Record<string, unknown>,
      photos: (row.photos as StandardProperty['photos']) || [],
      virtual_tour_url: row.virtual_tour_url ? String(row.virtual_tour_url) : undefined,
      latitude: row.latitude ? Number(row.latitude) : undefined,
      longitude: row.longitude ? Number(row.longitude) : undefined,
      neighborhood: row.neighborhood ? String(row.neighborhood) : undefined,
      raw_data: row,
    };
  }
}
