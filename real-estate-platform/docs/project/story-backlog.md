# Story Backlog - Yong Choi Real Estate Portal

## Overview

This document contains the complete story backlog organized by phase with dependencies, story points, and status tracking.

**Total Stories:** 71
**Total Story Points:** ~350
**Estimated Duration:** 22 weeks

---

## Status Legend

| Symbol | Status | Description |
|--------|--------|-------------|
| [ ] | Not Started | Work has not begun |
| [~] | In Progress | Currently being worked on |
| [x] | Complete | Delivered and approved |
| [!] | Blocked | Waiting on dependency |
| [-] | Deferred | Postponed to future phase |

---

## Phase 0: Foundation (Weeks 1-3)

**Target:** Infrastructure, authentication, and database foundation ready for development.

| ID | Story | Points | Status | Blocked By | Assignee |
|----|-------|--------|--------|------------|----------|
| 0.1 | Project Structure & Monorepo Setup | 3 | [x] | - | - |
| 0.2 | Documentation Structure | 2 | [x] | - | - |
| 0.3 | Database Schema Design | 8 | [ ] | - | Architecture |
| 0.4 | AWS Infrastructure Setup | 8 | [ ] | - | Implementation |
| 0.5 | Amazon Cognito Authentication | 5 | [ ] | 0.4 | Implementation |
| 0.6 | NextAuth.js v5 Integration | 5 | [ ] | 0.5 | Implementation |
| 0.7 | CI/CD Pipeline | 5 | [ ] | 0.4 | Implementation |
| 0.8 | Local Development Environment | 3 | [ ] | 0.3 | Implementation |
| 0.9 | Error Handling & Logging | 3 | [ ] | 0.4 | Implementation |
| 0.10 | API Foundation | 5 | [ ] | 0.3, 0.6 | Implementation |

**Phase 0 Total:** 10 stories, 47 points

### Story Details

#### 0.3 Database Schema Design
```
As a developer
I need a complete database schema
So that all features have proper data storage

Acceptance Criteria:
- [ ] All tables documented with columns and types
- [ ] ERD diagram created
- [ ] Indexes defined for all query patterns
- [ ] Foreign key relationships documented
- [ ] Row-level security patterns defined
- [ ] Migration scripts created
- [ ] Seed data scripts for development

Technical Notes:
- See database-schema.md for full schema
- Use UUID for all primary keys
- JSONB for flexible data fields
- Partitioning for analytics_events table
```

#### 0.4 AWS Infrastructure Setup
```
As a developer
I need AWS infrastructure provisioned
So that the application has proper hosting and services

Acceptance Criteria:
- [ ] Terraform/CDK infrastructure as code
- [ ] All services provisioned in us-west-2
- [ ] VPC with public/private subnets
- [ ] Security groups configured
- [ ] IAM roles with least privilege
- [ ] Staging and production environments
- [ ] Cost monitoring alerts set

AWS Services:
- Amplify (3 apps)
- RDS PostgreSQL (db.t3.medium)
- ElastiCache Redis (cache.t3.micro)
- OpenSearch (t3.small.search)
- S3 (3 buckets)
- SES (verified domain)
- SQS (standard queues)
- Lambda (Node.js 20)
- CloudFront (distributions)
- Cognito (user pool)
```

#### 0.5 Amazon Cognito Authentication
```
As a user
I need secure authentication
So that my account is protected

Acceptance Criteria:
- [ ] User Pool created with custom attributes
- [ ] User groups configured (6 roles)
- [ ] Hosted UI configured (fallback)
- [ ] Custom domain (auth.yongchoi.com)
- [ ] Social sign-in (Google) configured
- [ ] Password reset flow working
- [ ] Email verification templates via SES
- [ ] MFA option available

User Groups:
- super_admin
- agent_admin
- marketing_designer
- client_active
- client_lead
```

#### 0.6 NextAuth.js v5 Integration
```
As a developer
I need NextAuth integrated with Cognito
So that frontend apps have proper session management

Acceptance Criteria:
- [ ] NextAuth.js v5 installed and configured
- [ ] Cognito provider working
- [ ] Sign in/out flows functional
- [ ] Session includes user role and permissions
- [ ] Middleware protecting routes by role
- [ ] Client-side useSession hook working
- [ ] Server-side getServerSession working
- [ ] Token refresh handling
```

---

## Phase 1: Agent Portal Core (Weeks 4-8)

