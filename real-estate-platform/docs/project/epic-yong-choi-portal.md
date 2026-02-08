# Epic: Yong Choi Real Estate Portal

## Overview

A comprehensive real estate platform for Yong Choi serving as the foundation for a multi-tenant SaaS offering. This epic encompasses the full Agent Portal, Client Portal, Marketing Hub, and AI integrations.

**Epic ID:** REALESTATE-YONG
**Total Timeline:** 22 weeks
**Total Stories:** 55
**Priority:** P0 - Critical Path

---

## User Roles & Access Matrix

### Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| Super Admin (Joey) | Platform owner, full system access | All features + admin panel |
| Agent Admin (Yong) | Real estate agent, site owner | Agent Portal + Client Management |
| Marketing Designer | Creates marketing materials | Marketing Hub (Designer View) |
| Client (Active) | Clients with active transactions | Full Client Portal |
| Client (Lead) | Prospective clients | Limited Client Portal |
| Anonymous | Public visitors | Public pages only |

### Three-Tier Client Access Matrix

| Feature | Anonymous | Lead | Active |
|---------|-----------|------|--------|
| Property Search | Yes | Yes | Yes |
| Basic Market Stats | Yes | Yes | Yes |
| Save Favorites | No | Yes | Yes |
| Search Alerts | No | Yes | Yes |
| Detailed Market Analytics | No | Limited | Full |
| Concierge Directory | View Only | Request Intro | Full Access |
| Home Binder | No | No | Yes |
| Maintenance Tracker | No | No | Yes |
| Transaction Tracker | No | No | Yes |

---

## Phase Structure

### Phase 0: Foundation (Weeks 1-3)
Infrastructure, authentication, and database foundation.

### Phase 1: Agent Portal Core (Weeks 4-8)
Dashboard, Analytics, CRM, Calendar, and Automation.

### Phase 2: Marketing Hub + Client Portal Public (Weeks 9-14)
Marketing request workflow and public-facing client features.

### Phase 3: Client Portal Private (Weeks 15-18)
Post-closing tools for active clients.

### Phase 4: AI Integration & Polish (Weeks 19-22)
AI features, optimization, and launch preparation.

### Phase 5: Multi-Tenant Scale (Future)
Template site and multi-agent support.

---

## Phase 0: Foundation

**Duration:** 3 weeks
**Stories:** 10
**Dependencies:** None (starting phase)

### Story 0.1: Project Structure & Monorepo Setup
**Status:** Complete
**Points:** 3
**Description:** Turborepo monorepo with pnpm workspaces.

**Acceptance Criteria:**
- [x] Turborepo configured
- [x] pnpm workspaces defined
- [x] Apps: premium-site, template-site, backend, admin
- [x] Packages: ui, database, shared, config

---

### Story 0.2: Documentation Structure
**Status:** Complete
**Points:** 2
**Description:** Create documentation folder structure.

**Acceptance Criteria:**
- [x] /docs/architecture/ created
- [x] /docs/api/ created
- [x] /docs/deployment/ created
- [x] /docs/security/ created
- [x] /docs/compliance/ created
- [ ] /docs/project/ created (this update)

---

### Story 0.3: Database Schema Design
**Status:** Ready
**Points:** 8
**Blocked By:** None
**Description:** Design and document complete database schema for all features.

**New Tables Required:**

**Core:**
- users (id, email, password_hash, role, cognito_id, created_at, updated_at)
- user_profiles (id, user_id, first_name, last_name, phone, avatar_url)
- agents (existing - update with user_id FK)
- agent_sites (existing)
- properties (existing)
- leads (existing - link to users table)

**CRM:**
- contacts (id, agent_id, user_id, type, status, tags, metadata)
- contact_activities (id, contact_id, activity_type, description, metadata)
- pipeline_stages (id, agent_id, name, order, color)
- pipeline_deals (id, contact_id, stage_id, value, expected_close)
- tasks (id, agent_id, contact_id, title, due_date, status, priority)
- automation_rules (id, agent_id, trigger_type, conditions, actions, active)

**Marketing:**
- marketing_requests (id, agent_id, type, status, priority, sla_deadline)
- marketing_request_messages (id, request_id, sender_id, content, attachments)
- marketing_materials (id, agent_id, type, title, file_url, metadata)
- marketing_sla_config (id, request_type, priority, hours_to_complete)

**Client Portal:**
- saved_searches (id, user_id, name, criteria, alert_frequency)
- favorited_properties (id, user_id, property_id, notes)
- property_comparisons (id, user_id, property_ids, created_at)

**Concierge:**
- service_partners (id, agent_id, name, category, contact_info, description)
- service_introductions (id, partner_id, user_id, status, notes)

**Home Binder:**
- home_binder_documents (id, user_id, property_id, category, title, file_url)

**Maintenance:**
- appliances (id, user_id, property_id, name, brand, model, purchase_date, warranty_end)
- maintenance_tasks (id, user_id, property_id, title, frequency, last_completed, next_due)
- maintenance_checklists (id, season, tasks)

**Transactions:**
- client_transactions (id, user_id, property_id, type, status, close_date)
- transaction_milestones (id, transaction_id, name, status, due_date, completed_at)
- transaction_documents (id, transaction_id, title, file_url, category)

**Calendar:**
- calendar_events (id, agent_id, title, start_time, end_time, attendees, location)
- calendar_sync_tokens (id, agent_id, provider, token, last_sync)

**AI:**
- ai_conversations (id, user_id, context_type, messages, created_at)
- ai_context_documents (id, agent_id, content, embedding, metadata)

**Analytics:**
- analytics_events (existing - expand event types)
- analytics_aggregates (id, agent_id, metric_type, period, value)

**Acceptance Criteria:**
- [ ] All tables documented with columns and types
- [ ] ERD diagram created
- [ ] Indexes defined for all query patterns
- [ ] Foreign key relationships documented
- [ ] Row-level security patterns defined
- [ ] Migration scripts created

---

### Story 0.4: AWS Infrastructure Setup
**Status:** Ready
**Points:** 8
**Blocked By:** None
**Description:** Configure all required AWS services.

**Services Required:**

