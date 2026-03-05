export type AgentTier = 'premium' | 'template';

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
  tier: AgentTier;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AgentSite {
  id: string;
  agent_id: string;
  domain: string;
  brand_colors: {
    primary: string;
    secondary: string;
  };
  site_config: Record<string, unknown>;
  template_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AgentFeature {
  id: string;
  agent_id: string;
  feature_id: string;
  enabled: boolean;
  feature_config: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

/* ── Multi-tenant site configuration ── */

export interface AgentContact {
  phone: string;
  email: string;
  office: string;
  location: string;
}

export interface AgentSocial {
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
}

export interface AgentBrandColors {
  primary: string;
  accent: string;
  surface: string;
  surfaceAlt: string;
  highlight: string;
  primaryMid: string;
}

export interface AgentNavItem {
  label: string;
  href: string;
  children?: AgentNavItem[];
}

export interface AgentStat {
  value: string;
  label: string;
}

/**
 * Full site configuration for an agent's public website.
 * Resolved at build time (SSG) or request time (middleware domain lookup).
 * Replaces the loose `site_config: Record<string, unknown>` on AgentSite.
 */
export interface AgentSiteConfig {
  agentId: string;
  name: string;
  title: string;
  tagline: string;
  bio: string;
  photoUrl: string;
  logoUrl: string | null;
  brokerage: string;
  contact: AgentContact;
  social: AgentSocial;
  brandColors: AgentBrandColors;
  nav: AgentNavItem[];
  stats: AgentStat[];
  seo: {
    defaultTitle: string;
    titleTemplate: string;
    description: string;
    ogImage: string | null;
  };
  regions: Array<{ name: string; href: string }>;
}
