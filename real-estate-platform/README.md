# Real Estate Platform

Multi-tenant real estate SaaS platform for real estate agents.

## Overview

This platform supports:
- **Premium Tier**: Maximum 3 highly customized sites
- **Template Tier**: Unlimited agents with database-driven feature variants
- **MLS Integration**: Adapter pattern for multiple MLS sources

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Backend | Next.js 14 API Routes |
| Frontend | Next.js 14 (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (AWS RDS) |
| Caching | Redis (Upstash) |
| Infrastructure | AWS (Lambda, S3, CloudFront, Amplify) |

## Project Structure

```
real-estate-platform/
├── apps/
│   ├── backend/          # Shared backend API
│   ├── premium-site/     # Premium tier frontend
│   ├── template-site/    # Multi-tenant template frontend
│   └── admin/            # Admin panel (future)
├── packages/
│   ├── ui/               # Shared UI components
│   ├── database/         # Database utilities
│   ├── shared/           # Shared types and utilities
│   └── config/           # Shared configurations
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install pnpm if not already installed
npm install -g pnpm@8.15.0

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Run ESLint on all packages |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm clean` | Clean all build artifacts |
| `pnpm format` | Format code with Prettier |

## Development

### Creating a New Feature

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Run checks: `pnpm lint && pnpm type-check && pnpm test`
4. Commit: `git commit -m "feat: your feature description"`
5. Push: `git push origin feature/your-feature`

### Environment Variables

See `.env.example` files in each app directory for required environment variables.

## Documentation

- [System Overview](./docs/architecture/00-system-overview.md)
- [Database Schema](./docs/architecture/01-database-schema.md)
- [Multi-Tenant Strategy](./docs/architecture/02-multi-tenant-strategy.md)
- [MLS Adapter Pattern](./docs/architecture/03-mls-adapter-pattern.md)
- [Feature Variant System](./docs/architecture/04-feature-variant-system.md)

## License

Proprietary - All rights reserved.
