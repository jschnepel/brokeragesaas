# Backend API

Shared backend API serving all agents on the platform.

## Overview

This is the centralized API that handles:
- Property data management
- Lead capture and management
- Agent configuration
- MLS integrations

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run type checking
pnpm type-check

# Run linting
pnpm lint
```

## API Endpoints

### Properties
- `GET /api/properties` - List properties with filters
- `GET /api/properties/:id` - Get property details
- `POST /api/properties/sync` - Trigger MLS sync

### Leads
- `GET /api/leads` - List leads for agent
- `POST /api/leads` - Create new lead
- `PATCH /api/leads/:id` - Update lead status

### Agents
- `GET /api/agents/:id` - Get agent configuration
- `GET /api/agent/config` - Get current agent config (from header)

## Environment Variables

See `.env.example` for required environment variables.

## MLS Adapters

The backend uses an adapter pattern for MLS integrations:
- `armls` - Arizona Regional MLS
- `bridge` - Bridge Interactive API
- `manual` - Manual property entry

## Architecture

```
src/
├── api/              # API route handlers
│   ├── properties/
│   ├── leads/
│   └── agents/
├── lib/              # Utilities
│   ├── db.ts         # Database client
│   ├── mls/          # MLS adapters
│   └── auth/         # Authentication
└── middleware/       # Express middleware
    ├── tenant-resolver.ts
    ├── error-handler.ts
    └── rate-limiter.ts
```
