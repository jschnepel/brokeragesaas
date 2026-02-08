# MLS Adapter Pattern

## Overview

The platform uses an adapter pattern to integrate with multiple MLS data sources.

## Interface

All MLS adapters implement the `MLSAdapter` interface:

```typescript
interface MLSAdapter {
  fetchProperties(filters?: PropertyFilters): Promise<StandardProperty[]>;
  fetchProperty(mlsNumber: string): Promise<StandardProperty | null>;
  testConnection(): Promise<boolean>;
  getRateLimits(): RateLimitInfo;
}
```

## Standard Property Format

All adapters transform external data to `StandardProperty`:

```typescript
interface StandardProperty {
  external_id: string;
  data_source: 'armls' | 'bridge' | 'manual';
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: 'Active' | 'Pending' | 'Sold' | 'Off Market';
  photos: Array<{ url: string; order: number }>;
  // ... additional fields
}
```

## Available Adapters

### ARMLS Adapter
- Arizona Regional MLS
- Location: `/apps/backend/src/lib/mls/adapters/armls.ts`

### Bridge Adapter
- Bridge Interactive API
- Location: `/apps/backend/src/lib/mls/adapters/bridge.ts`

### Manual Adapter
- Direct database entries
- Location: `/apps/backend/src/lib/mls/adapters/manual.ts`

## Factory Pattern

```typescript
import { createMLSAdapter } from './factory';

const adapter = createMLSAdapter({ type: 'armls', apiKey: '...' });
const properties = await adapter.fetchProperties({ city: 'Phoenix' });
```

## Adding New Adapters

1. Create adapter class implementing `MLSAdapter`
2. Add transformer for external → standard format
3. Register in factory
4. Add environment variables
5. Document rate limits
