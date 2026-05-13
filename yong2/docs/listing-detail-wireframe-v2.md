# Listing Detail — Wireframe v2 (Target Design)

> Evolved page architecture — what we build toward now that we know
> the data shape (`Listing`), narrative shape (`ListingNarrative`),
> and analytics surface (comps + area aggregates).
>
> Companion: `listing-detail-wireframe-current.md` (what's live
> today — supersedes when v2 ships).

---

## What changed from v1

| Decision | v1 (current) | v2 (target) |
|---|---|---|
| Hero height | 80vh | **90vh near-full-bleed** with structured overlay |
| Sub-nav | none | **sticky anchor bar** under main nav (Overview · Features · The Read · Location · Schedule) |
| Stats row | inline beside price in fact sheet | **full-width at-a-glance strip** below hero, bold display numbers |
| Story sidebar | fact + financial + schools cards | **agent mini-card + inline showing form** (Jeane pattern) — facts move into v2's structured strip |
| Floor plan / virtual tour | not present | **first-class section** (2-col split with embed/CTA) |
| The Read | 2-col text+number block | **full-width visual block** with sparkline + bar trend |
| Map | inline, ~50vh | **full-width 60vh with POI overlay** + neighborhood narrative |
| Schedule | CTA-only in action row | **dedicated dark-bg section with calendar + form** |
| Documents | not present | **compact downloads list** (brochure / floor plan / disclosures) |
| Similar listings | 3 fixed cards | **horizontal carousel** of 5-7 |
| Recently viewed | not present | **localStorage strip** at bottom |

---

## Page anatomy v2

```
0    Navigation chrome (transparent over hero, solid on scroll)
0a   Sticky contact pill (after scroll)
═══════════════════════════════════════════════════════════════
1    HERO                                  90vh / min 640px
2    ANCHOR BAR                            sticky, h-14
3    AT-A-GLANCE STATS STRIP               h-32 to h-40
4    STORY + AGENT/FORM SIDEBAR            auto
5    LIFESTYLE PHOTO STRIP                 h-96
6    KEY FEATURES GRID                     11 chip groups
7    EDITORIAL "A CLOSER LOOK"             4 slot-filled
8    FLOOR PLAN + VIRTUAL TOUR             2-col, h-[480px]
9    THE READ — VISUAL ANALYTICS           full-width, h-auto
10   LOCATION INTELLIGENCE                 map h-[60vh] + neighborhood
11   SCHEDULE A SHOWING                    dark-bg interlude, full-width
12   DOCUMENTS & DISCLOSURES               compact list
13   SIMILAR LISTINGS CAROUSEL             5-7 cards horizontal
14   RECENTLY VIEWED                       localStorage strip
15   ACTION ROW                            minimal: ← Portfolio · Share · Save
16   IDX COMPLIANCE FOOTER                 ARMLS attribution
17   Site footer
```

---

## Section 1 — Hero (cinematic, 90vh)

```
┌─────────────────────────────────────────────────────────────┐
│ [ACTIVE · NEW]                              [📷 GALLERY · 47]│
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│              [Hero photo, ken-burns, 90vh]                  │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│  SILVERLEAF · NORTH SCOTTSDALE                              │
│                                                             │
│  10845 E Silverleaf Ridge Way                              │ ◀ display-xxl serif
│                                                             │
│  $8,950,000   ·   6 bd · 7 ba · 7,206 sf · 1.18 ac         │ ◀ smaller, italic
│                                                             │
└─────────────────────────────────────────────────────────────┘
┌──────────┬──────────┬──────────┬──────────┐
│ thumb 2  │ thumb 3  │ thumb 4  │ +43 MORE │
└──────────┴──────────┴──────────┴──────────┘
```

**What's new vs v1**
- 80vh → 90vh — almost full viewport
- Status badge moved to top-LEFT (was overlaid in fact sheet)
- "View Gallery · 47" pill top-RIGHT — explicit CTA into lightbox
- Single-column overlay anchored bottom-left (was bottom-left + bottom-right split)

**Data**: `Listing.{photos, status, unparsedAddress, community, listPrice, bedrooms, bathroomsTotal, livingArea, lotAcres}`

**Component**: `ListingHeroGallery` (extend — add status badge + gallery pill, bump height)

---

## Section 2 — Sticky anchor bar

```
══════════════════════════════════════════════════════════════
  OVERVIEW   ·   FEATURES   ·   THE READ   ·   LOCATION   ·   SCHEDULE
══════════════════════════════════════════════════════════════
```

