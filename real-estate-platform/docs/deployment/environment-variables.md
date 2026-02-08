# Environment Variables

## Backend

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| REDIS_URL | Redis connection string | Yes |
| AWS_REGION | AWS region | Yes |
| NODE_ENV | Environment (development/production) | Yes |
| ARMLS_API_KEY | ARMLS API key | No |
| BRIDGE_API_KEY | Bridge API key | No |

## Premium Site

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_API_URL | Backend API URL | Yes |
| NEXT_PUBLIC_AGENT_ID | Agent identifier | Yes |

## Template Site

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_API_URL | Backend API URL | Yes |

## Local Development

Copy `.env.example` to `.env.local`:

```bash
cp apps/backend/.env.example apps/backend/.env.local
cp apps/premium-site/.env.local.example apps/premium-site/.env.local
```
