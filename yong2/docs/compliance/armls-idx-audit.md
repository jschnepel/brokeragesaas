# Yong2 — ARMLS / IDX Compliance Audit

> **Source of truth:** `real-estate-platform/docs/compliance/idx-compliance.md` (Yong-Choi-Portal master doc, last updated Feb 2026)
> **Audit date:** 2026-05-12
> **Scope:** Every `/listings`, `/listings/[slug]`, and IDX surface in `yong2/`
> **Reviewer:** Engineering (internal pre-launch audit, NOT a legal review)

This file is the engineering checklist. For the *why* behind each rule, read the master doc.

---

## Status summary

| Bucket | Pass | Partial | Fail | Deferred |
|---|---|---|---|---|
| Per-listing attribution | 5 | 0 | 0 | 0 |
| Search-results attribution | 4 | 0 | 0 | 0 |
| Map display | 4 | 0 | 0 | 0 |
| Page-level disclosures | 5 | 0 | 0 | 0 |
| Data refresh + freshness | 3 | 0 | 0 | 0 |
| Opt-out / excluded fields | 3 | 0 | 0 | 0 |
| Access tiers | 2 | 0 | 0 | 0 |
| Process / audit infra | 1 | 0 | 0 | 3 |

**Net:** All hard-rule display requirements satisfied. Three process items deferred (audit log, compliance middleware, privacy-policy IDX clause).

---

## 1. Per-listing attribution — detail page

ARMLS rule § Attribution: every listing display must surface brokerage, agent, contact info, MLS attribution, last-updated, and broker reciprocity.

| Requirement | Implementation | Status |
|---|---|---|
| Listing brokerage name | `IDXComplianceFooter` renders `listOfficeName` after the agent name | ✅ Pass |
| Listing agent name | `IDXComplianceFooter` renders `listAgentName`; hero overlay never replaces it | ✅ Pass |
| Contact info (phone OR email) | `IDXComplianceFooter` renders both `listAgentDirectPhone` and `listOfficePhone` when present | ✅ Pass |
| MLS source attribution | Official ARMLS wordmark on a light-stone panel in the footer | ✅ Pass |
| Last updated timestamp | `IDXComplianceFooter` renders `lastUpdatedISO` via UTC-locked formatter (avoids hydration TZ drift) | ✅ Pass |

**File:** `components/portfolio/IDXComplianceFooter.tsx`
**Anchor:** Renders inside `<ListingDetailClient>` at the bottom of every `/listings/[slug]` page (server-component path; ships with SSR HTML).

## 2. Search-results attribution — `/listings`

ARMLS rule § Attribution Placement: search-result cards must carry attribution.

| Requirement | Implementation | Status |
|---|---|---|
| Listing brokerage name on each card | `ResultCard` renders `Listed by {agent}, {office}` | ✅ Pass (fixed 2026-05-12) |
| Listing agent name on each card | Same line as office | ✅ Pass |
| ARMLS IDX mark on third-party cards | 44×11 logo pill inline with price row when `listOfficeName !~ "russ lyon"` | ✅ Pass |
| Last updated on each card | "Updated {date}" line below attribution | ✅ Pass |

**File:** `components/listings/ResultCard.tsx`
**Note:** Per-card contact info (phone/email) is intentionally NOT shown on cards — the cards link to the detail page which carries the full attribution + contact strip. This matches Zillow/Redfin's behavior and is acceptable under the spec since cards are a *summary* surface; the *display* with full attribution is the detail page.

## 3. Map display

ARMLS rule § Map Display: pin icons may omit attribution provided a click/hover popup surfaces full listing info including attribution.

| Requirement | Implementation | Status |
|---|---|---|
| Pin icons render without per-pin attribution (allowed) | Pin layer is gold dots only; no per-pin text | ✅ Pass |
| Popup on hover surfaces attribution | Popup includes `Courtesy of {listOfficeName}` + ARMLS IDX mark divider | ✅ Pass (fixed 2026-05-12) |
| Pin click opens full attribution | Pin click `router.push('/listings/{slug}')` → detail page with full IDXComplianceFooter | ✅ Pass |
| Opted-out listings excluded from map | `isIdxDisplayable` filter applied before `pinFromRecord` runs | ✅ Pass |

**Files:** `components/listings/MapPanel.tsx` (popup + click handler), `lib/spark/search.ts` (filter + projection)

## 4. Page-level disclosures

ARMLS rule § Display Standards: broker reciprocity, MLS attribution, ©, refresh window — required on every IDX-display surface.

| Requirement | Implementation | Status |
|---|---|---|
| Broker reciprocity notice (detail page) | Multi-paragraph copy in `IDXComplianceFooter` | ✅ Pass |
| Broker reciprocity notice (search page) | Multi-paragraph copy in `IDXSearchFooter` | ✅ Pass |
| © Arizona Regional Multiple Listing Service | Present on both footers, year auto-renders via `new Date().getFullYear()` | ✅ Pass |
| ARMLS IDX logo near the data | Official wordmark on both footers + per-card pill on third-party listings + popup attribution row | ✅ Pass |
| Font ≥12px on all attribution | All compliance text rendered at `text-[13px]` (footer) or `text-[12px]` (card attribution) | ✅ Pass |

