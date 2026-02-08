export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export interface Lead {
  id: string;
  agent_id: string;
  property_id: string | null;

  // Contact Info
  name: string;
  email: string;
  phone: string | null;

  // Lead Details
  message: string | null;
  source: string;
  status: LeadStatus;

  // Metadata
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLeadInput {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  property_id?: string;
  source?: string;
}

export interface UpdateLeadInput {
  status?: LeadStatus;
  metadata?: Record<string, unknown>;
}
