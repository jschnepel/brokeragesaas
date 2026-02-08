# Phase 0 Changes Required

## Overview

This document outlines the specific changes needed in Phase 0 (Foundation) to accommodate the Yong Choi Real Estate Portal specification. These changes are CRITICAL - the entire project depends on getting the foundation right.

---

## Summary of Changes

| Area | Current State | Required State | Impact |
|------|---------------|----------------|--------|
| Database Schema | 5 core tables | 35+ tables | Major redesign |
| Authentication | Not specified | Cognito + NextAuth.js v5 | New implementation |
| User Roles | Single "agent" | 6 distinct roles | Complete RBAC system |
| AWS Services | Basic setup | 10+ services | Infrastructure expansion |
| API Layer | Basic routes | Auth + multi-tenant middleware | New middleware layer |

---

## 1. Database Schema Changes

### Current Schema (5 tables)
- agents
- agent_sites
- properties
- leads
- analytics_events

### Required Schema (35+ tables)

**New Core Tables:**
- users (central identity, linked to Cognito)
- user_profiles (extended user info)

**New CRM Tables:**
- contacts
- contact_activities
- pipeline_stages
- pipeline_deals
- tasks
- automation_rules
- automation_logs

**New Marketing Tables:**
- marketing_requests
- marketing_request_messages
- marketing_materials
- marketing_sla_config

**New Client Portal Tables:**
- saved_searches
- favorited_properties
- property_comparisons
- service_partners
- service_introductions

**New Home Management Tables:**
- home_binder_documents
- appliances
- maintenance_tasks
- maintenance_checklists

**New Transaction Tables:**
- client_transactions
- transaction_milestones
- transaction_documents
- transaction_communications

**New Calendar Tables:**
- calendar_events
- calendar_sync_tokens

**New AI Tables:**
- ai_conversations
- ai_context_documents

**New Analytics Tables:**
- analytics_aggregates (pre-computed metrics)

### Action Items
1. [ ] Review full schema in `database-schema.md`
2. [ ] Create migration files in `/packages/database/migrations/`
3. [ ] Update seed data scripts
4. [ ] Create ERD diagram
5. [ ] Define indexes for all query patterns

---

## 2. Authentication System

### Current State
- No authentication system documented
- Basic agent identification assumed

### Required State
- Amazon Cognito User Pool with custom attributes
- NextAuth.js v5 integration
- 6 user roles with distinct permissions
- Social sign-in (Google)
- MFA option
- Custom email templates via SES

### User Roles

| Role | Cognito Group | Access Level |
|------|---------------|--------------|
| Super Admin | super_admin | Full platform access |
| Agent Admin | agent_admin | Agent portal + client management |
| Marketing Designer | marketing_designer | Marketing hub (designer view) |
| Client (Active) | client_active | Full client portal |
| Client (Lead) | client_lead | Limited client portal |
| Anonymous | - | Public pages only |

### Action Items
1. [ ] Set up Cognito User Pool in AWS console or IaC
2. [ ] Configure custom attributes (role, agent_id, tier)
3. [ ] Create user groups
4. [ ] Install and configure NextAuth.js v5
5. [ ] Implement Cognito provider
6. [ ] Create auth middleware for API routes
7. [ ] Create role-based route protection

---

## 3. AWS Infrastructure Expansion

### Current Services
- AWS Amplify
- AWS Lambda
- Amazon RDS (PostgreSQL)
- Amazon S3
- Amazon CloudFront
- Upstash Redis (external)

### New Services Required

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Amazon Cognito | Authentication | User Pool + Identity Pool |
| Amazon SES | Email delivery | Verified domain, templates |
| Amazon SQS | Message queues | Standard queues |
| Amazon ElastiCache | Redis (replaces Upstash) | cache.t3.micro |
| Amazon OpenSearch | Property search | t3.small.search |
| AWS WAF | Web firewall | Rate limiting, bot protection |
| AWS Secrets Manager | Secret storage | API keys, credentials |
| Amazon CloudWatch | Monitoring | Custom dashboards, alerts |

### Infrastructure as Code
- Option A: Terraform (recommended for multi-environment)
- Option B: AWS CDK (TypeScript native)
- Option C: AWS CloudFormation (AWS native)

### Action Items
1. [ ] Choose IaC approach (recommend Terraform)
2. [ ] Create VPC with public/private subnets
3. [ ] Provision all required services
4. [ ] Configure security groups
5. [ ] Set up IAM roles with least privilege
6. [ ] Create staging and production environments
7. [ ] Set up cost monitoring alerts

---

## 4. API Foundation Changes

### Current State
- Basic Next.js API routes
- No authentication middleware
- No tenant context

### Required State
- Authentication middleware validating Cognito JWT
- Tenant context middleware (agent_id from session)
- Rate limiting middleware
- Request ID tracing
- Standardized error responses
- OpenAPI documentation