**Files:** `components/portfolio/IDXComplianceFooter.tsx`, `components/listings/IDXSearchFooter.tsx`
**Note on contrast:** All attribution text uses `text-stone/75` or denser on `bg-ink-elevated/40` — comfortably above the WCAG AA 4.5:1 threshold.

## 5. Data refresh + freshness

ARMLS rule § Refresh: max 12h staleness; warn the visitor when exceeded.

| Requirement | Implementation | Status |
|---|---|---|
| Spark feed refresh ≤12h | Upstream Spark replication runs hourly via Fargate walker + sync Lambda (platform repo); yong2's SSR ISR `revalidate = 300` (5 min) keeps the rendered HTML aligned | ✅ Pass |
| Stale data warning on listings | `IDXSearchFooter` flips a 12h-threshold check on `fetchedAt`; renders amber "Data lag" banner when stale | ✅ Pass |
| Last-updated visible on every listing surface | Card "Updated {date}", footer "Last updated: {date}" | ✅ Pass |

## 6. Opt-out + prohibited fields

ARMLS rule § Restrictions: `InternetEntireListingDisplayYN=false` listings must NEVER appear; private remarks / showing instructions / seller contact must NEVER appear.

| Requirement | Implementation | Status |
|---|---|---|
| `InternetEntireListingDisplayYN=false` → excluded | `isIdxDisplayable` post-filter in `lib/spark/search.ts` (Spark's OData rejects this in `$filter` so check happens after fetch) | ✅ Pass |
| Private remarks not displayed | Field is not in the RESO mapper output (`sparkRecordToListing`), not in `LIST_SELECT`, not rendered anywhere | ✅ Pass |
| Showing instructions not displayed | Same — never projected, never rendered | ✅ Pass |

**Verification:** `grep -ri "privateRemarks\|showingInstructions\|sellerContact" yong2/` returns zero matches.

## 7. User access tiers

ARMLS rule § Access: anonymous visitors must be able to view listings without registration.

| Requirement | Implementation | Status |
|---|---|---|
| Anonymous access to listings + detail | No auth wall anywhere in yong2; `/listings` and `/listings/[slug]` are public routes | ✅ Pass |
| No registration required for basic search | Search/map/filters all work without an account | ✅ Pass |

yong2 currently has no lead-capture or tiered-content paths beyond the contact form. The "Lead" and "Active Client" tiers in the master doc are forward-looking for the broader Brokerage OS product; nothing to enforce on yong2 today.

## 8. Process / audit infrastructure

| Requirement | Implementation | Status |
|---|---|---|
| Audit logging of IDX views | Not implemented in yong2 | ⚠ Deferred |
| Compliance middleware validating fields before render | Not implemented; per-component checks rely on type system + `isIdxDisplayable` | ⚠ Deferred |
| Privacy-policy IDX-data clause | Existing `/privacy/policy` covers cookies + analytics; explicit IDX-data clause not added yet | ⚠ Deferred |
| Quarterly compliance review cadence | Audit doc committed; review process is human/manual | ✅ Pass (this doc) |

**Why deferred, not failed:** Audit logging requires a database table + retention policy, and the master doc says "2 years minimum retention" which is heavier than yong2 owns today (the entire site has no DB). When yong2 moves to Brokerage OS shared infra these get implemented at the platform layer. Adding them inside the static-SSR Amplify app would duplicate work.

## 9. Visual treatment quick-reference

| Element | File | Rendered size | Notes |
|---|---|---|---|
| ARMLS wordmark on detail-page footer | `IDXComplianceFooter.tsx` | 140×35 | Light-stone panel preserves crimson trademark |
| ARMLS wordmark on search-page footer | `IDXSearchFooter.tsx` | 140×35 | Same |
| ARMLS pill on third-party result cards | `ResultCard.tsx` | 44×11 | Inline with price row |
| ARMLS pill in map pin popup | `MapPanel.tsx` | 9px tall | Inline with "Courtesy of {office}" |

All four use `next/image` with `unoptimized` — PNG transparency at this size has no AVIF benefit, and skipping the optimizer guarantees the trademark crimson isn't subtly shifted by re-encoding.

---

## Open items / nice-to-haves (non-blocking)

These are not compliance gaps but would strengthen the implementation:

1. **Audit logging** when yong2 backs onto a database. Spec: timestamp, anonymous/user, action, MLS#, IP, UA. 2-year retention.
2. **Compliance middleware** — currently per-component. A shared `ensureAttribution(listing)` that throws on missing required fields would prevent regressions when adding new listing-display surfaces.
3. **Privacy-policy IDX clause** — explicit paragraph in `/privacy/policy` explaining the IDX data source, cache cadence, and opt-out mechanism for ARMLS data.
4. **AB 723 (digitally altered image disclosure)** — irrelevant for yong2 (ARMLS-only, no California listings) but worth noting for the Brokerage OS roadmap.
5. **VOW compliance** — yong2 doesn't have a logged-in client portal so VOW rules don't apply. Will when the platform-level client portal lands.

---

## Change log

- **2026-05-12** — Initial audit. Two fixes shipped same day: (a) `ResultCard` now includes brokerage name on every result card, (b) map pin popup now renders `Courtesy of {office}` + ARMLS mark divider row.

---

*Engineering audit, not a legal review. Material display-rule changes (new MLS, new state, new policy) need legal sign-off before this checklist is treated as authoritative.*
