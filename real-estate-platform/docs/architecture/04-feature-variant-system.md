# Feature Variant System

## Overview

The platform supports per-agent feature customization through a database-driven variant system.

## Database Schema

```sql
-- Available features
CREATE TABLE site_features (
  id UUID PRIMARY KEY,
  feature_key VARCHAR(100) UNIQUE,
  name VARCHAR(255),
  category VARCHAR(100),
  default_value JSONB
);

-- Per-agent feature configuration
CREATE TABLE agent_features (
  agent_id UUID REFERENCES agents(id),
  feature_id UUID REFERENCES site_features(id),
  enabled BOOLEAN,
  feature_config JSONB
);
```

## Component Registry

```typescript
// packages/ui/src/variants/registry.ts
const variantRegistry = {
  'map-geojson': GeoJSONMap,
  'dropdown-menu': DropdownMenu,
};

export function getVariantComponent(key: string) {
  return variantRegistry[key];
}
```

## Usage

```tsx
// In a page component
const MapComponent = getVariantComponent(agent.features.mapType);
return <MapComponent center={property.location} />;
```

## Feature Categories

- **Navigation**: Menu styles, layouts
- **Maps**: Display options (GeoJSON, basic, none)
- **Forms**: Contact form variants
- **Display**: Card styles, grid layouts

## Configuration

Feature config stored in `agent_features.feature_config`:

```json
{
  "mapType": "geojson",
  "showVirtualTours": true,
  "contactFormStyle": "compact"
}
```
