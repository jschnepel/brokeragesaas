/**
 * @platform/armls-token-service — Configuration Constants
 *
 * All magic strings and configuration values in one place.
 */

/** AWS region for all service clients */
export const AWS_REGION = "us-east-1";

/** Secrets Manager secret name */
export const SM_SECRET_NAME = "rlsir/armls/tokens";

/** SSM Parameter Store backup path */
export const SSM_BACKUP_PARAM = "/rlsir/armls/backup-tokens";

/** SNS topic ARN — update ACCOUNT_ID after infrastructure setup */
export const SNS_TOPIC_ARN =
  process.env.RLSIR_SNS_TOPIC_ARN ??
  `arn:aws:sns:${AWS_REGION}:${process.env.AWS_ACCOUNT_ID ?? "ACCOUNT_ID"}:rlsir-token-alerts`;

/** CloudWatch custom metrics namespace */
export const CW_NAMESPACE = "RLSIR/TokenManagement";

/** Spark API OAuth token endpoint */
export const SPARK_TOKEN_ENDPOINT = "https://sparkapi.com/v1/oauth2/grant";

/** Spark Platform authorization endpoint (for handshake script) */
export const SPARK_AUTH_ENDPOINT = "https://sparkplatform.com/oauth2";

/**
 * How far before expiry we trigger a refresh.
 * 2 hours = 7,200,000 ms.
 * With a 24-hour token life and 12-hour cron, this gives massive headroom.
 */
export const EXPIRY_BUFFER_MS = 2 * 60 * 60 * 1000;

/**
 * Secrets Manager write retry configuration.
 * 3 attempts with exponential backoff: 2s, 4s between retries.
 */
export const SM_WRITE_MAX_RETRIES = 3;
export const SM_WRITE_BASE_DELAY_MS = 2000;

/**
 * Consumer-side in-memory cache TTL.
 * 5 minutes — balances freshness vs. Secrets Manager API call cost.
 */
export const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;
