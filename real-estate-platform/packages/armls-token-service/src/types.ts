/**
 * @platform/armls-token-service — Type Definitions
 *
 * Shared types for the ARMLS Spark API token lifecycle system.
 */

/** Shape of the secret stored in AWS Secrets Manager at rlsir/armls/tokens */
export interface ArmslTokenSecret {
  /** OAuth client ID provided by FBS/ARMLS */
  client_id: string;
  /** OAuth client secret provided by FBS/ARMLS */
  client_secret: string;
  /** Current access token for Spark API calls */
  access_token: string;
  /** Current refresh token — rotates on every refresh */
  refresh_token: string;
  /** Token type, always "Bearer" for Spark */
  token_type: string;
  /** Token lifetime in seconds (86400 = 24 hours for Spark) */
  expires_in: number;
  /** ISO 8601 timestamp when access_token expires */
  expires_at: string;
  /** ISO 8601 timestamp of last successful refresh */
  last_refreshed: string;
  /** Running count of successful refreshes (for debugging/monitoring) */
  refresh_count: number;
  /** How this token was originally obtained */
  flow_type: "authorization_code";
  /** How the initial tokens were seeded */
  seeded_via: "handshake_script" | "pre_provisioned";
  /** ISO 8601 timestamp when tokens were first seeded */
  seeded_at: string;
}

/** Response from Spark API token endpoint on successful refresh */
export interface SparkTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/** Response from Spark API token endpoint on failure */
export interface SparkTokenError {
  error: string;
  error_description: string;
}

/** Result of the triple-safety write operation */
export interface PersistenceResult {
  cloudwatch_logged: boolean;
  ssm_write_success: boolean;
  sm_write_success: boolean;
  /** If SM failed, contains the error message */
  sm_error?: string;
  /** If SSM failed, contains the error message */
  ssm_error?: string;
}

/** Lambda handler response */
export interface RefreshResult {
  statusCode: number;
  body: string;
  persistence?: PersistenceResult;
}