| Service | Purpose | Configuration |
|---------|---------|---------------|
| AWS Amplify | Frontend hosting | 3 apps: premium-site, template-site, admin |
| Amazon RDS | PostgreSQL database | db.t3.medium, Multi-AZ |
| Amazon Cognito | Authentication | User Pool + Identity Pool |
| Amazon SES | Email delivery | Verified domain, templates |
| Amazon SQS | Message queues | Standard queues for async jobs |
| AWS Lambda | Background processing | Node.js 20 runtime |
| Amazon S3 | File storage | Buckets: media, documents, backups |
| Amazon CloudFront | CDN | Distributions for all apps |
| Amazon ElastiCache | Redis caching | cache.t3.micro cluster |
| Amazon OpenSearch | Property search | t3.small.search domain |

**Acceptance Criteria:**
- [ ] Terraform/CDK infrastructure as code
- [ ] All services provisioned in us-west-2
- [ ] VPC with public/private subnets
- [ ] Security groups configured
- [ ] IAM roles with least privilege
- [ ] Staging and production environments
- [ ] Cost monitoring alerts set

---

### Story 0.5: Amazon Cognito Authentication
**Status:** Ready
**Points:** 5
**Blocked By:** 0.4
**Description:** Configure Cognito User Pool with all user roles.

**Configuration:**
- User Pool with email/password sign-in
- Custom attributes: role, agent_id, tier
- MFA optional (SMS/TOTP)
- Password policy: 8+ chars, mixed case, numbers
- Email verification required
- Custom email templates via SES

**User Groups:**
- super_admin
- agent_admin
- marketing_designer
- client_active
- client_lead

**Acceptance Criteria:**
- [ ] User Pool created with custom attributes
- [ ] User groups configured
- [ ] Hosted UI configured (fallback)
- [ ] Custom domain (auth.yongchoi.com)
- [ ] Social sign-in (Google) configured
- [ ] Password reset flow working
- [ ] Email verification templates

---

### Story 0.6: NextAuth.js v5 Integration
**Status:** Ready
**Points:** 5
**Blocked By:** 0.5
**Description:** Integrate NextAuth.js v5 with Cognito provider.

**Implementation:**
- NextAuth.js v5 (Auth.js)
- Cognito provider configuration
- JWT strategy with Cognito tokens
- Session callback with user role
- Protected route middleware
- Role-based access control helpers

**Acceptance Criteria:**
- [ ] NextAuth.js v5 installed and configured
- [ ] Cognito provider working
- [ ] Sign in/out flows functional
- [ ] Session includes user role and permissions
- [ ] Middleware protecting routes by role
- [ ] Client-side useSession hook working
- [ ] Server-side getServerSession working

---

### Story 0.7: CI/CD Pipeline
**Status:** Ready
**Points:** 5
**Blocked By:** 0.4
**Description:** GitHub Actions CI/CD with Amplify deployments.

**Pipeline Stages:**
1. Lint & Type Check
2. Unit Tests
3. Integration Tests
4. Build
5. Deploy to Staging (on PR merge to develop)
6. Deploy to Production (on release tag)

**Acceptance Criteria:**
- [ ] GitHub Actions workflow files
- [ ] Amplify webhook triggers
- [ ] Environment variable management
- [ ] Test coverage reporting
- [ ] Slack notifications on failure
- [ ] Manual approval for production

---

### Story 0.8: Local Development Environment
**Status:** Ready
**Points:** 3
**Blocked By:** 0.3
**Description:** Docker Compose for local development.

**Services:**
- PostgreSQL 15
- Redis 7
- LocalStack (S3, SQS, SES simulation)
- Mailhog (email testing)

**Acceptance Criteria:**
- [ ] docker-compose.yml configured
- [ ] .env.example with all variables
- [ ] Seed data scripts
- [ ] README with setup instructions
- [ ] Hot reload working for all apps

---

### Story 0.9: Error Handling & Logging
**Status:** Ready
**Points:** 3
**Blocked By:** 0.4
**Description:** Centralized error handling and structured logging.

**Implementation:**
- Winston logger with JSON format
- CloudWatch Logs integration
- Error boundary components (React)
- API error response format
- Request ID tracing

**Acceptance Criteria:**
- [ ] Logger utility configured
- [ ] All apps using consistent logging
- [ ] CloudWatch log groups created
- [ ] Error boundary in all apps
- [ ] Standardized API error responses
- [ ] Request ID in all logs

---

### Story 0.10: API Foundation
**Status:** Ready
**Points:** 5
**Blocked By:** 0.3, 0.6
**Description:** Base API setup with authentication and multi-tenant context.

**Implementation:**
- Next.js API routes (App Router)
- Authentication middleware
- Tenant context middleware
- Rate limiting
- CORS configuration
- OpenAPI documentation

**Acceptance Criteria:**
- [ ] API route structure defined
- [ ] Auth middleware validating Cognito tokens
- [ ] Tenant context from agent_id
- [ ] Rate limiting per user/IP
- [ ] CORS configured for all apps
- [ ] Swagger/OpenAPI docs generated

---

## Phase 1: Agent Portal Core

**Duration:** 5 weeks
**Stories:** 18
**Dependencies:** Phase 0 complete

### Story 1.1: Agent Portal Layout & Navigation
**Status:** Not Started
**Points:** 5
**Blocked By:** 0.6, 0.10
**Description:** Main layout for Agent Portal with sidebar navigation.

**Components:**
- Sidebar with collapsible sections
- Top bar with search and notifications
- Main content area
- Mobile-responsive drawer

**Navigation Items:**
- Dashboard
- Analytics
- CRM (Contacts, Pipeline, Tasks)
- Calendar
- Marketing Hub
- Settings

**Acceptance Criteria:**
- [ ] Layout component with sidebar
- [ ] Responsive design (desktop/tablet/mobile)
- [ ] Active state indicators
- [ ] Collapsible sidebar
- [ ] Breadcrumb navigation
- [ ] Quick actions menu

---

### Story 1.2: Dashboard - Today's Schedule Widget
**Status:** Not Started
**Points:** 3
**Blocked By:** 1.1, 1.15
**Description:** Widget showing today's appointments and tasks.

