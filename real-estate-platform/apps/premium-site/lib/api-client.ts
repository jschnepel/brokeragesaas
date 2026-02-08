import type { StandardProperty, PropertyFilters } from '@platform/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || '';

interface APIResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-agent-id': AGENT_ID,
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || { message: 'An error occurred', code: 'UNKNOWN' },
      };
    }

    return { data };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR',
      },
    };
  }
}

export async function getProperties(
  filters?: PropertyFilters
): Promise<APIResponse<{ properties: StandardProperty[]; pagination: { limit: number; offset: number; total: number } }>> {
  const params = new URLSearchParams();

  if (filters?.city) params.append('city', filters.city);
  if (filters?.minPrice) params.append('minPrice', String(filters.minPrice));
  if (filters?.maxPrice) params.append('maxPrice', String(filters.maxPrice));
  if (filters?.beds) params.append('beds', String(filters.beds));
  if (filters?.baths) params.append('baths', String(filters.baths));
  if (filters?.status) params.append('status', filters.status);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));

  return fetchAPI(`/api/properties?${params}`);
}

export async function getProperty(
  id: string
): Promise<APIResponse<{ property: StandardProperty }>> {
  return fetchAPI(`/api/properties/${id}`);
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  property_id?: string;
  source: string;
  status: string;
  created_at: string;
}

export async function createLead(
  lead: Omit<Lead, 'id' | 'status' | 'created_at'>
): Promise<APIResponse<{ lead: Lead }>> {
  return fetchAPI('/api/leads', {
    method: 'POST',
    body: JSON.stringify(lead),
  });
}

export async function getAgentConfig(): Promise<APIResponse<{ agent: Record<string, unknown> }>> {
  return fetchAPI('/api/agents');
}
