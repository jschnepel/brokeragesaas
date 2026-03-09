# OAuth Token Lifecycle Architecture — RLSIR Platform

**Document**: IDX Token Management via AWS Secrets Manager + Lambda
**Platform**: Echelon Point / RLSIR Websites
**Target Integration**: ARMLS IDX via Spark API (FBS)
**Infrastructure**: AWS Amplify (Lambda, Secrets Manager, EventBridge, CloudWatch, SNS)
**Last Updated**: 2026-03-05
**Status**: Spark API auth docs reviewed and incorporated

---

## Executive Summary

This document defines the architecture for a self-healing OAuth 2.0 token lifecycle that eliminates manual token management for ARMLS IDX API access via the Spark Platform. The system uses AWS Secrets Manager as the persistent token store, an EventBridge-triggered Lambda for proactive token refresh, an optional one-time local handshake script (only if ARMLS does not provide pre-provisioned tokens), and CloudWatch + SNS for failure alerting.

**Cost**: ~$0.50–$1.00/month (Secrets Manager storage + negligible API call and Lambda execution costs).

**Goal**: Tokens never expire silently. The platform always has valid credentials. If something breaks, you know within minutes — not when a client notices stale listings.

---

## Spark API Auth — Confirmed Details

These details are sourced directly from the Spark Platform documentation at `sparkplatform.com/docs/authentication/oauth2_authentication` and the ARMLS Getting Started PDF.

| Detail | Value | Source |
|---|---|---|
| **Auth flow** | OAuth 2 Authorization Code only (no client_credentials grant) | Spark docs |
| **Token endpoint** | `https://sparkapi.com/v1/oauth2/grant` (POST, HTTPS required) | Spark docs |
| **Authorization endpoint** | `https://sparkplatform.com/oauth2` (IDX role) | Spark docs |
| **Access token lifetime** | 24 hours (`expires_in: 86400`) | Spark docs |
| **Refresh token rotation** | Yes — every refresh returns a NEW `refresh_token` | Spark docs |
| **Refresh token lifetime** | **Not documented** — must confirm with ARMLS or discover empirically | Unknown |
| **Pre-provisioned keys** | Some developers receive a "single session" key with `access_token` + `refresh_token` already provided, skipping the authorization handshake entirely | Spark docs |
| **API base URL** | `https://sparkapi.com/v1/` (Spark API) or `https://sparkapi.com/Reso/OData/` (RESO Web API) | ARMLS PDF |
| **Rate limit (IDX key)** | 1,500 requests per 5-minute window | Spark docs |
| **Auth header format** | `Authorization: OAuth [access_token]` | Spark docs |
| **Session expired response** | HTTP 401, error code 1020, `error='expired_token'` | Spark docs |
| **All requests** | Must use HTTPS when using OAuth 2 | Spark docs |

### Critical Implementation Note: Refresh Token Rotation

Every successful refresh call returns **both** a new `access_token` and a new `refresh_token`. The old refresh token is invalidated. This means:

- We **must** persist the new refresh token on every refresh cycle, or we permanently lose access.
- If any write to Secrets Manager fails after a successful token refresh, we have a dangling token pair with no way to recover except re-running the handshake.
- The Lambda must treat the Secrets Manager write as the critical operation — if it fails, alert immediately.

### Single Flow Architecture (Simplified from v1)

The Spark API does **not** support a separate client_credentials grant. All access flows through the authorization code path, with refresh tokens maintaining the session. This simplifies our architecture from two flows and two secrets down to **one flow and one secret**.