- Sticks under the main Navigation on scroll
- Caps tracking, gold underline on active section (intersection observer)
- Click → smooth-scroll to section anchor
- Visual progress: tiny gold dot moves under the bar as user scrolls

**What's new**: this section didn't exist in v1. Long detail pages need wayfinding; without it, visitors drop off after the hero.

**Data**: section IDs only — no listing data

**Component**: NEW `ListingAnchorNav.tsx`

**Analytics**: `anchor_nav_click {listingKey, section}`

---

## Section 3 — At-a-glance stats strip

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  $8,950,000   6 BD   7 BA   7,206 SF   1.18 AC   2022   18 DOM   │
│   LIST PRICE  BEDROOMS BATHS INTERIOR  LOT      BUILT    DAYS    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

- Bold serif numbers (display-md), caps labels below
- Hairline dividers between
- Wraps to 2-row grid on mobile (4 + 3)
- Each cell click → scroll/highlight related section (price → fact sheet, beds → features, etc.) — micro-interaction

**What's new**: was inline beside the price in the v1 fact sheet — promoted to a dedicated row right under the hero so the visitor sees the headline numbers immediately on scroll without entering the prose.

**Data**: same fields as fact sheet, extracted

**Component**: NEW `ListingStatsStrip.tsx`

**Analytics**: `stats_strip_view` (intersection 1s)

---

## Section 4 — Story + Agent sidebar (Jeane pattern)

### Desktop (≥ md, 1.5fr / 1fr)

```
┌──────────────────────────────────────┬──────────────────────┐
│                                      │  ┌────────────────┐  │
│ A 2022 Horseshoe Canyon residence    │  │  [Yong photo]  │  │
│ on 1.18 acres with western exposure  │  │                │  │ ◀ Agent mini-card
│ to the McDowell ridge — six ensuite  │  │   YONG CHOI    │  │
│ bedrooms across 7,206 sf.            │  │   Russ Lyon    │  │
│                                      │  │   Sotheby's    │  │
│ A study in restrained modernism on   │  │                │  │
│ one of Silverleaf's most coveted     │  │  Call Yong     │  │
│ Horseshoe Canyon parcels...          │  │  ─────────     │  │
│                                      │  └────────────────┘  │
│ Sited at the back of a discreet      │                      │
│ cul-de-sac on 1.18 acres...          │  ┌────────────────┐  │
│                                      │  │  REQUEST A     │  │ ◀ Inline form
│ Six ensuite bedrooms across two      │  │  PRIVATE TOUR  │  │
│ wings, anchored by a primary suite…  │  │                │  │
│                                      │  │  Your name     │  │
│ Offered furnished... [italic-muted]  │  │  ───────────   │  │
│                                      │  │                │  │
│                                      │  │  Email         │  │
│                                      │  │  ───────────   │  │
│                                      │  │                │  │
│                                      │  │  Phone (opt)   │  │
│                                      │  │  ───────────   │  │
│                                      │  │                │  │
│                                      │  │  Preferred date│  │
│                                      │  │  [date picker] │  │
│                                      │  │                │  │
│                                      │  │  [REQUEST →]   │  │
│                                      │  └────────────────┘  │
└──────────────────────────────────────┴──────────────────────┘
```

**What's new**: sidebar is now agent-centric (mini photo + name + brokerage + tel) + the inline showing form. Fact / Financial / Schools moved out of the sidebar — facts are in the v2 stats strip, financial + schools land in a structured-data strip below the editorial section.

**Data**:
- Story prose: `ListingNarrative.story` (4 paragraphs)
- Summary lede: `ListingNarrative.summary`
- Agent: `agentConfig` (yongBio.photoUrl, yongBio.name, brokerage, contact.mobileHref)
- Form fields: client-side state

**Components**:
- `ListingStory` (existing)
- NEW `AgentMiniCard.tsx`
- NEW `ScheduleShowingForm.tsx` (inline variant)

**Analytics**:
- `cta_call_click {listingKey, surface: 'agent-card'}`
- `tour_form_field_focus {listingKey, field}` (engagement signal)
- `tour_form_submit_attempt/success/failure {listingKey}`

---

## Section 5 — Lifestyle photo strip

```
┌──────────────────┬──────────────────┬──────────────────┐
│                  │                  │                  │
│  [photo 4:3]     │  [photo 4:3]     │  [photo 4:3]     │
│   Living room    │   Kitchen detail │   Pool / view    │
│                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘
```

