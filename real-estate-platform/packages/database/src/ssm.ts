import { execFileSync } from 'child_process';

const AWS_CLI = process.platform === 'win32'
  ? 'C:/Program Files/Amazon/AWSCLIV2/aws.exe'
  : 'aws';

const REGION = 'us-east-1';

/**
 * Resolve a value from AWS SSM Parameter Store via the AWS CLI.
 * Returns the decrypted parameter value, or null if not found.
 */
export function getSSMParameter(name: string): string | null {
  try {
    const value = execFileSync(AWS_CLI, [
      'ssm', 'get-parameter',
      '--name', name,
      '--with-decryption',
      '--region', REGION,
      '--query', 'Parameter.Value',
      '--output', 'text',
    ], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    return value || null;
  } catch {
    return null;
  }
}

/** SSM paths for known parameters */
export const SSM_PARAMS = {
  DB_URL: '/rlsir/db/url',
  SPARK_ACCESS_TOKEN: '/rlsir/spark/access-token',
} as const;

/**
 * Resolve DATABASE_URL: checks env var first, falls back to SSM /rlsir/db/url.
 */
export function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const url = getSSMParameter(SSM_PARAMS.DB_URL);
  if (!url) throw new Error(`DATABASE_URL not set and SSM parameter ${SSM_PARAMS.DB_URL} not found. Ensure AWS CLI is configured.`);
  return url;
}