**Target:** Complete Agent Portal with Dashboard, CRM, Calendar, and AI Assistant.

| ID | Story | Points | Status | Blocked By | Assignee |
|----|-------|--------|--------|------------|----------|
| 1.1 | Agent Portal Layout & Navigation | 5 | [ ] | 0.6, 0.10 | Implementation |
| 1.2 | Dashboard - Today's Schedule Widget | 3 | [ ] | 1.1, 1.15 | Implementation |
| 1.3 | Dashboard - Hot Leads Widget | 3 | [ ] | 1.1, 1.9 | Implementation |
| 1.4 | Dashboard - Website Performance Widget | 3 | [ ] | 1.1, 1.5 | Implementation |
| 1.5 | Analytics Dashboard - Website Metrics | 5 | [ ] | 1.1 | Implementation |
| 1.6 | Analytics Dashboard - Lead Funnel | 5 | [ ] | 1.1, 1.9 | Implementation |
| 1.7 | Analytics Dashboard - Listing Performance | 5 | [ ] | 1.1 | Implementation |
| 1.8 | Analytics Dashboard - Marketing Metrics | 3 | [ ] | 1.1, 2.1 | Implementation |
| 1.9 | CRM - Contact Management | 8 | [ ] | 1.1, 0.10 | Implementation |
| 1.10 | CRM - Pipeline/Kanban Board | 8 | [ ] | 1.9 | Implementation |
| 1.11 | CRM - Activity Logging | 5 | [ ] | 1.9 | Implementation |
| 1.12 | CRM - Email Integration | 8 | [ ] | 1.9 | Integration |
| 1.13 | CRM - Task Management | 5 | [ ] | 1.9 | Implementation |
| 1.14 | CRM - Automation Engine | 13 | [ ] | 1.9, 1.11, 1.13 | Implementation |
| 1.15 | Google Calendar Integration | 8 | [ ] | 1.1 | Integration |
| 1.16 | AI Assistant - Gemini Setup | 5 | [ ] | 0.4 | Integration |
| 1.17 | AI Assistant - Email Drafting | 5 | [ ] | 1.16, 1.12 | Implementation |
| 1.18 | AI Assistant - Calendar Intelligence | 5 | [ ] | 1.16, 1.15 | Implementation |

**Phase 1 Total:** 18 stories, 102 points

### Key Story Details

#### 1.9 CRM - Contact Management
```
As an agent
I need to manage all my contacts
So that I can track relationships and follow-ups

Acceptance Criteria:
- [ ] Contact list with pagination (100+ contacts)
- [ ] Advanced search (name, email, phone, tags)
- [ ] Filter by type, status, tags, source
- [ ] Contact detail page with full info
- [ ] Create/Edit forms with validation
- [ ] Tag management (create, assign, remove)
- [ ] CSV import/export
- [ ] Duplicate detection on import
- [ ] Merge duplicate contacts
- [ ] Contact activity timeline (from 1.11)

Contact Fields:
- Basic info (name, email, phone, address)
- Type (lead, client, vendor, other)
- Status (active, inactive, etc.)
- Source (website, referral, etc.)
- Tags (array)
- Custom fields (JSONB)
- Notes
- Related contacts
```

#### 1.14 CRM - Automation Engine
```
As an agent
I need automated actions based on triggers
So that routine follow-ups happen automatically

Acceptance Criteria:
- [ ] Rule builder interface
- [ ] All trigger types implemented
- [ ] All action types implemented
- [ ] Condition builder (AND/OR logic)
- [ ] Rule testing mode (dry run)
- [ ] Execution history log
- [ ] Enable/disable toggle
- [ ] Rule templates for common scenarios

Trigger Types:
- lead_created
- contact_status_change
- task_due
- no_activity_for_x_days
- property_status_change
- form_submission

Action Types:
- create_task
- send_email_template
- change_contact_status
- add_tag
- send_notification
- update_field
```

---

## Phase 2: Marketing Hub + Client Portal Public (Weeks 9-14)

**Target:** Marketing request workflow and public client portal features.

