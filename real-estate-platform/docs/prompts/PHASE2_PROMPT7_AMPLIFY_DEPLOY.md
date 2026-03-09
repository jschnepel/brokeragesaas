# Phase 2 — Prompt 7: AWS Amplify Deploy
# Claude Code — run from monorepo root: real-estate-platform/
# Build exactly what is specified. No alternatives. Flag blockers and continue.

---

## CONTEXT

`apps/platform` is a fully functional Next.js 16 app with:
- Tailwind v4 + shadcn canary
- NextAuth v5 (JWT, CredentialsProvider)
- Neon serverless Postgres (via `@platform/database` pool)
- Server actions + polling API route
- pnpm workspaces + Turborepo monorepo

The goal is a production deploy to AWS Amplify Gen 2 on its own subdomain, separate from any existing Amplify app in the repo.

---

## READ FIRST

Before writing any code, read:
1. The repo root — check if `amplify.yml` or `amplify-platform.yml` already exists
2. `apps/platform/package.json` — exact package name, scripts, deps
3. `apps/platform/next.config.ts` — any output config, env vars
4. `apps/platform/auth.ts` — what env vars NextAuth needs (`AUTH_SECRET`, `NEXTAUTH_URL`)
5. `packages/database/src/index.ts` — what env var the pool reads (`DATABASE_URL` or similar)
6. Check for any existing `.env.local` or `.env.example` to understand all required env vars

---

## STEP 1 — Build Verification

First confirm the production build works cleanly from the monorepo root (the way Amplify will run it):

```bash
cd real-estate-platform
pnpm install
pnpm --filter @real-estate/platform build
```

If this fails, fix it before proceeding. Amplify runs exactly this command.

Note any warnings about:
- The deprecated `middleware` → `proxy` rename in Next.js 16 (acceptable, non-blocking)
- Missing env vars (will be set in Amplify console)

---

## STEP 2 — Environment Variables

Identify all required env vars for `apps/platform`. Based on the codebase they should be:

```
DATABASE_URL          — Neon connection string (from @platform/database)
AUTH_SECRET           — NextAuth secret (generate: openssl rand -base64 32)
NEXTAUTH_URL          — Full URL of the deployed app (set after domain is known)
```

Check `apps/platform` for any other `process.env.*` references and add them to this list.

Create `apps/platform/.env.example` documenting all required vars:

```
# Neon DB — get from Neon console
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# NextAuth — generate with: openssl rand -base64 32
AUTH_SECRET=

# Set to your Amplify domain after first deploy
NEXTAUTH_URL=https://your-app.amplifyapp.com

# Optional: set to 'production'
NODE_ENV=production
```

Do NOT commit actual values. `.env.example` only.

---

## STEP 3 — Amplify Build Config

Create `apps/platform/amplify.yml`:

```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - corepack enable
            - corepack prepare pnpm@8.15.0 --activate
            - cd ../..
            - pnpm install --frozen-lockfile
        build:
          commands:
            - cd apps/platform
            - pnpm build
      artifacts:
        baseDirectory: apps/platform/.next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - apps/platform/.next/cache/**/*
          - ~/.pnpm-store/**/*
      environment:
        variables:
          NODE_VERSION: '20'
          PNPM_VERSION: '8.15.0'
    appRoot: apps/platform
```

**Important:** Amplify Gen 2 with Next.js uses the SSR compute — the `baseDirectory` must point to `.next`. Amplify auto-detects Next.js and handles the server/client split.

---

## STEP 4 — next.config.ts Updates

Read the current `apps/platform/next.config.ts`. Make these changes if not already present:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for Amplify SSR
  output: undefined,   // Do NOT set output: 'export' — we need SSR for server actions

  // Allow Unsplash images used in seed data
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Suppress the middleware→proxy deprecation warning in build output
  experimental: {
    // any existing experimental flags stay here
  },
};

export default nextConfig;
```

Do NOT add `output: 'standalone'` — Amplify Gen 2 handles Next.js SSR natively without standalone mode.

---

## STEP 5 — Package.json Scripts

Verify `apps/platform/package.json` has the correct start script for Amplify:

```json
"scripts": {
  "dev":        "next dev --port 3003",
  "build":      "next build",
  "start":      "next start",
  "type-check": "tsc --noEmit"
}
```

`start` must not have `--port 3003` — Amplify uses its own port binding.

---

## STEP 6 — Middleware / Proxy Rename (Optional but Clean)

Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`. The build still works with `middleware.ts` but logs a warning on every build. If the warning is distracting:

```bash
# In apps/platform:
mv middleware.ts proxy.ts
```

The file contents and behavior are identical — only the filename changes. If the auth guard logic uses `NextResponse` and `NextRequest`, it will work identically in `proxy.ts`.

Only do this if the file is simple (just auth redirects). If it's complex, leave it and note the warning is non-blocking.

---

## STEP 7 — Amplify Console Setup Instructions

