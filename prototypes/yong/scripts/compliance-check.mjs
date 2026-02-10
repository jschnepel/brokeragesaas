#!/usr/bin/env node
/**
 * Compliance, Security & Edge Case Test Suite
 * Runs all quality gates for the testing branch.
 *
 * Usage:
 *   node scripts/compliance-check.mjs           # run all checks
 *   node scripts/compliance-check.mjs --security # run only security checks
 *   node scripts/compliance-check.mjs --seo      # run only SEO checks
 */
import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';

// Use process.cwd() — npm scripts always run from package.json directory
const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const filter = process.argv[2]; // optional --security, --seo, etc.

let passed = 0;
let failed = 0;
let warnings = 0;
const issues = [];

// ── Helpers ────────────────────────────────────────────
function run(label, fn) {
  if (filter && !label.toLowerCase().includes(filter.replace('--', ''))) return;
  process.stdout.write(`\n[${'CHECK'.padEnd(5)}] ${label}\n`);
  try {
    fn();
    passed++;
    process.stdout.write(`  ✅ PASSED\n`);
  } catch (e) {
    failed++;
    const msg = e.message || String(e);
    issues.push({ label, msg });
    process.stdout.write(`  ❌ FAILED: ${msg}\n`);
  }
}

function warn(label, msg) {
  warnings++;
  issues.push({ label, msg, severity: 'warning' });
  process.stdout.write(`  ⚠️  WARNING: ${msg}\n`);
}

function shell(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', timeout: 120_000, shell: true });
}

function walkFiles(dir, exts) {
  const results = [];
  function walk(d) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) {
        if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
        walk(full);
      } else if (exts.includes(extname(full))) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function readSrc(file) {
  return readFileSync(file, 'utf-8');
}

// ── 1. BUILD & TYPE SAFETY ────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('  BUILD & TYPE SAFETY');
console.log('═══════════════════════════════════════');

run('TypeScript strict check', () => {
  shell('npx tsc --noEmit');
});

run('ESLint', () => {
  shell('npx eslint .');
});

run('Vite production build', () => {
  const out = shell('npx vite build 2>&1');
  if (out.includes('error') && !out.includes('warning')) {
    throw new Error('Build produced errors');
  }
});

run('Bundle size threshold', () => {
  const distDir = join(ROOT, 'dist', 'assets');
  if (!existsSync(distDir)) throw new Error('dist/assets not found — build may have failed');
  const jsFiles = readdirSync(distDir).filter(f => f.endsWith('.js'));
  const indexChunk = jsFiles.find(f => f.startsWith('index-'));
  if (!indexChunk) throw new Error('No index chunk found');
  const size = statSync(join(distDir, indexChunk)).size;
  const sizeKB = Math.round(size / 1024);
  if (sizeKB > 600) {
    throw new Error(`Index bundle ${sizeKB}KB exceeds 600KB threshold`);
  }
  process.stdout.write(`  Index bundle: ${sizeKB}KB\n`);
});

// ── 2. SECURITY ───────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('  SECURITY');
console.log('═══════════════════════════════════════');

run('Security: no hardcoded secrets', () => {
  const srcFiles = walkFiles(SRC, ['.ts', '.tsx', '.js', '.jsx']);
  const secretPatterns = [
    /(?:api[_-]?key|apikey)\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/i,
    /(?:secret|token|password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    /sk[-_]live[-_][A-Za-z0-9]{20,}/,
    /pk[-_]live[-_][A-Za-z0-9]{20,}/,
    /AKIA[0-9A-Z]{16}/,  // AWS access key
    /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  ];
  const violations = [];
  for (const file of srcFiles) {
    const content = readSrc(file);
    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        violations.push(`${file.replace(ROOT, '')}: matches ${pattern.source.slice(0, 40)}...`);
      }
    }
  }
  if (violations.length > 0) {
    throw new Error(`Found ${violations.length} potential secrets:\n    ${violations.join('\n    ')}`);
  }
});