**What's new**: didn't exist in v1. Three editorialized lifestyle shots picked from the gallery — chosen for narrative weight, not just sequence. Click → opens lightbox at that index.

**Data**: `Listing.photos[]` with index hints from the photo metadata if available, else 3 hand-picked indexes (3, 7, 12) as a heuristic.

**Component**: NEW `LifestylePhotoStrip.tsx`

**Analytics**: `gallery_open {listingKey, initialIndex, source: 'lifestyle-strip'}`

---

## Section 6 — Key features grid

(unchanged from v1 — already aligned with the narrative shape)

```
─── FEATURES & AMENITIES ─────────────────────────────────────

  ARCHITECTURE      [Contemporary] [Glass + Stone] [Single-Story Wings]
  INTERIOR          [12-Foot Ceilings] [Heated Limestone Floors] ...
  KITCHEN           [Gaggenau Suite] [Subzero] [Wolf 6-Burner] ...
  PRIMARY SUITE     [Private Courtyard] [Dual Baths] ...
  EXTERIOR          [Infinity-Edge Pool 70ft] [Outdoor Kitchen] ...
  VIEWS             [McDowell Mountains] [Pinnacle Peak] ...
  GARAGE            [4-Car Climate-Controlled] [EV Charging × 2] ...
  GUEST             [Detached Casita 1BR/1BA] [Private Entrance]
  COMMUNITY         [24/7 Manned Gates] [Member-Only Trails] ...
  CONSTRUCTION      [Steel + Concrete] [Standing-Seam Roof] [2022]
  CLIMATE           [Zoned Geothermal] [Whole-House Filtration] ...
```

**Component**: `KeyFeaturesGrid` (no change)

---

## Section 7 — Editorial "A closer look"

(unchanged from v1)

```
─── A CLOSER LOOK ────────────────────────────────────────────

  *The site.*
  One of the last elevated parcels in Horseshoe Canyon...

  *Materials.*
  Limestone flooring sourced from a single European quarry...

  *Program.*
  Two wings split family from guest...

  *Presentation.*
  Shown by appointment. Yong personally accompanies...
```

**Component**: `ListingEditorial` (no change)

---

## Section 8 — Floor plan + virtual tour

```
┌──────────────────────────────┬──────────────────────────────┐
│                              │                              │
│   FLOOR PLAN                 │   VIRTUAL TOUR               │
│                              │                              │
│   ┌────────────────────────┐ │   ┌──────────────────────┐  │
│   │                        │ │   │  ▶                   │  │
│   │  [floor plan diagram]  │ │   │  [Matterport embed]  │  │
│   │  click to enlarge      │ │   │                      │  │
│   │                        │ │   │                      │  │
│   └────────────────────────┘ │   └──────────────────────┘  │
│                              │                              │
│   Download PDF →             │   Open in new window →       │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

**What's new**: section didn't exist in v1. Many top-tier listings have floor plans + virtual tours; surfacing them as first-class is luxury convention.

If neither asset is available for a listing → the entire section is omitted (renders nothing). When only one is available, the section becomes a single-column with the one that exists.

**Data**:
- `floorPlanUrl` — NEW field on `Listing` (Phase 2 backlog)
- `virtualTourUrl` — NEW field on `Listing` (already on ARMLS as `virtual_tour_url`)

**Component**: NEW `ListingFloorPlanAndTour.tsx`

**Analytics**:
- `floor_plan_open {listingKey}`
- `virtual_tour_open {listingKey}`

---

## Section 9 — The Read (full-width visual analytics)

```
═══════════════════════════════════════════════════════════════
THE READ
*How this property reads against the active market — and the area at large.*
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────┬─────────────────────────────────────┐
│ VS. ACTIVE COMPS · 9 properties     │ SILVERLEAF · LAST 12 MONTHS         │
│                                     │                                     │
│  $1,242     vs comp median          │     ▁▃▆▇▆▅▆▇▆▇▇▇▇                  │
│  /sqft      $1,085 (+14.5%)         │     New active inventory, monthly   │
│                                     │                                     │
│  [bar chart: subject vs P25/P50/P75 │  Median DOM    Months supply  YoY   │
│   of comp pool — subject in gold,   │   42 days       3.8 mo       +8.2%  │
│   comps in stone]                   │                                     │
│                                     │  [sparkline: median price over 12mo]│
│                                     │                                     │
│  │ Priced 14.5% above the active    │  │ Silverleaf trended +8.2% YoY    │
│  │ comp median — consistent with    │  │ against a Phoenix metro near    │
│  │ the lot premium and 2022 build   │  │ +3.0% — outperformer for 4      │
│  │ vintage...                       │  │ consecutive quarters.           │
│                                     │                                     │
└─────────────────────────────────────┴─────────────────────────────────────┘

