# ARMLS IDX Compliance Audit — 2026-05-13

External audit against ARMLS Rules (March 31, 2026 version), Section 9
+ Section 23 IDX. Findings logged verbatim with this-session status
notes appended.

**Scope of audit:** homepage, listings search index, one listing
detail page, privacy footer.

---

## What's already shipped this session

Three findings from the audit overlap fixes that landed today.
Cross-references so the next pass against prod doesn't re-flag them:

- **F2 — Placeholder (480) 555-1234** — FIXED in job 147. All `555-1234`
  occurrences scrubbed from the repo; `siteContent.contact` is now
  env-driven via `NEXT_PUBLIC_ADVISOR_MOBILE` / `NEXT_PUBLIC_OFFICE_PHONE`.
  Production now renders `(909) 376-5494`. Audit snapshot pre-dates
  the fix. **Verify on next re-audit by curling
  `/listings/<slug>` and checking the IDX footer.**

- **F3 — Listings canonical leak to Amplify preview URL** — FIXED in
  job 146. `NEXT_PUBLIC_SITE_URL` flipped to `https://www.yong-choi.com`
  on the Amplify branch env; `metadataBase` + `siteUrl()` now both
  emit the production canonical. Confirmed across 16 routes × 2 PoPs.

- **F7 (partial) — Listings search SSR** — FIXED in job 152. The
  search index now ships a server-rendered crawler-readable
  inventory list (sr-only + aria-hidden) alongside the interactive
  client. ARMLS audit crawler will see real addresses, prices,
  community labels, and MLS#s in the first HTML chunk.

---

## High severity

### F1 — Homepage IDX-as-portfolio framing

**Audit finding:** Homepage "Now offering" / "Current Portfolio"
displays third-party listings as if they're Yong's. The Mockingbird
$40M listing is listed by Katrina Barrett at Local Luxury Christie's
International — not Yong, not RLSIR. The section header reads
"Yong Choi represents..." and "Current Portfolio" then immediately
surfaces competitor inventory. No "Courtesy of" line, no ARMLS logo
at the homepage level, no broker reciprocity indicator on the cards.
**This is the textbook scenario ARMLS Section 9/23 is written to
prevent.**

**Current state:** Still live. `components/home/FeaturedPortfolio.tsx`
pulls the top-3 active luxury listings from Spark via `searchListings`
in `app/page.tsx:34`. Cards render as branded portfolio entries with
no attribution.

**Fix path (recommended):**

Pick exactly one of:

1. **Rename + re-frame.** Section heading changes from "Current
   Portfolio" / "Yong Choi represents" to "Top of market" /
   "Currently for sale across the Valley". Each card gets a
   "Courtesy of {ListOfficeName}" attribution line below the
   address. ARMLS IDX logo appears next to the section heading
   (small, the same asset already in `public/images/armls-idx-logo.png`).
   Broker reciprocity sentence shipped in a single-line footnote at
   the bottom of the section.
2. **Curated portfolio only.** Homepage features only listings where
   `listing.listAgentKey === YONG_AGENT_KEY` (his actual representations).
   Drop the IDX-fed cards entirely. Surfaces less inventory but
   removes the IDX framing question.

Path 1 is the smaller code change and matches the data architecture;
Path 2 is the higher-integrity move long-term but requires Yong to
seed `/portfolio` with real curated entries (currently empty). A
30-minute Yong conversation makes the call.

---

### F2 — Placeholder phone number `(480) 555-1234`

**Audit finding:** Listing detail footer shows `(480) 555-1234`;
homepage shows `(909) 376-5494`. The 480 is a developer stub still
in prod.

**Status:** ✓ **FIXED this session.** See "What's already shipped"
above. Re-verify on the next ARMLS audit pass.

---

## Medium severity

### F3 — Canonical leak to Amplify preview URL

**Audit finding:** `/listings` canonical was
`https://feature-yong2-amplify.d2tuygdje4mmy3.amplifyapp.com/listings`.
SEO-poisoning own domain; reveals branch name.

**Status:** ✓ **FIXED this session.** All 16 audited routes now emit
`https://www.yong-choi.com/...` canonicals.

---

### F4 — Homepage footer disclaimer too thin given IDX content above

**Audit finding:** The homepage footer ships the short
"Based on information from ARMLS. All data deemed reliable but not
guaranteed..." sentence — fine for non-IDX pages. But the homepage
*does* surface IDX listings (see F1), which means the footer needs
the full broker-reciprocity paragraph there too, or the homepage
needs to stop showing IDX listings as portfolio cards.

**Current state:** Footer copy in `components/chrome/Footer.tsx` is
the short disclaimer. Tied to F1's resolution path:

- If F1-Path-1 ships (rename + attribute), the section needs the
  full reciprocity paragraph (or a link to it from the section's
  IDX-logo footnote).