### Middleware Stack
```
Request
   │
   ▼
┌─────────────────────┐
│  Rate Limiting      │  (by IP/user)
└─────────────────────┘
   │
   ▼
┌─────────────────────┐
│  Request ID         │  (add X-Request-ID)
└─────────────────────┘
   │
   ▼
┌─────────────────────┐
│  Authentication     │  (validate Cognito JWT)
└─────────────────────┘
   │
   ▼
┌─────────────────────┐
│  Authorization      │  (check role permissions)
└─────────────────────┘
   │
   ▼
┌─────────────────────┐
│  Tenant Context     │  (set agent_id)
└─────────────────────┘
   │
   ▼
  Route Handler
```

### Action Items
1. [ ] Create authentication middleware
2. [ ] Create authorization helpers
3. [ ] Create tenant context middleware
4. [ ] Implement rate limiting
5. [ ] Add request ID tracing
6. [ ] Define error response format
7. [ ] Set up OpenAPI documentation

---

## 5. Local Development Environment

### Current State
- Unknown local setup

### Required State
- Docker Compose for all services
- LocalStack for AWS services
- Seed data for development
- Hot reload for all apps

### Docker Compose Services
```yaml
services:
  postgres:
    image: postgres:15

  redis:
    image: redis:7

  localstack:
    image: localstack/localstack
    # S3, SQS, SES simulation

  mailhog:
    image: mailhog/mailhog
    # Email testing

  opensearch:
    image: opensearchproject/opensearch:2
```

### Action Items
1. [ ] Create docker-compose.yml
2. [ ] Create .env.example with all variables
3. [ ] Create seed data scripts
4. [ ] Document setup in README
5. [ ] Test hot reload for all apps

---

## 6. CI/CD Pipeline Updates

### Current State
- Unknown CI/CD setup

### Required State
- GitHub Actions workflows
- Lint, test, build stages
- Staging deployment on PR merge
- Production deployment on release tags
- Environment variable management

### Pipeline Stages
1. Install dependencies (pnpm)
2. Lint & type check
3. Unit tests
4. Build all apps
5. Integration tests
6. Deploy to staging (develop branch)
7. E2E tests on staging
8. Manual approval for production
9. Deploy to production (release tags)

### Action Items
1. [ ] Create `.github/workflows/ci.yml`
2. [ ] Create `.github/workflows/deploy-staging.yml`
3. [ ] Create `.github/workflows/deploy-production.yml`
4. [ ] Configure Amplify webhooks
5. [ ] Set up GitHub secrets
6. [ ] Add Slack notifications

---

## 7. Documentation Updates

### Files to Update
- [x] `.claude/context/tech-stack.md` - Complete rewrite
- [x] `.claude/context/database-schema.md` - Complete rewrite
- [ ] `docs/architecture/01-database-schema.md` - Sync with context
- [ ] `docs/deployment/aws-infrastructure.md` - Add new services
- [ ] `docs/deployment/environment-variables.md` - Add new variables
- [ ] `docs/security/security-requirements.md` - Update for Cognito
- [ ] `docs/api/api-spec.md` - Update with auth requirements

### New Files Created
- [x] `docs/project/epic-yong-choi-portal.md`
- [x] `docs/project/story-backlog.md`
- [x] `docs/project/phase-0-changes.md` (this file)

---

## Phase 0 Story Sequence

### Week 1
**Parallel Track A:**
- 0.1 Project Structure [COMPLETE]
- 0.2 Documentation Structure [COMPLETE]
- 0.3 Database Schema Design

**Parallel Track B:**
- 0.4 AWS Infrastructure Setup

### Week 2
**Track A (continues):**
- 0.3 Database Schema Design (complete)
- 0.8 Local Development Environment

**Track B (continues):**
- 0.4 AWS Infrastructure (complete)
- 0.5 Amazon Cognito Authentication
- 0.7 CI/CD Pipeline (can start)

### Week 3
**Track A:**
- 0.10 API Foundation

**Track B:**
- 0.5 Cognito (complete)
- 0.6 NextAuth.js Integration
- 0.9 Error Handling & Logging

---

## Success Criteria for Phase 0

Before starting Phase 1, all of the following MUST be true:

1. **Infrastructure**
   - [ ] All AWS services provisioned and accessible
   - [ ] Staging environment fully functional
   - [ ] Production environment ready (not deployed)

2. **Authentication**
   - [ ] Can create users in Cognito
   - [ ] Can sign in/out via NextAuth.js
   - [ ] Session contains user role
   - [ ] Protected routes working

3. **Database**
   - [ ] All tables created in staging
   - [ ] Migrations running successfully
   - [ ] Seed data populating
   - [ ] Multi-tenant queries tested

4. **Development**
   - [ ] Local environment starts with one command
   - [ ] Hot reload working for all apps
   - [ ] Can run tests locally

5. **CI/CD**
   - [ ] Pipeline runs on every PR
   - [ ] Staging deploys on merge to develop
   - [ ] All tests passing

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cognito setup complexity | High | Start early, allocate 5 story points |
| AWS service limits | Medium | Check limits, request increases |
| Database migration complexity | Medium | Test migrations on staging first |
| Local environment complexity | Low | Docker Compose handles most issues |
| CI/CD configuration | Low | Use standard GitHub Actions patterns |

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-04 | 1.0 | Initial Phase 0 changes document |
