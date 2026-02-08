# Security Requirements

## Authentication & Authorization

- Agent authentication via secure tokens
- Role-based access control
- API key management for MLS

## Data Protection

### In Transit
- HTTPS everywhere
- TLS 1.3 minimum

### At Rest
- Encrypted database (RDS)
- Encrypted S3 buckets

## Input Validation

- Validate all user inputs
- Sanitize HTML content
- Parameterized SQL queries

## OWASP Top 10 Prevention

1. **Injection**: Parameterized queries
2. **Broken Auth**: Secure token handling
3. **Sensitive Data**: Encryption
4. **XXE**: Disabled XML parsing
5. **Access Control**: Multi-tenant isolation
6. **Misconfig**: Secure defaults
7. **XSS**: Output encoding
8. **Deserialization**: JSON only
9. **Components**: Dependency scanning
10. **Logging**: Audit trails

## Rate Limiting

- API rate limits per agent
- Login attempt limits
- Contact form limits

## Secrets Management

- Environment variables
- No hardcoded credentials
- Rotate keys regularly