run('Security: no dangerous DOM patterns', () => {
  const srcFiles = walkFiles(SRC, ['.ts', '.tsx', '.js', '.jsx']);
  const dangerous = [
    { pattern: /dangerouslySetInnerHTML/g, name: 'dangerouslySetInnerHTML' },
    { pattern: /\beval\s*\(/g, name: 'eval()' },
    { pattern: /document\.write/g, name: 'document.write' },
    { pattern: /innerHTML\s*=/g, name: 'innerHTML assignment' },
  ];
  const violations = [];
  for (const file of srcFiles) {
    const content = readSrc(file);
    for (const { pattern, name } of dangerous) {
      const matches = content.match(pattern);
      if (matches) {
        violations.push(`${file.replace(ROOT, '')}: ${matches.length}x ${name}`);
      }
    }
  }
  if (violations.length > 0) {
    throw new Error(`Found dangerous DOM patterns:\n    ${violations.join('\n    ')}`);
  }
});

run('Security: npm audit (high/critical)', () => {
  try {
    shell('npm audit --audit-level=high --omit=dev 2>&1');
  } catch (e) {
    // npm audit exits non-zero when vulnerabilities found
    if (e.stdout && (e.stdout.includes('high') || e.stdout.includes('critical'))) {
      throw new Error('npm audit found high/critical vulnerabilities');
    }
  }
});

run('Security: no .env files in source', () => {
  const envFiles = walkFiles(ROOT, ['.env']);
  // Allow .env.example
  const dangerous = envFiles.filter(f => !f.endsWith('.example'));
  if (dangerous.length > 0) {
    throw new Error(`Found .env files that may contain secrets: ${dangerous.join(', ')}`);
  }
});

// ── 3. SEO COMPLIANCE ─────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('  SEO COMPLIANCE');
console.log('═══════════════════════════════════════');

run('SEO: all pages use SEOHead', () => {
  const pagesDir = join(SRC, 'pages');
  const pageFiles = walkFiles(pagesDir, ['.tsx']);
  const missing = [];
  for (const file of pageFiles) {
    const content = readSrc(file);
    // Skip redirect-only or utility components
    if (content.includes('Navigate to=') && !content.includes('SEOHead') && content.length < 500) continue;
    if (!content.includes('SEOHead') && content.includes('return (')) {
      missing.push(file.replace(ROOT, ''));
    }
  }
  if (missing.length > 0) {
    throw new Error(`Pages missing SEOHead:\n    ${missing.join('\n    ')}`);
  }
});

run('SEO: all images have alt attributes', () => {
  const srcFiles = walkFiles(SRC, ['.tsx', '.jsx']);
  const violations = [];
  for (const file of srcFiles) {
    const content = readSrc(file);
    // Find <img without alt
    const imgTags = content.match(/<img\b[^>]*>/g) || [];
    for (const tag of imgTags) {
      if (!tag.includes('alt=') && !tag.includes('alt =')) {
        violations.push(file.replace(ROOT, ''));
        break; // one per file is enough
      }
    }
  }
  if (violations.length > 0) {
    throw new Error(`Images missing alt attributes in:\n    ${violations.join('\n    ')}`);
  }
});

run('SEO: robots.txt exists', () => {
  if (!existsSync(join(ROOT, 'public', 'robots.txt'))) {
    throw new Error('public/robots.txt not found');
  }
});

run('SEO: structured data utility exists', () => {
  if (!existsSync(join(SRC, 'utils', 'structuredData.ts'))) {
    throw new Error('src/utils/structuredData.ts not found');
  }
});

// ── 4. ACCESSIBILITY ──────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('  ACCESSIBILITY');
console.log('═══════════════════════════════════════');

run('A11y: buttons have accessible text', () => {
  const srcFiles = walkFiles(SRC, ['.tsx', '.jsx']);
  const violations = [];
  for (const file of srcFiles) {
    const content = readSrc(file);
    // Find buttons that are just icons (no text, no aria-label)
    const iconButtons = content.match(/<button[^>]*>\s*<(?:Download|Share2|ArrowRight|ChevronLeft|ChevronRight)\b[^/]*\/>\s*<\/button>/g);
    if (iconButtons) {
      for (const btn of iconButtons) {
        if (!btn.includes('aria-label') && !btn.includes('title=')) {
          violations.push(file.replace(ROOT, ''));
          break;
        }
      }
    }
  }
  if (violations.length > 0) {
    warn('A11y: buttons have accessible text', `Icon-only buttons missing aria-label in:\n    ${violations.join('\n    ')}`);
  }
});

run('A11y: form inputs have labels', () => {
  const srcFiles = walkFiles(SRC, ['.tsx', '.jsx']);
  const violations = [];
  for (const file of srcFiles) {
    const content = readSrc(file);
    const inputs = content.match(/<input\b[^>]*>/g) || [];
    for (const input of inputs) {
      if (!input.includes('aria-label') && !input.includes('id=') && !input.includes('placeholder=')) {
        violations.push(file.replace(ROOT, ''));
        break;
      }
    }
  }
  if (violations.length > 0) {
    warn('A11y: form inputs have labels', `Inputs missing labels/aria-label in:\n    ${violations.join('\n    ')}`);
  }
});

// ── 5. EDGE CASES & ROBUSTNESS ────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('  EDGE CASES & ROBUSTNESS');
console.log('═══════════════════════════════════════');

run('Edge: route params have null guards', () => {
  const pagesDir = join(SRC, 'pages');
  const pageFiles = walkFiles(pagesDir, ['.tsx']);
  const violations = [];
  for (const file of pageFiles) {
    const content = readSrc(file);
    if (content.includes('useParams')) {
      // Should have a null/undefined check or Navigate fallback
      const hasGuard = content.includes('if (!') || content.includes('Navigate to=') || content.includes('?? ') || content.includes('|| ');
      if (!hasGuard) {
        violations.push(file.replace(ROOT, ''));
      }
    }
  }
  if (violations.length > 0) {
    throw new Error(`Pages using useParams without null guards:\n    ${violations.join('\n    ')}`);
  }
});

run('Edge: no console.log in production code', () => {
  const srcFiles = walkFiles(SRC, ['.ts', '.tsx', '.js', '.jsx']);
  const violations = [];
  for (const file of srcFiles) {
    const content = readSrc(file);
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip comments
      if (line.startsWith('//') || line.startsWith('*')) continue;
      if (line.includes('console.log') || line.includes('console.warn') || line.includes('console.error')) {
        violations.push(`${file.replace(ROOT, '')}:${i + 1}`);
      }
    }
  }
  if (violations.length > 0) {
    warn('Edge: no console.log in production code', `Found console statements:\n    ${violations.join('\n    ')}`);
  }
});

