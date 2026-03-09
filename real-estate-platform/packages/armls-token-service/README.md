# @platform/armls-token-service

Self-healing OAuth 2.0 token lifecycle for ARMLS Spark API access. Tokens never expire silently — if something breaks, you know within minutes.

## Architecture

```
EventBridge (12h cron)
     │
     ▼
token-refresh-lambda
     │
     ├─► Read tokens from Secrets Manager
     ├─► If expiring soon → POST /v1/oauth2/grant (refresh)
     ├─► TRIPLE-SAFETY PERSIST:
     │     1. CloudWatch Log dump (fire-and-forget)
     │     2. SSM Parameter Store backup
     │     3. Secrets Manager primary (3x retry)
     └─► Alert via SNS if anything fails

Consumer Lambdas
     │
     └─► getArmslToken() → cached read from Secrets Manager
```

## Quick Start

```bash
# 1. Set up AWS infrastructure
pnpm setup-infra

# 2. Seed your pre-provisioned tokens
pnpm seed

# 3. Verify connectivity
pnpm test-refresh --api

# 4. Deploy Lambda + wire EventBridge (see setup-infra output)
```

## Usage in Consumer Lambdas

```typescript
import { getArmslToken, getArmslHeaders } from "@platform/armls-token-service";

// Simple: get the token
const token = await getArmslToken();

// Convenience: get ready-to-use headers
const headers = getArmslHeaders(token);

// Make Spark API calls
const response = await fetch(
  "https://sparkapi.com/v1/listings?_limit=10&_filter=StandardStatus eq 'Active'",
  { headers }
);
```

## Scripts

| Script | Command | Purpose |
|---|---|---|
| Infrastructure setup | `pnpm setup-infra` | Creates SNS, SSM, IAM, CloudWatch alarms, EventBridge |
| Seed tokens | `pnpm seed` | Write pre-provisioned tokens to Secrets Manager + SSM |
| Handshake (recovery) | `pnpm handshake` | OAuth auth code flow — only if refresh token dies |
| Test | `pnpm test-refresh` | Check token status |
| Test + API | `pnpm test-refresh --api` | Check status + make a real Spark API call |

## Recovery Procedures

**Alarm: "Refresh token dead"**
→ Re-run `pnpm handshake` or get new tokens from ARMLS, then `pnpm seed`

**Alarm: "SM write failed, SSM backup OK"**
→ Follow the CLI commands in the alert email to copy SSM → SM

**Alarm: "All write targets failed"**
→ Check CloudWatch Logs for `EMERGENCY_TOKEN_DUMP`, extract tokens manually

## Cost

~$0.50/month (Secrets Manager) + free tier (SSM, Lambda, EventBridge, CloudWatch)