**Features:**
- Calendar events for today
- Tasks due today
- Upcoming in next 2 hours highlighted
- Click to view details
- Quick add event/task

**Acceptance Criteria:**
- [ ] Displays today's calendar events
- [ ] Displays today's tasks
- [ ] Color coding by type
- [ ] Click navigation to full calendar
- [ ] Real-time updates

---

### Story 1.3: Dashboard - Hot Leads Widget
**Status:** Not Started
**Points:** 3
**Blocked By:** 1.1, 1.9
**Description:** Widget showing leads requiring immediate attention.

**Features:**
- Leads with recent activity
- Leads with upcoming follow-ups
- Lead score indicator
- Quick action buttons (call, email, task)

**Acceptance Criteria:**
- [ ] Shows top 5 hot leads
- [ ] Lead score calculation
- [ ] Recent activity indicator
- [ ] Quick action buttons
- [ ] Click to view full contact

---

### Story 1.4: Dashboard - Website Performance Widget
**Status:** Not Started
**Points:** 3
**Blocked By:** 1.1, 1.5
**Description:** Widget showing key website metrics.

**Features:**
- Visitors today/this week
- Page views
- Top viewed properties
- Lead conversion rate
- Mini chart (last 7 days)

**Acceptance Criteria:**
- [ ] Real-time visitor count
- [ ] 7-day trend chart
- [ ] Top properties list
- [ ] Conversion rate display
- [ ] Click to full analytics

---

### Story 1.5: Analytics Dashboard - Website Metrics
**Status:** Not Started
**Points:** 5
**Blocked By:** 1.1
**Description:** Comprehensive website analytics view.

**Metrics:**
- Unique visitors (daily/weekly/monthly)
- Page views
- Session duration
- Bounce rate
- Traffic sources
- Device breakdown
- Geographic distribution

**Visualizations:**
- Line charts for trends
- Pie charts for breakdowns
- Data tables with export

**Acceptance Criteria:**
- [ ] Date range selector
- [ ] All metrics displayed
- [ ] Interactive charts (Chart.js/Recharts)
- [ ] CSV export functionality
- [ ] Comparison to previous period
- [ ] Mobile-responsive layout

---

### Story 1.6: Analytics Dashboard - Lead Funnel
**Status:** Not Started
**Points:** 5
**Blocked By:** 1.1, 1.9
**Description:** Visual lead funnel with conversion metrics.

**Funnel Stages:**
1. Website Visitors
2. Property Views
3. Contact Form Submissions
4. Qualified Leads
5. Active Clients
6. Closed Deals

**Features:**
- Visual funnel chart
- Stage-to-stage conversion rates
- Trend over time
- Drill-down to lead list

**Acceptance Criteria:**
- [ ] Funnel visualization
- [ ] Conversion rates calculated
- [ ] Date range filtering
- [ ] Click to view leads at each stage
- [ ] Export functionality

---

### Story 1.7: Analytics Dashboard - Listing Performance
**Status:** Not Started
**Points:** 5
**Blocked By:** 1.1
**Description:** Analytics for property listings.

**Metrics per Listing:**
- Views
- Favorites
- Inquiries
- Days on market
- Price changes

**Aggregate Metrics:**
- Average views per listing
- Most viewed listings
- Listings with no activity
- Inquiry-to-showing ratio

**Acceptance Criteria:**
- [ ] Per-listing metrics table
- [ ] Aggregate summary cards
- [ ] Sort and filter options
- [ ] Trend charts
- [ ] Export to CSV

---

### Story 1.8: Analytics Dashboard - Marketing Metrics
**Status:** Not Started
**Points:** 3
**Blocked By:** 1.1, 2.1
**Description:** Marketing campaign performance tracking.

**Metrics:**
- Materials created
- Request turnaround time
- Campaign reach (future)
- Cost per lead (future)

**Acceptance Criteria:**
- [ ] Marketing request metrics
- [ ] SLA compliance rate
- [ ] Materials usage tracking
- [ ] Basic campaign metrics

---

### Story 1.9: CRM - Contact Management
**Status:** Not Started
**Points:** 8
**Blocked By:** 1.1, 0.10
**Description:** Full contact management system.

**Features:**
- Contact list with search and filter
- Contact detail view
- Contact creation/editing
- Contact types (Lead, Client, Vendor, Other)
- Tags and categories
- Import/Export contacts
- Merge duplicates

**Contact Fields:**
- Basic info (name, email, phone)
- Address
- Source (website, referral, etc.)
- Status
- Tags
- Custom fields
- Notes
- Related contacts

**Acceptance Criteria:**
- [ ] Contact list with pagination
- [ ] Advanced search and filters
- [ ] Contact detail page
- [ ] Create/Edit forms
- [ ] Tag management
- [ ] CSV import/export
- [ ] Duplicate detection

---

### Story 1.10: CRM - Pipeline/Kanban Board
**Status:** Not Started
**Points:** 8
**Blocked By:** 1.9
**Description:** Visual pipeline for deal management.

**Features:**
- Drag-and-drop Kanban board
- Customizable stages
- Deal cards with key info
- Stage totals and metrics
- Multiple pipelines (Buyer, Seller)

**Deal Fields:**
- Contact reference
- Property reference
- Expected value
- Expected close date
- Probability
- Notes

**Acceptance Criteria:**
- [ ] Kanban board with drag-drop
- [ ] Stage customization
- [ ] Deal creation/editing
- [ ] Stage value totals
- [ ] Multiple pipeline support
- [ ] Mobile-friendly view

---

### Story 1.11: CRM - Activity Logging
**Status:** Not Started
**Points:** 5
**Blocked By:** 1.9
**Description:** Track all contact interactions.

**Activity Types:**
- Phone call
- Email sent/received
- Meeting
- Property showing
- Note added
- Status change
- Task completed

**Features:**
- Activity timeline on contact
- Quick log buttons
- Activity filtering
- Team activity feed (future)

**Acceptance Criteria:**
- [ ] Activity timeline component
- [ ] Quick log modal
- [ ] Activity type icons
- [ ] Date/time recording
- [ ] Notes field
- [ ] Filter by type

---

