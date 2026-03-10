import { query, queryOne } from "@/lib/db";

export interface ThemeTokens {
  "brand-primary": string;
  "brand-primary-dark": string;
  "brand-accent": string;
  "brand-surface": string;
  "brand-surface-alt": string;
  "brand-dark": string;
  "brand-sidebar": string;
  "brand-font-display": string;
  "brand-font-body": string;
  "brand-font-mono": string;
  "brand-radius": string;
  "brand-glow-opacity": string;
  "brand-card-blur": string;
  "brand-sidebar-width": string;
}

export interface TenantTheme {
  id: string;
  tenantId: string;
  themeName: string;
  tokens: ThemeTokens;
  updatedAt: string;
}

interface ThemeRow extends Record<string, unknown> {
  id: string;
  tenant_id: string;
  theme_name: string;
  tokens: ThemeTokens;
  created_at: string;
  updated_at: string;
}

function rowToTheme(r: ThemeRow): TenantTheme {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    themeName: r.theme_name,
    tokens: r.tokens,
    updatedAt: r.updated_at,
  };
}

export const ThemeService = {
  async getTheme(tenantId: string): Promise<TenantTheme | null> {
    const row = await queryOne<ThemeRow>(
      "SELECT * FROM tenant_themes WHERE tenant_id = $1",
      [tenantId]
    );
    return row ? rowToTheme(row) : null;
  },

  async getAllThemes(): Promise<TenantTheme[]> {
    const res = await query<ThemeRow>(
      "SELECT * FROM tenant_themes ORDER BY created_at ASC"
    );
    return res.rows.map(rowToTheme);
  },

  async saveTheme(tenantId: string, themeName: string, tokens: ThemeTokens): Promise<void> {
    await query(
      `INSERT INTO tenant_themes (tenant_id, theme_name, tokens)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id) DO UPDATE
       SET theme_name = EXCLUDED.theme_name,
           tokens = EXCLUDED.tokens,
           updated_at = NOW()`,
      [tenantId, themeName, JSON.stringify(tokens)]
    );
  },
};
