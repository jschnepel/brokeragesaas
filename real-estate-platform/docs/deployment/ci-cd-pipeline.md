# CI/CD Pipeline

## GitHub Actions

### On Pull Request
1. Install dependencies
2. Run linting
3. Run type checking
4. Run tests
5. Build check

### On Merge to Main
1. All PR checks
2. Deploy to staging
3. Run E2E tests
4. Deploy to production

## Workflow Files

- `.github/workflows/test.yml` - PR checks
- `.github/workflows/deploy-backend.yml` - Backend deploy
- `.github/workflows/deploy-premium.yml` - Premium site deploy
- `.github/workflows/deploy-template.yml` - Template site deploy

## Branch Strategy

- `main`: Production
- `staging`: Staging environment
- `feature/*`: Feature branches
