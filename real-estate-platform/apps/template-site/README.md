# Template Site

Multi-tenant frontend for template tier agents.

## Overview

This is a single deployment that serves multiple agents via domain resolution:

- Agent ID is determined at runtime from the request domain
- Branding and features are loaded dynamically from the database
- Single codebase, unlimited agents

## How It Works

1. User visits agent's domain (e.g., `agent-name.realestate.com`)
2. Middleware resolves domain → agent_id
3. Agent configuration is fetched from backend
4. Site renders with agent's branding and features

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

## Environment Variables

See `.env.example` for required environment variables.

## Structure

```
app/
├── page.tsx            # Homepage
├── properties/         # Property listings
├── about/              # About page
├── contact/            # Contact page
└── layout.tsx          # Root layout

components/             # React components
lib/                    # Utilities
middleware.ts           # Tenant resolution middleware
```

## Multi-Tenant Resolution

The middleware (`middleware.ts`) handles tenant resolution:

1. Extract domain from request headers
2. Query database for agent with matching domain
3. Cache result for performance
4. Add agent_id to request headers
5. Return 404 if domain not configured

## Feature Variants

Template sites support feature variants controlled by database:
- Different navigation styles
- Map component options (GeoJSON, basic)
- Contact form variations
- And more...

Features are configured per-agent in the `agent_features` table.