### Story 1.12: CRM - Email Integration
**Status:** Not Started
**Points:** 8
**Blocked By:** 1.9
**Description:** Gmail integration for email tracking.

**Features:**
- OAuth connection to Gmail
- View recent emails with contact
- Send email from CRM
- Email templates
- Track opens (future)
- Auto-log emails to contact

**Implementation:**
- Google Workspace API
- Gmail API for send/receive
- Secure token storage

**Acceptance Criteria:**
- [ ] Gmail OAuth flow
- [ ] View emails on contact page
- [ ] Send email modal
- [ ] Email templates CRUD
- [ ] Auto-log sent emails
- [ ] Disconnect option

---

### Story 1.13: CRM - Task Management
**Status:** Not Started
**Points:** 5
**Blocked By:** 1.9
**Description:** Task tracking linked to contacts.

**Features:**
- Task list view
- Task detail view
- Due date and reminders
- Priority levels
- Task categories
- Recurring tasks
- Link to contact/deal

**Acceptance Criteria:**
- [ ] Task list with filters
- [ ] Create/Edit task modal
- [ ] Due date picker
- [ ] Priority selection
- [ ] Contact/deal linking
- [ ] Mark complete action
- [ ] Overdue highlighting

---

### Story 1.14: CRM - Automation Engine
**Status:** Not Started
**Points:** 13
**Blocked By:** 1.9, 1.11, 1.13
**Description:** Rule-based automation for CRM actions.

**Trigger Types:**
- New lead created
- Contact status change
- Task due
- No activity for X days
- Property status change
- Form submission

**Action Types:**
- Create task
- Send email (template)
- Change contact status
- Add tag
- Send notification
- Update field

**Features:**
- Rule builder UI
- Condition logic (AND/OR)
- Action sequencing
- Rule enable/disable
- Execution logs

**Acceptance Criteria:**
- [ ] Rule builder interface
- [ ] All trigger types working
- [ ] All action types working
- [ ] Condition builder (AND/OR)
- [ ] Rule testing mode
- [ ] Execution history log
- [ ] Enable/disable toggle

---

### Story 1.15: Google Calendar Integration
**Status:** Not Started
**Points:** 8
**Blocked By:** 1.1
**Description:** Two-way sync with Google Calendar.

**Features:**
- OAuth connection to Google Calendar
- View calendar in Agent Portal
- Create events that sync to Google
- Sync Google events to portal
- Multiple calendar support
- Event categories (showing, meeting, personal)

**Implementation:**
- Google Calendar API
- Webhook for real-time sync
- Conflict resolution logic

**Acceptance Criteria:**
- [ ] Google OAuth flow
- [ ] Calendar view (day/week/month)
- [ ] Create event syncs to Google
- [ ] Google events appear in portal
- [ ] Edit/delete sync
- [ ] Multiple calendar selection
- [ ] Color coding by calendar

---

### Story 1.16: AI Assistant - Gemini Setup
**Status:** Not Started
**Points:** 5
**Blocked By:** 0.4
**Description:** Configure Gemini API for AI features.

**Implementation:**
- Gemini API key management
- Rate limiting and quotas
- Context management
- Response caching
- Error handling

**Acceptance Criteria:**
- [ ] Gemini API integration
- [ ] Secure key storage
- [ ] Rate limit handling
- [ ] Basic chat interface
- [ ] Context window management

---

### Story 1.17: AI Assistant - Email Drafting
**Status:** Not Started
**Points:** 5
**Blocked By:** 1.16, 1.12
**Description:** AI-powered email composition.

**Features:**
- Suggest email content based on context
- Multiple tone options (formal, friendly, urgent)
- Contact history context
- Template suggestions
- Grammar and style improvements

**Acceptance Criteria:**
- [ ] AI compose button in email modal
- [ ] Context from contact history
- [ ] Tone selection
- [ ] Edit before sending
- [ ] Improvement suggestions

---

### Story 1.18: AI Assistant - Calendar Intelligence
**Status:** Not Started
**Points:** 5
**Blocked By:** 1.16, 1.15
**Description:** AI-powered calendar suggestions.

**Features:**
- Optimal meeting time suggestions
- Follow-up reminder suggestions
- Schedule conflict detection
- Meeting prep notes generation

**Acceptance Criteria:**
- [ ] Time slot suggestions based on history
- [ ] Smart follow-up reminders
- [ ] Conflict warnings
- [ ] Meeting summary generation

---

## Phase 2: Marketing Hub + Client Portal Public

**Duration:** 6 weeks
**Stories:** 20
**Dependencies:** Phase 1 complete

### Story 2.1: Marketing Materials Library
**Status:** Not Started
**Points:** 5
**Blocked By:** 1.1
**Description:** Digital asset library for marketing materials.

**Features:**
- Grid/list view of materials
- Categories (flyers, social, print, digital)
- Search and filter
- Preview modal
- Download options
- Usage tracking

**Acceptance Criteria:**
- [ ] Material list with thumbnails
- [ ] Category filtering
- [ ] Search functionality
- [ ] Preview (images, PDFs)
- [ ] Download tracking
- [ ] Upload interface (admin)

---

### Story 2.2: Marketing Request Submission
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.1
**Description:** Form for agents to request marketing materials.

**Request Types:**
- Property flyer
- Social media graphics
- Email campaign
- Print materials
- Custom request

**Form Fields:**
- Request type
- Priority (standard, rush)
- Property reference (if applicable)
- Description
- Reference materials
- Deadline preference

**Acceptance Criteria:**
- [ ] Request form with validation
- [ ] File upload for references
- [ ] Property selector
- [ ] Priority affects SLA
- [ ] Confirmation with tracking number

---

### Story 2.3: Marketing Request Designer Chat
**Status:** Not Started
**Points:** 8
**Blocked By:** 2.2
**Description:** Real-time chat between agent and designer.

**Features:**
- Chat interface on request detail
- File sharing in chat
- Read receipts
- Notification on new message
- Chat history

**Implementation:**
- WebSocket for real-time
- S3 for file attachments
- SQS for notifications

**Acceptance Criteria:**
- [ ] Real-time messaging
- [ ] File uploads in chat
- [ ] Message timestamps
- [ ] Unread indicators
- [ ] Email notification for offline users

