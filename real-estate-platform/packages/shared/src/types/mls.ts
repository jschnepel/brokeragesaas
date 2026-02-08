/**
 * Standardized property format (internal representation)
 */
export interface StandardProperty {
  // Identifiers
  external_id: string;
  data_source: 'armls' | 'crmls' | 'bridge' | 'manual';

  // Basic Info
  address: string;
  city: string;
  state: string;
  zip: string;

  // Property Details
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  lot_size_sqft?: number;
  year_built?: number;
  property_type: string;

  // Listing Details
  status: 'Active' | 'Pending' | 'Sold' | 'Off Market';
  list_date: Date;
  sold_date?: Date;
  sold_price?: number;
  days_on_market?: number;

  // Description
  description: string;
  features?: Record<string, unknown>;

  // Media
  photos: Array<{
    url: string;
    order: number;
    caption?: string;
  }>;
  virtual_tour_url?: string;

  // Location
  latitude?: number;
  longitude?: number;
  neighborhood?: string;

  // Raw data (for reference)
  raw_data: unknown;
}

export interface PropertyFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * MLS Adapter interface (all adapters must implement this)
 */
export interface MLSAdapter {
  fetchProperties(filters?: PropertyFilters): Promise<StandardProperty[]>;
  fetchProperty(mlsNumber: string): Promise<StandardProperty | null>;
  testConnection(): Promise<boolean>;
  getRateLimits(): {
    requests_per_period: number;
    period_seconds: number;
    current_usage?: number;
  };
}
