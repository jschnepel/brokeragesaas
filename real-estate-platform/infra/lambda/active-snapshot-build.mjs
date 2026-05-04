/**
 * Bundle the active-snapshot Lambda with esbuild.
 * Run: node infra/lambda/active-snapshot-build.mjs
 *
 * Produces: infra/lambda/dist/active-snapshot.zip
 */

import { execFileSync } from 'child_process';
import { mkdirSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');
const outFile = join(distDir, 'active-snapshot.js');
const zipFile = join(distDir, 'active-snapshot.zip');
const isWin = process.platform === 'win32';

if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });

console.log('Bundling active-snapshot Lambda...');
await esbuild.build({
  entryPoints: [join(__dirname, 'active-snapshot.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: outFile,
  external: ['@aws-sdk/client-secrets-manager', '@aws-sdk/client-s3', '@aws-sdk/client-cloudwatch'],
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
  execFileSync('zip', ['active-snapshot.zip', 'active-snapshot.js', 'active-snapshot.js.map'], {
    stdio: 'inherit', cwd: distDir,
  });
}

console.log(`\nDone! Lambda package: ${zipFile}`);
