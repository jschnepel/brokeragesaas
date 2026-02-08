import { query, queryOne } from '../client';

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  brokerage_name: string | null;
  license_number: string | null;
  bio: string | null;
  photo_url: string | null;
  logo_url: string | null;
  tier: 'premium' | 'template';
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function getAgentById(id: string): Promise<Agent | null> {
  return queryOne<Agent>(
    'SELECT * FROM agents WHERE id = $1 AND active = true',
    [id]
  );
}

export async function getAgentByEmail(email: string): Promise<Agent | null> {
  return queryOne<Agent>(
    'SELECT * FROM agents WHERE email = $1 AND active = true',
    [email]
  );
}

export async function getAgentByDomain(domain: string): Promise<Agent | null> {
  return queryOne<Agent>(
    `SELECT a.* FROM agents a
     JOIN agent_sites s ON a.id = s.agent_id
     WHERE s.domain = $1 AND a.active = true`,
    [domain]
  );
}

export async function createAgent(data: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent> {
  const result = await query<Agent>(
    `INSERT INTO agents (name, email, phone, brokerage_name, license_number, bio, photo_url, logo_url, tier, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.name,
      data.email,
      data.phone,
      data.brokerage_name,
      data.license_number,
      data.bio,
      data.photo_url,
      data.logo_url,
      data.tier,
      data.active,
    ]
  );
  return result.rows[0];
}

export async function updateAgent(id: string, data: Partial<Omit<Agent, 'id' | 'created_at' | 'updated_at'>>): Promise<Agent | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    return getAgentById(id);
  }

  values.push(id);

  const result = await query<Agent>(
    `UPDATE agents SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}
