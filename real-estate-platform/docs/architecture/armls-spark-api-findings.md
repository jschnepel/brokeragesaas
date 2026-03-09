# ARMLS Spark Platform API — Findings & Infrastructure Recommendations

**Date:** March 4, 2026
**Author:** Joey Schnepel
**Status:** Discovery complete, awaiting architecture decision

---

## What We Expected vs What We Got

### Original Assumption
A standard REST API where we query listings on demand — user searches for "Scottsdale homes over $1M," we hit the API, return results, cache them locally. Pull-as-needed, cache-what-is-used.

### What Spark Actually Provides
A **RESO Replication feed** — a bulk data firehose designed for building a complete local mirror of the entire ARMLS database. No filtering. No on-demand queries. You pull everything sequentially and store it yourself.

---

## API Behavior (Confirmed by Testing)

| Feature | Expected | Actual |
|---------|----------|--------|
| Query by city/price/status | Yes | **No** — `$filter` ignored |
| Select specific fields | Yes | **No** — `$select` ignored |
| Sort results | Yes | **No** — `$orderby` ignored |
| Limit results | Yes | **No** — `$top` ignored, always returns 10/page |
| Count total records | Yes | **No** — `$count` returns 404 |
| Pagination | Offset-based | **Cursor-based** (`$skiptoken` only) |
| Real-time single lookups | Yes | **No** — sequential feed only |
| Photo URLs in response | Yes | **No** — `PhotosCount` only, no Media entity |

### What Works
- Bearer token auth: `Authorization: Bearer {access_token}`
- Endpoint: `replication.sparkapi.com/Reso/OData/Property`
- Returns 10 records per page with `$skiptoken` cursor
- 5 entity sets: Property (707 fields), Member (48), Office (41), OpenHouse (7), Lookup (5)
- Data is live and current (OpenHouse records modified March 3, 2026)

### What's Restricted (166 fields)
Most of these are correctly restricted (private remarks, showing instructions, access codes). But some impact us:

**Fields we can't get from Property directly:**
- `DaysOnMarket` / `CumulativeDaysOnMarket` — must compute from `ListingContractDate`
- `ListAgentDirectPhone` / `ListAgentEmail` / `ListAgentMobilePhone` — must join to Member entity
- `OriginalListPrice` / `PreviousListPrice` — no workaround, can't display price history
- `Stories` — have `StoriesTotal` as alternative

**Workaround for agent contact (IDX compliance):**
- Property has `ListAgentKey` → join to Member entity `MemberKey` → get `MemberEmail` + `MemberMobilePhone`
- ARMLS custom field `Contact_sp_Info_co_List_sp_Agent_sp_Cell_sp_Phn2` sometimes has agent cell directly

---

## What This Means for Our Architecture

### The Original Plan Won't Work

The original IDX-1 spec assumed we'd build a thin API adapter that queries Spark on demand:
```
User searches → Our API → Spark API (filtered) → Transform → Return results
```

This is impossible with a replication feed. You can't search it. You can't filter it. You get everything or nothing.

### The Replication Model

What Spark expects us to do:
```
Background job → Pull ALL records sequentially → Store in our database → Serve from our DB
```

This is how every IDX website works — they maintain a local copy of the MLS database and serve searches from that. Zillow, Redfin, every brokerage site — they all replicate.

---

## Infrastructure Impact

### What Changes

| Component | Original Plan | New Requirement |
|-----------|--------------|-----------------|
| **Database** | Cache used listings | **Full ARMLS mirror** (~500K+ listings) |
| **Storage** | Minimal | **Significant** — 707 fields × 500K records |
| **Background jobs** | None planned | **Required** — initial pull + recurring sync |
| **Compute** | On-demand only | **Scheduled workers** for replication |
| **Photo storage** | Hotlink to MLS | **TBD** — no photo URLs in feed |

### Database Impact (Neon)

Current Neon setup: free tier, 0.5 GB storage, 1 compute.