Some ARMLS developers receive pre-provisioned tokens (a "single session" key), which eliminates the need for the handshake script entirely. In that case, you simply store the provided tokens in Secrets Manager and the automated refresh cycle takes over.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│          INITIAL TOKEN SEEDING (one-time, pick one)         │
│                                                             │
│  OPTION A: Pre-provisioned key from ARMLS                   │
│  ──► You receive access_token + refresh_token via email     │
│  ──► Store directly in Secrets Manager (CLI or Console)     │
│  ──► Done. Skip to automated cycle.                         │
│                                                             │
│  OPTION B: Authorization Code Handshake (manual script)     │
│  ──► Script opens browser to:                               │
│      https://sparkplatform.com/oauth2                       │
│        ?response_type=code                                  │
│        &client_id=[client_id]                               │
│        &redirect_uri=http://localhost:3000/callback          │
│  ──► You log in to Flexmls / ARMLS, grant consent           │
│  ──► ARMLS redirects to localhost:3000/callback?code=XXX     │
│  ──► Script POSTs to https://sparkapi.com/v1/oauth2/grant:  │
│      {                                                      │
│        "client_id": "[client_id]",                          │
│        "client_secret": "[client_secret]",                  │
│        "grant_type": "authorization_code",                  │
│        "code": "[code]",                                    │
│        "redirect_uri": "http://localhost:3000/callback"     │
│      }                                                      │
│  ──► Receives: access_token, refresh_token, expires_in      │
│  ──► Writes to Secrets Manager                              │
│  ──► Done.                                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              AUTOMATED REFRESH CYCLE (runs forever)         │
│                                                             │
│  EventBridge Cron (every 12 hours)                          │
│       │                                                     │
│       ▼                                                     │
│  token-refresh-lambda                                       │
│       │                                                     │
│       ├──► Read secret from Secrets Manager                 │
│       │    Secret: rlsir/armls/tokens                       │
│       │                                                     │
│       ├──► Check: is access_token expiring within 2 hours?  │
│       │                                                     │
│       │    YES ──► POST https://sparkapi.com/v1/oauth2/grant│
│       │           {                                         │
│       │             "client_id": "[client_id]",             │
│       │             "client_secret": "[client_secret]",     │
│       │             "grant_type": "refresh_token",          │
│       │             "refresh_token": "[refresh_token]"      │
│       │           }                                         │
│       │           ──► Receives:                             │
│       │               access_token (new)                    │
│       │               refresh_token (new, MUST store)       │
│       │               expires_in: 86400                     │
│       │           ──► Write ALL tokens to Secrets Manager   │
│       │           ──► Verify write succeeded                │
│       │           ──► Log success                           │
│       │                                                     │
│       │    NO  ──► Skip, token still fresh                  │
│       │           ──► Log "token still valid, skipping"     │
│       │                                                     │
│       └──► On ANY failure:                                  │
│            ──► Log full error to CloudWatch                 │
│            ──► Publish to SNS (email alert)                 │
│            ──► If HTTP 401/400 with "invalid_grant":        │
│               ──► CRITICAL: refresh token is dead           │
│               ──► Publish metric RefreshTokenDead = 1       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              CONSUMER LAMBDAS (IDX API calls)               │
│                                                             │
│  Any Lambda needing ARMLS data:                             │
│       │                                                     │
│       ├──► Read access_token from Secrets Manager           │
│       │    (uses AWS SDK caching layer, ~5 min TTL)         │
│       │                                                     │
│       ├──► Call Spark API with header:                      │
│       │    Authorization: OAuth [access_token]              │
│       │                                                     │
│       ├──► If 200: process data normally                    │
│       │                                                     │
│       └──► If 401 (Code: 1020, expired_token):             │
│            ──► Log warning (cron should have caught this)   │
│            ──► Publish metric TokenExpiredAtCallTime = 1    │
│            ──► Do NOT attempt inline refresh                │
│            ──► Serve stale/cached data if available         │
└─────────────────────────────────────────────────────────────┘
```

---

## Secrets Manager Structure

### Single Secret: `rlsir/armls/tokens`

One secret holds everything. Client credentials (id/secret) are stored alongside tokens so the refresh Lambda is self-contained — it doesn't need environment variables or a second secret lookup.

```json
{
  "client_id": "your-armls-oauth-client-id",
  "client_secret": "your-armls-oauth-client-secret",
  "access_token": "eyJhbG...",
  "refresh_token": "dGhpcyBpcyBh...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": "2026-03-06T14:00:00Z",
  "last_refreshed": "2026-03-05T14:00:00Z",
  "refresh_count": 42,
  "flow_type": "authorization_code",
  "seeded_via": "handshake_script | pre_provisioned",
  "seeded_at": "2026-03-05T12:00:00Z"
}
```

**Field notes**:
- `expires_at`: Computed as `last_refreshed + expires_in`. The Lambda checks this field, not `expires_in`, to determine freshness.
- `refresh_count`: Incremented on each successful refresh. Useful for debugging and confirming the cron is actually running.
- `seeded_via`: Audit trail for how tokens were initially obtained.
- `client_id` / `client_secret`: Stored here rather than in Lambda env vars so rotation doesn't require a redeploy. If ARMLS ever rotates your API key credentials, you update one secret and the Lambda picks it up on the next cycle.

---

## Component 1: Initial Token Seeding

### Option A: Pre-Provisioned Key (Preferred if Available)

If ARMLS provides a "single session" key with tokens already generated:

1. Open AWS Console → Secrets Manager → Store a new secret
2. Select "Other type of secrets"
3. Paste the JSON structure above, filling in the provided `access_token`, `refresh_token`, `client_id`, and `client_secret`
4. Name: `rlsir/armls/tokens`
5. Compute `expires_at` as current time + 24 hours
6. Set `seeded_via` to `"pre_provisioned"`
7. Done — the cron takes over from here

Alternatively, use the AWS CLI:
```bash
aws secretsmanager create-secret \
  --name rlsir/armls/tokens \
  --secret-string '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "access_token": "PROVIDED_ACCESS_TOKEN",
    "refresh_token": "PROVIDED_REFRESH_TOKEN",
    "token_type": "Bearer",
    "expires_in": 86400,
    "expires_at": "2026-03-06T12:00:00Z",
    "last_refreshed": "2026-03-05T12:00:00Z",
    "refresh_count": 0,
    "flow_type": "authorization_code",
    "seeded_via": "pre_provisioned",
    "seeded_at": "2026-03-05T12:00:00Z"
  }'
