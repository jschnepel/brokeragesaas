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