---

### Story 2.4: Marketing Request Status Stepper
**Status:** Not Started
**Points:** 3
**Blocked By:** 2.2
**Description:** Visual progress tracker for requests.

**Stages:**
1. Submitted
2. Assigned
3. In Progress
4. Review
5. Revision (if needed)
6. Completed

**Features:**
- Visual stepper component
- Current stage highlighted
- Stage timestamps
- Status history

**Acceptance Criteria:**
- [ ] Stepper component
- [ ] Current stage indicator
- [ ] Stage completion times
- [ ] Responsive design

---

### Story 2.5: Marketing SLA Configuration
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.2
**Description:** SLA management for marketing requests.

**Features:**
- SLA rules by request type and priority
- Deadline calculation
- SLA breach warnings
- Escalation notifications
- SLA compliance reporting

**Default SLAs:**
- Standard: 48 hours
- Rush: 24 hours
- Custom: Agent specified

**Acceptance Criteria:**
- [ ] SLA configuration UI (admin)
- [ ] Automatic deadline calculation
- [ ] Warning at 75% time elapsed
- [ ] Breach notification
- [ ] Compliance dashboard

---

### Story 2.6: Marketing Notifications
**Status:** Not Started
**Points:** 3
**Blocked By:** 2.2, 2.3
**Description:** Notification system for marketing workflow.

**Notification Types:**
- Request submitted (to designer)
- Request assigned (to agent)
- New message (to both)
- Status change (to agent)
- SLA warning (to designer)
- Request completed (to agent)

**Channels:**
- In-app notification
- Email notification

**Acceptance Criteria:**
- [ ] Notification bell with count
- [ ] Notification dropdown
- [ ] Email notifications via SES
- [ ] Notification preferences
- [ ] Mark as read

---

### Story 2.7: Client Portal Layout & Auth
**Status:** Not Started
**Points:** 5
**Blocked By:** 0.6
**Description:** Client-facing portal layout and authentication.

**Features:**
- Clean, modern layout
- Navigation: Search, Favorites, Market, Services, My Home
- Mobile-responsive
- Role-based menu items

**Acceptance Criteria:**
- [ ] Layout component
- [ ] Navigation with role-based items
- [ ] Login/Register flows
- [ ] Guest browsing support
- [ ] Mobile navigation

---

### Story 2.8: Property Search with OpenSearch
**Status:** Not Started
**Points:** 8
**Blocked By:** 0.4, 2.7
**Description:** Full-text property search using OpenSearch.

**Features:**
- Full-text search on address, description
- Faceted search (price, beds, baths, etc.)
- Geo-search by area/radius
- Sort options
- Auto-complete suggestions

**Implementation:**
- OpenSearch index for properties
- Real-time index updates
- Query optimization

**Acceptance Criteria:**
- [ ] Search bar with suggestions
- [ ] Results pagination
- [ ] Faceted filters
- [ ] Map integration
- [ ] Performance < 500ms

---

### Story 2.9: Advanced Search Filters
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.8
**Description:** Comprehensive filter panel for property search.

**Filters:**
- Price range (slider)
- Bedrooms (min/max)
- Bathrooms (min/max)
- Square footage (range)
- Property type
- Year built
- Features (pool, garage, etc.)
- Status (Active, Pending, Sold)
- Days on market

**Acceptance Criteria:**
- [ ] Filter panel component
- [ ] All filter types working
- [ ] Filter persistence in URL
- [ ] Clear all filters
- [ ] Filter count badge

---

### Story 2.10: Search Results Display
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.8
**Description:** Property search results with multiple views.

**Views:**
- Grid view (cards)
- List view
- Map view

**Card Features:**
- Property image
- Price
- Address
- Beds/baths/sqft
- Status badge
- Favorite button
- Quick view

**Acceptance Criteria:**
- [ ] Three view modes
- [ ] View toggle
- [ ] Responsive card design
- [ ] Lazy loading images
- [ ] Infinite scroll or pagination

---

### Story 2.11: Property Detail Page
**Status:** Not Started
**Points:** 8
**Blocked By:** 2.10
**Description:** Comprehensive property detail view.

**Sections:**
- Photo gallery with lightbox
- Property overview
- Features and amenities
- Location map
- Price history (if available)
- Similar properties
- Contact agent form

**Acceptance Criteria:**
- [ ] Photo gallery
- [ ] All property data displayed
- [ ] Interactive map
- [ ] Share functionality
- [ ] Print view
- [ ] Contact form
- [ ] Mobile-optimized

---

### Story 2.12: Favorites System
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.7, 2.10
**Description:** Save and manage favorite properties.

**Features:**
- Heart icon toggle
- Favorites list page
- Add notes to favorites
- Remove from favorites
- Share favorites list

**Acceptance Criteria:**
- [ ] Heart icon on property cards/details
- [ ] Toggle animation
- [ ] Favorites page with list
- [ ] Notes per favorite
- [ ] Requires login (prompt if guest)

---

### Story 2.13: Property Comparison Tool
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.12
**Description:** Side-by-side property comparison.

**Features:**
- Add to compare button
- Comparison tray
- Side-by-side view (2-4 properties)
- Highlight differences
- Print comparison

**Acceptance Criteria:**
- [ ] Add to compare button
- [ ] Comparison tray UI
- [ ] Side-by-side layout
- [ ] Feature comparison table
- [ ] Remove from comparison

---

### Story 2.14: Saved Search Alerts
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.9
**Description:** Save searches and receive alerts.

**Features:**
- Save current search criteria
- Name saved search
- Alert frequency (instant, daily, weekly)
- Edit saved searches
- Email notifications for new matches

**Acceptance Criteria:**
- [ ] Save search button
- [ ] Saved searches list
- [ ] Frequency selection
- [ ] Email alerts working
- [ ] Edit/delete saved searches

---

### Story 2.15: Market Analytics - Anonymous View
**Status:** Not Started
**Points:** 3
**Blocked By:** 2.7
**Description:** Basic market data for anonymous visitors.

**Data:**
- Median home price
- Average days on market
- New listings this month
- Price trend (3-month)