**Estimated ARMLS data size:**
- ~500K property records × ~2KB per record (storing only fields we need) = ~1 GB
- Member table: ~50K agents × ~500 bytes = ~25 MB
- Office table: ~10K offices × ~300 bytes = ~3 MB
- With indexes: roughly **1.5–2 GB total**

Neon free tier gives 0.5 GB. **We'd need to upgrade.** Neon Launch plan is $19/month for 10 GB — more than enough.

Alternatively, we only store **active + recently sold** listings instead of the full historical feed. Active listings in ARMLS are probably ~30K–50K at any time. That would be ~100–200 MB, which could fit on free tier with careful column selection.

### Background Job Requirements

**Initial replication:**
- Pull all records, 10 at a time, following `$skiptoken` links
- At 10 records per request, 500K records = 50,000 API calls
- At ~500ms per call = ~7 hours for initial pull
- Can parallelize if API allows (need to test)

**Ongoing sync (IDX compliance requires ≤12 hour refresh):**
- Spark replication feeds support "delta" mode — after initial pull, subsequent pulls only return records modified since your last sync
- This depends on whether we can resume from a saved `$skiptoken` or need to re-scan
- Need to test: does the API support `$filter` on `ModificationTimestamp` after initial pull, or do we always start from the beginning?

**Where to run:**
- Option A: Neon cron (if they support it) or Vercel cron
- Option B: AWS Lambda on EventBridge schedule (free tier covers this)
- Option C: GitHub Actions on schedule (free for public repos, limited for private)

### Photo Problem

The API returns `PhotosCount: 14` but no actual photo URLs. The `Media` entity doesn't exist on this endpoint.

**Options:**
1. Spark may expose photos through a different endpoint or URL pattern (e.g., `photos.sparkplatform.com/{ListingKey}/0.jpg`) — need to research
2. May need to request additional API access from Spark/ARMLS
3. Some Spark implementations provide photo URLs in the Property record under `Media` field — ours appears to not include them

**This is a blocker for display.** A listing without photos is useless. We need to solve this before building the frontend.

---

## Three Paths Forward

### Path A: Full Replication (What Spark Expects)
**Cost:** ~$19/month (Neon upgrade) + compute for sync jobs
**Effort:** High — build full replication pipeline, scheduling, error recovery, monitoring
**Result:** Complete ARMLS mirror, fast local queries, full IDX compliance

Pros:
- Industry standard approach
- Sub-second search results (local DB)
- Full control over data freshness
- Works offline if API goes down temporarily

Cons:
- 1.5–2 GB database (need Neon upgrade)
- 7+ hour initial pull
- Must maintain sync infrastructure
- More complexity to operate

### Path B: Selective Replication (Compromise)
**Cost:** Free tier may work (~$0) or minimal upgrade
**Effort:** Medium — same pipeline but filtered during ingest
**Result:** Only active listings in target communities stored locally

How it works:
- Pull the full feed but only INSERT records where:
  - `StandardStatus` = Active, Pending, Coming Soon, Active Under Contract
  - `City` in our target cities (Scottsdale, Phoenix, Paradise Valley, etc.)
  - OR `SubdivisionName` matches our tracked communities
- Skip/discard everything else
- Estimated: ~5K–15K records instead of 500K
- Fits in free tier easily

Pros:
- Much smaller database footprint
- Faster initial pull (still scan everything but store less)
- Still local queries for speed
- Can expand scope later

Cons:
- Still need to scan the full feed (same API call count)
- No historical/sold data unless we track it ourselves
- Missing listings if community filter is too narrow

### Path C: Different API Access
**Cost:** Unknown (depends on Spark/ARMLS pricing)
**Effort:** Low (if approved) — our original adapter design would work
**Result:** On-demand queries like we originally planned

How it works:
- Contact Spark Platform and request a **standard API key** (not replication-only)
- The `sparkapi.com/v1` endpoint supports full filtering, pagination, and on-demand queries
- Our existing `ARMLSAdapter` class would work with minor URL/auth changes

