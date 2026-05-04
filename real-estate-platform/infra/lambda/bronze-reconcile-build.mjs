/**
 * Bundle the bronze-reconcile Lambda with esbuild.
 * Note: the duckdb npm package has native bindings; it's NOT bundled —
 * we mark it external and provide it via a Lambda Layer at deploy time.
 */
import { execFileSync } from 'child_process';
import { mkdirSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');
const outFile = join(distDir, 'bronze-reconcile.js');
const zipFile = join(distDir, 'bronze-reconcile.zip');
const isWin = process.platform === 'win32';

if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

console.log('Bundling bronze-reconcile Lambda...');
await esbuild.build({
  entryPoints: [join(__dirname, 'bronze-reconcile.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: outFile,
  external: [
    'pg-native',
    '@aws-sdk/client-secrets-manager',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-cloudwatch',
    '@aws-sdk/client-sns',
    '@aws-sdk/client-dynamodb',
  ],
  minify: true,
  sourcemap: true,
  logLevel: 'info',
});

if (existsSync(zipFile)) unlinkSync(zipFile);

if (isWin) {
  execFileSync('powershell', [
    '-Command',
    `Compress-Archive -Path '${outFile}','${outFile}.map' -DestinationPath '${zipFile}'`,
  ], { stdio: 'inherit' });
} else {
  execFileSync('zip', ['bronze-reconcile.zip', 'bronze-reconcile.js', 'bronze-reconcile.js.map'], {
    stdio: 'inherit', cwd: distDir,
  });
}

console.log(`\nDone! Lambda package: ${zipFile}`);