**Acceptance Criteria:**
- [ ] Summary cards
- [ ] Basic chart
- [ ] Data freshness indicator
- [ ] Teaser for more data

---

### Story 2.16: Market Analytics - Lead View
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.15
**Description:** Enhanced market data for registered leads.

**Additional Data:**
- Price per sqft trends
- Inventory levels
- Neighborhood comparisons
- School ratings (if available)

**Acceptance Criteria:**
- [ ] All anonymous data plus enhancements
- [ ] Neighborhood selector
- [ ] Trend charts
- [ ] Data export

---

### Story 2.17: Market Analytics - Active Client View
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.16
**Description:** Full market data for active clients.

**Additional Data:**
- Detailed neighborhood reports
- Investment analysis tools
- Comparable sales data
- Custom report generation

**Acceptance Criteria:**
- [ ] Full data access
- [ ] Report builder
- [ ] Download reports (PDF)
- [ ] Historical data access

---

### Story 2.18: Concierge Directory
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.7
**Description:** Service partner directory for clients.

**Partner Categories:**
- Mortgage lenders
- Home inspectors
- Insurance agents
- Contractors
- Moving companies
- Interior designers
- Landscapers

**Features:**
- Category filtering
- Partner profiles
- Contact information
- Request introduction

**Acceptance Criteria:**
- [ ] Partner list by category
- [ ] Partner detail cards
- [ ] Search functionality
- [ ] Introduction request button

---

### Story 2.19: Service Partner Management
**Status:** Not Started
**Points:** 3
**Blocked By:** 2.18
**Description:** Admin interface for managing service partners.

**Features:**
- Add/edit/remove partners
- Partner categories
- Featured partners
- Referral tracking (future)

**Acceptance Criteria:**
- [ ] Partner CRUD interface
- [ ] Category management
- [ ] Featured flag toggle
- [ ] Partner logo upload

---

### Story 2.20: Service Introduction Requests
**Status:** Not Started
**Points:** 3
**Blocked By:** 2.18
**Description:** Request introductions to service partners.

**Flow:**
1. Client requests introduction
2. Agent notified
3. Agent facilitates introduction
4. Status tracked

**Acceptance Criteria:**
- [ ] Request form
- [ ] Agent notification
- [ ] Status tracking
- [ ] Introduction history

---

## Phase 3: Client Portal Private Features

**Duration:** 4 weeks
**Stories:** 11
**Dependencies:** Phase 2 complete

### Story 3.1: Home Binder - Document Upload
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.7
**Description:** Document storage for homeowners.

**Features:**
- Drag-and-drop upload
- Multiple file support
- Progress indicator
- File preview
- Secure storage (S3)

**File Types:**
- PDF, DOC, DOCX
- Images (JPG, PNG)
- Spreadsheets (XLS, XLSX)

**Acceptance Criteria:**
- [ ] Drag-drop upload zone
- [ ] File type validation
- [ ] Upload progress
- [ ] Preview functionality
- [ ] Secure S3 storage

---

### Story 3.2: Home Binder - Document Organization
**Status:** Not Started
**Points:** 5
**Blocked By:** 3.1
**Description:** Categorize and organize documents.

**Categories:**
- Purchase documents
- Warranties
- Manuals
- Insurance
- Tax documents
- Improvement records
- Utility information

**Features:**
- Category assignment
- Custom categories
- Tags
- Folder structure
- Rename/move documents

**Acceptance Criteria:**
- [ ] Category dropdown
- [ ] Tag input
- [ ] Folder view
- [ ] Drag to reorganize
- [ ] Bulk operations

---

### Story 3.3: Home Binder - Search & Retrieval
**Status:** Not Started
**Points:** 3
**Blocked By:** 3.2
**Description:** Find documents quickly.

**Features:**
- Full-text search
- Filter by category/date/type
- Sort options
- Recent documents
- Download/share

**Acceptance Criteria:**
- [ ] Search bar
- [ ] Filter panel
- [ ] Sort dropdown
- [ ] Download button
- [ ] Share link generation

---

### Story 3.4: Maintenance Tracker - Dashboard
**Status:** Not Started
**Points:** 5
**Blocked By:** 2.7
**Description:** Home maintenance overview.

**Features:**
- Upcoming tasks summary
- Overdue tasks alert
- Quick task completion
- Seasonal overview
- Appliance summary

**Acceptance Criteria:**
- [ ] Dashboard layout
- [ ] Task summary cards
- [ ] Overdue highlighting
- [ ] Quick complete action
- [ ] Navigation to details

---

### Story 3.5: Maintenance Tracker - Seasonal Checklists
**Status:** Not Started
**Points:** 5
**Blocked By:** 3.4
**Description:** Pre-defined seasonal maintenance tasks.

**Seasons:**
- Spring
- Summer
- Fall
- Winter

**Task Examples:**
- Spring: HVAC service, gutter cleaning
- Summer: AC maintenance, pest control
- Fall: Furnace check, weatherstripping
- Winter: Pipe insulation, smoke detector test

**Features:**
- Checklist view
- Mark complete
- Skip option
- Custom tasks
- Reminder settings

**Acceptance Criteria:**
- [ ] Seasonal tabs
- [ ] Task checklists
- [ ] Complete/skip actions
- [ ] Add custom task
- [ ] Reminder configuration

---

### Story 3.6: Maintenance Tracker - Appliance Registry
**Status:** Not Started
**Points:** 5
**Blocked By:** 3.4
**Description:** Track home appliances and warranties.

**Appliance Fields:**
- Name
- Brand/Model
- Serial number
- Purchase date
- Warranty expiration
- Manual (upload)
- Service history

**Features:**
- Appliance list
- Warranty alerts
- Manual storage
- Service log

**Acceptance Criteria:**
- [ ] Appliance CRUD
- [ ] Warranty tracking
- [ ] Manual upload
- [ ] Service history log
- [ ] Expiration alerts

---

### Story 3.7: Maintenance Tracker - Reminders
**Status:** Not Started
**Points:** 3
**Blocked By:** 3.5, 3.6
**Description:** Notification system for maintenance.

**Reminder Types:**
- Task due
- Task overdue
- Warranty expiring
- Seasonal checklist start

