# System Overview

## Architecture

The Real Estate Platform is a multi-tenant SaaS application serving real estate agents.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│  Premium     │  Template    │  Admin       │  MLS Feeds           │
│  Sites       │  Sites       │  Panel       │  (ARMLS, Bridge)     │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────┬───────────┘
       │              │              │                  │
       ▼              ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS CloudFront (CDN)                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AWS Amplify                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │  Premium    │  │  Template   │  │  Admin      │               │
│  │  Site       │  │  Site       │  │  Panel      │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API (Lambda)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │ Properties  │  │   Leads     │  │   Agents    │               │
│  │    API      │  │    API      │  │    API      │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │     Redis       │  │      S3         │
│   (AWS RDS)     │  │   (Upstash)     │  │   (Storage)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Components

### Frontend Applications

#### Premium Site (`apps/premium-site`)
- Fully customizable sites for premium tier agents
- One deployment per agent
- Maximum 3 premium sites

#### Template Site (`apps/template-site`)
- Multi-tenant site for template tier agents
- Single deployment, unlimited agents
- Runtime tenant resolution via domain

#### Admin Panel (`apps/admin`)
- Agent management
- Property management
- Analytics dashboard
- (Future development)

### Backend API (`apps/backend`)
- Centralized API serving all frontends
- Multi-tenant with agent context
- MLS adapter integrations

### Shared Packages

#### @platform/ui
- Shared React components
- Feature variant components

#### @platform/database
- Database client
- Query builders
- Schema definitions

#### @platform/shared
- TypeScript types
- Utility functions
- Constants

## Data Flow

1. User visits agent domain (e.g., yongchoi.com)
2. DNS routes to CloudFront/Amplify
3. Middleware resolves agent_id from domain
4. Frontend fetches agent config from backend
5. Backend queries database filtered by agent_id
6. Response rendered with agent-specific branding

## Key Design Decisions

See `/docs/architecture/` for detailed ADRs:
- Multi-tenant from Day 1
- Adapter pattern for MLS
- Feature variants via database
- Caching at every layer
