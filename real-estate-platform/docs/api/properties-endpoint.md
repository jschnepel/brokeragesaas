# Properties Endpoint

## List Properties

```
GET /api/properties
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| city | string | Filter by city |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| beds | number | Minimum beds |
| baths | number | Minimum baths |
| status | string | 'Active', 'Pending', 'Sold' |
| limit | number | Results per page (default: 24) |
| offset | number | Pagination offset |

### Response

```json
{
  "properties": [
    {
      "external_id": "MLS123",
      "address": "123 Main St",
      "city": "Phoenix",
      "price": 450000,
      "beds": 3,
      "baths": 2,
      "sqft": 1800,
      "status": "Active",
      "photos": [{"url": "...", "order": 0}]
    }
  ],
  "pagination": {
    "limit": 24,
    "offset": 0,
    "total": 156
  }
}
```

## Get Property

```
GET /api/properties/:id
```

### Response

```json
{
  "property": {
    "external_id": "MLS123",
    "address": "123 Main St",
    "description": "Beautiful home...",
    "features": {...},
    "photos": [...]
  }
}
```