**Channels:**
- In-app notification
- Email notification

**Acceptance Criteria:**
- [ ] Reminder scheduling
- [ ] Multiple channels
- [ ] Snooze option
- [ ] Reminder preferences

---

### Story 3.8: Transaction Tracker - Timeline
**Status:** Not Started
**Points:** 8
**Blocked By:** 2.7
**Description:** Visual transaction progress tracker.

**Transaction Types:**
- Buying
- Selling

**Milestone Examples (Buying):**
1. Offer submitted
2. Offer accepted
3. Inspection scheduled
4. Inspection complete
5. Appraisal scheduled
6. Appraisal complete
7. Loan approved
8. Final walkthrough
9. Closing scheduled
10. Closed!

**Features:**
- Visual timeline
- Current stage highlight
- Date tracking
- Notes per milestone
- Document links

**Acceptance Criteria:**
- [ ] Timeline component
- [ ] Milestone cards
- [ ] Current stage indicator
- [ ] Date display
- [ ] Mobile-responsive

---

### Story 3.9: Transaction Tracker - Milestone Management
**Status:** Not Started
**Points:** 5
**Blocked By:** 3.8
**Description:** Agent management of transaction milestones.

**Features:**
- Mark milestone complete
- Update dates
- Add notes
- Notify client
- Custom milestones

**Acceptance Criteria:**
- [ ] Admin view for agent
- [ ] Complete milestone action
- [ ] Date editing
- [ ] Note addition
- [ ] Client notification trigger

---

### Story 3.10: Transaction Tracker - Document Integration
**Status:** Not Started
**Points:** 3
**Blocked By:** 3.8, 3.1
**Description:** Link documents to transaction milestones.

**Features:**
- Attach documents to milestones
- Document preview
- Required document checklist
- Upload from milestone view

**Acceptance Criteria:**
- [ ] Document attachment
- [ ] Required doc indicator
- [ ] Upload from milestone
- [ ] Preview functionality

---

### Story 3.11: Transaction Tracker - Communication Log
**Status:** Not Started
**Points:** 3
**Blocked By:** 3.8
**Description:** Communication history for transaction.

**Features:**
- Log entries
- Entry types (call, email, meeting)
- Timestamps
- Notes
- File attachments

**Acceptance Criteria:**
- [ ] Log entry list
- [ ] Add entry form
- [ ] Type categorization
- [ ] Chronological order

---

## Phase 4: AI Integration & Polish

**Duration:** 4 weeks
**Stories:** 12
**Dependencies:** Phase 3 complete

### Story 4.1: Amazon Bedrock Setup
**Status:** Not Started
**Points:** 5
**Blocked By:** 0.4
**Description:** Configure Amazon Bedrock for AI features.

**Implementation:**
- Bedrock model access
- API integration
- Cost management
- Model selection (Claude, Titan)

**Acceptance Criteria:**
- [ ] Bedrock access configured
- [ ] API wrapper created
- [ ] Model selection logic
- [ ] Cost monitoring

---

### Story 4.2: HuggingFace Integration
**Status:** Not Started
**Points:** 5
**Blocked By:** 0.4
**Description:** HuggingFace models for specialized tasks.

**Use Cases:**
- Sentiment analysis
- Entity extraction
- Text classification

**Acceptance Criteria:**
- [ ] HuggingFace API integration
- [ ] Model selection
- [ ] Response caching
- [ ] Fallback handling

---

### Story 4.3: AI Property Recommendations
**Status:** Not Started
**Points:** 5
**Blocked By:** 4.1, 2.12
**Description:** Personalized property recommendations.

**Features:**
- Based on favorites
- Based on search history
- Based on similar buyers
- Explanation of recommendation

**Acceptance Criteria:**
- [ ] Recommendation algorithm
- [ ] Recommendation display
- [ ] Explanation text
- [ ] Feedback mechanism

---

### Story 4.4: AI Market Insights
**Status:** Not Started
**Points:** 5
**Blocked By:** 4.1, 2.17
**Description:** AI-generated market analysis.

**Features:**
- Natural language summaries
- Trend explanations
- Investment insights
- Neighborhood narratives

**Acceptance Criteria:**
- [ ] Summary generation
- [ ] Insight cards
- [ ] Source citations
- [ ] Refresh capability

---

### Story 4.5: AI Listing Description Generation
**Status:** Not Started
**Points:** 5
**Blocked By:** 4.1
**Description:** AI-generated property descriptions.

**Features:**
- Generate from property data
- Multiple tone options
- Feature highlighting
- Edit and refine

**Acceptance Criteria:**
- [ ] Generate button
- [ ] Tone selection
- [ ] Edit interface
- [ ] Save to listing

---

### Story 4.6: Performance Optimization
**Status:** Not Started
**Points:** 8
**Blocked By:** All prior stories
**Description:** Comprehensive performance audit and optimization.

**Areas:**
- Frontend bundle size
- API response times
- Database query optimization
- Image optimization
- Caching effectiveness

**Targets:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- API < 500ms

**Acceptance Criteria:**
- [ ] Lighthouse scores > 90
- [ ] API metrics within target
- [ ] Load testing passed
- [ ] No memory leaks

---

### Story 4.7: Security Audit
**Status:** Not Started
**Points:** 8
**Blocked By:** All prior stories
**Description:** Security review and hardening.

**Areas:**
- Authentication flows
- Authorization checks
- Data encryption
- Input validation
- Dependency vulnerabilities
- OWASP Top 10

**Acceptance Criteria:**
- [ ] No critical vulnerabilities
- [ ] Penetration test passed
- [ ] Security headers configured
- [ ] Audit logging complete

---

### Story 4.8: Accessibility Audit
**Status:** Not Started
**Points:** 5
**Blocked By:** All UI stories
**Description:** WCAG 2.1 AA compliance.

**Areas:**
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus management
- ARIA attributes

**Acceptance Criteria:**
- [ ] Automated audit passing
- [ ] Manual testing complete
- [ ] Screen reader tested
- [ ] Keyboard-only navigation working

---

### Story 4.9: Mobile Responsiveness
**Status:** Not Started
**Points:** 5
**Blocked By:** All UI stories
**Description:** Mobile experience polish.