run('Edge: scroll-to-top on route changes', () => {
  const pagesDir = join(SRC, 'pages');
  const pageFiles = walkFiles(pagesDir, ['.tsx']);
  const violations = [];
  for (const file of pageFiles) {
    const content = readSrc(file);
    // Pages that use useParams (dynamic routes) should scroll to top
    if (content.includes('useParams') && !content.includes('scrollTo')) {
      violations.push(file.replace(ROOT, ''));
    }
  }
  if (violations.length > 0) {
    warn('Edge: scroll-to-top on route changes', `Dynamic pages missing scrollTo:\n    ${violations.join('\n    ')}`);
  }
});

run('Edge: lazy-loaded pages use Suspense', () => {
  const appFile = readSrc(join(SRC, 'App.tsx'));
  const lazyCount = (appFile.match(/lazy\(/g) || []).length;
  const hasSuspense = appFile.includes('Suspense');
  if (lazyCount > 0 && !hasSuspense) {
    throw new Error(`${lazyCount} lazy imports but no Suspense boundary`);
  }
});

// ── 6. CODE QUALITY ───────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('  CODE QUALITY');
console.log('═══════════════════════════════════════');

run('Quality: no TODO/FIXME/HACK in code', () => {
  const srcFiles = walkFiles(SRC, ['.ts', '.tsx', '.js', '.jsx']);
  const violations = [];
  for (const file of srcFiles) {
    const content = readSrc(file);
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/\b(TODO|FIXME|HACK|XXX)\b/.test(lines[i])) {
        violations.push(`${file.replace(ROOT, '')}:${i + 1}: ${lines[i].trim().slice(0, 80)}`);
      }
    }
  }
  if (violations.length > 0) {
    warn('Quality: no TODO/FIXME/HACK', `Found ${violations.length} markers:\n    ${violations.join('\n    ')}`);
  }
});

