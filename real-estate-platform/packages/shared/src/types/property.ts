export type PropertyStatus = 'Active' | 'Pending' | 'Sold' | 'Off Market';

export type PropertyType =
  | 'Single Family'
  | 'Condo'
  | 'Townhouse'
  | 'Multi-Family'
  | 'Land'
  | 'Commercial'
  | 'Other';

export interface Property {
  id: string;
  agent_id: string;
  external_id: string | null;
  data_source: 'armls' | 'crmls' | 'bridge' | 'manual';

  // Address
  address: string;
  city: string;
  state: string;
  zip: string;

  // Property Details
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lot_size_sqft: number | null;
  year_built: number | null;
  property_type: PropertyType;

  // Listing Details
  status: PropertyStatus;
  list_date: Date | null;
  sold_date: Date | null;
  sold_price: number | null;
  days_on_market: number | null;

  // Content
  description: string | null;
  features: Record<string, unknown>;
  photos: Array<{
    url: string;
    order: number;
    caption?: string;
  }>;
  virtual_tour_url: string | null;

  // Location
  latitude: number | null;
  longitude: number | null;
  neighborhood: string | null;

  // Metadata
  raw_data: unknown;
  created_at: Date;
  updated_at: Date;
}