SOURCE · ARMLS SPARK · Refreshed hourly
```

**What's new vs v1**:
- Mini bar chart (subject vs comp P25/P50/P75)
- Mini sparkline of monthly inventory + median price trend
- Same 2-col layout but with visual elements that make the numbers tangible
- Commentary blockquotes already in v1 — kept

**Data**:
- `subjectPpsf` — `Listing.pricePerSqft` derived
- `comp_pool_distribution: {p25, p50, p75, count}` — analytics layer extension
- `area_monthly_inventory: number[12]` — new analytics aggregate
- `area_monthly_median_price: number[12]` — new analytics aggregate
- `areaMedianDom`, `areaMonthsOfSupply`, `areaYoYPriceChangePct` — same as v1
- `theRead.compsCommentary`, `theRead.areaCommentary` — narrative

**Component**: `TheRead.tsx` (rebuild from `MockTheRead` + `recharts` for sparkline/bar)

**Analytics**: `the_read_view` (2s in viewport), `the_read_chart_hover {chart}`

---

## Section 10 — Location intelligence

```
═══════════════════════════════════════════════════════════════
LOCATION
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│              [Map, 60vh, MapTiler tiles]                    │
│                                                             │
│         ●  Subject (gold pin)                               │
│         ▽  Schools (stone)                                  │
│         ⛳ Golf clubs                                       │
│         🍽 Dining within 10min                              │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ TOGGLE: ◯ Subject only  ◉ Schools  ◯ Dining  ◯ All  │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┬──────────────────────┐
│ ABOUT SILVERLEAF                     │  Distance to:        │
│                                      │  ─────────────────   │
│ A handful of enclaves carry most of  │  Sky Harbor   28 mi  │
│ the Valley's top-tier inventory.     │  Old Town SDL  6 mi  │
│ Silverleaf is the most measured of   │  Hwy 101       2 mi  │
│ them — gated, architecturally        │                      │
│ committed, member-driven.            │  Schools             │
│                                      │  Copper Ridge El     │
│ [pulled from content/communities.ts] │  Copper Ridge Mid    │
│                                      │  Scott. Unified HS   │
└──────────────────────────────────────┴──────────────────────┘

Precise address shared with qualified buyers following inquiry.
```

**What's new vs v1**:
- Map taller (60vh, was inline)
- POI overlay with toggle (schools, dining, golf)
- Below-map split: community narrative left + distances/schools right
- Privacy note retained

**Data**:
- `Listing.{latitude, longitude, unparsedAddress}`
- `community_profile` from `content/communities.ts` (existing)
- POI data: cached Google Places results (Phase 2 — uses the API key already provisioned in `rlsir-agent-websites` GCP project)
- Distances: precomputed at narrative-workflow time using Google Distance Matrix

**Component**: NEW `LocationIntelligence.tsx` (wraps existing `ListingMap` with POI layer + side panels)

**Analytics**: `map_poi_toggle {layer}`, `location_view`

---

## Section 11 — Schedule a Showing (dark interlude)

```
═══════════════════════════════════════════════════════════════
[dark-bg charcoal interlude]

  SCHEDULE A SHOWING
  Private tours, *by appointment.*

  ┌─────────────────────────────┬──────────────────────────────┐
  │                             │                              │
  │   [Calendar widget]         │   [4-field form, dark]      │
  │                             │                              │
  │   Mon Tue Wed Thu Fri Sat   │   Your name                  │
  │   ─── ─── ─── ─── ─── ───   │   Email                      │
  │   ░░  ●●  ●●  ●●  ░░  ░░    │   Phone                      │
  │                             │   Notes (optional)           │
  │   Available afternoons:     │                              │
  │   1:00, 2:30, 4:00          │   [REQUEST TOUR →]           │
  │                             │                              │
  └─────────────────────────────┴──────────────────────────────┘

  Or call Yong direct:  (XXX) XXX-XXXX
