/**
 * @platform/armls-token-service
 *
 * Public API for consumer Lambdas and server functions.
 *
 * Usage:
 *   import { getArmslToken, getArmslHeaders, getArmslAuthHeaders } from "@platform/armls-token-service";
 */

export { getArmslToken, getArmslTokenSecret, getArmslHeaders, getArmslAuthHeaders } from "./get-token.js";
export type { ArmslTokenSecret, SparkTokenResponse, RefreshResult } from "./types.js";
export { SM_SECRET_NAME, SPARK_TOKEN_ENDPOINT, SPARK_AUTH_ENDPOINT } from "./constants.js";