Pros:
- Original architecture works as designed
- No bulk storage needed
- No sync jobs needed
- Simpler infrastructure

Cons:
- May cost more (Spark charges differently for API vs replication)
- May not be available for our use case
- Dependent on API availability for every search
- Slower (network round-trip per search)

---

## Recommendation

**Start with Path B (Selective Replication), investigate Path C in parallel.**

1. Build the replication pipeline — it's needed regardless, and the infrastructure (background jobs, upsert queries, monitoring) is useful for the platform long-term
2. Filter during ingest to keep database small: active listings in our target market only
3. Contact Spark Platform to ask about standard API access — if available and affordable, we can use it for real-time queries and use replication as a backup/cache
4. Solve the photo problem before building any listing display UI

### Immediate Next Steps

1. **Resolve photo access** — Research Spark photo URL patterns or contact them about Media endpoint access
2. **Design `listing_records` table** — Schema based on the 707 fields we discovered, storing only the ~60 we actually need
3. **Build replication worker** — Node.js script that paginates through the feed, filters, and upserts
4. **Test token refresh** — We have a refresh token but haven't tested the OAuth flow for automatic token renewal (the access token will expire)
5. **Decide on Neon tier** — Free vs Launch based on storage needs

---

## Appendix: API Credentials

**OAuth Key:** `axhunj67o29ybpajnvzopevsl`
**Endpoint:** `https://replication.sparkapi.com/Reso/OData/`
**Entities:** Property, Member, Office, OpenHouse, Lookup

Access token and refresh token stored separately (not in repo).

---

## Appendix: Field Inventory

### Property Entity — Fields We'd Store (~60 of 707)

**Identification:**
ListingId, ListingKey, StandardStatus, MlsStatus, OriginatingSystemName

**Location:**
UnparsedAddress, StreetNumber, StreetDirPrefix, StreetName, StreetSuffix, UnitNumber, City, StateOrProvince, PostalCode, CountyOrParish, SubdivisionName, Latitude, Longitude

**Price:**
ListPrice, ClosePrice

**Characteristics:**
PropertyType, PropertySubType, BedroomsTotal, BathroomsTotalInteger, BathroomsFull, BathroomsHalf, LivingArea, LotSizeAcres, LotSizeSquareFeet, YearBuilt, StoriesTotal

**Features (arrays):**
InteriorFeatures, ExteriorFeatures, Appliances, Cooling, Heating, Flooring, Fencing, PoolFeatures, ParkingFeatures, CommunityFeatures, View, ArchitecturalStyle, ConstructionMaterials, Roof, Sewer, WaterSource, FireplaceFeatures

**Booleans:**
PoolPrivateYN, FireplaceYN, AssociationYN, HeatingYN, CoolingYN, AttachedGarageYN, HorseYN

**HOA:**
AssociationFee, AssociationFeeFrequency, AssociationFeeIncludes, AssociationName

**Parking:**
GarageSpaces, CoveredSpaces, CarportSpaces, OpenParkingSpaces

**Attribution (IDX required):**
ListAgentFullName, ListAgentFirstName, ListAgentLastName, ListAgentMlsId, ListAgentKey, ListOfficeName, ListOfficeMlsId, ListOfficePhone

**Content:**
PublicRemarks, Directions, CrossStreet

**Dates:**
ListingContractDate, CloseDate, ModificationTimestamp, OriginalEntryTimestamp, PriceChangeTimestamp, StatusChangeTimestamp, PhotosChangeTimestamp

**Photos:**
PhotosCount (actual URLs TBD)

**Tax:**
TaxAnnualAmount, TaxYear, ParcelNumber

**Schools:**
ElementarySchool, ElementarySchoolDistrict, HighSchoolDistrict

**Display flags:**
InternetEntireListingDisplayYN, InternetAddressDisplayYN

**Raw data:**
Full JSON stored in `raw_data` JSONB column for fields not in dedicated columns