═══════════════════════════════════════════════════════════════
```

**What's new vs v1**: dedicated full-width section (was sidebar form). Calendar widget shows agent availability (real or simulated) — converts higher than form-only because it sets the next step.

**Data**:
- Form: client-side state
- Availability: `agentSchedule` (NEW — pulled from a calendar source in Phase 3, hardcoded availability in Phase 1-2)

**Component**: NEW `ScheduleShowingFull.tsx` (inline `ScheduleShowingForm` + `AvailabilityCalendar`)

**Analytics**:
- `availability_date_select {listingKey, date}`
- `availability_time_select {listingKey, datetime}`
- `tour_form_submit_*` (same as inline)

---

## Section 12 — Documents & Disclosures

```
─── DOCUMENTS & DISCLOSURES ──────────────────────────────────

  📄  Property Brochure         48-page PDF · 12.4 MB    [↓]
  📄  Floor Plans               4-page PDF · 2.1 MB      [↓]
  📄  HOA Disclosures           CC&Rs + bylaws · 4.7 MB  [↓]
  📄  Property Disclosure       SPDS · 1.2 MB            [↓]
  📄  ALTA Survey               2024 · 0.8 MB            [↓]
```

**What's new**: didn't exist in v1. Top luxury sites surface downloadable documents directly — buyers (and their reps) want them.

**Data**:
- `documents: { type, label, url, sizeBytes }[]` — NEW field on `Listing` (Phase 3 backlog)
- Documents typically supplied by the listing-prep team via a CMS
- Section omitted entirely if no documents

**Component**: NEW `ListingDocuments.tsx`

**Analytics**: `document_download {listingKey, type}`

---

## Section 13 — Similar listings (carousel)

```
─── YOU MAY ALSO CONSIDER ──────── ◀ ▶ ─── VIEW ALL LISTINGS →

┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│        │        │        │        │        │        │        │
│ photo  │ photo  │ photo  │ photo  │ photo  │ photo  │ photo  │
│  4:5   │  4:5   │  4:5   │  4:5   │  4:5   │  4:5   │  4:5   │
│        │        │        │        │        │        │        │
│        │        │        │        │        │        │        │
│ 10220  │ 37210  │ 6045   │ 8841   │ 11020  │ 5612   │ 7340   │
│ Whisper│ Cave Cr│ 47th   │ Wlk Cyn│ N Tatum│ E Mockingbird│ Kierland│
│ $7.4M  │ $9.95M │ $11.5M │ $6.2M  │ $13.8M │ $5.4M  │ $8.1M  │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

**What's new**: 5-7 cards in horizontal carousel (was 3 fixed). More room for ranking variations (same community first → expanding by price tier → expanding by region).

**Data**: `getSimilarListings(listing, 7)` — selection logic per spec

**Component**: extend `SimilarListingsStrip` → `SimilarListingsCarousel`

**Analytics**: `similar_listing_click {from, to, position}`, `similar_carousel_advance {direction}`

---

## Section 14 — Recently viewed

```
─── RECENTLY VIEWED ──────────────────────────────────────────

┌────────┬────────┬────────┐
│ photo  │ photo  │ photo  │
│        │        │        │
│ 5612 E │ 8841 N │ 11020 N│
│ Mockbird│Wlk Cyn │ Tatum  │
│ $5.4M  │ $6.2M  │ $13.8M │
└────────┴────────┴────────┘
```

- Reads from localStorage `yong2_recently_viewed` (last 5)
- Hidden if list is empty (first-visit)
- Updates on every listing-detail view (push current onto front, dedupe)

**Data**: localStorage only

**Component**: NEW `RecentlyViewedStrip.tsx`

**Analytics**: `recently_viewed_click {to, position}`

---

## Section 15 — Action row (minimal)

```
← THE PORTFOLIO            [SAVE]   [SHARE]   [REQUEST TOUR →]
```

**What's new**: trimmed from v1 (no Call link — that lives in the agent card + sticky pill now). "Save" is new — bookmarks a listing to localStorage.

**Component**: existing `ShareButton` + `RequestTourCta` + NEW `SaveButton`

**Analytics**: `cta_save_click {listingKey, on/off}`

---

## Section 16 — IDX compliance footer

(unchanged from v1, mandatory for ARMLS)

---

## Sticky surfaces (overlay across all sections)

### Sticky anchor bar (Section 2)

Sticks under main nav after first scroll. Visible until end of `Documents` section, then unsticks (no longer relevant on the closing strips).

### Sticky contact pill