| ID | Story | Points | Status | Blocked By | Assignee |
|----|-------|--------|--------|------------|----------|
| 2.1 | Marketing Materials Library | 5 | [ ] | 1.1 | Implementation |
| 2.2 | Marketing Request Submission | 5 | [ ] | 2.1 | Implementation |
| 2.3 | Marketing Request Designer Chat | 8 | [ ] | 2.2 | Implementation |
| 2.4 | Marketing Request Status Stepper | 3 | [ ] | 2.2 | Implementation |
| 2.5 | Marketing SLA Configuration | 5 | [ ] | 2.2 | Implementation |
| 2.6 | Marketing Notifications | 3 | [ ] | 2.2, 2.3 | Implementation |
| 2.7 | Client Portal Layout & Auth | 5 | [ ] | 0.6 | Implementation |
| 2.8 | Property Search with OpenSearch | 8 | [ ] | 0.4, 2.7 | Implementation |
| 2.9 | Advanced Search Filters | 5 | [ ] | 2.8 | Implementation |
| 2.10 | Search Results Display | 5 | [ ] | 2.8 | Implementation |
| 2.11 | Property Detail Page | 8 | [ ] | 2.10 | Implementation |
| 2.12 | Favorites System | 5 | [ ] | 2.7, 2.10 | Implementation |
| 2.13 | Property Comparison Tool | 5 | [ ] | 2.12 | Implementation |
| 2.14 | Saved Search Alerts | 5 | [ ] | 2.9 | Implementation |
| 2.15 | Market Analytics - Anonymous View | 3 | [ ] | 2.7 | Implementation |
| 2.16 | Market Analytics - Lead View | 5 | [ ] | 2.15 | Implementation |
| 2.17 | Market Analytics - Active Client View | 5 | [ ] | 2.16 | Implementation |
| 2.18 | Concierge Directory | 5 | [ ] | 2.7 | Implementation |
| 2.19 | Service Partner Management | 3 | [ ] | 2.18 | Implementation |
| 2.20 | Service Introduction Requests | 3 | [ ] | 2.18 | Implementation |

**Phase 2 Total:** 20 stories, 99 points

### Key Story Details

#### 2.8 Property Search with OpenSearch
```
As a client
I need to search for properties
So that I can find homes matching my criteria

Acceptance Criteria:
- [ ] Search bar with auto-complete
- [ ] Full-text search on address, description
- [ ] Faceted search filters working
- [ ] Geo-search by area/radius/polygon
- [ ] Sort options (price, date, sqft)
- [ ] Results pagination
- [ ] Performance < 500ms for queries
- [ ] Index sync with property changes

OpenSearch Index Fields:
- address (text)
- description (text)
- city (keyword)
- price (integer)
- beds, baths (integer)
- sqft (integer)
- property_type (keyword)
- status (keyword)
- features (keyword array)
- location (geo_point)
```

---

## Phase 3: Client Portal Private Features (Weeks 15-18)

**Target:** Post-closing tools for active clients (Home Binder, Maintenance, Transactions).

| ID | Story | Points | Status | Blocked By | Assignee |
|----|-------|--------|--------|------------|----------|
| 3.1 | Home Binder - Document Upload | 5 | [ ] | 2.7 | Implementation |
| 3.2 | Home Binder - Document Organization | 5 | [ ] | 3.1 | Implementation |
| 3.3 | Home Binder - Search & Retrieval | 3 | [ ] | 3.2 | Implementation |
| 3.4 | Maintenance Tracker - Dashboard | 5 | [ ] | 2.7 | Implementation |
| 3.5 | Maintenance Tracker - Seasonal Checklists | 5 | [ ] | 3.4 | Implementation |
| 3.6 | Maintenance Tracker - Appliance Registry | 5 | [ ] | 3.4 | Implementation |
| 3.7 | Maintenance Tracker - Reminders | 3 | [ ] | 3.5, 3.6 | Implementation |
| 3.8 | Transaction Tracker - Timeline | 8 | [ ] | 2.7 | Implementation |
| 3.9 | Transaction Tracker - Milestone Management | 5 | [ ] | 3.8 | Implementation |
| 3.10 | Transaction Tracker - Document Integration | 3 | [ ] | 3.8, 3.1 | Implementation |
| 3.11 | Transaction Tracker - Communication Log | 3 | [ ] | 3.8 | Implementation |

**Phase 3 Total:** 11 stories, 50 points

---

## Phase 4: AI Integration & Polish (Weeks 19-22)

**Target:** AI features, optimization, testing, and production deployment.

