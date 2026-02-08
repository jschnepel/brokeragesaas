# Database Schema

## Overview

PostgreSQL database with UUID primary keys, proper indexing, and row-level multi-tenancy.

## Entity Relationship

```
┌─────────────┐
│   agents    │
├─────────────┤
│ id (PK)     │──────┬──────────┬──────────────┬─────────────┐
│ name        │      │          │              │             │
│ email       │      │          │              │             │
│ tier        │      ▼          ▼              ▼             ▼
└─────────────┘ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐
                │ agent   │ │ proper- │ │  leads   │ │  content   │
                │ _sites  │ │  ties   │ │          │ │  _pages    │
                └─────────┘ └─────────┘ └──────────┘ └────────────┘
                     │
                     ▼
              ┌─────────────┐
              │   agent_    │
              │  features   │◄───────┐
              └─────────────┘        │
                                     │
              ┌─────────────┐        │
              │    site_    │────────┘
              │  features   │
              └─────────────┘
```

## Core Tables

### agents
Primary entity for real estate agents.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Agent name |
| email | VARCHAR(255) | Unique email |
| phone | VARCHAR(50) | Phone number |
| brokerage_name | VARCHAR(255) | Brokerage |
| tier | VARCHAR(50) | 'premium' or 'template' |
| active | BOOLEAN | Account status |

### agent_sites
Site configuration per agent.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| agent_id | UUID | Foreign key to agents |
| domain | VARCHAR(255) | Unique domain |
| brand_colors | JSONB | Color configuration |
| site_config | JSONB | Site settings |

### properties
Property listings with multi-tenant support.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| agent_id | UUID | Foreign key to agents |
| external_id | VARCHAR(255) | MLS ID |
| data_source | VARCHAR(50) | 'armls', 'bridge', 'manual' |
| address | VARCHAR(255) | Street address |
| city | VARCHAR(100) | City |
| price | DECIMAL(15,2) | List price |
| status | VARCHAR(50) | 'Active', 'Pending', 'Sold' |

### leads
Lead captures with multi-tenant support.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| agent_id | UUID | Foreign key to agents |
| property_id | UUID | Optional property reference |
| name | VARCHAR(255) | Lead name |
| email | VARCHAR(255) | Lead email |
| status | VARCHAR(50) | Lead status |

## Indexes

```sql
-- Fast domain lookup
CREATE INDEX idx_agent_sites_domain ON agent_sites(domain);

-- Multi-tenant property queries
CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);

-- Lead queries
CREATE INDEX idx_leads_agent_id ON leads(agent_id);
CREATE INDEX idx_leads_status ON leads(status);
```

## Multi-Tenant Pattern

All queries MUST include agent_id:

```sql
-- CORRECT
SELECT * FROM properties WHERE agent_id = $1 AND status = 'Active';

-- INCORRECT (security risk)
SELECT * FROM properties WHERE status = 'Active';
```

## Full Schema

See `/packages/database/src/schema.sql` for complete schema definition.
