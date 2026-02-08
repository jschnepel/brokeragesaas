import type { MLSAdapter, StandardProperty, PropertyFilters, MLSConfig } from '../types';

export class ARMLSAdapter implements MLSAdapter {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private rateLimits = {
    requests_per_period: 1000,
    period_seconds: 3600,
    current_usage: 0,
  };

  constructor(config: MLSConfig) {
    this.apiKey = config.apiKey || '';
    this.apiSecret = config.apiSecret || '';
    this.baseUrl = config.baseUrl || 'https://api.armls.com/v1';
  }

  async fetchProperties(filters?: PropertyFilters): Promise<StandardProperty[]> {
    const params = new URLSearchParams();

    if (filters?.city) params.append('city', filters.city);
    if (filters?.minPrice) params.append('minPrice', String(filters.minPrice));
    if (filters?.maxPrice) params.append('maxPrice', String(filters.maxPrice));
    if (filters?.beds) params.append('beds', String(filters.beds));
    if (filters?.baths) params.append('baths', String(filters.baths));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const response = await fetch(`${this.baseUrl}/properties?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`ARMLS API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.listings.map(this.transformProperty);
  }

  async fetchProperty(mlsNumber: string): Promise<StandardProperty | null> {
    const response = await fetch(`${this.baseUrl}/properties/${mlsNumber}`, {
      headers: this.getHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`ARMLS API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformProperty(data);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ping`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getRateLimits() {
    return this.rateLimits;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-API-Secret': this.apiSecret,
      'Content-Type': 'application/json',
    };
  }

  private transformProperty(raw: Record<string, unknown>): StandardProperty {
    return {
      external_id: String(raw.ListingId || raw.MlsNumber),
      data_source: 'armls',
      address: String(raw.StreetAddress || ''),
      city: String(raw.City || ''),
      state: String(raw.State || 'AZ'),
      zip: String(raw.PostalCode || ''),
      price: Number(raw.ListPrice) || 0,
      beds: Number(raw.BedroomsTotal) || 0,
      baths: Number(raw.BathroomsFull) + (Number(raw.BathroomsHalf) || 0) * 0.5,
      sqft: Number(raw.LivingArea) || 0,
      lot_size_sqft: Number(raw.LotSizeSquareFeet),
      year_built: Number(raw.YearBuilt),
      property_type: String(raw.PropertyType || 'Residential'),
      status: this.mapStatus(String(raw.StandardStatus)),
      list_date: new Date(String(raw.ListingContractDate)),
      sold_date: raw.CloseDate ? new Date(String(raw.CloseDate)) : undefined,
      sold_price: raw.ClosePrice ? Number(raw.ClosePrice) : undefined,
      days_on_market: Number(raw.DaysOnMarket),
      description: String(raw.PublicRemarks || ''),
      features: raw.Features as Record<string, unknown>,
      photos: this.transformPhotos(raw.Media as unknown[]),
      virtual_tour_url: raw.VirtualTourURLUnbranded ? String(raw.VirtualTourURLUnbranded) : undefined,
      latitude: Number(raw.Latitude),
      longitude: Number(raw.Longitude),
      neighborhood: raw.SubdivisionName ? String(raw.SubdivisionName) : undefined,
      raw_data: raw,
    };
  }

  private mapStatus(status: string): StandardProperty['status'] {
    const statusMap: Record<string, StandardProperty['status']> = {
      'Active': 'Active',
      'Active Under Contract': 'Pending',
      'Pending': 'Pending',
      'Closed': 'Sold',
      'Canceled': 'Off Market',
      'Withdrawn': 'Off Market',
      'Expired': 'Off Market',
    };
    return statusMap[status] || 'Off Market';
  }

  private transformPhotos(media: unknown[]): StandardProperty['photos'] {
    if (!Array.isArray(media)) return [];

    return media
      .filter((m: unknown) => (m as Record<string, unknown>).MediaCategory === 'Photo')
      .map((m: unknown, index: number) => ({
        url: String((m as Record<string, unknown>).MediaURL),
        order: Number((m as Record<string, unknown>).Order) || index,
        caption: (m as Record<string, unknown>).ShortDescription
          ? String((m as Record<string, unknown>).ShortDescription)
          : undefined,
      }));
  }
}