run('Quality: consistent hero heights', () => {
  const srcFiles = walkFiles(SRC, ['.tsx']);
  const heroHeights = new Set();
  for (const file of srcFiles) {
    const content = readSrc(file);
    // Skip error/fallback pages (intentionally shorter heroes)
    if (content.includes('Not Found') && content.includes('height="50vh"')) continue;
    // Check PageHero height props
    const pageHeroMatch = content.match(/height=["'](\d+vh)["']/g);
    if (pageHeroMatch && (content.includes('PageHero') || content.includes('MarketReportHero'))) {
      for (const m of pageHeroMatch) {
        const val = m.match(/["'](\d+vh)["']/)[1];
        heroHeights.add(val);
      }
    }
    // Check MarketReportHero hardcoded heights
    const hardcoded = content.match(/h-\[(\d+vh)\]/);
    if (hardcoded && content.includes('MarketReportHero')) {
      heroHeights.add(hardcoded[1]);
    }
  }
  if (heroHeights.size > 1) {
    throw new Error(`Inconsistent hero heights found: ${[...heroHeights].join(', ')} — should be unified`);
  }
});

run('Quality: shared components used (no inline duplication)', () => {
  const pagesDir = join(SRC, 'pages');
  const pageFiles = walkFiles(pagesDir, ['.tsx']);
  const violations = [];
  for (const file of pageFiles) {
    const content = readSrc(file);
    // Check for inline AnimatedCounter or useScrollAnimation definitions
    if (content.includes('function AnimatedCounter') || content.includes('const AnimatedCounter')) {
      if (!file.includes('shared')) {
        violations.push(`${file.replace(ROOT, '')}: inline AnimatedCounter definition`);
      }
    }
    if (content.includes('function useScrollAnimation') || content.match(/const useScrollAnimation\s*=/)) {
      if (!file.includes('shared')) {
        violations.push(`${file.replace(ROOT, '')}: inline useScrollAnimation definition`);
      }
    }
  }
  if (violations.length > 0) {
    throw new Error(`Inline component duplication found:\n    ${violations.join('\n    ')}`);
  }
});

// ── REPORT ────────────────────────────────────────────
console.log('\n\n═══════════════════════════════════════');
console.log('  COMPLIANCE REPORT');
console.log('═══════════════════════════════════════');
console.log(`  ✅ Passed:   ${passed}`);
console.log(`  ❌ Failed:   ${failed}`);
console.log(`  ⚠️  Warnings: ${warnings}`);
console.log('═══════════════════════════════════════');

if (failed > 0) {
  console.log('\nFAILED CHECKS:');
  for (const issue of issues.filter(i => i.severity !== 'warning')) {
    console.log(`  ❌ ${issue.label}`);
    console.log(`     ${issue.msg}\n`);
  }
}

if (warnings > 0) {
  console.log('\nWARNINGS:');
  for (const issue of issues.filter(i => i.severity === 'warning')) {
    console.log(`  ⚠️  ${issue.label}`);
    console.log(`     ${issue.msg}\n`);
  }
}

process.exit(failed > 0 ? 1 : 0);
