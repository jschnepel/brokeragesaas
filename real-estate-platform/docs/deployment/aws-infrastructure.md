# AWS Infrastructure

## Services

### Compute
- **AWS Amplify**: Frontend hosting
- **AWS Lambda**: API functions

### Database
- **RDS PostgreSQL**: Primary database
- **Upstash Redis**: Caching

### Storage
- **S3**: File storage
- **CloudFront**: CDN

## Architecture

```
CloudFront CDN
      │
      ▼
  AWS Amplify
      │
      ▼
 AWS Lambda (API)
      │
  ┌───┴───┐
  ▼       ▼
 RDS    Redis
```

## Environments

- **Production**: Full HA setup
- **Staging**: Reduced capacity
- **Development**: Local/minimal

## Deployment

Frontend: Amplify auto-deploy on push
Backend: Lambda via serverless framework
