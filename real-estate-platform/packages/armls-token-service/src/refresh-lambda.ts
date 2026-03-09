/**
 * @platform/armls-token-service — Token Refresh Lambda
 *
 * Proactively refreshes ARMLS Spark API tokens before they expire.
 * Triggered by EventBridge cron every 12 hours.
 *
 * TRIPLE-SAFETY PERSISTENCE:
 *   1. Emergency dump to CloudWatch Logs (fire-and-forget, survives SM/SSM outage)
 *   2. Backup write to SSM Parameter Store (independent service from SM)
 *   3. Primary write to Secrets Manager with 3x retry + exponential backoff
 *
 * Why all three? Spark rotates refresh tokens on every call. The moment
 * we get a 200 back, the old refresh token is DEAD. If we fail to persist
 * the new tokens, we're bricked and need to re-run the handshake script.
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  SSMClient,
  PutParameterCommand,
} from "@aws-sdk/client-ssm";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  SNSClient,
  PublishCommand,
} from "@aws-sdk/client-sns";
import type {
  ArmslTokenSecret,
  SparkTokenResponse,
  SparkTokenError,
  PersistenceResult,
  RefreshResult,
} from "./types.js";
import {
  AWS_REGION,
  SM_SECRET_NAME,
  SSM_BACKUP_PARAM,
  SNS_TOPIC_ARN,
  CW_NAMESPACE,
  SPARK_TOKEN_ENDPOINT,
  EXPIRY_BUFFER_MS,
  SM_WRITE_MAX_RETRIES,
  SM_WRITE_BASE_DELAY_MS,
} from "./constants.js";

// ─── AWS Clients (reused across warm invocations) ────────────────
const smClient = new SecretsManagerClient({ region: AWS_REGION });
const ssmClient = new SSMClient({ region: AWS_REGION });
const cwClient = new CloudWatchClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });

// ─── Helpers ─────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function publishMetric(metricName: string, value = 1): Promise<void> {
  try {
    await cwClient.send(
      new PutMetricDataCommand({
        Namespace: CW_NAMESPACE,
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: "Count",
            Timestamp: new Date(),
          },
        ],
      })
    );
  } catch (err) {
    console.error(`[metric] Failed to publish ${metricName}:`, err);
  }
}

async function publishAlert(subject: string, message: string): Promise<void> {
  try {
    await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: subject.slice(0, 100), // SNS subject limit
        Message: message,
      })
    );
  } catch (err) {
    console.error("[alert] Failed to publish SNS alert:", err);
  }
}

// ─── Core: Token Refresh ─────────────────────────────────────────

async function refreshTokenWithSpark(
  tokens: ArmslTokenSecret
): Promise<SparkTokenResponse> {
  // ── LOG: Request details ──────────────────────────────────
  console.info("[spark-request] ═══ TOKEN REFRESH REQUEST ═══");
  console.info(`[spark-request] Endpoint: ${SPARK_TOKEN_ENDPOINT}`);
  console.info(`[spark-request] Method: POST`);
  console.info(`[spark-request] grant_type: refresh_token`);
  console.info(`[spark-request] client_id: ${tokens.client_id}`);
  console.info(`[spark-request] refresh_token: ${tokens.refresh_token.substring(0, 8)}...${tokens.refresh_token.substring(tokens.refresh_token.length - 4)}`);
  console.info(`[spark-request] Current access_token: ${tokens.access_token.substring(0, 8)}...${tokens.access_token.substring(tokens.access_token.length - 4)}`);
  console.info(`[spark-request] Current expires_at: ${tokens.expires_at}`);
  console.info(`[spark-request] Current refresh_count: ${tokens.refresh_count}`);
  console.info(`[spark-request] Sending request at: ${new Date().toISOString()}`);

  const body = JSON.stringify({
    client_id: tokens.client_id,
    client_secret: tokens.client_secret,
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
  });

  const requestStart = Date.now();
  const response = await fetch(SPARK_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const requestDuration = Date.now() - requestStart;

  // ── LOG: Response metadata ────────────────────────────────
  console.info("[spark-response] ═══ TOKEN REFRESH RESPONSE ═══");
  console.info(`[spark-response] HTTP status: ${response.status} ${response.statusText}`);
  console.info(`[spark-response] Duration: ${requestDuration}ms`);
  console.info(`[spark-response] Headers: content-type=${response.headers.get("content-type")}, x-request-id=${response.headers.get("x-request-id") ?? "none"}`);

  if (!response.ok) {
    const rawBody = await response.text();
    console.error(`[spark-response] ERROR BODY (raw): ${rawBody}`);

    let errorBody: SparkTokenError;
    try {
      errorBody = JSON.parse(rawBody) as SparkTokenError;
    } catch {
      console.error(`[spark-response] Could not parse error body as JSON`);
      throw new RefreshFailedError(
        `Token refresh failed: HTTP ${response.status} — non-JSON response: ${rawBody.substring(0, 200)}`,
        response.status,
        { error: "parse_error", error_description: rawBody.substring(0, 200) }
      );
    }

    console.error(`[spark-response] error: ${errorBody.error}`);
    console.error(`[spark-response] error_description: ${errorBody.error_description}`);

    if (
      response.status === 401 ||
      response.status === 400 ||
      errorBody.error === "invalid_grant"
    ) {
      throw new RefreshTokenDeadError(
        `Refresh token invalid/expired: ${errorBody.error} — ${errorBody.error_description}`,
        errorBody
      );
    }

    throw new RefreshFailedError(
      `Token refresh failed: HTTP ${response.status} — ${errorBody.error_description}`,
      response.status,
      errorBody
    );
  }

  // ── IMMEDIATE: Log raw response body the instant we receive it ──
  // Spark has already rotated the token at this point. This raw log
  // is the absolute earliest we can capture the new tokens.
  const rawSuccess = await response.text();
  console.info("EMERGENCY_TOKEN_DUMP::RAW_RESPONSE::BEGIN");
  console.info(`EMERGENCY_TOKEN_DUMP::RAW_RESPONSE::${rawSuccess}`);
  console.info("EMERGENCY_TOKEN_DUMP::RAW_RESPONSE::END");

  let parsed: SparkTokenResponse;
  try {
    parsed = JSON.parse(rawSuccess) as SparkTokenResponse;
  } catch {
    console.error(`[spark-response] Could not parse success body as JSON`);
    throw new Error(`Spark returned 200 but non-JSON body: ${rawSuccess.substring(0, 200)}`);
  }

  console.info(`[spark-response] Parsed fields:`);
  console.info(`[spark-response]   access_token: ${parsed.access_token ? `${parsed.access_token.substring(0, 8)}...(${parsed.access_token.length} chars)` : "MISSING"}`);
  console.info(`[spark-response]   refresh_token: ${parsed.refresh_token ? `${parsed.refresh_token.substring(0, 8)}...(${parsed.refresh_token.length} chars)` : "MISSING"}`);
  console.info(`[spark-response]   expires_in: ${parsed.expires_in ?? "MISSING"}`);
  console.info(`[spark-response]   token_type: ${(parsed as Record<string, unknown>).token_type ?? "MISSING"}`);
  console.info(`[spark-response]   All keys: ${Object.keys(parsed).join(", ")}`);
  console.info("[spark-response] ═══ END TOKEN REFRESH ═══");

  return parsed;
}

// ─── Core: Triple-Safety Persistence ─────────────────────────────

async function persistTokens(
  updatedSecret: ArmslTokenSecret
): Promise<PersistenceResult> {
  const payload = JSON.stringify(updatedSecret);
  const result: PersistenceResult = {
    cloudwatch_logged: false,
    ssm_write_success: false,
    sm_write_success: false,
  };

  // ── LAYER 1: CloudWatch Log Dump (structured) ───────────────
  // Raw response was already dumped inside refreshTokenWithSpark().
  // This structured dump adds computed fields (expires_at, refresh_count).
  console.info("EMERGENCY_TOKEN_DUMP::STRUCTURED::BEGIN");
  console.info(`EMERGENCY_TOKEN_DUMP::STRUCTURED::ACCESS_TOKEN::${updatedSecret.access_token}`);
  console.info(`EMERGENCY_TOKEN_DUMP::STRUCTURED::REFRESH_TOKEN::${updatedSecret.refresh_token}`);
  console.info(`EMERGENCY_TOKEN_DUMP::STRUCTURED::EXPIRES_IN::${updatedSecret.expires_in}`);
  console.info(`EMERGENCY_TOKEN_DUMP::STRUCTURED::EXPIRES_AT::${updatedSecret.expires_at}`);
  console.info(`EMERGENCY_TOKEN_DUMP::STRUCTURED::TIMESTAMP::${updatedSecret.last_refreshed}`);
  console.info(`EMERGENCY_TOKEN_DUMP::STRUCTURED::REFRESH_COUNT::${updatedSecret.refresh_count}`);
  console.info("EMERGENCY_TOKEN_DUMP::STRUCTURED::END");
  result.cloudwatch_logged = true;

  // ── LAYER 2: Backup Write to SSM Parameter Store ─────────────
  // SSM is independent from Secrets Manager — different service,
  // different infrastructure. Both failing simultaneously is
  // approaching "AWS region is gone" territory.
  try {
    await ssmClient.send(
      new PutParameterCommand({
        Name: SSM_BACKUP_PARAM,
        Type: "SecureString",
        Value: payload,
        Overwrite: true,
        Description:
          "Backup of ARMLS tokens. Recovery source if Secrets Manager write fails. " +
          `Last updated: ${updatedSecret.last_refreshed}`,
      })
    );
    result.ssm_write_success = true;
    console.info("[persist] SSM backup write succeeded.");
  } catch (err) {
    result.ssm_error =
      err instanceof Error ? err.message : "Unknown SSM error";
    console.warn(`[persist] SSM backup write FAILED: ${result.ssm_error}`);
  }

  // ── LAYER 3: Primary Write to Secrets Manager (3x retry) ────
  for (let attempt = 1; attempt <= SM_WRITE_MAX_RETRIES; attempt++) {
    try {
      await smClient.send(
        new PutSecretValueCommand({
          SecretId: SM_SECRET_NAME,
          SecretString: payload,
        })
      );
      result.sm_write_success = true;
      console.info(
        `[persist] Secrets Manager write succeeded on attempt ${attempt}/${SM_WRITE_MAX_RETRIES}.`
      );
      break;
    } catch (err) {
      result.sm_error =
        err instanceof Error ? err.message : "Unknown SM error";
      console.warn(
        `[persist] Secrets Manager write FAILED on attempt ${attempt}/${SM_WRITE_MAX_RETRIES}: ${result.sm_error}`
      );
      if (attempt < SM_WRITE_MAX_RETRIES) {
        const backoff = SM_WRITE_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.info(`[persist] Retrying in ${backoff}ms...`);
        await sleep(backoff);
      }
    }
  }

  return result;
}

// ─── Core: Evaluate Persistence Results ──────────────────────────

async function handlePersistenceResult(
  result: PersistenceResult,
  updatedSecret: ArmslTokenSecret
): Promise<RefreshResult> {
  const { sm_write_success, ssm_write_success } = result;

  // ── Happy path: SM write succeeded ───────────────────────────
  if (sm_write_success) {
    console.info(
      `[refresh] Token refreshed and persisted successfully. ` +
        `expires_at: ${updatedSecret.expires_at} | ` +
        `refresh_count: ${updatedSecret.refresh_count} | ` +
        `ssm_backup: ${ssm_write_success ? "OK" : "FAILED"}`
    );

    // Soft warning if SSM backup failed (tokens are safe in SM though)
    if (!ssm_write_success) {
      await publishMetric("SSMBackupWriteFailed");
    }

    return {
      statusCode: 200,
      body: "Token refreshed successfully",
      persistence: result,
    };
  }

  // ── SM failed, SSM succeeded — recoverable without handshake ─
  if (ssm_write_success) {
    console.error(
      `[refresh] CRITICAL: Secrets Manager write failed after ${SM_WRITE_MAX_RETRIES} attempts, ` +
        `but SSM backup succeeded. Tokens safe at ${SSM_BACKUP_PARAM}.`
    );
    await publishMetric("SecretsManagerWriteFailed");
    await publishAlert(
      "CRITICAL: ARMLS SM Write Failed — SSM Backup OK",
      `Secrets Manager write FAILED but SSM backup SUCCEEDED.\n\n` +
        `New tokens are safe in SSM Parameter Store at:\n` +
        `  ${SSM_BACKUP_PARAM}\n\n` +
        `Recovery steps:\n` +
        `1. aws ssm get-parameter --name ${SSM_BACKUP_PARAM} ` +
        `--with-decryption --query Parameter.Value --output text --region ${AWS_REGION}\n` +
        `2. aws secretsmanager put-secret-value --secret-id ${SM_SECRET_NAME} ` +
        `--secret-string '<paste value from step 1>' --region ${AWS_REGION}\n\n` +
        `SM error: ${result.sm_error}\n` +
        `Tokens valid for 24h from: ${updatedSecret.last_refreshed}`
    );

    return {
      statusCode: 500,
      body: "SM write failed, SSM backup OK — see alert for recovery steps",
      persistence: result,
    };
  }

  // ── Both SM and SSM failed — tokens only in CloudWatch logs ──
  console.error(
    `[refresh] CRITICAL: BOTH Secrets Manager and SSM writes failed. ` +
      `Tokens exist ONLY in CloudWatch Logs (search EMERGENCY_TOKEN_DUMP). ` +
      `Old refresh token is DEAD on Spark's side.`
  );
  await publishMetric("RefreshTokenDead");
  await publishAlert(
    "CRITICAL: ALL WRITE TARGETS FAILED",
    `BOTH Secrets Manager AND SSM Parameter Store writes failed ` +
      `after a successful Spark token refresh.\n\n` +
      `The old refresh token has been invalidated by Spark.\n` +
      `The new tokens exist ONLY in CloudWatch Logs.\n\n` +
      `Recovery steps:\n` +
      `1. Go to CloudWatch Logs → /aws/lambda/token-refresh-lambda\n` +
      `2. Search for: EMERGENCY_TOKEN_DUMP\n` +
      `3. Extract the access_token and refresh_token values\n` +
      `4. Reconstruct the secret JSON and write to Secrets Manager:\n` +
      `   aws secretsmanager put-secret-value --secret-id ${SM_SECRET_NAME} ` +
      `--secret-string '<reconstructed JSON>' --region ${AWS_REGION}\n\n` +
      `If CloudWatch logs are also unavailable, re-run the handshake script.\n\n` +
      `SM error: ${result.sm_error}\n` +
      `SSM error: ${result.ssm_error}\n` +
      `Timestamp: ${updatedSecret.last_refreshed}`
  );

  return {
    statusCode: 500,
    body: "All writes failed — check CloudWatch logs for EMERGENCY_TOKEN_DUMP",
    persistence: result,
  };
}

// ─── Custom Error Classes ────────────────────────────────────────

class RefreshTokenDeadError extends Error {
  constructor(
    message: string,
    public sparkError: SparkTokenError
  ) {
    super(message);
    this.name = "RefreshTokenDeadError";
  }
}

class RefreshFailedError extends Error {
  constructor(
    message: string,
    public httpStatus: number,
    public sparkError: SparkTokenError
  ) {
    super(message);
    this.name = "RefreshFailedError";
  }
}

// ─── Lambda Handler ──────────────────────────────────────────────

export async function handler(): Promise<RefreshResult> {
  console.info("[refresh] Token refresh Lambda invoked.");

  try {
    // ── 1. Read current tokens ─────────────────────────────────
    const secretResponse = await smClient.send(
      new GetSecretValueCommand({ SecretId: SM_SECRET_NAME })
    );

    if (!secretResponse.SecretString) {
      const msg = "Secret has no string value. Is it seeded?";
      console.error(`[refresh] ${msg}`);
      await publishAlert("ERROR: ARMLS Secret Empty", msg);
      return { statusCode: 500, body: msg };
    }

    const tokens: ArmslTokenSecret = JSON.parse(secretResponse.SecretString);
    console.info("[refresh] ═══ CURRENT TOKEN STATE ═══");
    console.info(`[refresh] client_id: ${tokens.client_id}`);
    console.info(`[refresh] access_token: ${tokens.access_token?.substring(0, 8)}...(${tokens.access_token?.length ?? 0} chars)`);
    console.info(`[refresh] refresh_token: ${tokens.refresh_token?.substring(0, 8)}...(${tokens.refresh_token?.length ?? 0} chars)`);
    console.info(`[refresh] expires_at: ${tokens.expires_at}`);
    console.info(`[refresh] expires_in: ${tokens.expires_in}`);
    console.info(`[refresh] last_refreshed: ${tokens.last_refreshed}`);
    console.info(`[refresh] refresh_count: ${tokens.refresh_count}`);
    console.info(`[refresh] flow_type: ${tokens.flow_type}`);
    console.info(`[refresh] seeded_via: ${tokens.seeded_via}`);

    // ── 2. Check if refresh is needed ──────────────────────────
    const expiresAt = new Date(tokens.expires_at).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry > EXPIRY_BUFFER_MS) {
      const hoursLeft = Math.round(timeUntilExpiry / 3_600_000 * 10) / 10;
      console.info(
        `[refresh] Token still valid. ` +
          `expires_at: ${tokens.expires_at} | ` +
          `hours_remaining: ${hoursLeft} | ` +
          `refresh_count: ${tokens.refresh_count} | ` +
          `Skipping.`
      );
      return { statusCode: 200, body: `Token fresh (${hoursLeft}h remaining)` };
    }

    // ── 3. Refresh the token ───────────────────────────────────
    const hoursUntil = Math.round(timeUntilExpiry / 3_600_000 * 10) / 10;
    console.info(
      `[refresh] Token expiring in ${hoursUntil}h (buffer: ${EXPIRY_BUFFER_MS / 3_600_000}h). ` +
        `Initiating refresh...`
    );

    let newTokens: SparkTokenResponse;
    try {
      newTokens = await refreshTokenWithSpark(tokens);
    } catch (err) {
      if (err instanceof RefreshTokenDeadError) {
        // CRITICAL: Refresh token is dead — manual intervention required
        console.error(`[refresh] CRITICAL: ${err.message}`);
        await publishMetric("RefreshTokenDead");
        await publishAlert(
          "CRITICAL: ARMLS Refresh Token Dead",
          `The refresh token is invalid or expired.\n\n` +
            `Error: ${err.sparkError.error} — ${err.sparkError.error_description}\n` +
            `Last successful refresh: ${tokens.last_refreshed}\n` +
            `Total refreshes before failure: ${tokens.refresh_count}\n\n` +
            `Action required: Re-run the handshake script or obtain new tokens from ARMLS.`
        );
        return { statusCode: 500, body: "Refresh token dead" };
      }

      if (err instanceof RefreshFailedError) {
        // Non-critical: network/rate limit/transient failure
        console.error(`[refresh] ${err.message}`);
        await publishMetric("TokenRefreshFailed");
        await publishAlert(
          "WARNING: ARMLS Token Refresh Failed",
          `Token refresh failed.\n\n` +
            `HTTP ${err.httpStatus}: ${err.sparkError.error_description}\n` +
            `Token still valid until: ${tokens.expires_at}\n` +
            `Will retry on next cron cycle (12h).`
        );
        return { statusCode: 500, body: "Refresh failed, will retry" };
      }

      // Unexpected error shape
      throw err;
    }

    // Emergency dump already fired inside refreshTokenWithSpark() the instant
    // the response was received — before parsing, before returning here.

    // Default expires_in to 24h if Spark doesn't include it
    const expiresIn = newTokens.expires_in ?? 86400;

    console.info(
      `[refresh] Spark returned new tokens. expires_in: ${expiresIn}s. ` +
        `Proceeding to triple-safety persistence...`
    );

    // ── 4. Build updated secret ────────────────────────────────
    const refreshedAt = new Date().toISOString();
    const newExpiresAt = new Date(
      Date.now() + expiresIn * 1000
    ).toISOString();

    const updatedSecret: ArmslTokenSecret = {
      ...tokens,
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_in: expiresIn,
      expires_at: newExpiresAt,
      last_refreshed: refreshedAt,
      refresh_count: tokens.refresh_count + 1,
    };

    // ── 5. Triple-safety persist ───────────────────────────────
    console.info("[refresh] ═══ STARTING TRIPLE-SAFETY PERSISTENCE ═══");
    const persistResult = await persistTokens(updatedSecret);
    console.info("[refresh] ═══ PERSISTENCE RESULTS ═══");
    console.info(`[refresh]   CloudWatch logged: ${persistResult.cloudwatch_logged}`);
    console.info(`[refresh]   SSM write: ${persistResult.ssm_write_success}${persistResult.ssm_error ? ` (error: ${persistResult.ssm_error})` : ""}`);
    console.info(`[refresh]   SM write: ${persistResult.sm_write_success}${persistResult.sm_error ? ` (error: ${persistResult.sm_error})` : ""}`);

    // ── 6. Evaluate and alert ──────────────────────────────────
    const finalResult = await handlePersistenceResult(persistResult, updatedSecret);
    console.info(`[refresh] ═══ FINAL RESULT: ${finalResult.statusCode} — ${finalResult.body} ═══`);
    return finalResult;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[refresh] Unexpected error: ${message}`, error);
    await publishAlert(
      "ERROR: ARMLS Token Refresh Unexpected Failure",
      `Unexpected error in token refresh Lambda:\n\n${message}`
    );
    return { statusCode: 500, body: `Unexpected error: ${message}` };
  }
}