```

### Option B: Authorization Code Handshake Script

**When needed**: Only if ARMLS does not provide pre-provisioned tokens. Also used as the recovery path when a refresh token expires/is revoked.

**Runtime**: Node.js (matches platform stack). Runs on your local machine.

**Spark-Specific Flow**:

1. Script starts a local Express server on `localhost:3000`
2. Opens browser to:
   ```
   https://sparkplatform.com/oauth2?response_type=code&client_id=[client_id]&redirect_uri=http://localhost:3000/callback
   ```
3. You log in to Flexmls/ARMLS and grant consent
4. ARMLS redirects to `http://localhost:3000/callback?code=[access_code]`
   - If error: redirects with `?error=[error_code]&error_description=[message]`
5. Script POSTs to `https://sparkapi.com/v1/oauth2/grant`:
   ```json
   {
     "client_id": "[client_id]",
     "client_secret": "[client_secret]",
     "grant_type": "authorization_code",
     "code": "[access_code]",
     "redirect_uri": "http://localhost:3000/callback"
   }
   ```
6. On success (HTTP 200), receives:
   ```json
   {
     "access_token": "[access_token]",
     "refresh_token": "[refresh_token]",
     "expires_in": 86400
   }
   ```
7. Script writes the full secret JSON to Secrets Manager
8. Prints summary: token expiry time, refresh token obtained, Secrets Manager write confirmed
9. Express server shuts down, script exits

**Important**: The `redirect_uri` must match exactly what's registered with FBS/ARMLS for your API key. If you register `http://localhost:3000/callback`, that's what you must use. Mismatch returns `error=redirect_uri_mismatch`.

