import type { MLSAdapter, StandardProperty, PropertyFilters, MLSConfig } from '../types';

export class BridgeAdapter implements MLSAdapter {
  private apiKey: string;
  private baseUrl: string;
  private rateLimits = {
    requests_per_period: 500,
    period_seconds: 3600,
    current_usage: 0,
  };

  constructor(config: MLSConfig) {
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || 'https://api.bridgedataoutput.com/api/v2';
  }

  async fetchProperties(filters?: PropertyFilters): Promise<StandardProperty[]> {
    const params = new URLSearchParams();
    params.append('access_token', this.apiKey);

    if (filters?.city) params.append('City', filters.city);
    if (filters?.minPrice) params.append('ListPrice.gte', String(filters.minPrice));
    if (filters?.maxPrice) params.append('ListPrice.lte', String(filters.maxPrice));
    if (filters?.beds) params.append('BedroomsTotal.gte', String(filters.beds));
    if (filters?.baths) params.append('BathroomsTotalInteger.gte', String(filters.baths));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const response = await fetch(`${this.baseUrl}/OData/Property?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Bridge API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value.map(this.transformProperty);
  }

  async fetchProperty(mlsNumber: string): Promise<StandardProperty | null> {
    const params = new URLSearchParams();
    params.append('access_token', this.apiKey);

    const response = await fetch(
      `${this.baseUrl}/OData/Property('${mlsNumber}')?${params}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Bridge API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformProperty(data);
  }

  async testConnection(): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('access_token', this.apiKey);
      params.append('limit', '1');

      const response = await fetch(`${this.baseUrl}/OData/Property?${params}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getRateLimits() {
    return this.rateLimits;
  }

  private transformProperty(raw: Record<string, unknown>): StandardProperty {
    return {
      external_id: String(raw.ListingKey || raw.ListingId),
      data_source: 'bridge',
      address: String(raw.UnparsedAddress || raw.StreetAddress || ''),
      city: String(raw.City || ''),
      state: String(raw.StateOrProvince || ''),
      zip: String(raw.PostalCode || ''),
      price: Number(raw.ListPrice) || 0,
      beds: Number(raw.BedroomsTotal) || 0,
      baths: Number(raw.BathroomsTotalInteger) || Number(raw.BathroomsFull) || 0,
      sqft: Number(raw.LivingArea) || 0,
      lot_size_sqft: Number(raw.LotSizeSquareFeet),
      year_built: Number(raw.YearBuilt),
      property_type: String(raw.PropertyType || 'Residential'),
      status: this.mapStatus(String(raw.StandardStatus)),
      list_date: new Date(String(raw.ListingContractDate || raw.OnMarketDate)),
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
      'ActiveUnderContract': 'Pending',
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
      .filter((m: unknown) => (m as Record<string, unknown>).MediaType === 'image')
      .map((m: unknown, index: number) => ({
        url: String((m as Record<string, unknown>).MediaURL),
        order: Number((m as Record<string, unknown>).Order) || index,
        caption: (m as Record<string, unknown>).ShortDescription
          ? String((m as Record<string, unknown>).ShortDescription)
          : undefined,
      }));
  }
}