- If F1-Path-2 ships (curated only), the short disclaimer is fine
  since the homepage no longer carries IDX content.

**Acceptance:** Reciprocity paragraph + ARMLS logo render on any
page that surfaces IDX listings outside the dedicated /listings page
or /listings/[slug] detail.

---

### F5 — Missing ARMLS IDX logo on cards

**Audit finding:** Section 23 requires the IDX logo to mark
non-brokerage listings. Logo is on the listing-detail page only;
missing from listing search cards and homepage cards.

**Current state:** `public/images/armls-idx-logo.png` exists and is
already wired into `components/portfolio/IDXComplianceFooter.tsx`
(detail page). Search index + homepage cards have no logo at all.

**Fix path:** Render a small ARMLS logo badge on each search-grid
card and homepage-portfolio card when the listing's `listAgentKey`
is not Yong's. (When it *is* Yong's, the badge is moot since the
listing is RLSIR's own.) Badge sits in the bottom-right of the
card image. Asset is the same PNG.

---

## Low / medium severity

### F6 — Days on Market not displayed

**Audit finding:** Not strictly required, but its absence combined
with the "Now offering" framing creates a fresh-listing impression
the listings may not warrant.

**Current state:** `daysOnMarket` is in the `Listing` shape (see
`app/listings/[slug]/ListingDetailClient.tsx:151`) but the homepage
`FeaturedPortfolio` card omits it. Listing-detail hero shows it via
`ListingHeroGallery` overlay.

**Fix path:** Add a small "X days on market" line to the homepage
portfolio card metadata and to the listings search-grid card. Caps
small, stone/55 colour; nestled with the price/beds/baths row.

---

### F7 (partial) — Listings page SSR

**Audit finding:** Listings page is fully client-rendered with no
SSR fallback. Search engines and the ARMLS audit crawler both see
an empty page.

**Status:** ✓ **Fix shipped this session** (job 152). The crawler
now sees a server-rendered inventory list with addresses, prices,
beds/baths/sqft, MLS#, and href links to `/listings/{slug}` for
every visible listing in the default view. List is sr-only +
aria-hidden so the interactive UI stays the primary affordance for
sighted JS users. **Verify on next ARMLS audit by curling
`/listings` with no JS — should see real markup, not a skeleton.**

---

### F8 — "Listed by" line formatting

**Audit finding:** "Listed by Katrina Barrett, Local Luxury
Christie's International Real Estate." ARMLS preferred format is
**"Listing courtesy of [Office Name]"** with the listing agent
name as a separate field. Current phrasing is close but not
standard.

**Current state:** `components/portfolio/IDXComplianceFooter.tsx`
line 88-90:
```
<span className="text-stone font-medium">Listed by</span>{' '}
{listAgentName ?? 'Agent'}
{listOfficeName ? `, ${listOfficeName}` : ''}.
```

**Fix path:** Re-order to
"Listing courtesy of {listOfficeName}; listing agent: {listAgentName}."
or split into two lines. One-file edit. Coordinate with the IDX
compliance contact before flipping — there may be a Q4 2024 ARMLS
update that codified this further.

---

### F9 — Office address absent from listing-detail IDX footer

**Audit finding:** Office address (34305 N Scottsdale Rd,
Scottsdale, AZ 85266) appears on the homepage footer but not on the
listing-detail IDX footer where the IDX context arguably benefits
from it.

**Current state:** `NEXT_PUBLIC_OFFICE_ADDRESS` env is set; the
homepage footer surfaces it. `IDXComplianceFooter` doesn't.

**Fix path:** Pass `officeAddress` into `IDXComplianceFooter` via
its `brokerage` prop or a new `brokerageAddress` prop; render
beneath the broker-reciprocity paragraph.

---

## Summary scoreboard

| ID | Sev | Status |
|---|---|---|
| F1 | High | OPEN — needs Yong call on Path 1 vs Path 2 |
| F2 | High | ✓ Fixed (job 147) |
| F3 | Medium | ✓ Fixed (job 146) |
| F4 | Medium | OPEN — tied to F1 |
| F5 | Medium | OPEN — ARMLS logo on cards |
| F6 | Low/Med | OPEN — DOM on cards |
| F7 | Low | ✓ Fixed (job 152) |
| F8 | Low | OPEN — "Listing courtesy of" phrasing |
| F9 | Low | OPEN — office address on IDX footer |

**Six open findings**, three already fixed. The biggest single risk
is **F1** because it's a consumer-deception framing question, not a
mechanical compliance gap. Recommend that one becomes its own
session with explicit Yong sign-off on which path to take. F4
collapses into F1's resolution. F5/F6/F8/F9 are all 30-90min
mechanical fixes that can batch into one commit once F1's path is
settled.