**When to re-run**: Only if the refresh token expires/is revoked (you'll get a CRITICAL email alert). Also useful for initial setup if you don't get pre-provisioned tokens.

---

## Component 2: Token Refresh Lambda (`token-refresh-lambda`)

**Purpose**: Proactively refresh tokens before they expire, keeping Secrets Manager always populated with valid credentials.

**Trigger**: EventBridge cron rule — every 12 hours.

**Runtime**: Node.js 20.x (ARM64 for cost savings).

### Why Every 12 Hours?

Access tokens live 24 hours. A 12-hour cron with a 2-hour expiry buffer means:
- Token is refreshed ~12 hours before expiry in the normal case
- If one cron invocation fails entirely, the next one fires 12 hours later — still within the 24-hour window
- Two consecutive cron failures would need to occur before a token actually expires (extremely unlikely)
- At 2 invocations/day × 30 days = ~60 Lambda invocations/month (essentially free)

This is deliberately conservative. A 30-minute cron would also work but generates unnecessary invocations against a 24-hour token.

### Execution Logic (pseudocode)

```
function handler():
  try:
    // 1. Read current tokens
    secret = secretsManager.getSecretValue("rlsir/armls/tokens")
    tokens = JSON.parse(secret.SecretString)

    // 2. Check if refresh is needed
    expiresAt = new Date(tokens.expires_at)
    bufferMs = 2 * 60 * 60 * 1000  // 2 hours
    now = Date.now()

    if (expiresAt - now) > bufferMs:
      log("Token still valid. Expires at: " + tokens.expires_at
          + ". Refresh count: " + tokens.refresh_count
          + ". Skipping.")
      return { statusCode: 200, body: "Token fresh, no action needed" }

    // 3. Refresh the token
    log("Token expiring soon or expired. Initiating refresh...")

    response = POST "https://sparkapi.com/v1/oauth2/grant" {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: tokens.client_id,
        client_secret: tokens.client_secret,
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token
      })
    }

    // 4. Handle response
    if response.status != 200:
      errorBody = response.json()

      if errorBody.error == "invalid_grant"
         OR response.status == 401:
        // CRITICAL: Refresh token is dead
        log.error("CRITICAL: Refresh token invalid/expired."
                  + " Manual re-auth required."
                  + " Error: " + errorBody.error_description)
        cloudwatch.putMetric("RLSIR/TokenManagement",
                             "RefreshTokenDead", 1)
        sns.publish("rlsir-token-alerts",
          "CRITICAL: ARMLS refresh token is dead.\n"
          + "Error: " + errorBody.error_description + "\n"
          + "Action: Re-run handshake script or obtain new tokens from ARMLS.\n"
          + "Last successful refresh: " + tokens.last_refreshed + "\n"
          + "Total refreshes before failure: " + tokens.refresh_count)
        return { statusCode: 500, body: "Refresh token dead" }

      else:
        // Non-critical failure (network, rate limit, etc.)
        log.error("Token refresh failed: " + response.status
                  + " " + errorBody.error_description)
        cloudwatch.putMetric("RLSIR/TokenManagement",
                             "TokenRefreshFailed", 1)
        sns.publish("rlsir-token-alerts",
          "WARNING: ARMLS token refresh failed.\n"
          + "HTTP " + response.status + "\n"
          + "Error: " + errorBody.error_description + "\n"
          + "Token still valid until: " + tokens.expires_at + "\n"
          + "Will retry on next cron cycle.")
        return { statusCode: 500, body: "Refresh failed" }

    // ================================================================
    // TRIPLE-SAFETY TOKEN PERSISTENCE
    // ================================================================
    //
    // Spark rotates refresh tokens on every call. The moment we get
    // a 200 back, the OLD refresh token is dead on Spark's side.
    // If we fail to persist the new tokens, we're bricked.
    //
    // Safety layers:
    //   1. Emergency dump to CloudWatch Logs (survives SM/SSM outage)
    //   2. Backup write to SSM Parameter Store (independent from SM)
    //   3. Primary write to Secrets Manager with retry + backoff
    //
    // The order matters: cheapest/fastest safety net first, primary
    // write last with retries. If Lambda dies at any point after
    // step 1, we have a recovery path.
    // ================================================================

    // 5. Parse new tokens
    newTokens = response.json()
    refreshedAt = new Date().toISOString()
    newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()

    // 6. Build updated secret payload
    updatedSecret = {
      ...tokens,
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_in: newTokens.expires_in,
      expires_at: newExpiresAt,
      last_refreshed: refreshedAt,
      refresh_count: tokens.refresh_count + 1
    }
    secretPayload = JSON.stringify(updatedSecret)

    // ── SAFETY LAYER 1: Emergency CloudWatch dump ──────────────
    // This fires BEFORE any write attempts. CloudWatch Logs is a
    // separate service from SM and SSM. If everything else fails,
    // these tokens are recoverable from log inspection.
    // CloudWatch Logs are encrypted at rest with AWS-managed keys.
    //
    log.info("EMERGENCY_TOKEN_DUMP::BEGIN")
    log.info("EMERGENCY_TOKEN_DUMP::ACCESS_TOKEN::" + newTokens.access_token)
    log.info("EMERGENCY_TOKEN_DUMP::REFRESH_TOKEN::" + newTokens.refresh_token)
    log.info("EMERGENCY_TOKEN_DUMP::EXPIRES_IN::" + newTokens.expires_in)
    log.info("EMERGENCY_TOKEN_DUMP::TIMESTAMP::" + refreshedAt)
    log.info("EMERGENCY_TOKEN_DUMP::END")

    // Track write results for final status
    ssmWriteSuccess = false
    smWriteSuccess = false

    // ── SAFETY LAYER 2: Backup write to SSM Parameter Store ────
    // SSM is a completely independent service from Secrets Manager.
    // Both would need to be down simultaneously for us to lose
    // tokens (plus CloudWatch would also need to be down).
    //
    try:
      ssm.putParameter({
        Name: "/rlsir/armls/backup-tokens",
        Type: "SecureString",
        Value: secretPayload,
        Overwrite: true,
        Description: "Backup of ARMLS tokens. Recovery source if Secrets Manager write fails."
      })
      ssmWriteSuccess = true
      log("SSM backup write succeeded.")
    catch ssmError:
      log.warn("SSM backup write FAILED: " + ssmError.message
               + " — continuing to primary write.")

    // ── SAFETY LAYER 3: Primary write to Secrets Manager ───────
    // Retry with exponential backoff: 3 attempts over ~7 seconds.
    // This covers transient SM hiccups (throttling, brief outage).
    //
    maxRetries = 3
    for attempt = 1 to maxRetries:
      try:
        secretsManager.putSecretValue("rlsir/armls/tokens", secretPayload)
        smWriteSuccess = true
        log("Secrets Manager write succeeded on attempt " + attempt + ".")
        break

      catch smError:
        log.warn("Secrets Manager write FAILED on attempt " + attempt
                 + "/" + maxRetries + ": " + smError.message)
        if attempt < maxRetries:
          backoffMs = Math.pow(2, attempt) * 1000  // 2s, 4s
          log("Retrying in " + backoffMs + "ms...")
          await sleep(backoffMs)

    // ── EVALUATE RESULTS ───────────────────────────────────────
    if smWriteSuccess:
      log("Token refreshed and persisted successfully."
          + " New expiry: " + newExpiresAt
          + " Refresh count: " + updatedSecret.refresh_count
          + " SSM backup: " + (ssmWriteSuccess ? "OK" : "FAILED"))

      // Clean up: if SSM backup failed, that's a soft warning
      if NOT ssmWriteSuccess:
        cloudwatch.putMetric("RLSIR/TokenManagement",
                             "SSMBackupWriteFailed", 1)

      return { statusCode: 200, body: "Refreshed successfully" }

    else if ssmWriteSuccess:
      // SM failed but SSM has the tokens — recoverable without handshake
      log.error("CRITICAL: Secrets Manager write failed after " + maxRetries
                + " attempts, but SSM backup succeeded."
                + " Tokens are in SSM at /rlsir/armls/backup-tokens."
                + " Manual recovery: copy SSM value to Secrets Manager.")
      cloudwatch.putMetric("RLSIR/TokenManagement",
                           "SecretsManagerWriteFailed", 1)
      sns.publish("rlsir-token-alerts",
        "CRITICAL: Secrets Manager write FAILED but SSM backup SUCCEEDED.\n\n"
        + "New tokens are safe in SSM Parameter Store at:\n"
        + "  /rlsir/armls/backup-tokens\n\n"
        + "Recovery steps:\n"
        + "1. aws ssm get-parameter --name /rlsir/armls/backup-tokens "
        +    "--with-decryption --query Parameter.Value --output text\n"
        + "2. aws secretsmanager put-secret-value --secret-id rlsir/armls/tokens "
        +    "--secret-string '<paste value from step 1>'\n\n"
        + "The tokens are valid for 24 hours from: " + refreshedAt)
      return { statusCode: 500, body: "SM write failed, SSM backup OK" }

    else:
      // Both SM and SSM failed — tokens only exist in CloudWatch logs
      log.error("CRITICAL: BOTH Secrets Manager and SSM writes failed."
                + " Tokens exist ONLY in CloudWatch Logs (search EMERGENCY_TOKEN_DUMP)."
                + " Old refresh token is DEAD on Spark's side.")
      cloudwatch.putMetric("RLSIR/TokenManagement",
                           "RefreshTokenDead", 1)
      sns.publish("rlsir-token-alerts",
        "CRITICAL: ALL WRITE TARGETS FAILED.\n\n"
        + "Both Secrets Manager and SSM Parameter Store writes failed "
        + "after a successful Spark token refresh.\n\n"
        + "The old refresh token has been invalidated by Spark.\n"
        + "The new tokens exist ONLY in CloudWatch Logs.\n\n"
        + "Recovery steps:\n"
        + "1. Go to CloudWatch Logs → /aws/lambda/token-refresh-lambda\n"
        + "2. Search for: EMERGENCY_TOKEN_DUMP\n"
        + "3. Extract the access_token and refresh_token values\n"
        + "4. Manually reconstruct the secret JSON and write to Secrets Manager:\n"
        + "   aws secretsmanager put-secret-value --secret-id rlsir/armls/tokens "
        +     "--secret-string '<reconstructed JSON>'\n\n"
        + "If CloudWatch logs are also unavailable, re-run the handshake script.\n\n"
        + "Timestamp: " + refreshedAt)
      return { statusCode: 500, body: "All writes failed — check CloudWatch logs" }

  catch topLevelError:
    log.error("Unexpected error in token refresh: " + topLevelError.message)
    sns.publish("rlsir-token-alerts",
      "ERROR: Unexpected failure in token refresh Lambda.\n"
      + topLevelError.message)
    return { statusCode: 500, body: "Unexpected error" }
```

### Triple-Safety Token Persistence — Design Rationale

This is the scariest failure mode and it's unique to APIs that rotate refresh tokens (like Spark). The destructive sequence:

1. Lambda reads old tokens from Secrets Manager ✅
2. Lambda sends refresh request to Spark API ✅
3. Spark issues new tokens, **invalidates old refresh token forever** ✅
4. Lambda tries to persist new tokens ❌
5. Old refresh token: dead on Spark's side. New tokens: lost when Lambda exits.

**There is no undo.** Spark doesn't have a "cancel that refresh" endpoint. The moment you get a 200 back, you're holding the only copy of valid tokens in Lambda memory.

The triple-safety pattern ensures tokens survive in at least one location:

```
┌──────────────────────────────────────────────────────────┐
│              TOKEN PERSISTENCE CASCADE                    │
│                                                          │
│  Spark returns new tokens                                │
│       │                                                  │
│       ▼                                                  │
│  LAYER 1: CloudWatch Log Dump (immediate, fire-and-forget)
│       │   └── Tokens written to encrypted log stream     │
│       │   └── Survives SM + SSM outage simultaneously    │
│       │   └── Recovery: manual extraction from logs      │
│       │                                                  │
│       ▼                                                  │
│  LAYER 2: SSM Parameter Store Write (independent service)│
│       │   └── SecureString, KMS encrypted                │
│       │   └── /rlsir/armls/backup-tokens                 │
│       │   └── Recovery: copy SSM → SM (one CLI command)  │
│       │                                                  │
│       ▼                                                  │
│  LAYER 3: Secrets Manager Write (primary, 3x retry)      │
│       │   └── Exponential backoff: 2s, 4s between tries  │
│       │   └── This is what consumer Lambdas read from    │
│       │   └── On success: done, normal path              │
│       │                                                  │
│       ▼                                                  │
│  EVALUATE: Which writes succeeded?                       │
│       │                                                  │
│       ├── SM ✅           → All good, log and return     │
│       ├── SM ❌ SSM ✅    → Alert with recovery CLI cmds │
│       └── SM ❌ SSM ❌    → Alert: check CloudWatch logs │
│           (CW always ✅)    (or re-run handshake as last  │
│                              resort)                     │
└──────────────────────────────────────────────────────────┘
```

**Failure probability analysis** (because why not):
- Secrets Manager write failure: ~0.01% (99.99% SLA)
- SM write failure after 3 retries: ~0.000001% (0.01%³)
- SM + SSM both failing simultaneously: ~0.0000000001%
- SM + SSM + CloudWatch all failing: You have bigger problems than IDX tokens (check if AWS us-west-2 still exists)

**Cost of the paranoia**: One SSM SecureString parameter (free tier, Standard), zero additional CloudWatch cost (logging already happens). The insurance is effectively free.

### SSM Backup Parameter — Housekeeping

The SSM backup at `/rlsir/armls/backup-tokens` is overwritten on every successful refresh cycle. It always contains the most recent token pair. It does **not** accumulate versions — each write replaces the previous value.

**Do not use SSM as the primary token source for consumer Lambdas.** It's purely a write-behind backup for disaster recovery. Consumer Lambdas always read from Secrets Manager.

**Cleanup**: If you ever decommission this system, delete the SSM parameter:
```bash
aws ssm delete-parameter --name /rlsir/armls/backup-tokens
```

### Lambda Configuration

| Setting | Value | Rationale |
|---|---|---|
| Memory | 128 MB | Token refresh is lightweight HTTP calls |
| Timeout | 30 seconds | Generous for 1 HTTP call + Secrets Manager I/O |
| Architecture | ARM64 | 20% cheaper on Lambda |
| Retry | 2 (built-in EventBridge retries) | Catches transient failures |
| Reserved Concurrency | 1 | Prevents parallel refresh race conditions |
| Runtime | Node.js 20.x | Matches platform stack |

### IAM Policy (least privilege)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:PutSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-west-2:ACCOUNT_ID:secret:rlsir/armls/*"
    },
    {
      "Sid": "SSMBackupAccess",
      "Effect": "Allow",
      "Action": [
        "ssm:PutParameter",
        "ssm:GetParameter"
      ],
      "Resource": "arn:aws:ssm:us-west-2:ACCOUNT_ID:parameter/rlsir/armls/*"
    },
    {
      "Sid": "SNSAlerts",
      "Effect": "Allow",
      "Action": "sns:Publish",
      "Resource": "arn:aws:sns:us-west-2:ACCOUNT_ID:rlsir-token-alerts"
    },
    {
      "Sid": "CloudWatchMetrics",
      "Effect": "Allow",
      "Action": "cloudwatch:PutMetricData",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "cloudwatch:namespace": "RLSIR/TokenManagement"
        }
      }
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-west-2:ACCOUNT_ID:log-group:/aws/lambda/token-refresh-lambda:*"
    }
  ]
}
```

### EventBridge Cron Rule

```
Name: rlsir-token-refresh-schedule
Schedule: rate(12 hours)
Target: arn:aws:lambda:us-west-2:ACCOUNT_ID:function:token-refresh-lambda
```

Alternative cron expression for specific times (e.g., 6 AM and 6 PM UTC):
```
cron(0 6,18 * * ? *)
```

---

## Component 3: Consumer Lambda Token Access Pattern

Any Lambda in the platform that needs to call the ARMLS Spark API uses this shared utility:

```javascript
// Utility module: lib/armls-token.ts
//
// Reads the access token from Secrets Manager.
// Uses AWS SDK built-in caching (~5 min TTL) to minimize API calls.
// Consumer Lambdas are READ-ONLY — they never refresh tokens.

