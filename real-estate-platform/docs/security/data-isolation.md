# Data Isolation

## Multi-Tenant Security

### Database Level
- Row-level security via agent_id
- All queries filter by tenant
- Foreign key constraints

### Application Level
- Middleware validates agent
- Context passed through request
- No cross-tenant API calls

### Cache Level
- Tenant-scoped cache keys
- No shared cache entries

## Implementation

```typescript
// Every query includes agent_id
const properties = await query(
  'SELECT * FROM properties WHERE agent_id = $1',
  [agentId]
);
```

## Audit

- Log all data access
- Monitor for anomalies
- Regular security reviews