| ID | Story | Points | Status | Blocked By | Assignee |
|----|-------|--------|--------|------------|----------|
| 4.1 | Amazon Bedrock Setup | 5 | [ ] | 0.4 | Integration |
| 4.2 | HuggingFace Integration | 5 | [ ] | 0.4 | Integration |
| 4.3 | AI Property Recommendations | 5 | [ ] | 4.1, 2.12 | Implementation |
| 4.4 | AI Market Insights | 5 | [ ] | 4.1, 2.17 | Implementation |
| 4.5 | AI Listing Description Generation | 5 | [ ] | 4.1 | Implementation |
| 4.6 | Performance Optimization | 8 | [ ] | All prior | Implementation |
| 4.7 | Security Audit | 8 | [ ] | All prior | Review |
| 4.8 | Accessibility Audit (WCAG 2.1) | 5 | [ ] | All UI | Review |
| 4.9 | Mobile Responsiveness Polish | 5 | [ ] | All UI | Implementation |
| 4.10 | Testing & QA | 8 | [ ] | All prior | Review |
| 4.11 | Production Deployment | 5 | [ ] | 4.6-4.10 | Implementation |
| 4.12 | Documentation Finalization | 3 | [ ] | All prior | Architecture |

**Phase 4 Total:** 12 stories, 67 points

---

## Phase 5: Multi-Tenant Scale (Future)

**Target:** Enable multiple agents on template tier.

| ID | Story | Points | Status | Blocked By | Assignee |
|----|-------|--------|--------|------------|----------|
| 5.1 | Template Site Tenant Resolution | 8 | [-] | Phase 4 | Architecture |
| 5.2 | Agent Onboarding Flow | 8 | [-] | 5.1 | Implementation |
| 5.3 | Self-Service Configuration | 8 | [-] | 5.2 | Implementation |
| 5.4 | Billing Integration (Stripe) | 13 | [-] | 5.2 | Integration |
| 5.5 | Performance Monitoring Dashboard | 5 | [-] | 5.1 | Implementation |
| 5.6 | Multi-Tenant Admin Panel | 8 | [-] | 5.1 | Implementation |

**Phase 5 Total:** 6 stories, 50 points (deferred)

---

## Dependency Graph

```
PHASE 0 (Foundation)
────────────────────
0.1 ─┬─► 0.2
     │
0.3 ─┼─► 0.8 (Local Dev)
     │
     └─► 0.10 (API Foundation) ◄─┐
                                 │
0.4 ─┬─► 0.5 ─► 0.6 ─────────────┘
     │
     ├─► 0.7 (CI/CD)
     │
     └─► 0.9 (Logging)


PHASE 1 (Agent Portal)
──────────────────────
0.6 + 0.10 ─► 1.1 (Layout) ─┬─► 1.5 ─► 1.4
                            │
                            ├─► 1.9 (CRM) ─┬─► 1.3
                            │              │
                            │              ├─► 1.6
                            │              │
                            │              ├─► 1.10 (Pipeline)
                            │              │
                            │              ├─► 1.11 (Activities)
                            │              │
                            │              ├─► 1.12 (Email) ─► 1.17
                            │              │
                            │              └─► 1.13 (Tasks)
                            │                     │
                            │                     ▼
                            │              1.14 (Automation)
                            │
                            └─► 1.15 (Calendar) ─┬─► 1.2
                                                 │
                                                 └─► 1.18

0.4 ─► 1.16 (Gemini) ─┬─► 1.17
                      │
                      └─► 1.18


PHASE 2 (Marketing + Client)
────────────────────────────
1.1 ─► 2.1 (Materials) ─► 2.2 (Requests) ─┬─► 2.3 (Chat)
                                          │
                                          ├─► 2.4 (Stepper)
                                          │
                                          ├─► 2.5 (SLA)
                                          │
                                          └─► 2.6 (Notifications)

0.6 ─► 2.7 (Client Layout) ─┬─► 2.8 (Search) ─┬─► 2.9 (Filters) ─► 2.14
                            │                 │
                            │                 └─► 2.10 (Results) ─┬─► 2.11
                            │                                     │
                            │                                     └─► 2.12 ─► 2.13
                            │
                            ├─► 2.15 ─► 2.16 ─► 2.17
                            │
                            └─► 2.18 ─┬─► 2.19
                                      │
                                      └─► 2.20


PHASE 3 (Client Private)
────────────────────────
2.7 ─┬─► 3.1 ─► 3.2 ─► 3.3
     │
     ├─► 3.4 ─┬─► 3.5 ─┐
     │        │        │
     │        └─► 3.6 ─┼─► 3.7
     │                 │
     └─► 3.8 ─┬─► 3.9  │
              │        │
              ├─► 3.10 ◄┘
              │
              └─► 3.11


PHASE 4 (AI + Polish)
─────────────────────
0.4 ─┬─► 4.1 (Bedrock) ─┬─► 4.3
     │                  │
     │                  ├─► 4.4
     │                  │
     │                  └─► 4.5
     │
     └─► 4.2 (HuggingFace)

All Prior ─► 4.6 ─► 4.7 ─► 4.10 ─► 4.11
                    │
All UI ─► 4.8 ─────┘
      │
      └─► 4.9 ─────┘
```