Same as v1 — bottom-right circular phone pill on mobile, expanded pill on desktop, appears after `scrollY > 32vh`.

### Save / Share / Tour mini-rail (NEW, mobile only)

On mobile, a thin 3-icon rail bottom of viewport (above sticky pill) for quick Save / Share / Tour without scrolling to action row. Hidden on desktop where the sticky contact pill carries Tour.

---

## Mobile breakdowns

| Section | Desktop | Mobile |
|---|---|---|
| 1 Hero | 90vh | 70vh, snap-x photo gallery |
| 2 Anchor bar | 5-tab horizontal | hidden (replace with mobile nav drawer) |
| 3 Stats strip | 7 cells horizontal | 4-cell row + 3-cell row |
| 4 Story + Sidebar | 1.5fr / 1fr | full-width story, sidebar drops below story |
| 5 Lifestyle strip | 3 cols | snap-x scroll |
| 6-7 Features / Editorial | full-width | full-width |
| 8 Floor plan + tour | 2-col | stack |
| 9 The Read | 2-col | stack with mini-charts full-width |
| 10 Location | full-width | full-width, map 50vh |
| 11 Schedule | 2-col | stack with calendar collapsing to date dropdown |
| 12 Documents | full-width list | same |
| 13 Similar | carousel 7-wide | carousel 1.2-wide (snap to 1 + peek) |
| 14 Recently viewed | 5-wide row | snap-x scroll |
| 15 Action row | inline | wraps |
| 16 IDX | 2-col (logo + text) | stack |

---

## Build sequence

### Phase A — Restructure (no new data needed)
1. Bump hero to 90vh + restructure overlay
2. Build `ListingAnchorNav.tsx`
3. Build `ListingStatsStrip.tsx`
4. Build `AgentMiniCard.tsx`
5. Restructure preview page to v2 layout
6. Build `LifestylePhotoStrip.tsx` (uses existing photos)
7. Build `RecentlyViewedStrip.tsx` (localStorage only)

### Phase B — Add data fields (Phase 1 of detail-spec.md)
8. Extend `Listing` type with the 17 missing fields
9. Build `ListingFloorPlanAndTour.tsx` (driven by virtual_tour_url + floor_plan_url)
10. Build `LocationIntelligence.tsx` (POI overlay using Google Places)

### Phase C — Analytics depth
11. Extend analytics layer with `comp_pool_distribution` + `area_monthly_*`
12. Rebuild `TheRead` with sparkline + bar chart (recharts)

### Phase D — Lead-conversion surfaces
13. Build `ScheduleShowingForm` (inline variant for sidebar)
14. Build `ScheduleShowingFull` (dark interlude with calendar)
15. Build `SaveButton` + localStorage save list

### Phase E — Documents (TBD)
16. Add `documents[]` to Listing schema (CMS-driven)
17. Build `ListingDocuments.tsx`

### Phase F — Polish
18. Replace `SimilarListingsStrip` with `SimilarListingsCarousel`

---

## What we keep, rebuild, drop

### Keep (consume narrative + listing data, polished as-is)
- `ListingHeroGallery` — extend for 90vh + status/gallery overlays
- `ListingStory` — uses narrative.story
- `KeyFeaturesGrid` — uses narrative.featureGroups
- `ListingEditorial` — uses narrative.editorial
- `ListingMap` — wrap inside `LocationIntelligence`
- `IDXComplianceFooter` — mandatory
- `StickyContact` — sticky pill (no change)
- `ShareButton`, `RequestTourCta` — same

### Rebuild
- `MockTheRead` → `TheRead` with charts
- `SimilarListingsStrip` → `SimilarListingsCarousel`
- Sidebar arrangement (Fact + Financial + Schools cards → Agent + ScheduleForm cards; facts move to stats strip; financial + schools become a sub-strip below editorial)

### Drop
- Inline beds/baths/sqft beside the price in fact sheet (replaced by stats strip)
- Inline "Listed by" in v1 footer area (consolidated into IDX footer)

### Add (new components)
- `ListingAnchorNav`
- `ListingStatsStrip`
- `AgentMiniCard`
- `LifestylePhotoStrip`
- `ListingFloorPlanAndTour`
- `LocationIntelligence`
- `ScheduleShowingForm` (sidebar)
- `ScheduleShowingFull` (dark interlude)
- `ListingDocuments`
- `SimilarListingsCarousel`
- `RecentlyViewedStrip`
- `SaveButton`
