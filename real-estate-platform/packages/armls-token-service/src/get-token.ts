/**
 * @platform/armls-token-service — Consumer Token Utility
 *
 * Shared module for any Lambda or server function that needs to call
 * the ARMLS Spark API. Reads the access token from Secrets Manager
 * with in-memory caching.
 *
 * IMPORTANT: This module is READ-ONLY. It never refreshes tokens.
 * The refresh Lambda (refresh-lambda.ts) owns the token lifecycle.
 *
 * Usage:
 *   import { getArmslToken, getArmslHeaders } from "@platform/armls-token-service";
 *
 *   const token = await getArmslToken();
 *   const response = await fetch("https://sparkapi.com/v1/listings?_limit=1", {
 *     headers: getArmslHeaders(token),
 *   });
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import type { ArmslTokenSecret } from "./types.js";
import { AWS_REGION, SM_SECRET_NAME, TOKEN_CACHE_TTL_MS } from "./constants.js";

// ─── Client (initialized once, reused across warm invocations) ───
const smClient = new SecretsManagerClient({ region: AWS_REGION });

// ─── In-memory cache ─────────────────────────────────────────────
let cachedToken: string | null = null;
let cachedExpiresAt: string | null = null;
let cacheTimestamp = 0;

/**
 * Returns the current ARMLS access token from Secrets Manager.
 *
 * Uses an in-memory cache (5 min TTL) to minimize SM API calls.
 * Returns the token even if expired — let the caller handle 401s
 * gracefully (serve cached data, show updating state, etc.)
 *
 * Returns `null` only if Secrets Manager is unreachable.
 */
export async function getArmslToken(): Promise<string | null> {
  const now = Date.now();

  // Return cached token if cache is still fresh
  if (cachedToken && now - cacheTimestamp < TOKEN_CACHE_TTL_MS) {
    return cachedToken;
  }

  try {
    const response = await smClient.send(
      new GetSecretValueCommand({ SecretId: SM_SECRET_NAME })
    );

    if (!response.SecretString) {
      console.error("[armls-token] Secret has no string value");
      return cachedToken; // Return stale cache if available
    }

    const secret: ArmslTokenSecret = JSON.parse(response.SecretString);

    // Check if token is expired (log warning, but still return it)
    const expiresAt = new Date(secret.expires_at).getTime();
    if (expiresAt <= now) {
      console.warn(
        `[armls-token] Token is EXPIRED. expires_at: ${secret.expires_at}. ` +
          `Cron may have missed refresh. Returning expired token for caller to handle.`
      );
    }

    // Update cache
    cachedToken = secret.access_token;
    cachedExpiresAt = secret.expires_at;
    cacheTimestamp = now;

    return cachedToken;
  } catch (error) {
    console.error(
      "[armls-token] Failed to read from Secrets Manager:",
      error instanceof Error ? error.message : error
    );
    // Return stale cache if we have one — better than nothing
    if (cachedToken) {
      console.warn("[armls-token] Returning stale cached token as fallback.");
      return cachedToken;
    }
    return null;
  }
}

/**
 * Returns the full token secret (including refresh token, metadata, etc.)
 * Only use this for admin/debugging purposes — consumer Lambdas should
 * use getArmslToken() which returns just the access token.
 */
export async function getArmslTokenSecret(): Promise<ArmslTokenSecret | null> {
  try {
    const response = await smClient.send(
      new GetSecretValueCommand({ SecretId: SM_SECRET_NAME })
    );
    if (!response.SecretString) return null;
    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error(
      "[armls-token] Failed to read full secret:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Builds the headers required for Spark API requests.
 *
 * Spark requires:
 *   Authorization: OAuth <access_token>
 *   X-SparkApi-User-Agent: <app identifier>
 */
export function getArmslHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `OAuth ${accessToken}`,
    "X-SparkApi-User-Agent": "EchelonPoint/RLSIR/1.0",
  };
}

/**
 * Convenience: fetches token and returns ready-to-use headers.
 * Returns null if token is unavailable.
 */
export async function getArmslAuthHeaders(): Promise<Record<string, string> | null> {
  const token = await getArmslToken();
  if (!token) return null;
  return getArmslHeaders(token);
}
