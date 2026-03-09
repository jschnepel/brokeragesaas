# Amplify Deploy — apps/platform

## Prerequisites
- AWS account with Amplify access
- Neon DB connection string
- GitHub repo connected to Amplify (or manual deploy)

## Step 1: Create Amplify App
1. AWS Console → Amplify → Create new app
2. Connect to GitHub repo: `real-estate-platform`
3. Branch: `main` (or `dev`)
4. App root: `apps/platform`
5. Build settings: Amplify will detect `amplify.yml` automatically

## Step 2: Environment Variables
In Amplify Console → App settings → Environment variables, add:

| Variable         | Value                                      |
|------------------|--------------------------------------------|
| `DATABASE_URL`   | `postgresql://...` (from Neon console)     |
| `NEXTAUTH_SECRET`| Run: `openssl rand -base64 32`             |
| `NEXTAUTH_URL`   | `https://[your-branch].amplifyapp.com`     |
| `NODE_ENV`       | `production`                               |

## Step 3: Deploy
1. Trigger first deploy from Amplify console
2. Wait for build to complete (~3-5 min)
3. Visit the generated `.amplifyapp.com` URL
4. Test all 3 logins: `yong/yong`, `lex/lex`, `david/david`

## Step 4: Custom Domain (Optional)
1. Amplify Console → Domain management
2. Add custom domain (e.g. `platform.echelonpoint.com`)
3. Update `NEXTAUTH_URL` env var to match the custom domain
4. Redeploy

## Step 5: Update NEXTAUTH_URL
After the first deploy, you'll have the actual URL. Go back to:
Amplify Console → Environment variables → Update `NEXTAUTH_URL`
Then trigger a redeploy.

## Troubleshooting

**Build fails: pnpm not found**
Add to preBuild commands:
```
- npm install -g pnpm@8.15.0
```

**Build fails: Cannot find module '@platform/database'**
Ensure the preBuild runs `pnpm install` from the monorepo root (`cd ../..`), not from `apps/platform`.

**Login redirects to localhost after deploy**
`NEXTAUTH_URL` env var is wrong or not set. Must match the exact deployed URL including `https://`.

**Database connection timeout**
Neon free tier suspends after inactivity. First request after sleep takes ~2s. This is normal.
Add `?connection_limit=5&pool_timeout=10` to the `DATABASE_URL` if seeing frequent timeouts.

**Middleware deprecation warning**
Next.js 16 renamed `middleware.ts` to `proxy.ts`. This has already been done. If you see the warning, the file may have been reverted — rename it again.
