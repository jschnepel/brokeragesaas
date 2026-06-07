/**
 * Bundle the ARMLS sync Lambda with esbuild.
 * Run: node infra/lambda/build.mjs
 *
 * Produces: infra/lambda/dist/armls-sync.zip
 */

import { execFileSync } from 'child_process';
import { mkdirSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');
const outFile = join(distDir, 'index.js');
const zipFile = join(distDir, 'armls-sync.zip');
const isWin = process.platform === 'win32';

// Ensure dist directory
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Bundle with esbuild's Node API (avoids Node 22 cross-platform exec issues)
console.log('Bundling Lambda...');
await esbuild.build({
  entryPoints: [join(__dirname, 'armls-sync-bundle.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: outFile,
  external: ['pg-native', '@aws-sdk/client-secrets-manager', '@aws-sdk/client-s3', '@aws-sdk/client-cloudwatch'],
  minify: true,
  sourcemap: true,
  logLevel: 'info',
});

// Create ZIP
console.log('Creating ZIP...');
if (existsSync(zipFile)) unlinkSync(zipFile);

// Use PowerShell Compress-Archive on Windows, zip on Unix
if (isWin) {
  execFileSync(
    'powershell',
    [
      '-Command',
      `Compress-Archive -Path '${outFile}','${outFile}.map' -DestinationPath '${zipFile}'`,
    ],
    { stdio: 'inherit' }
  );
} else {
  execFileSync('zip', ['armls-sync.zip', 'index.js', 'index.js.map'], {
    stdio: 'inherit',
    cwd: distDir,
  });
}

console.log(`\nDone! Lambda package: ${zipFile}`);
