# CI/CD Pipeline Documentation

## Branch Strategy

```
feature/* ──► dev ──► testing ──► main
              │         │          │
           Active    QA/Staging  Production
         Development   Review     (Stable)
```

### Branches

| Branch | Purpose | Deploys To | Protected |
|--------|---------|------------|-----------|
| `main` | Production-ready code | Production | Yes |
| `testing` | QA and staging review | Preview/Staging URL | Yes |
| `dev` | Active development | CI checks only | Yes |
| `feature/*` | Individual features/fixes | None (PR checks) | No |

### Rules

- **Never push directly** to `main` or `testing` — always use pull requests
- All changes start on `dev` or a `feature/*` branch
- Promotion path: `feature/* → dev → testing → main`
- Every PR must pass CI checks before merging

## Feature Branch Workflow

### 1. Create a Feature Branch

```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-feature
```

### 2. Develop and Commit

```bash
# Make changes...
git add <files>
git commit -m "Add my feature"
```

### 3. Push and Open PR to `dev`

```bash
git push origin feature/my-feature
# Open PR: feature/my-feature → dev
```

### 4. After Review & CI Pass, Merge to `dev`

The PR must pass:
- TypeScript type checking (`tsc --noEmit`)
- ESLint linting
- Vite production build

### 5. Promote to `testing`

```bash
# Open PR: dev → testing
# After review and CI pass, merge
```

### 6. Promote to `main` (Production)

```bash
# Open PR: testing → main
# After final review and CI pass, merge
# This triggers production deployment
```

## CI Pipeline

The pipeline is defined in `.github/workflows/ci.yml` and runs on every push and PR to `dev`, `testing`, and `main`.

### Pipeline Steps

| Step | Command | Purpose |
|------|---------|---------|
| Checkout | `actions/checkout@v4` | Clone repo |
| Setup Node | `actions/setup-node@v4` | Node.js 20 with npm cache |
| Install | `npm ci` | Install exact dependencies |
| Type Check | `npx tsc --noEmit` | TypeScript compilation check |
| Lint | `npx eslint .` | Code style and quality |
| Build | `npx vite build` | Production build |
| Artifact | `actions/upload-artifact@v4` | Save build output |

### Branch-Specific Behavior

| Trigger | Lint | Type Check | Build | Deploy |
|---------|------|------------|-------|--------|
| PR to any branch | Yes | Yes | Yes | No |
| Push to `dev` | Yes | Yes | Yes | No |
| Push to `testing` | Yes | Yes | Yes | Staging |
| Push to `main` | Yes | Yes | Yes | Production |

## Deployment

Deployment jobs are configured as placeholders in the workflow. To enable actual deployment:

1. Choose a hosting provider (Vercel, Netlify, AWS S3 + CloudFront, etc.)
2. Add the required secrets to GitHub repository settings
3. Uncomment and configure the deploy steps in `.github/workflows/ci.yml`

### Vercel Example

Add these GitHub secrets:
- `VERCEL_TOKEN` — Vercel API token
- `VERCEL_ORG_ID` — Organization ID
- `VERCEL_PROJECT_ID` — Project ID

### Environment Protection

Configure GitHub environment protection rules:
- **staging**: Require reviewers (optional)
- **production**: Require reviewers, restrict to `main` branch only

## Environment Variables

Environment-specific variables should be managed through:
1. **GitHub Secrets** — For sensitive values (API keys, tokens)
2. **GitHub Variables** — For non-sensitive config per environment
3. **`.env.example`** — Document all required variables (never commit `.env` files)

## Rollback Procedures

### Quick Rollback (Revert Commit)

```bash
git checkout main
git revert <commit-sha>
git push origin main
```

This triggers a new production deployment with the reverted code.

### Full Rollback (Reset to Previous Release)

```bash
# Identify the last good commit
git log --oneline main

# Create a revert PR
git checkout -b hotfix/rollback-to-<sha>
git reset --hard <good-commit-sha>
git push origin hotfix/rollback-to-<sha>
# Open PR: hotfix/rollback-to-<sha> → main
```

### Artifact Rollback

Build artifacts are retained for 7 days. If the hosting provider supports it, redeploy a previous artifact directly.

## Hotfix Workflow

For urgent production fixes that can't wait for the full `dev → testing → main` flow:

```bash
git checkout main
git pull origin main
git checkout -b hotfix/fix-description

# Make the fix...
git commit -m "Hotfix: fix description"
git push origin hotfix/fix-description

# Open PR: hotfix/* → main (fast-track review)
# After merge, backport to dev and testing:
git checkout dev && git merge main && git push origin dev
git checkout testing && git merge main && git push origin testing
```

## Agent Rules Summary

All CI/CD-aware agents follow these rules:
- Never push directly to `main` or `testing`
- Feature work goes to `dev` via PR
- Promotion: `dev → testing → main` via PR
- All PRs must pass CI checks before merge
- See individual agent docs for specific responsibilities
