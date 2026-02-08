# Multi-Tenant Strategy

## Overview

The platform uses a single-database multi-tenant architecture with row-level data isolation.

## Tenant Identification

### Premium Sites
- Agent ID configured at build time via environment variable
- `NEXT_PUBLIC_AGENT_ID=yong`

### Template Sites
- Agent ID resolved at runtime from request domain
- Middleware extracts domain → queries database → returns agent_id

```typescript
// Template site middleware
const hostname = request.headers.get('host');
const domain = hostname.split(':')[0];
const agent = await getAgentByDomain(domain);
response.headers.set('x-agent-id', agent.id);
```

## Data Isolation

### Database Level
- All tenant data includes `agent_id` column
- All queries MUST filter by `agent_id`
- Foreign keys cascade on agent delete

### API Level
- Backend requires `x-agent-id` header
- Middleware validates agent exists and is active
- API routes receive agent context

### Cache Level
- Cache keys include agent_id
- Separate cache entries per tenant

```typescript
const cacheKey = `properties:${agentId}:${filterHash}`;
```

## Request Flow

```
┌────────────────┐
│   Request      │
│  example.com   │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Middleware    │
│ (resolve agent)│
└───────┬────────┘
        │
        ▼ x-agent-id header
┌────────────────┐
│  Backend API   │
│ (validate agent│
└───────┬────────┘
        │
        ▼ agent_id filter
┌────────────────┐
│   Database     │
│ (row-level     │
│  isolation)    │
└────────────────┘
```

## Security Considerations

### Never Trust Client
- Agent ID comes from server, not client
- Validate agent on every request

### Query Safety
```typescript
// SECURE: Parameterized query with agent_id
const result = await query(
  'SELECT * FROM properties WHERE agent_id = $1',
  [agentId]
);

// INSECURE: Missing agent_id
const result = await query('SELECT * FROM properties');
```

### Cross-Tenant Prevention
- No APIs that return data across agents
- Admin APIs require special authentication
- Audit logging for sensitive operations

## Performance Optimizations

### Caching Strategy
1. **CDN Level**: Static assets, public pages
2. **Redis Level**: Agent configs, feature flags
3. **Query Level**: Prepared statements

### Database Indexing
```sql
-- Composite index for common queries
CREATE INDEX idx_properties_agent_status
ON properties(agent_id, status);
```

## Scaling Considerations

- Current: Single database, all tenants
- Future: Database sharding by agent_id range
- Future: Read replicas per region