**Breakpoints:**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Acceptance Criteria:**
- [ ] All pages responsive
- [ ] Touch targets adequate
- [ ] No horizontal scroll
- [ ] Forms mobile-friendly

---

### Story 4.10: Testing & QA
**Status:** Not Started
**Points:** 8
**Blocked By:** All prior stories
**Description:** Comprehensive testing pass.

**Testing Types:**
- Unit tests (80% coverage)
- Integration tests
- E2E tests (critical paths)
- User acceptance testing

**Acceptance Criteria:**
- [ ] 80% test coverage
- [ ] All E2E tests passing
- [ ] UAT sign-off
- [ ] Bug backlog cleared

---

### Story 4.11: Production Deployment
**Status:** Not Started
**Points:** 5
**Blocked By:** 4.6, 4.7, 4.8, 4.10
**Description:** Deploy to production environment.

**Tasks:**
- Production environment setup
- DNS configuration
- SSL certificates
- Monitoring setup
- Alerting configuration
- Backup verification

**Acceptance Criteria:**
- [ ] Production live
- [ ] DNS propagated
- [ ] SSL working
- [ ] Monitoring active
- [ ] Alerts configured

---

### Story 4.12: Documentation Finalization
**Status:** Not Started
**Points:** 3
**Blocked By:** All prior stories
**Description:** Complete all documentation.

**Documents:**
- API documentation
- User guides
- Admin documentation
- Runbook
- Architecture diagrams

**Acceptance Criteria:**
- [ ] All docs complete
- [ ] Docs reviewed
- [ ] Screenshots current
- [ ] Runbook tested

---

## Phase 5: Multi-Tenant Scale (Future)

**Duration:** TBD
**Stories:** 6
**Dependencies:** Phase 4 complete, post-Yong launch

### Story 5.1: Template Site Tenant Resolution
**Status:** Not Started
**Points:** 8
**Description:** Multi-tenant routing for template tier.

### Story 5.2: Agent Onboarding Flow
**Status:** Not Started
**Points:** 8
**Description:** Self-service agent signup.

### Story 5.3: Self-Service Configuration
**Status:** Not Started
**Points:** 8
**Description:** Agent configuration panel.

### Story 5.4: Billing Integration
**Status:** Not Started
**Points:** 13
**Description:** Stripe billing for subscriptions.

### Story 5.5: Performance Monitoring
**Status:** Not Started
**Points:** 5
**Description:** Multi-tenant performance dashboard.

### Story 5.6: Multi-Tenant Admin Panel
**Status:** Not Started
**Points:** 8
**Description:** Super admin management interface.

---

## Timeline Summary

| Phase | Duration | Stories | Key Deliverables |
|-------|----------|---------|------------------|
| 0: Foundation | 3 weeks | 10 | Infrastructure, Auth, DB |
| 1: Agent Portal | 5 weeks | 18 | Dashboard, CRM, Calendar, AI |
| 2: Marketing + Public | 6 weeks | 20 | Marketing Hub, Property Search |
| 3: Client Private | 4 weeks | 11 | Home Binder, Maintenance, Transactions |
| 4: AI + Polish | 4 weeks | 12 | AI Features, Optimization, Launch |
| 5: Scale | TBD | 6 | Multi-Tenant Features |

**Total for Yong Launch:** 22 weeks, 71 stories

---

## Dependencies Diagram

```
Phase 0 (Foundation)
├── 0.1 Project Structure
├── 0.2 Documentation
├── 0.3 Database Schema ─────────────────┐
├── 0.4 AWS Infrastructure ──────────────┼───┐
│   └── 0.5 Cognito ─────────────────────┼───┼───┐
│       └── 0.6 NextAuth ────────────────┼───┼───┼───┐
├── 0.7 CI/CD ───────────────────────────┘   │   │   │
├── 0.8 Local Dev ◄── 0.3                    │   │   │
├── 0.9 Logging ◄── 0.4                      │   │   │
└── 0.10 API Foundation ◄── 0.3, 0.6         │   │   │
                                             │   │   │
Phase 1 (Agent Portal) ◄─────────────────────┴───┴───┘
├── 1.1 Layout ◄── 0.6, 0.10
├── 1.2-1.4 Dashboard Widgets ◄── 1.1
├── 1.5-1.8 Analytics ◄── 1.1
├── 1.9-1.14 CRM ◄── 1.1
├── 1.15 Calendar ◄── 1.1
└── 1.16-1.18 AI Assistant ◄── 0.4

Phase 2 (Marketing + Public) ◄── Phase 1
├── 2.1-2.6 Marketing Hub ◄── 1.1
└── 2.7-2.20 Client Portal ◄── 0.6

Phase 3 (Client Private) ◄── Phase 2
├── 3.1-3.3 Home Binder ◄── 2.7
├── 3.4-3.7 Maintenance ◄── 2.7
└── 3.8-3.11 Transactions ◄── 2.7

Phase 4 (AI + Polish) ◄── Phase 3
├── 4.1-4.5 AI Features
├── 4.6-4.9 Optimization
├── 4.10 Testing
├── 4.11 Deployment
└── 4.12 Documentation
```

---

## Success Metrics

### Phase 0 Exit Criteria
- [ ] All AWS services provisioned
- [ ] Authentication working end-to-end
- [ ] Database schema migrated
- [ ] CI/CD deploying to staging
- [ ] Local dev environment documented

### Phase 1 Exit Criteria
- [ ] Agent can login and view dashboard
- [ ] CRM fully functional
- [ ] Calendar syncing with Google
- [ ] AI assistant responding

### Phase 2 Exit Criteria
- [ ] Marketing request workflow complete
- [ ] Property search working with OpenSearch
- [ ] Favorites and comparison tools working
- [ ] Market analytics displaying

### Phase 3 Exit Criteria
- [ ] Home Binder documents uploading
- [ ] Maintenance tracker functional
- [ ] Transaction tracker displaying milestones

### Phase 4 Exit Criteria
- [ ] AI recommendations working
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Production deployed

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-04 | 1.0 | Initial integration of Yong Choi spec | Gideon |