---

## Velocity Tracking

| Week | Phase | Stories Planned | Stories Completed | Points Planned | Points Completed |
|------|-------|-----------------|-------------------|----------------|------------------|
| 1 | 0 | 4 | | 21 | |
| 2 | 0 | 4 | | 18 | |
| 3 | 0 | 2 | | 8 | |
| 4 | 1 | 4 | | 16 | |
| 5 | 1 | 4 | | 21 | |
| 6 | 1 | 4 | | 21 | |
| 7 | 1 | 3 | | 21 | |
| 8 | 1 | 3 | | 23 | |
| 9 | 2 | 4 | | 21 | |
| 10 | 2 | 4 | | 21 | |
| 11 | 2 | 4 | | 18 | |
| 12 | 2 | 4 | | 18 | |
| 13 | 2 | 2 | | 11 | |
| 14 | 2 | 2 | | 10 | |
| 15 | 3 | 3 | | 13 | |
| 16 | 3 | 3 | | 13 | |
| 17 | 3 | 3 | | 13 | |
| 18 | 3 | 2 | | 11 | |
| 19 | 4 | 3 | | 15 | |
| 20 | 4 | 3 | | 15 | |
| 21 | 4 | 3 | | 18 | |
| 22 | 4 | 3 | | 19 | |

---

## Parallelization Opportunities

### Phase 0 Parallel Tracks
After 0.1 and 0.2 complete:
- **Track A:** 0.3 (Database) -> 0.8 (Local Dev)
- **Track B:** 0.4 (AWS) -> 0.5 (Cognito) -> 0.6 (NextAuth)
- **Track C:** 0.7 (CI/CD) (after 0.4)

Time Saved: ~1 week

### Phase 1 Parallel Tracks
After 1.1 complete:
- **Track A:** 1.5 -> 1.4, 1.7
- **Track B:** 1.9 -> 1.10, 1.11, 1.13 -> 1.14
- **Track C:** 1.15 -> 1.2
- **Track D:** 1.16 -> 1.17, 1.18 (Integration agent)

Time Saved: ~2 weeks

### Phase 2 Parallel Tracks
After 2.7 complete:
- **Track A:** 2.8 -> 2.9, 2.10 -> 2.11, 2.12, 2.13, 2.14
- **Track B:** 2.15 -> 2.16 -> 2.17
- **Track C:** 2.18 -> 2.19, 2.20
- **Track D:** 2.1 -> 2.2 -> 2.3, 2.4, 2.5, 2.6 (can start immediately)

Time Saved: ~1.5 weeks

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AWS service limits | High | Low | Request limit increases early |
| Cognito complexity | Medium | Medium | Allocate extra time, have fallback |
| OpenSearch learning curve | Medium | Medium | Spike story first |
| Google API OAuth approval | High | Medium | Start approval process Week 1 |
| AI API costs | Medium | Medium | Implement caching, rate limits |
| Scope creep | High | High | Strict acceptance criteria |

---

## Definition of Done

Every story must meet these criteria:

1. **Code Complete**
   - [ ] Implementation matches acceptance criteria
   - [ ] TypeScript types defined
   - [ ] Error handling implemented

2. **Testing**
   - [ ] Unit tests written (>80% coverage)
   - [ ] Integration tests for APIs
   - [ ] Manual testing completed

3. **Documentation**
   - [ ] Code comments for complex logic
   - [ ] API documentation updated
   - [ ] README updated if needed

4. **Review**
   - [ ] Code review approved
   - [ ] No linting errors
   - [ ] No TypeScript errors

5. **Deployment**
   - [ ] Deploys to staging successfully
   - [ ] No console errors
   - [ ] Performance acceptable

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-04 | 1.0 | Initial backlog from Yong spec integration |