import {
  SecretsManagerClient,
  GetSecretValueCommand
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-west-2" });
const SECRET_NAME = "rlsir/armls/tokens";

// In-memory cache (survives across warm Lambda invocations)
let cachedToken = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getArmslToken() {
  const now = Date.now();

  // Return cached token if still fresh
  if (cachedToken && now < cacheExpiry) {
    return cachedToken;
  }

  // Fetch from Secrets Manager
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: SECRET_NAME })
  );
  const secret = JSON.parse(response.SecretString);

  // Check if token itself is expired
  const expiresAt = new Date(secret.expires_at).getTime();
  if (expiresAt <= now) {
    console.warn("[armls-token] Token is EXPIRED. " +
      "Cron may have missed refresh. expires_at:", secret.expires_at);
    // Still return it — the API call will fail with 401,
    // and the caller handles graceful degradation.
  }

  cachedToken = secret.access_token;
  cacheExpiry = now + CACHE_TTL_MS;
  return cachedToken;
}

// Usage in any consumer Lambda:
//
// import { getArmslToken } from "@platform/lib/armls-token";
//
// const token = await getArmslToken();
// const response = await fetch("https://sparkapi.com/v1/listings?...", {
//   headers: {
//     "Authorization": `OAuth ${token}`,
//     "X-SparkApi-User-Agent": "EchelonPoint/RLSIR"
//   }
// });
//
// if (response.status === 401) {
//   // Graceful degradation: serve cached data
// }
```

### Why No Inline Refresh?

Consumer Lambdas never attempt to refresh tokens themselves because:

1. **Race conditions**: Multiple concurrent Lambdas hitting the refresh endpoint simultaneously would each get different new refresh tokens, and only the last Secrets Manager write would survive. All other refresh tokens would be invalidated by Spark's rotation policy.
2. **Single responsibility**: The cron Lambda owns the token lifecycle. Consumer Lambdas own data fetching. Clean separation.
3. **Failure signal**: If a consumer hits an expired token, that's a symptom that the cron failed — and the alerting system catches it.

### Spark API Request Format

All consumer Lambda requests to the Spark API must include:

```
Authorization: OAuth [access_token]
X-SparkApi-User-Agent: EchelonPoint/RLSIR
```

The `X-SparkApi-User-Agent` header is required by Spark API and should identify your application.

### Spark API Rate Limits

IDX keys allow 1,500 requests per 5-minute window. Design consumer Lambdas with this in mind:

- ISR rebuilds should batch requests where possible
- Use `_select` parameter to request only needed fields (reduces response size)
- Use `ModificationTimestamp` filters for incremental syncs instead of full pulls
- Monitor rate limit headers and back off if approaching the limit

---

## Component 4: Alerting — CloudWatch + SNS

### SNS Topic: `rlsir-token-alerts`

- **Subscription**: Your email address
- **Purpose**: Immediate notification when token refresh fails

### Custom Metrics Namespace: `RLSIR/TokenManagement`

| Metric | Meaning | Published by |
|---|---|---|
| `RefreshTokenDead` | Refresh token expired, revoked, or all write targets failed | Refresh Lambda |
| `TokenRefreshFailed` | Refresh attempt failed (network, rate limit, etc.) | Refresh Lambda |
| `TokenExpiredAtCallTime` | Consumer Lambda encountered an expired access token | Consumer Lambdas |
| `SecretsManagerWriteFailed` | SM write failed but SSM backup succeeded — manual recovery needed | Refresh Lambda |
| `SSMBackupWriteFailed` | SSM backup write failed (soft warning, SM is still primary) | Refresh Lambda |

### CloudWatch Alarms

**Alarm 1: `rlsir-refresh-token-dead`** (CRITICAL)
- **Metric**: `RLSIR/TokenManagement` → `RefreshTokenDead`
- **Condition**: >= 1 for 1 datapoint within 5 minutes
- **Action**: SNS publish to `rlsir-token-alerts`
- **What it means**: Manual intervention required. Re-run handshake script or obtain new tokens from ARMLS.

**Alarm 2: `rlsir-token-refresh-failed`** (WARNING)
- **Metric**: `RLSIR/TokenManagement` → `TokenRefreshFailed`
- **Condition**: >= 2 within 24 hours
- **Action**: SNS publish to `rlsir-token-alerts`
- **What it means**: Refresh is failing repeatedly. Likely transient if only 1, concerning if 2+ (since cron only runs every 12 hours, 2 failures = 24 hours of failed refreshes).

**Alarm 3: `rlsir-cron-missed-expiry`** (WARNING)
- **Metric**: `RLSIR/TokenManagement` → `TokenExpiredAtCallTime`
- **Condition**: >= 1 for 1 datapoint within 5 minutes
- **Action**: SNS publish to `rlsir-token-alerts`
- **What it means**: A consumer Lambda found an expired token. The refresh cron may be failing silently. Check Lambda logs.

---

## Failure Modes & Recovery

| # | Failure | Detection | Impact | Recovery |
|---|---|---|---|---|
| 1 | Access token expires (cron missed) | Alarm 3 | API calls return 401, stale data served | Check cron Lambda logs. Next cron cycle should fix it. |
| 2 | Refresh token expires/revoked | Alarm 1 (CRITICAL) | Cannot refresh. Access degrades within 24h. | Re-run handshake script or get new tokens from ARMLS. |
| 3 | SM write fails, SSM write succeeds | Alert with CLI recovery commands | SM has stale tokens, but new tokens safe in SSM | Copy SSM → SM with provided CLI commands (30 seconds). |
| 4 | SM + SSM both fail, CW logs succeed | CRITICAL alert referencing CW logs | Tokens only in CloudWatch Logs | Extract from CW logs, manually write to SM. |
| 5 | SM + SSM + CW all fail | Lambda itself probably crashed | Tokens lost entirely | Re-run handshake script. (Requires SM, SSM, CW, AND Lambda networking all failing — effectively an AWS region outage.) |
| 6 | Spark API temporarily down | Alarm 2 after 2 failures | Tokens go stale if outage exceeds 24h | Wait. Cron retries every 12h. Spark outages are typically short. |
| 7 | Rate limited (HTTP 429) | Alarm 2 | Refresh request rejected | Extremely unlikely for 2 requests/day. Would indicate a larger issue. |
| 8 | ARMLS rotates your API key credentials | All refreshes fail with auth error | Access denied | Update `client_id` / `client_secret` in Secrets Manager. |
| 9 | Lambda code bug | CloudWatch Lambda error metrics | No refresh occurs | Fix code, redeploy. Token valid for 24h, so you have time. |
| 10 | EventBridge rule disabled/deleted | No cron fires, Alarm 3 eventually | Token expires after 24h | Re-create EventBridge rule. |

---

## Implementation Order

### Phase 1: Infrastructure (15 min)
1. Create Secrets Manager secret `rlsir/armls/tokens` with placeholder JSON
2. Create SSM Parameter `/rlsir/armls/backup-tokens` (SecureString, placeholder value)
3. Create SNS topic `rlsir-token-alerts`, subscribe your email, confirm subscription

### Phase 2: Token Seeding (5–30 min)
4. **If pre-provisioned key**: Update the secret with real tokens via CLI
5. **If auth code flow needed**: Build and run the handshake script

### Phase 3: Refresh Lambda (1–2 hours)
6. Build `token-refresh-lambda` with the triple-safety persistence logic
7. Create IAM role with the least-privilege policy (includes SM + SSM + SNS + CW)
8. Deploy Lambda (128MB, ARM64, 30s timeout, reserved concurrency = 1)
9. Create EventBridge rule: `rate(12 hours)`, target the Lambda

### Phase 4: Alerting (15 min)
10. Create CloudWatch alarms (3 alarms wired to SNS topic)

### Phase 5: Consumer Utility (30 min)
11. Build `@platform/lib/armls-token.ts` shared module
12. Test: call `getArmslToken()` from a test Lambda, verify it returns a valid token
13. Test: make a real Spark API call (`GET /v1/listings?_limit=1`)

### Phase 6: Validation (30 min)
14. Manually expire the token in Secrets Manager (set `expires_at` to the past)
15. Trigger the cron Lambda manually, verify it refreshes and writes back
16. Verify tokens appear in both Secrets Manager AND SSM Parameter Store
17. Verify CloudWatch logs contain EMERGENCY_TOKEN_DUMP entries
18. Verify CloudWatch metrics and logs populated correctly
19. Test alert: publish a fake `RefreshTokenDead` metric, confirm email arrives

### Phase 7: Documentation
20. Record actual `refresh_token` lifetime once observed (first refresh that fails will reveal it)
21. Record the registered `redirect_uri` for your key (needed for future handshake runs)
22. Store a copy of this doc in `.claude/` or project wiki

---

## Open Questions

| # | Question | Status | Impact |
|---|---|---|---|
| 1 | What key type will ARMLS provide? (Pre-provisioned vs. auth code) | **Ask ARMLS** | Determines whether handshake script is needed |
| 2 | What is the refresh token lifetime? | **Not documented by Spark** | Determines how often you might need to re-auth. Set up monitoring to detect empirically. |
| 3 | What `redirect_uri` is registered for your key? | **Ask ARMLS / check key email** | Must match exactly in handshake script |
| 4 | Which Spark API scopes/roles does your key have? (IDX, VOW, Private) | **Check key provisioning email** | Determines what data you can access |
| 5 | Is Replication enabled for your key? | **Default is no** | If yes, query syntax differs slightly (see ARMLS PDF page 4) |
| 6 | AWS region for deployment? | Presumably `us-west-2` (Oregon) or `us-east-1` | Affects ARNs in IAM policy |

---

## Appendix: Spark API Quick Reference (from ARMLS PDF)

For consumer Lambdas — common query patterns:

| Action | Spark API URL |
|---|---|
| All active listings | `GET /v1/listings?_filter=StandardStatus eq 'Active'` |
| Residential only | `GET /v1/listings?_filter=PropertyType eq 'A'` |
| Modified since timestamp | `GET /v1/listings?_filter=ModificationTimestamp gt 2026-03-01T00:00:00Z` |
| Select specific fields | `GET /v1/listings?_select=ListingId,ModificationTimestamp,ListPrice` |
| Limit results | `GET /v1/listings?_limit=100` |
| Pagination count | `GET /v1/listings?_filter=StandardStatus eq 'Active'&_pagination=1` |
| RESO Web API listings | `GET /Reso/OData/Property?$filter=StandardStatus eq 'Active'` |
| Member data | `GET /v1/accounts?_filter=UserType eq 'Member'` |
| Office data | `GET /v1/accounts?_filter=UserType eq 'Office'` |
| Standard field metadata | `GET /v1/standardfields?_expand=ResoStandardNames` |

All URLs are relative to `https://sparkapi.com`. All require `Authorization: OAuth [access_token]` header.