Claude Code cannot access the AWS console directly. Produce a `DEPLOY.md` file at `apps/platform/DEPLOY.md` with exact step-by-step instructions:

```markdown
# Amplify Deploy — apps/platform

## Prerequisites
- AWS account with Amplify access
- Neon DB connection string
- GitHub repo connected to Amplify (or manual deploy)

## Step 1: Create Amplify App
1. AWS Console → Amplify → Create new app
2. Connect to GitHub repo: real-estate-platform
3. Branch: main (or dev)
4. App root: apps/platform
5. Build settings: Amplify will detect amplify.yml automatically

## Step 2: Environment Variables
In Amplify Console → App settings → Environment variables, add:

| Variable      | Value                                      |
|---------------|--------------------------------------------|
| DATABASE_URL  | postgresql://... (from Neon console)       |
| AUTH_SECRET   | [run: openssl rand -base64 32]             |
| NEXTAUTH_URL  | https://[your-branch].amplifyapp.com       |
| NODE_ENV      | production                                 |

## Step 3: Deploy
1. Trigger first deploy from Amplify console
2. Wait for build to complete (~3-5 min)
3. Visit the generated .amplifyapp.com URL
4. Test all 3 logins: yong/yong, lex/lex, david/david

## Step 4: Custom Domain (Optional)
1. Amplify Console → Domain management
2. Add custom domain (e.g. platform.echelonpoint.com)
3. Update NEXTAUTH_URL env var to match the custom domain
4. Redeploy

## Step 5: Update NEXTAUTH_URL
After the first deploy, you'll have the actual URL. Go back to:
Amplify Console → Environment variables → Update NEXTAUTH_URL
Then trigger a redeploy.

## Troubleshooting

**Build fails: pnpm not found**
Add to preBuild commands:
  - npm install -g pnpm@8.15.0

**Build fails: Cannot find module '@platform/database'**
Ensure the preBuild runs pnpm install from the monorepo root (cd ../..), not from apps/platform.

**Login redirects to localhost after deploy**
NEXTAUTH_URL env var is wrong or not set. Must match the exact deployed URL including https://.

**Database connection timeout**
Neon free tier suspends after inactivity. First request after sleep takes ~2s. This is normal.
Add ?connection_limit=5&pool_timeout=10 to the DATABASE_URL if seeing frequent timeouts.
```

---

## STEP 8 — Verify Locally as Production

Run a production build and start locally to simulate Amplify:

```bash
cd apps/platform
pnpm build
pnpm start
```

Visit `http://localhost:3000` (note: no port flag in start script).

Test:
1. Login page loads
2. `yong/yong` → `/requests` → real request cards
3. `lex/lex` → `/triage` → manager dashboard
4. `david/david` → `/reports` → executive dashboard
5. Send a chat message → persists
6. Create a new request → appears in list

If all 5 pass locally in production mode, the Amplify deploy will succeed.

---

## STEP 9 — Final Build Check

```bash
cd real-estate-platform
pnpm --filter @real-estate/platform type-check
pnpm --filter @real-estate/platform build
```

Both must pass with 0 errors.

Report:
1. Does `pnpm --filter @real-estate/platform build` pass from monorepo root?
2. Is `amplify.yml` created at `apps/platform/amplify.yml`?
3. Is `DEPLOY.md` created with all env vars documented?
4. Is `.env.example` created?
5. Does `pnpm start` (no port flag) serve the app on `:3000`?
6. Do all 3 logins work in production mode locally?
7. Was `middleware.ts` renamed to `proxy.ts`? If not, why not?
8. Are there any `output: 'export'` or `output: 'standalone'` settings that would break Amplify SSR? (should be none)

---

## CONSTRAINTS

- Do NOT set `output: 'export'` — this disables SSR and breaks server actions
- Do NOT set `output: 'standalone'` — Amplify Gen 2 doesn't need it and it complicates monorepo builds
- The `amplify.yml` must run `pnpm install` from the **monorepo root** (`cd ../..`), not from `apps/platform` — otherwise workspace packages won't resolve
- Do NOT commit `.env.local` or any file containing actual secrets
- `NEXTAUTH_URL` in production must be `https://` — HTTP will cause auth failures
- The `start` script must have no `--port` flag — Amplify binds its own port

---

## WHAT SUCCESS LOOKS LIKE

```
apps/platform/
├── amplify.yml     ✓ preBuild from monorepo root, build from apps/platform
├── DEPLOY.md       ✓ step-by-step console instructions + env var table + troubleshooting
├── .env.example    ✓ all required vars documented, no actual values
└── next.config.ts  ✓ images.remotePatterns for Unsplash, no output override
```

`pnpm --filter @real-estate/platform build` passes from monorepo root.
`pnpm start` serves production build on `:3000` with all 3 logins working.
Handing someone `DEPLOY.md` + the repo URL is all they need to get it live.
