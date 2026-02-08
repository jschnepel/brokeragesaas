import type { StandardProperty, PropertyFilters, MLSAdapter } from '@platform/shared';

export type { StandardProperty, PropertyFilters, MLSAdapter };

export interface MLSConfig {
  type: 'armls' | 'bridge' | 'manual';
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  rateLimit?: {
    requests_per_period: number;
    period_seconds: number;
  };
}

export interface MLSResponse<T> {
  data: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  timestamp: Date;
}

export interface MLSError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
