# API Specification

## Base URL

```
Production: https://api.realestate-platform.com
Development: http://localhost:3001
```

## Authentication

All requests require `x-agent-id` header:

```
x-agent-id: <agent-uuid>
```

## Endpoints

### Properties
- `GET /api/properties` - List properties
- `GET /api/properties/:id` - Get property
- `POST /api/properties/sync` - Trigger MLS sync

### Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `PATCH /api/leads/:id` - Update lead

### Agents
- `GET /api/agents` - Get agent config
- `GET /api/agents/resolve?domain=` - Resolve domain

## Response Format

```json
{
  "data": {},
  "pagination": {
    "limit": 24,
    "offset": 0,
    "total": 100
  }
}
```

## Error Format

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Rate Limits

- 100 requests per minute (default)
- 1000 requests per minute (authenticated)
