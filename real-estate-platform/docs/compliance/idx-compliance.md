# IDX (Internet Data Exchange) Compliance Documentation

## Overview

IDX is a NAR-mandated Internet policy allowing MLS Participants to electronically display MLS listings on their websites. This document outlines all compliance requirements for the Yong Choi Real Estate Portal.

**Regulatory Authority:** National Association of Realtors (NAR)
**Local MLS:** ARMLS (Arizona Regional Multiple Listing Service)
**Last Updated:** February 2026
**Next Review:** Quarterly

---

## Table of Contents

1. [Core IDX Requirements](#core-idx-requirements)
2. [Data Display Rules](#data-display-rules)
3. [Attribution Requirements](#attribution-requirements)
4. [Data Refresh Requirements](#data-refresh-requirements)
5. [User Access Tiers](#user-access-tiers)
6. [Prohibited Actions](#prohibited-actions)
7. [Technical Implementation](#technical-implementation)
8. [Compliance Checklist](#compliance-checklist)
9. [2026 Policy Updates](#2026-policy-updates)

---

## Core IDX Requirements

### Definition
IDX allows real estate brokers to display listings from other brokers in the MLS on their websites, creating a comprehensive property search experience for consumers.

### Eligibility
- Must be an MLS Participant (broker) or have authorization from one
- Must notify MLS of intention to display IDX data
- Must provide MLS access for compliance monitoring
- Must maintain broker-consumer relationship establishment

### Legal Framework
```
NAR IDX Policy → State MLS Rules → ARMLS Specific Rules
```

All three levels must be satisfied for compliance.

---

## Data Display Rules

### Required Elements on Every Listing

| Element | Requirement | Location |
|---------|-------------|----------|
| Listing Brokerage Name | **MANDATORY** | Prominent, conspicuous |
| Listing Agent Name | **MANDATORY** | With brokerage |
| Contact Information | **MANDATORY** | Email OR phone (minimum) |
| Last Updated Timestamp | **MANDATORY** | Visible on listing |
| MLS Attribution | **MANDATORY** | Footer or listing card |
| Broker Reciprocity Notice | **MANDATORY** | Footer or disclaimer |

### Display Standards

#### Font & Visibility Requirements
```
✓ Attribution text must be:
  - Same size or larger than body text
  - Sufficient color contrast (WCAG AA minimum: 4.5:1)
  - Not hidden, collapsed, or behind interactions
  - Not replaced by displaying broker's branding

✗ Attribution text must NOT be:
  - Smaller than 12px font size
  - Light gray on white background
  - Hidden in expandable sections
  - Requiring scroll to view
```

#### Example Compliant Display
```
┌─────────────────────────────────────────────────┐
│  [Property Photo]                               │
│                                                 │
│  123 Main Street, Phoenix, AZ 85001             │
│  $485,000 | 4 bed | 3 bath | 2,450 sqft         │
│                                                 │
├─────────────────────────────────────────────────┤
│  LISTING INFORMATION                            │
│  ─────────────────                              │
│  Brokerage: ABC Realty Partners                 │
│  Agent: Jane Smith                              │
│  Contact: (602) 555-0123 | jane@abcrealty.com   │
│                                                 │
│  Last Updated: Feb 4, 2026 2:30 PM MST          │
│  Data Source: ARMLS                             │
├─────────────────────────────────────────────────┤
│  Broker Reciprocity: Listing data provided      │
│  under ARMLS IDX rules. Information believed    │
│  accurate but not guaranteed.                   │
└─────────────────────────────────────────────────┘
```

### Data Fields by Access Level

| Data Field | Anonymous | Lead | Active Client |
|------------|-----------|------|---------------|
| Address | ✅ | ✅ | ✅ |
| Price | ✅ | ✅ | ✅ |
| Beds/Baths/Sqft | ✅ | ✅ | ✅ |
| Property Description | ✅ | ✅ | ✅ |
| Photos | ✅ | ✅ | ✅ |
| Days on Market | ✅ | ✅ | ✅ |
| Listing Agent/Broker | ✅ | ✅ | ✅ |
| Price History | ❌ | Limited | ✅ |
| Tax Records | ❌ | ❌ | ✅ |
| Private Remarks | ❌ | ❌ | ❌ |
| Showing Instructions | ❌ | ❌ | ❌ |
| Seller Contact Info | ❌ | ❌ | ❌ |

**Note:** Private Remarks and Showing Instructions are NEVER displayed via IDX.

---

## Attribution Requirements

### Mandatory Attribution Components

#### 1. Listing Brokerage Name
```html
<!-- REQUIRED: Listing brokerage prominently displayed -->
<div class="listing-attribution">
  <span class="brokerage-label">Listing Brokerage:</span>
  <span class="brokerage-name">{ListOfficeName}</span>
</div>
```

#### 2. Listing Agent Name
```html
<!-- REQUIRED: Agent name displayed -->
<div class="listing-agent">
  <span class="agent-label">Listing Agent:</span>
  <span class="agent-name">{ListAgentFullName}</span>
</div>
```

#### 3. Contact Information
```html
<!-- REQUIRED: At least one contact method -->
<div class="listing-contact">
  <span class="phone">{ListAgentDirectPhone}</span>
  <span class="email">{ListAgentEmail}</span>
</div>
```

#### 4. MLS Source Attribution
```html
<!-- REQUIRED: MLS source attribution -->
<div class="mls-attribution">
  <img src="/images/armls-logo.png" alt="ARMLS" height="24" />
  <span>Data provided by ARMLS</span>
</div>
```

#### 5. Last Updated Timestamp
```html
<!-- REQUIRED: Refresh timestamp -->
<div class="last-updated">
  Last Updated: {ModificationTimestamp}
</div>
```

#### 6. Broker Reciprocity Notice
```html
<!-- REQUIRED: Legal disclaimer -->
<div class="broker-reciprocity">
  <p>
    Broker Reciprocity: Listing information is provided under
    Internet Data Exchange (IDX) rules. The data relating to
    real estate for sale on this web site comes in part from
    the Arizona Regional Multiple Listing Service. Real estate
    listings held by brokerage firms other than {YourBrokerageName}
    are marked with the ARMLS logo. All information is believed
    accurate but not guaranteed and should be independently verified.
  </p>
</div>
```

### Attribution Placement Rules

| Page Type | Attribution Location |
|-----------|---------------------|
| Search Results List | On each listing card |
| Property Detail Page | Prominent section above fold |
| Map View | In listing popup/tooltip |
| Print View | On every printed page |
| Email/Share | Included in shared content |
| PDF Export | On every page |

---

## Data Refresh Requirements

### Minimum Refresh Intervals

| Update Type | Minimum Frequency | Recommended | Our Implementation |
|-------------|-------------------|-------------|-------------------|
| Full Sync | 12 hours | 6 hours | 6 hours |
| Delta/Incremental | 4 hours | 1 hour | 2 hours |
| Status Changes | Real-time (if available) | 15 min | 30 min |
| Photo Updates | 24 hours | 12 hours | 12 hours |

### Implementation Requirements

```typescript
// Required: Sync job configuration
interface SyncConfiguration {
  fullSyncInterval: 21600000;    // 6 hours in ms
  deltaSyncInterval: 7200000;     // 2 hours in ms
  statusCheckInterval: 1800000;   // 30 minutes in ms
  photoSyncInterval: 43200000;    // 12 hours in ms
}

// Required: Track last sync timestamp
interface SyncMetadata {
  lastFullSync: Date;
  lastDeltaSync: Date;
  lastStatusCheck: Date;
  lastPhotoSync: Date;
  recordsUpdated: number;
  syncDuration: number;
}
```

### Stale Data Handling

```
If data is older than 12 hours:
  1. Display warning banner on listings
  2. Log compliance alert
  3. Trigger emergency sync
  4. Notify admin
```

---

## User Access Tiers

### Tier 1: Anonymous Visitors

**Access Level:** Public IDX display

**Allowed:**
- Property search with basic filters
- View listing details (public fields)
- View photos
- See days on market
- Contact listing agent

**Not Allowed:**
- Save favorites
- Create search alerts
- Access price history
- View detailed analytics

**Compliance Notes:**
- All IDX attribution required
- No registration wall for basic viewing
- Cannot require login to see listing details

### Tier 2: Registered Leads

**Access Level:** Enhanced IDX display

**Allowed:**
- All Tier 1 features PLUS:
- Save favorite properties
- Create saved searches
- Receive search alerts (email)
- Limited price history
- Limited market analytics

**Required for Registration:**
- Email verification
- Acceptance of Terms of Use
- Privacy policy acknowledgment

**Compliance Notes:**
- Still subject to IDX attribution rules
- Cannot use registration to bypass attribution
- Must honor unsubscribe requests within 10 days

### Tier 3: Active Clients

**Access Level:** Full IDX + VOW features

**Allowed:**
- All Tier 2 features PLUS:
- Full price history
- Detailed market analytics
- Comparative market analysis
- Investment analysis tools
- Home Binder access
- Transaction tracking

**Required:**
- Broker-consumer relationship established
- VOW Terms of Use accepted
- Additional privacy consent

**Compliance Notes:**
- Additional VOW compliance applies (see vow-compliance.md)
- Still requires IDX attribution on listings
- Must maintain audit logs

---

## Prohibited Actions

### Data Usage Restrictions

```
❌ PROHIBITED:
  - Using IDX data for purposes other than display
  - Selling or licensing IDX data to third parties
  - Using IDX data for email marketing lists
  - Aggregating IDX data for analytics products
  - Scraping or bulk downloading IDX data
  - Displaying listings where seller opted out
  - Removing or minimizing attribution
  - Replacing listing broker branding with own
  - Framing or deep-linking to bypass attribution
  - Using IDX data for appraisals or valuations
  - Sharing raw data with non-participants
```

### Display Restrictions

```
❌ PROHIBITED:
  - Displaying seller's private contact info
  - Showing private remarks or showing instructions
  - Revealing offers or negotiation details
  - Displaying sold price before recorded (varies by MLS)
  - Showing listings from non-participating MLSs
  - Mixing IDX data with non-MLS sources without disclosure
```

### Technical Restrictions

```
❌ PROHIBITED:
  - Caching IDX data beyond refresh interval
  - Storing IDX data without proper security
  - Exposing API credentials in client-side code
  - Allowing robots/scrapers to index raw data
  - Providing bulk export to consumers
```

---

## Technical Implementation

### API Integration

```typescript
// ARMLS API Configuration
const armlsConfig = {
  baseUrl: 'https://api.armls.com/v1',
  rateLimit: {
    requests: 1000,
    interval: 3600000 // 1 hour
  },
  authentication: {
    type: 'bearer',
    headers: {
      'Authorization': 'Bearer {API_KEY}',
      'X-API-Secret': '{API_SECRET}'
    }
  }
};

// Required: Store credentials securely
// Use AWS Secrets Manager - NEVER in code or .env files
```

### Data Transformation

```typescript
// Map MLS data to display format with attribution
interface ListingDisplay {
  // Property data
  mlsNumber: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  description: string;
  photos: Photo[];
  status: PropertyStatus;
  daysOnMarket: number;

  // REQUIRED: Attribution data
  attribution: {
    listingBrokerage: string;      // REQUIRED
    listingAgent: string;          // REQUIRED
    agentPhone: string;            // REQUIRED (or email)
    agentEmail: string;            // REQUIRED (or phone)
    mlsSource: 'ARMLS';            // REQUIRED
    lastUpdated: Date;             // REQUIRED
    brokerReciprocity: string;     // REQUIRED
  };
}
```

### Compliance Middleware

```typescript
// Middleware to ensure IDX compliance on all listing responses
function idxComplianceMiddleware(listing: Listing): ListingDisplay {
  // Verify required attribution fields
  if (!listing.listOfficeName) {
    throw new ComplianceError('Missing listing brokerage name');
  }
  if (!listing.listAgentFullName) {
    throw new ComplianceError('Missing listing agent name');
  }
  if (!listing.listAgentPhone && !listing.listAgentEmail) {
    throw new ComplianceError('Missing agent contact information');
  }

  // Filter out prohibited fields
  delete listing.privateRemarks;
  delete listing.showingInstructions;
  delete listing.sellerContact;

  // Add required attribution
  return {
    ...listing,
    attribution: {
      listingBrokerage: listing.listOfficeName,
      listingAgent: listing.listAgentFullName,
      agentPhone: listing.listAgentPhone,
      agentEmail: listing.listAgentEmail,
      mlsSource: 'ARMLS',
      lastUpdated: new Date(),
      brokerReciprocity: BROKER_RECIPROCITY_TEXT
    }
  };
}
```

### Audit Logging

```typescript
// Required: Log all IDX data access for compliance audits
interface IDXAccessLog {
  timestamp: Date;
  userId: string | 'anonymous';
  userTier: 'anonymous' | 'lead' | 'active_client';
  action: 'view' | 'search' | 'favorite' | 'share';
  mlsNumber: string;
  ipAddress: string;
  userAgent: string;
}

// Retention: 2 years minimum
```

---

## Compliance Checklist

### Pre-Launch Checklist

#### Data Display
- [ ] Listing brokerage name displayed prominently on all listings
- [ ] Listing agent name displayed with brokerage
- [ ] Agent contact info (phone or email) displayed
- [ ] MLS source attribution (ARMLS) displayed
- [ ] Last updated timestamp displayed
- [ ] Broker reciprocity notice present
- [ ] Attribution visible without scrolling on detail pages
- [ ] Attribution present in search results
- [ ] Attribution included in print/PDF views
- [ ] Attribution included in share/email features

#### Data Handling
- [ ] Data refresh interval set to 12 hours or less
- [ ] Stale data warning implemented
- [ ] Private remarks filtered from display
- [ ] Showing instructions filtered from display
- [ ] Seller opt-out listings excluded
- [ ] API credentials stored securely (Secrets Manager)
- [ ] Rate limiting implemented

#### User Access
- [ ] Anonymous users can view listings without registration
- [ ] Registration not required for basic search
- [ ] Terms of Use include IDX data usage notice
- [ ] Privacy policy covers IDX data handling

#### Technical
- [ ] Audit logging implemented
- [ ] Compliance middleware active
- [ ] Error handling for missing attribution
- [ ] MLS notification sent
- [ ] MLS audit access provided

### Ongoing Compliance

#### Daily
- [ ] Verify sync jobs completed successfully
- [ ] Check for stale data alerts
- [ ] Review error logs for compliance issues

#### Weekly
- [ ] Sample 10 random listings for attribution compliance
- [ ] Review access logs for unusual patterns
- [ ] Check rate limit usage

#### Monthly
- [ ] Full compliance audit of display requirements
- [ ] Review and update broker reciprocity text if needed
- [ ] Verify MLS logo usage is current

#### Quarterly
- [ ] Review NAR/ARMLS policy updates
- [ ] Update documentation as needed
- [ ] Train team on any changes

---

## 2026 Policy Updates

### NAR January 2026 Changes

**Key Updates:**
1. **IDX Access Determination:** Now determined by individual local MLSs, not NAR-wide
2. **Policy Flexibility:** MLSs can set their own IDX participation rules
3. **Check ARMLS Rules:** Verify ARMLS-specific 2026 requirements

### AB 723 (California) - January 2026

**Requirement:** Disclosure for digitally altered images

```html
<!-- Required if displaying California listings with altered images -->
<div class="image-disclosure">
  This listing contains digitally altered images.
</div>
```

**Implementation:**
- Add `isDigitallyAltered` flag to photo metadata
- Display disclosure when flag is true
- Document disclosure in compliance logs

### Upcoming Considerations

- Monitor NAR Clear Cooperation Policy changes
- Watch for additional state-level IDX regulations
- Prepare for potential data portability requirements

---

## Resources

### Official Documentation
- [NAR IDX Policy](https://www.nar.realtor/about-nar/policies/internet-data-exchange-idx)
- [ARMLS Rules & Regulations](https://armls.com/rules)
- [RESO Data Dictionary](https://www.reso.org/data-dictionary/)

### Internal Documentation
- [VOW Compliance](./vow-compliance.md)
- [ARMLS Requirements](./armls-requirements.md)
- [Data Privacy - CCPA](./data-privacy-ccpa.md)

### Contacts
- **ARMLS Compliance:** compliance@armls.com
- **ARMLS API Access:** contracts@armls.com
- **NAR IDX Questions:** idx@nar.realtor

---

*Document Version: 1.0*
*Created: February 2026*
*Owner: Development Team*
*Review Cycle: Quarterly*
