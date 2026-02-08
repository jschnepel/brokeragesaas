# VOW (Virtual Office Website) Compliance Documentation

## Overview

A Virtual Office Website (VOW) is an MLS Participant's password-protected website that provides real estate brokerage services to consumers who have established a broker-consumer relationship. This document outlines all compliance requirements for VOW features in the Yong Choi Real Estate Portal.

**Regulatory Authority:** National Association of Realtors (NAR)
**Local MLS:** ARMLS (Arizona Regional Multiple Listing Service)
**Last Updated:** February 2026
**Next Review:** Quarterly

---

## Table of Contents

1. [VOW vs IDX Comparison](#vow-vs-idx-comparison)
2. [Consumer Registration Requirements](#consumer-registration-requirements)
3. [Terms of Use Requirements](#terms-of-use-requirements)
4. [Data Access & Restrictions](#data-access--restrictions)
5. [Broker-Consumer Relationship](#broker-consumer-relationship)
6. [Technical Requirements](#technical-requirements)
7. [Compliance Checklist](#compliance-checklist)
8. [Implementation Guide](#implementation-guide)

---

## VOW vs IDX Comparison

### Key Differences

| Aspect | IDX | VOW |
|--------|-----|-----|
| **Consumer Access** | Public (no login required for basic) | **Login required** |
| **Registration** | Optional | **Mandatory** |
| **Terms Acceptance** | Recommended | **Required with specific language** |
| **Data Depth** | Standard listing data | Enhanced data + analytics |
| **Relationship** | None required | **Broker-consumer relationship** |
| **Use Restrictions** | Standard | **Strict non-commercial** |
| **MLS Notification** | Required | **Required** |
| **Audit Requirements** | Standard | **Enhanced** |

### When VOW Rules Apply

VOW rules apply to the Yong Choi Portal when:
- User is registered (email verified)
- User has accepted VOW Terms of Use
- User accesses features beyond basic IDX:
  - Saved searches
  - Saved favorites
  - Search alerts
  - Market analytics
  - Price history
  - Home Binder
  - Transaction Tracker

### Hybrid Model (Our Implementation)

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC ACCESS                        │
│                    (IDX Rules Apply)                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  - Property Search                              │   │
│  │  - Listing Details (public fields)              │   │
│  │  - Photos                                       │   │
│  │  - Contact Agent                                │   │
│  │  - All IDX attribution required                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Registration + ToU Acceptance
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   REGISTERED USER                       │
│               (IDX + VOW Rules Apply)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  - All IDX features PLUS:                       │   │
│  │  - Saved Favorites                              │   │
│  │  - Saved Searches                               │   │
│  │  - Email Alerts                                 │   │
│  │  - Limited Price History                        │   │
│  │  - VOW Terms acceptance required                │   │
│  │  - IDX attribution still required               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Agent Promotion to Active Client
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    ACTIVE CLIENT                        │
│               (Full VOW Rules Apply)                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  - All Registered features PLUS:                │   │
│  │  - Full Price History                           │   │
│  │  - Detailed Market Analytics                    │   │
│  │  - Comparative Market Analysis                  │   │
│  │  - Home Binder                                  │   │
│  │  - Maintenance Tracker                          │   │
│  │  - Transaction Tracker                          │   │
│  │  - Concierge Directory (full access)            │   │
│  │  - Direct Agent Communication                   │   │
│  │  - Broker-consumer relationship established     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Consumer Registration Requirements

### Mandatory Registration Fields

```typescript
interface VOWRegistration {
  // Required fields
  email: string;              // Must be verified
  firstName: string;          // Legal name
  lastName: string;           // Legal name

  // Required acknowledgments (checkboxes)
  termsAccepted: boolean;     // Must be true
  termsAcceptedAt: Date;      // Timestamp
  privacyAccepted: boolean;   // Must be true
  privacyAcceptedAt: Date;    // Timestamp
  vowTermsAccepted: boolean;  // Must be true
  vowTermsAcceptedAt: Date;   // Timestamp

  // IP and audit data
  registrationIp: string;
  userAgent: string;
  registrationTimestamp: Date;
}
```

### Registration Flow

```
1. User clicks "Create Account" or accesses VOW feature
                    │
                    ▼
2. Registration form displayed with required fields
   - Email (required, must verify)
   - Password (required, min 8 chars)
   - First Name (required)
   - Last Name (required)
                    │
                    ▼
3. Terms of Use presented (MUST read or scroll)
   - General Terms of Use
   - VOW Terms of Use (specific language required)
   - Privacy Policy
                    │
                    ▼
4. User must affirmatively check boxes:
   □ I have read and agree to the Terms of Use
   □ I have read and agree to the VOW Terms of Use
   □ I have read and agree to the Privacy Policy
                    │
                    ▼
5. Email verification sent
                    │
                    ▼
6. User clicks verification link
                    │
                    ▼
7. Account activated - VOW features enabled
```

### Email Verification Requirements

```typescript
// Email verification is REQUIRED for VOW access
interface EmailVerification {
  // Verification email must include:
  verificationLink: string;     // Unique, time-limited
  expiresAt: Date;              // 24-48 hours recommended

  // Verification record:
  verifiedAt: Date | null;
  verificationIp: string;
  verificationAttempts: number; // Limit to prevent abuse
}

// VOW features BLOCKED until email verified
function canAccessVOWFeatures(user: User): boolean {
  return user.emailVerified && user.vowTermsAccepted;
}
```

---

## Terms of Use Requirements

### Required VOW Terms Language

The following terms MUST be included in the VOW Terms of Use. This is not optional language.

```
VOW TERMS OF USE

By registering for and using this website, you acknowledge and agree
to the following:

1. BROKER-CONSUMER RELATIONSHIP
   You are establishing a lawful broker-consumer relationship with
   Yong Choi, licensed real estate broker with Russ Lyon Sotheby's
   International Realty, for the purpose of receiving real estate
   brokerage services.

2. PERSONAL, NON-COMMERCIAL USE
   The information provided through this website is intended solely
   for your personal, non-commercial use. You may not:

   a) Copy, redistribute, or retransmit any of the information
      provided, except in connection with your consideration of
      the purchase or sale of a property;

   b) Use the information for any purpose other than to identify
      and inquire about properties you may be interested in
      purchasing or selling;

   c) Use the information for any commercial purpose, including
      but not limited to resale, licensing, or providing
      information to third parties;

   d) Use automated means (including but not limited to scripts,
      bots, or scrapers) to access or collect information from
      this website.

3. BONA FIDE INTEREST
   You represent that you have a bona fide interest in the
   purchase, sale, or lease of real estate of the type being
   offered through the site.

4. DATA ACCURACY
   While we strive to provide accurate information, all data
   is provided "as is" without warranty. You should independently
   verify all information before making any real estate decisions.

5. MLS DATA
   Some or all of the data on this website is provided by the
   Arizona Regional Multiple Listing Service (ARMLS). This data
   is subject to the rules and regulations of ARMLS and may not
   be reproduced or redistributed.

6. REVOCATION
   Your access to VOW features may be revoked at any time if
   you violate these terms or if your broker-consumer relationship
   is terminated.

By clicking "I Accept" or by using the VOW features of this website,
you acknowledge that you have read, understood, and agree to be
bound by these terms.

Last Updated: [Date]
```

### Terms Acceptance Recording

```typescript
// REQUIRED: Record all terms acceptances for audit
interface TermsAcceptance {
  id: string;
  userId: string;

  // Which terms were accepted
  termsType: 'general' | 'vow' | 'privacy';
  termsVersion: string;        // Version number of terms
  termsContent: string;        // Full text at time of acceptance

  // Acceptance details
  acceptedAt: Date;
  acceptanceMethod: 'checkbox' | 'click' | 'scroll_and_accept';

  // Audit trail
  ipAddress: string;
  userAgent: string;
  sessionId: string;

  // Retention
  retentionPeriod: '7_years';  // Minimum retention
}

// Store in database - do not delete
```

### Terms Version Management

```typescript
// When terms are updated:
interface TermsUpdate {
  previousVersion: string;
  newVersion: string;
  updatedAt: Date;
  changesSummary: string;

  // Action required
  requireReacceptance: boolean;  // If material changes
  graceperiodDays: number;       // Time to accept new terms
}

// If requireReacceptance = true:
// - Display new terms on next login
// - Block VOW features until accepted
// - Log new acceptance with new version
```

---

## Data Access & Restrictions

### VOW Data Categories

#### Category A: Enhanced Display Data (All VOW Users)
```
Data accessible to all registered VOW users:

✓ All IDX data PLUS:
✓ Price change history (limited)
✓ Days on market history
✓ Basic market trends
✓ Saved search results
✓ Favorited properties
✓ Search alerts
```

#### Category B: Active Client Data (Promoted Clients Only)
```
Data accessible only to Active Clients:

✓ All Category A data PLUS:
✓ Full price history
✓ Detailed market analytics
✓ Comparative market analysis
✓ Investment calculators
✓ Neighborhood insights
✓ School ratings
✓ Home Binder documents
✓ Transaction tracking
✓ Direct agent messaging
```

#### Category C: Restricted Data (Never Display)
```
Data that must NEVER be displayed via VOW:

✗ Seller's private contact information
✗ Private remarks (agent-to-agent notes)
✗ Showing instructions
✗ Lockbox codes
✗ Offer details or negotiation history
✗ Other agent's commission
✗ Buyer's financial details
✗ Credit information
```

### Data Usage Restrictions

```typescript
// Enforce data usage restrictions
interface DataUsagePolicy {
  // PROHIBITED uses of VOW data
  prohibited: [
    'resale_to_third_parties',
    'commercial_products',
    'lead_generation_lists',
    'automated_scraping',
    'bulk_download',
    'data_aggregation_services',
    'appraisal_or_valuation',
    'marketing_to_listing_agents'
  ];

  // PERMITTED uses of VOW data
  permitted: [
    'personal_property_search',
    'purchase_consideration',
    'sale_consideration',
    'personal_market_research',
    'communication_with_broker'
  ];
}
```

### Search & Alert Restrictions

```typescript
// VOW search and alert limitations
interface VOWSearchLimits {
  // Maximum saved searches per user
  maxSavedSearches: 25;

  // Maximum favorites per user
  maxFavorites: 100;

  // Alert frequency options
  alertFrequencies: ['instant', 'daily', 'weekly'];

  // Maximum alerts per user
  maxActiveAlerts: 10;

  // Search result limits
  maxResultsPerSearch: 500;

  // Export restrictions
  exportAllowed: false;        // Cannot bulk export
  printAllowed: true;          // Can print individual listings
  shareAllowed: true;          // Can share individual listings
}
```

---

## Broker-Consumer Relationship

### Establishing the Relationship

```typescript
// Broker-consumer relationship is established when:
interface BrokerConsumerRelationship {
  // Required elements
  consumerRegistered: boolean;        // Must be true
  emailVerified: boolean;              // Must be true
  vowTermsAccepted: boolean;           // Must be true

  // Relationship details
  establishedAt: Date;
  brokerName: 'Yong Choi';
  brokerageName: 'Russ Lyon Sotheby\'s International Realty';
  licenseNumber: string;

  // Relationship type
  relationshipType: 'inquiry' | 'active_buyer' | 'active_seller' | 'past_client';

  // Status
  isActive: boolean;
  terminatedAt: Date | null;
  terminationReason: string | null;
}
```

### Active Client Promotion

```
Registered Lead → Active Client Promotion Process:

1. Yong identifies lead as genuine client opportunity
                    │
                    ▼
2. Yong initiates promotion in CRM
   - Reviews lead's registration data
   - Confirms identity (optional verification call)
   - Documents relationship establishment
                    │
                    ▼
3. System updates user role: 'client_lead' → 'client_active'
                    │
                    ▼
4. Client receives notification email:
   - Welcome as Active Client
   - New features now available
   - Direct contact information
   - Reminder of VOW terms
                    │
                    ▼
5. Audit log entry created:
   - User ID
   - Promoted by (Yong)
   - Promotion timestamp
   - Previous role
   - New role
                    │
                    ▼
6. Active Client features unlocked:
   - Home Binder
   - Maintenance Tracker
   - Transaction Tracker
   - Full Market Analytics
   - Direct Messaging
```

### Relationship Termination

```typescript
// When broker-consumer relationship ends
interface RelationshipTermination {
  userId: string;
  terminatedAt: Date;
  terminatedBy: 'broker' | 'consumer' | 'system';

  reason:
    | 'consumer_request'
    | 'transaction_complete'
    | 'inactivity'           // After X months no login
    | 'terms_violation'
    | 'moved_to_other_broker';

  // Data handling
  dataRetention: {
    transactionDocs: '7_years';      // Legal requirement
    searchHistory: 'delete_after_30_days';
    favorites: 'delete_after_30_days';
    homeBinder: 'preserve_indefinitely';  // Client's documents
  };

  // Access changes
  accessLevel: 'downgrade_to_lead' | 'full_removal';
}
```

---

## Technical Requirements

### Authentication & Authorization

```typescript
// VOW access control
interface VOWAccessControl {
  // Authentication
  authentication: {
    method: 'email_password' | 'google_oauth';
    mfaRequired: false;           // Optional but recommended
    sessionTimeout: 86400000;     // 24 hours
    rememberMeMaxAge: 2592000000; // 30 days
  };

  // Authorization middleware
  authorization: {
    checkEmailVerified: true;
    checkVOWTermsAccepted: true;
    checkAccountActive: true;
    checkNotTerminated: true;
  };
}

// Middleware implementation
function vowAccessMiddleware(req, res, next) {
  const user = req.user;

  if (!user) {
    return res.redirect('/login?redirect=' + req.originalUrl);
  }

  if (!user.emailVerified) {
    return res.redirect('/verify-email');
  }

  if (!user.vowTermsAccepted) {
    return res.redirect('/accept-vow-terms?redirect=' + req.originalUrl);
  }

  if (user.accountStatus !== 'active') {
    return res.render('account-inactive');
  }

  next();
}
```

### Audit Logging Requirements

```typescript
// REQUIRED: Comprehensive audit logging for VOW
interface VOWAuditLog {
  // Event identification
  id: string;
  timestamp: Date;
  eventType: VOWEventType;

  // User context
  userId: string;
  userEmail: string;
  userTier: 'lead' | 'active_client';

  // Session context
  sessionId: string;
  ipAddress: string;
  userAgent: string;

  // Event details
  action: string;
  resourceType: string;
  resourceId: string;

  // Data accessed (for compliance audits)
  dataCategories: string[];

  // Retention
  retainUntil: Date;  // Minimum 2 years
}

type VOWEventType =
  | 'registration'
  | 'terms_acceptance'
  | 'email_verification'
  | 'login'
  | 'logout'
  | 'search_performed'
  | 'listing_viewed'
  | 'favorite_added'
  | 'favorite_removed'
  | 'search_saved'
  | 'alert_created'
  | 'alert_modified'
  | 'document_uploaded'
  | 'document_downloaded'
  | 'analytics_viewed'
  | 'role_changed'
  | 'account_terminated';
```

### MLS Notification

```typescript
// REQUIRED: Notify MLS of VOW operation
interface MLSNotification {
  // Initial notification (before launch)
  initialNotification: {
    sentTo: 'armls_compliance@armls.com';
    sentAt: Date;
    content: {
      brokerName: string;
      brokerageName: string;
      licenseNumber: string;
      vowUrl: string;
      contactEmail: string;
      contactPhone: string;
      technicalContact: string;
    };
    acknowledgmentReceived: boolean;
    acknowledgmentDate: Date;
  };

  // Provide MLS audit access
  auditAccess: {
    testAccountProvided: boolean;
    testAccountEmail: string;
    auditUrlsProvided: string[];
    lastAuditDate: Date;
    auditResult: 'pass' | 'fail' | 'pending';
    remediationRequired: string[];
  };
}
```

### Data Security Requirements

```typescript
// VOW data security requirements
interface VOWSecurityRequirements {
  // Encryption
  encryption: {
    inTransit: 'TLS_1.3';
    atRest: 'AES_256';
    databaseFields: ['ssn', 'financial_data'];  // If stored
  };

  // Access controls
  accessControls: {
    roleBasedAccess: true;
    attributeBasedAccess: true;  // For data categories
    auditLogging: true;
    sessionManagement: true;
  };

  // Data handling
  dataHandling: {
    noClientSideCaching: true;  // For sensitive data
    secureHeaders: true;
    csrfProtection: true;
    xssProtection: true;
  };

  // Credential management
  credentials: {
    storage: 'AWS_Secrets_Manager';
    rotation: 'quarterly';
    neverInCode: true;
    neverInEnvFiles: true;
  };
}
```

---

## Compliance Checklist

### Pre-Launch VOW Checklist

#### Registration & Terms
- [ ] Registration form includes all required fields
- [ ] Email verification implemented and required
- [ ] VOW Terms of Use include all required language
- [ ] Terms acceptance is affirmative (checkbox, not pre-checked)
- [ ] Terms version is tracked
- [ ] Terms acceptance is logged with timestamp, IP, user agent
- [ ] Privacy Policy covers VOW data handling
- [ ] Re-acceptance flow exists for updated terms

#### Data Access Controls
- [ ] Anonymous users cannot access VOW features
- [ ] Unverified emails cannot access VOW features
- [ ] Users who haven't accepted VOW terms are blocked
- [ ] Data categories properly restricted by user tier
- [ ] Private/restricted data never displayed
- [ ] Search and alert limits enforced
- [ ] Bulk export blocked

#### Broker-Consumer Relationship
- [ ] Relationship establishment documented in system
- [ ] Active Client promotion requires agent action
- [ ] Relationship termination process exists
- [ ] Data retention follows policy on termination

#### Technical & Security
- [ ] Audit logging captures all VOW events
- [ ] Logs retained for minimum 2 years
- [ ] TLS 1.3 enforced
- [ ] Database encryption enabled
- [ ] CSRF protection active
- [ ] Session management secure
- [ ] API credentials in Secrets Manager

#### MLS Notification
- [ ] Initial VOW notification sent to ARMLS
- [ ] Acknowledgment received and documented
- [ ] Test account provided for MLS audit
- [ ] Audit URLs documented

### Ongoing VOW Compliance

#### Daily
- [ ] Verify registration and verification flows working
- [ ] Check audit logs for anomalies
- [ ] Monitor for terms violation indicators

#### Weekly
- [ ] Review new registrations for bots/abuse
- [ ] Sample audit log entries for completeness
- [ ] Check data access patterns for anomalies

#### Monthly
- [ ] Full security scan
- [ ] Review and respond to any MLS audit requests
- [ ] Update terms if needed (with re-acceptance)

#### Quarterly
- [ ] Review NAR/ARMLS VOW policy updates
- [ ] Rotate API credentials
- [ ] Full compliance audit
- [ ] Update documentation

---

## Implementation Guide

### Database Schema

```sql
-- VOW-specific tables

-- User VOW status
CREATE TABLE user_vow_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Verification status
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    email_verification_ip VARCHAR(45),

    -- Terms acceptance
    general_terms_accepted BOOLEAN DEFAULT FALSE,
    general_terms_version VARCHAR(20),
    general_terms_accepted_at TIMESTAMP,

    vow_terms_accepted BOOLEAN DEFAULT FALSE,
    vow_terms_version VARCHAR(20),
    vow_terms_accepted_at TIMESTAMP,

    privacy_terms_accepted BOOLEAN DEFAULT FALSE,
    privacy_terms_version VARCHAR(20),
    privacy_terms_accepted_at TIMESTAMP,

    -- Broker-consumer relationship
    relationship_established BOOLEAN DEFAULT FALSE,
    relationship_established_at TIMESTAMP,
    relationship_type VARCHAR(50),
    promoted_to_active_at TIMESTAMP,
    promoted_by UUID REFERENCES users(id),

    -- Termination
    is_terminated BOOLEAN DEFAULT FALSE,
    terminated_at TIMESTAMP,
    terminated_by UUID,
    termination_reason VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Terms acceptance audit trail
CREATE TABLE terms_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    terms_type VARCHAR(50) NOT NULL,  -- 'general', 'vow', 'privacy'
    terms_version VARCHAR(20) NOT NULL,
    terms_content_hash VARCHAR(64) NOT NULL,  -- SHA-256 of content

    accepted_at TIMESTAMP NOT NULL,
    acceptance_method VARCHAR(50) NOT NULL,

    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    session_id VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW()
);

-- VOW audit log
CREATE TABLE vow_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_tier VARCHAR(50),

    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,

    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),

    data_categories TEXT[],
    additional_data JSONB,

    created_at TIMESTAMP DEFAULT NOW(),
    retain_until TIMESTAMP NOT NULL  -- Set to created_at + 2 years
);

-- Create indexes for audit queries
CREATE INDEX idx_vow_audit_user_id ON vow_audit_log(user_id);
CREATE INDEX idx_vow_audit_event_type ON vow_audit_log(event_type);
CREATE INDEX idx_vow_audit_created_at ON vow_audit_log(created_at);
CREATE INDEX idx_vow_audit_retain_until ON vow_audit_log(retain_until);

-- Create index for terms lookups
CREATE INDEX idx_terms_user_type ON terms_acceptances(user_id, terms_type);
```

### API Endpoints

```typescript
// VOW-specific API endpoints

// Registration
POST   /api/auth/register           // Create account
POST   /api/auth/verify-email       // Verify email token
POST   /api/auth/resend-verification // Resend verification

// Terms
GET    /api/terms/:type             // Get current terms
POST   /api/terms/:type/accept      // Accept terms
GET    /api/terms/status            // Get user's acceptance status

// VOW Features (require authentication + VOW terms)
GET    /api/vow/favorites           // Get user's favorites
POST   /api/vow/favorites           // Add favorite
DELETE /api/vow/favorites/:id       // Remove favorite

GET    /api/vow/searches            // Get saved searches
POST   /api/vow/searches            // Create saved search
PUT    /api/vow/searches/:id        // Update saved search
DELETE /api/vow/searches/:id        // Delete saved search

GET    /api/vow/alerts              // Get search alerts
POST   /api/vow/alerts              // Create alert
PUT    /api/vow/alerts/:id          // Update alert
DELETE /api/vow/alerts/:id          // Delete alert

// Active Client Only (require active_client role)
GET    /api/client/home-binder      // Get home binder docs
POST   /api/client/home-binder      // Upload document
GET    /api/client/maintenance      // Get maintenance tasks
GET    /api/client/transaction      // Get transaction status
GET    /api/client/analytics        // Get full analytics
```

### Middleware Stack

```typescript
// VOW middleware stack

// 1. Authentication check
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// 2. Email verification check
const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      error: 'Email verification required',
      action: 'verify_email'
    });
  }
  next();
};

// 3. VOW terms acceptance check
const requireVOWTerms = async (req, res, next) => {
  const vowStatus = await getVOWStatus(req.user.id);

  if (!vowStatus.vowTermsAccepted) {
    return res.status(403).json({
      error: 'VOW Terms acceptance required',
      action: 'accept_vow_terms',
      termsUrl: '/api/terms/vow'
    });
  }
  next();
};

// 4. Active client check (for premium features)
const requireActiveClient = (req, res, next) => {
  if (req.user.role !== 'client_active') {
    return res.status(403).json({
      error: 'Active client status required',
      message: 'Please contact your agent for access'
    });
  }
  next();
};

// 5. Audit logging
const auditLog = (eventType) => async (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    await logVOWEvent({
      eventType,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userTier: req.user?.role,
      sessionId: req.sessionID,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: `${req.method} ${req.originalUrl}`,
      resourceType: req.params.resource,
      resourceId: req.params.id,
      responseTime: Date.now() - startTime,
      statusCode: res.statusCode
    });
  });

  next();
};

// Combined middleware for VOW routes
const vowMiddleware = [
  requireAuth,
  requireVerifiedEmail,
  requireVOWTerms,
  auditLog('vow_feature_access')
];

// Combined middleware for Active Client routes
const activeClientMiddleware = [
  ...vowMiddleware,
  requireActiveClient
];
```

---

## Resources

### Official Documentation
- [NAR VOW Policy](https://www.nar.realtor/handbook-on-multiple-listing-policy/virtual-office-websites-policy-governing-use-of-mls-data-in-connection-with-internet-brokerage)
- [ARMLS Rules & Regulations](https://armls.com/rules)
- [NAR Model VOW Rules](https://www.nar.realtor/about-nar/policies/mls-vow-policy)

### Internal Documentation
- [IDX Compliance](./idx-compliance.md)
- [ARMLS Requirements](./armls-requirements.md)
- [Data Privacy - CCPA](./data-privacy-ccpa.md)

### Contacts
- **ARMLS VOW Compliance:** compliance@armls.com
- **ARMLS Technical Support:** tech@armls.com
- **NAR VOW Questions:** vow@nar.realtor

---

*Document Version: 1.0*
*Created: February 2026*
*Owner: Development Team*
*Review Cycle: Quarterly*
