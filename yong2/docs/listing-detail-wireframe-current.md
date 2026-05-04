# Listing Detail — Full Wireframe + Data Map

> Visual layout, per-section data inventory, and analytics events
> for every surface on `/portfolio/[slug]`. Source-of-truth for what
> renders where and what feeds it.
>
> Companions: `listing-detail-spec.md` (Yong Premium → Jeane pattern
> mapping), `listing-narrative-workflow.md` (the automated
> narrative-generation contract), `listing-detail-shape.md` (when
> created — types).

---

## Page anatomy

```
0   Navigation chrome (sticky, transparent over hero)
0a  Preview ribbon (PREVIEW PAGE ONLY — gold strip, fixed)
0b  Sticky contact pill (after scrollY > 32vh)
─────────────────────────────────────────────────────────────
1   HERO GALLERY                         80vh / min 560px
2   STORY + SIDEBAR                      auto
    2a  Summary lede (italic serif, large)
    2b  4-paragraph story (drop-cap lede)
    2c  Fact sheet (price + 7 specs)
    2d  Financial details (HOA / tax / parcel / county)
    2e  Schools (3 rows)
3   KEY FEATURES GRID                    11 chip groups, canonical order
4   EDITORIAL SUB-SECTIONS               0–4 slot-filled paragraphs
5   THE READ — ANALYTICS                 numerical block + 0–2 commentary lines
6   LOCATION + MAP                       split layout, privacy note
7   SCHEDULE A SHOWING                   inline form OR CTA-only
8   SIMILAR LISTINGS                     3-card grid
9   ACTION ROW                           ← Portfolio · Call · Share · Tour
10  IDX COMPLIANCE FOOTER                ARMLS attribution + reciprocity
11  Site footer
```

---

## Section 1 — Hero gallery

### Desktop (≥ md)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                                                             │
│             [Hero photo, full-bleed, 80vh]                  │
│                                                             │
│                                                             │
│                                                             │
│  SILVERLEAF · SCOTTSDALE                                    │
│                                                             │
│  10845 E Silverleaf Ridge Way                              │ ◀ display-xxl serif
│  Scottsdale, AZ 85255                                       │
│                                                             │
│  $8,950,000   6 bd · 7 ba · 7,206 sf · 1.2 ac              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
┌──────────┬──────────┬──────────┬──────────┐
│  thumb 1 │  thumb 2 │  thumb 3 │  +N PHOTOS│  ◀ 4-up thumb strip below hero
└──────────┴──────────┴──────────┴──────────┘
```

### Mobile (< md)

```
┌──────────────────────────┐
│                          │
│                          │
│  [photos, snap-x scroll] │ ◀ horizontal swipe gallery
│                          │
│  N photos · swipe        │ ◀ count badge
│                          │
└──────────────────────────┘
SILVERLEAF · SCOTTSDALE
10845 E Silverleaf
Ridge Way
Scottsdale, AZ 85255
$8,950,000
6 bd · 7 ba · 7,206 sf
```

### Data inventory

| Field | Source | Required | Fallback if missing |
|---|---|---|---|
| `coverPhotoUrl` + `photos[]` | `Listing.photos` (S3 active-snapshot mapper) | Yes | Empty section: ink-elevated background, overlay only |
| `unparsedAddress` | `Listing.unparsedAddress` | Yes | `${streetNumber} ${streetName} ${streetSuffix}` |
| `community` / `subdivisionDisplay` | `Listing.communityName` ?? `subdivisionDisplay` ?? `city` | Yes | `city` always present |
| `city`, `postalCode` | `Listing` | Optional | Hide line |
| `listPrice` | `Listing.listPrice` | Optional | "Price Upon Request" |
| Quick stats (beds/baths/sqft/lot) | `Listing.bedrooms`, `bathroomsTotal`, `livingArea`, `lotAcres` | Optional | Stat omitted from join row |
| `status` | `Listing.status` | Yes | always present from ARMLS |
| `listingId` | `Listing.listingId` | Yes | "MLS#" small caps top-right |

### Component
`components/portfolio/ListingHeroGallery.tsx`

### Analytics
- `data-track="hero"` on the section
- `gallery_open` fires on hero / thumb / "+N photos" click with `{listingKey, initialIndex}`

---

## Section 2 — Story + Sidebar

### Desktop (≥ md, 1.3fr / 1fr split)

```
┌──────────────────────────────────────┬──────────────────────┐
│ A 2022 Horseshoe Canyon residence    │  ┌────────────────┐  │
│ on 1.18 acres with western exposure  │  │ LIST PRICE     │  │
│ to the McDowell ridge — six ensuite  │  │ $8,950,000     │  │ ◀ ListingFactSheet
│ bedrooms across 7,206 sf.            │  │ ─────────────  │  │
│                                      │  │ Bedrooms    6  │  │
│ A study in restrained modernism on   │  │ Bathrooms   7  │  │
│ one of Silverleaf's most coveted     │  │ Interior 7,206 │  │
│ Horseshoe Canyon parcels...          │  │ Lot      1.18a │  │
│                                      │  │ Year      2022 │  │
│ Sited at the back of a discreet      │  │ MLS#  6900001  │  │
│ cul-de-sac on 1.18 acres...          │  │ Status  Active │  │
│                                      │  └────────────────┘  │
│ Six ensuite bedrooms across two      │                      │
│ wings, anchored by a primary suite   │  ┌────────────────┐  │
│ with private courtyard...            │  │ FINANCIAL & LE-│  │ ◀ ListingFinancialDetails
│                                      │  │ HOA $985/mo    │  │
│ Offered furnished... Shown by        │  │ Tax $28,400/yr │  │
│ appointment... [italic-muted closing]│  │ County Maricopa│  │
│                                      │  │ Parcel 217-65… │  │
│                                      │  └────────────────┘  │
│                                      │                      │
│                                      │  ┌────────────────┐  │
│                                      │  │ SCHOOLS        │  │ ◀ ListingSchoolsBlock
│                                      │  │ Elem  Copper R │  │
│                                      │  │ Mid   Copper R │  │
│                                      │  │ HS    Scott U  │  │
│                                      │  └────────────────┘  │
└──────────────────────────────────────┴──────────────────────┘
```

### Mobile (< md, single column stack)

```
[summary lede]
[story 4 paragraphs]
[fact sheet card]
[financial card]
[schools card]
```

### Data inventory

| Field | Source | Required | Fallback |
|---|---|---|---|
| **Summary lede (2a)** |  |  |  |
| `summary` | `ListingNarrative.summary` | Yes | Use first sentence of `Listing.publicRemarks` |
| **Story (2b)** |  |  |  |
| `story.lede` | `ListingNarrative.story.lede` | Yes | first 50-80 words of `publicRemarks` |
| `story.setting` | `ListingNarrative.story.setting` | Yes | next 50-80 words of `publicRemarks` |
| `story.interior` | `ListingNarrative.story.interior` | Yes | next 50-80 words |
| `story.closing` | `ListingNarrative.story.closing` | Yes | last 50-80 words OR boilerplate showings clause |
| **Fact sheet (2c)** |  |  |  |
| `listPrice` | `Listing` | Yes | "Price Upon Request" |
| `bedrooms`, `bathroomsTotal`, `livingArea`, `lotAcres`, `yearBuilt`, `listingId`, `status` | `Listing` | Per-row optional | row hidden if value null |
| **Financial (2d)** |  |  |  |
| `associationYn`, `associationFee`, `associationFeeFrequency` | `Listing` (added in Phase 1) | Optional | hide HOA row |
| `taxAnnualAmount` | `Listing` (added in Phase 1) | Optional | hide tax row |
| `county` | `Listing.county` | Optional | hide county row |
| `parcelNumber` | `Listing` (added in Phase 1) | Optional | hide parcel row |
| **Schools (2e)** |  |  |  |
| `elementarySchool`, `middleOrJuniorSchool`, `highSchoolDistrict` | `Listing` (added in Phase 1) | Optional | render empty if all 3 null |

### Components
- `components/portfolio/ListingStory.tsx`
- `components/portfolio/ListingFactSheet.tsx`
- `components/portfolio/ListingFinancialDetails.tsx`
- `components/portfolio/ListingSchoolsBlock.tsx`

### Analytics
- `data-track="facts"` on the grid container
- No fire-on-view events from this section (engagement via scroll-depth)

---

## Section 3 — Key features grid

### Desktop (≥ md)

```
─── FEATURES & AMENITIES ─────────────────────────────────────

  ARCHITECTURE      [Contemporary] [Glass + Stone] [Single-Story Wings]
  INTERIOR          [12-Foot Ceilings] [Heated Limestone] [Folding Glass]
                    [Wet Bar] [Wine Room] [Catering Pantry] [Smart Home]
  KITCHEN           [Gaggenau] [Subzero] [Wolf 6-Burner] [Marble Island]
  PRIMARY SUITE     [Private Courtyard] [Dual Baths] [Dressing Room]
                    [Steam Shower] [Soaking Tub]
  EXTERIOR          [Infinity-Edge Pool 70ft] [Outdoor Kitchen] [Fire]
                    [Bocce Court] [Putting Green]
  VIEWS             [McDowell Mountains] [Pinnacle Peak] [City Lights]
  GARAGE            [4-Car Climate-Controlled] [EV Charging × 2]
  GUEST             [Detached Casita 1 BR/1 BA] [Private Entrance]
  COMMUNITY         [24/7 Manned Gates] [Member-Only Trails]
  CONSTRUCTION      [Steel + Concrete Frame] [Standing-Seam Roof]
  CLIMATE           [Zoned Geothermal] [Whole-House Filtration]
```

### Mobile

Same flow, chips wrap freely. Caps label still left-aligned, chips
flow right then wrap to next line.

### Data inventory

| Field | Source | Required | Fallback |
|---|---|---|---|
| `featureGroups` | `ListingNarrative.featureGroups` | Yes (can be empty array) | If empty array, section not rendered |

Each `FeatureGroup` is `{ label: FeatureGroupLabel, items: string[] }`.
Workflow categorizes ARMLS source arrays (interior_features,
exterior_features, appliances, flooring, cooling, heating,
pool_features, parking_features, architectural_style,
construction_materials, roof, community_features, view_features) into
the fixed 11-label enum per the rules in
`listing-narrative-workflow.md`.

### Component
`components/portfolio/KeyFeaturesGrid.tsx`

### Analytics
- `data-track="features"` on the section
- `feature_chip_click` (future) on individual chip click — current
  chips are non-interactive; can become filter-launchers later

---

## Section 4 — Editorial sub-sections

### Desktop (≥ md)

```
─── A CLOSER LOOK ────────────────────────────────────────────

  *The site.*        ◀ italic-serif gold heading

  One of the last elevated parcels in Horseshoe Canyon to come
  to market. The 1.18-acre lot sits at the back of a discreet
  cul-de-sac with no through-traffic and unobstructed western
  exposure...

  *Materials.*

  Limestone flooring sourced from a single European quarry.
  Walnut millwork by a Salt Lake atelier. Board-formed
  concrete walls poured in place...

  *Program.*

  Two wings split family from guest. Primary on its own wing —
  private courtyard, dual baths, dedicated dressing...

  *Presentation.*

  Shown by appointment. Yong personally accompanies every
  qualified showing...
```

### Mobile

Single column, same flow.

### Data inventory

| Slot | Source | Required | Heading rendered |
|---|---|---|---|
| `editorial.site` | `ListingNarrative.editorial.site` | No | "The site." |
| `editorial.materials` | `ListingNarrative.editorial.materials` | No | "Materials." |
| `editorial.program` | `ListingNarrative.editorial.program` | No | "Program." |
| `editorial.presentation` | `ListingNarrative.editorial.presentation` | No | "Presentation." |

If all 4 slots null → section not rendered. Slots render in fixed
order regardless of which are present.

### Component
`components/portfolio/ListingEditorial.tsx`

### Analytics
- `data-track="editorial"` on the section

---

## Section 5 — The Read (analytics)

### Desktop (≥ md, 2-col grid)

```
┌─── THE READ ────────────────────────────────────────────────┐
│                                                             │
│  *How this property reads against the active market — and   │
│  the area at large.*  ◀ italic serif sub-headline           │
│                                                             │
├──────────────────────────┬──────────────────────────────────┤
│ VS. ACTIVE COMPS         │ SILVERLEAF · LAST 12 MONTHS      │
│                          │                                  │
│ 9 active comparables —   │ Aggregate market signal for      │
│ same community, same     │ the immediate area.              │
│ property type, ±20% size │                                  │
│ band.                    │                                  │
│                          │                                  │
│ SUBJECT PRICE / SQFT     │ MEDIAN DAYS ON MARKET            │
│ $1,242                   │ 42 days                          │
│ ─────────────────        │ ─────────────────────            │
│ COMP MEDIAN / SQFT       │ MONTHS OF SUPPLY                 │
│ $1,085                   │ 3.8 mo                           │
│ ─────────────────        │ ─────────────────────            │
│ POSITION VS. COMPS       │ YOY MEDIAN PRICE                 │
│ +14.5% (gold)            │ +8.2% (gold)                     │
│                          │                                  │
│ │ Priced 14.5% above the │ │ Silverleaf trended +8.2% YoY   │
│ │ active comp median —   │ │ against a Phoenix metro        │
│ │ consistent with the lot│ │ baseline near +3.0% — the      │
│ │ premium...             │ │ community has outperformed...  │
│                          │                                  │
└──────────────────────────┴──────────────────────────────────┘

SOURCE · ARMLS SPARK · REFRESHED HOURLY
```

Commentary blockquotes (the `│` boxes) are rendered as left-rule gold
sentences under each numerical column.

### Mobile

Two columns stack vertically. Numbers stay legible at any width.

### Data inventory

| Field | Source | Required | Fallback |
|---|---|---|---|
| `subjectPpsf` | `Listing.pricePerSqft` (derived from listPrice/livingArea) | Yes | section not rendered if null |
| `compMedianPpsf` | `comps_aggregate.medianPpsf` (analytics layer) | Yes | section not rendered if null |
| `compPoolSize` | `comps_aggregate.count` | Yes | "≥1 comp" floor — workflow filters before display |
| `areaMedianDom` | `area_aggregate.medianDom` | Yes | section not rendered if null |
| `areaMonthsOfSupply` | `area_aggregate.monthsOfSupply` | Yes | hide row if null |
| `areaYoYPriceChangePct` | `area_aggregate.yoyMedianPriceChangePct` | Yes | hide row if null |
| `areaLabel` | derived from `Listing.communityName` ?? `regionName` | Yes | "the area · last 12 months" |
| `compsCommentary` | `ListingNarrative.theRead.compsCommentary` | No | hide blockquote |
| `areaCommentary` | `ListingNarrative.theRead.areaCommentary` | No | hide blockquote |

### Component
`components/portfolio/MockTheRead.tsx` → rename to `TheRead.tsx`
when wired to analytics.

### Analytics
- `data-track="the-read"`, `data-testid="the-read"`
- `the_read_view` (after 2s in viewport) — high-intent signal

---

## Section 6 — Location + Map

### Desktop (≥ md)

```
LOCATION

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              [Interactive map, MapTiler tiles]              │
│              centered on listing.lat/lng                    │
│              gold-pin marker on subject                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Precise address shared with qualified buyers following inquiry.
Showings by appointment only.
```

### Mobile

Map full-width, ~50vh tall on mobile.

### Data inventory

| Field | Source | Required | Fallback |
|---|---|---|---|
| `latitude`, `longitude` | `Listing` | Yes | section not rendered if either null |
| `unparsedAddress` | `Listing` | Yes | aria-label only |

### Component
`components/portfolio/ListingMap.tsx`

### Analytics
- `data-track="map"` on the section
- `map_zoom`, `map_pan` from MapPanel internals

---

## Section 7 — Schedule a Showing (TODO — Phase 2)

### Desktop wireframe (intent)

```
═══════════════════════════════════════════════════════════════
SCHEDULE A SHOWING                                           ◀ dark-bg interlude
═══════════════════════════════════════════════════════════════

PRIVATE TOURS                       ┌────────────────────────┐
BY APPOINTMENT.                     │ Your name              │
                                    │ ───────────────────    │
For qualified buyers and their      │                        │
representatives.                    │ Email                  │
                                    │ ───────────────────    │
PREFER TO SPEAK DIRECTLY            │                        │
(480) 555-1234                      │ Phone (optional)       │
                                    │ ───────────────────    │
                                    │                        │
                                    │ Preferred date         │
                                    │ [date picker]          │
                                    │                        │
                                    │ [    REQUEST TOUR  →  ]│
                                    └────────────────────────┘
```

### Data inventory

| Field | Source | Required | Fallback |
|---|---|---|---|
| (form inputs) | user-supplied | n/a | client-side validation |
| Tel link | `siteContent.contact.mobileHref` | static | n/a |
| Tour-request POST target | `/api/contact` | server | error toast on failure |

### Component
`components/portfolio/ScheduleShowingForm.tsx` — TBD. Until built,
the action row at the bottom of the page (with `RequestTourCta`)
serves as the lightweight equivalent.

### Analytics
- `cta_request_tour_click` `{listingKey, surface: 'inline'}`
- `tour_form_submit_attempt` / `_success` / `_failure`

---

## Section 8 — Similar listings

### Desktop (≥ md, 3-col grid)

```
OTHER OFFERINGS                              VIEW ALL LISTINGS →
You may also consider.

┌──────────────┬──────────────┬──────────────┐
│              │              │              │
│  [photo 4:5] │  [photo 4:5] │  [photo 4:5] │
│              │              │              │
│              │              │              │
│ WHISPER ROCK │ DESERT MTN   │ PARADISE V   │
│ 10220 E Whis │ 37210 N Cave │ 6045 N 47th  │
│ $7,400,000   │ $9,950,000   │ $11,500,000  │
│ 5 bd · 6 ba  │ 6 bd · 7 ba  │ 7 bd · 9 ba  │
└──────────────┴──────────────┴──────────────┘
```

### Mobile

3 cards stack vertically. Same shape.

### Data inventory

| Field | Source | Required | Fallback |
|---|---|---|---|
| 3 similar listings | `getSimilarListings(listing, 3)` (TBD query) | Optional | section not rendered |

Selection logic for `getSimilarListings`:
- Same `communitySlug` first; fall back to same `regionSlug`
- ±20% price tier
- Active status only
- Order by closest price match
- LIMIT 3

### Component
`components/portfolio/SimilarListingsStrip.tsx`

### Analytics
- `data-track="similar"` on the section
- `similar_listing_click` `{from: listingKey, to: listingKey, position}` on tile click

---

## Section 9 — Action row

### Desktop (≥ md)

```
─────────────────────────────────────────────────────────────────

← THE PORTFOLIO        CALL YONG    [ SHARE ]   [REQUEST PRIVATE TOUR →]
```

### Mobile

Wraps onto two rows; each control still touch-friendly (≥44×44).

### Data inventory

| Element | Source | Notes |
|---|---|---|
| Back link | static `/portfolio` | always present |
| Call link | `tel:+14805551234` | static for now; pull from siteContent |
| Share | `ShareButton` (Web Share API + clipboard fallback) | dynamic URL |
| Request tour | `RequestTourCta` → `/contact?listing=...&interest=Buying` | always present |

### Components
- `Link` (back)
- `<a href="tel:...">` (call)
- `components/portfolio/ShareButton.tsx`
- `components/portfolio/RequestTourCta.tsx`

### Analytics
- `cta_call_click` `{listingKey, surface: 'inline'}`
- `cta_share_click` `{method: 'navigator' | 'clipboard', listingKey}`
- `cta_request_tour_click` `{listingKey, surface: 'inline'}`

---

## Section 10 — IDX compliance footer

### Desktop (≥ md)

```
═══════════════════════════════════════════════════════════════

┌────────┐
│ ARMLS  │   Listed by Yong Choi, Russ Lyon Sotheby's
│  IDX   │   International Realty.
└────────┘   Agent: (480) 555-1234 · Office: (480) 287-5200

             Listing information © 2026 Arizona Regional MLS.
             All rights reserved. Last updated: Apr 29, 2026.

             Broker Reciprocity: The data relating to real estate
             for sale on this website comes in part from the
             Arizona Regional Multiple Listing Service. Real estate
             listings held by brokerage firms other than Russ Lyon
             Sotheby's International Realty are marked with the
             ARMLS IDX logo. All information is believed accurate
             but is not guaranteed and should be independently
             verified. IDX information is provided exclusively for
             personal, non-commercial use...
```

### Mobile

Logo on top, text stacks below.

### Data inventory — MANDATORY for ARMLS compliance

| Field | Source | Required | Compliance role |
|---|---|---|---|
| ARMLS IDX logo | static asset | Yes | Required by ARMLS § IDX display rules |
| `listAgentName` | `Listing.listAgentName` | Yes | Listing agent attribution |
| `listOfficeName` | `Listing.listOfficeName` (Phase 1 add) | Yes | Brokerage attribution |
| `agentCellPhone` | `Listing.agentCellPhone` (Phase 1 add) | Required ≥12px | Contact info — required by ARMLS |
| `listOfficePhone` | `Listing.listOfficePhone` (Phase 1 add) | Required ≥12px | Contact info — required by ARMLS |
| `modificationTimestamp` | `Listing.modificationTimestamp` | Yes | "Last updated" line |
| Reciprocity notice | hardcoded string | Yes | Required exact-language disclosure |
| Brokerage name | `siteContent.brokerage` | Yes | Used in reciprocity text |

### Component
`components/portfolio/IDXComplianceFooter.tsx`

### Compliance notes
- Text must be **≥ 12px** to meet ARMLS readability rules
- Logo must appear "near the listing data" — placement at page bottom is acceptable per ARMLS guidance
- **$21K fine per occurrence** for violations (per the platform's
  recent ARMLS compliance audit). Do not modify copy without
  IDX/legal review.

---

## Cross-cutting concerns

### Performance budgets

| Surface | Budget | How |
|---|---|---|
| LCP image (hero) | < 1000ms | `priority` + `fetchPriority="high"` + `quality={70}` |
| Hero image weight | < 280KB | source resized to 2560 max + AVIF/WebP via Next/Image |
| Initial bundle | < 250KB JS | dynamic-import for MapLibre, terra-draw, lightbox |
| TTFB (cold) | < 700ms | ISR `revalidate=3600`; warm CDN |
| Total page weight | < 2MB | photos lazy-loaded after hero |

### Accessibility

- Hero photo: `alt=""` (decorative); page h1 carries the meaning
- Lightbox: keyboard nav (← → Esc), focus trap, `aria-modal="true"`
- Sticky pill: `role="region"`, `aria-label="Contact Yong about this listing"`
- All buttons: descriptive `aria-label` where icon-only
- Form fields: `<label>` association
- Color contrast: stone on ink-elevated/40 = 7.4:1 (WCAG AAA)

### Analytics events (full list)

Fired from this page, all gated on consent:

| Event | Trigger | Properties |
|---|---|---|
| `listing_view` | Page mount | `{listingKey, source}` |
| `listing_view_long` | 30s in tab | `{listingKey}` |
| `gallery_open` | Hero/thumb/lightbox click | `{listingKey, initialIndex}` |
| `gallery_advance` | Lightbox next/prev | `{listingKey, fromIndex, toIndex}` |
| `the_read_view` | TheRead 2s in viewport | `{listingKey}` |
| `map_zoom`, `map_pan` | Map internals | `{listingKey, zoom}` |
| `similar_listing_click` | Similar tile click | `{from, to, position}` |
| `cta_call_click` | Call link | `{listingKey, surface}` |
| `cta_share_click` | Share | `{method, listingKey}` |
| `cta_request_tour_click` | Tour CTA | `{listingKey, surface}` |
| `scroll_depth_25/50/75/100` | Scroll | `{pathname}` |

### Mobile sticky-contact pill

Bottom-right circular phone pill once `scrollY > 32vh`. Tapping
expands to a bottom-sheet with Call + Tour. Mirror pattern of the
cookie consent pill (consistent mobile-pattern language).

---

## Build status

| Section | Live? | Component | Notes |
|---|---|---|---|
| Hero gallery | ✅ | `ListingHeroGallery` | 80vh; lightbox working; mock photos render |
| Story + sidebar | ✅ | `ListingStory` + `ListingFactSheet` + `ListingFinancialDetails` + `ListingSchoolsBlock` | Consumes narrative shape |
| Key features grid | ✅ | `KeyFeaturesGrid` | 11-label canonical order |
| Editorial sub-sections | ✅ | `ListingEditorial` | 4 slot keys → headings |
| The Read analytics | ✅ (mock) | `MockTheRead` | Rename + wire to analytics layer when ready |
| Location + map | ✅ | `ListingMap` | MapTiler tiles |
| Schedule a Showing form | ❌ TBD | `ScheduleShowingForm` (build in Phase 2) | Action-row CTA serves until then |
| Similar listings | ✅ (mock) | `SimilarListingsStrip` | Wire `getSimilarListings` query when DB ready |
| Action row | ✅ | various | Polished |
| IDX compliance footer | ✅ | `IDXComplianceFooter` | ARMLS attribution + reciprocity |
| Sticky contact pill | ✅ | `StickyContact` | After-scroll trigger |

### Blocking on data layer
- All `Listing.*` fields beyond what's currently in `lib/types.ts` (Phase 1 backlog adds 17 fields — see `listing-detail-spec.md`)
- `comps_aggregate` + `area_aggregate` queries (analytics layer)
- `getSimilarListings(listing, n)` query

### Blocking on narrative workflow
- Per-listing `ListingNarrative` cache (`getNarrativeFor(listingKey)`)
- Categorization step (raw ARMLS arrays → `featureGroups`)
- Templated commentary lines for The Read

### Blocking on neither (can ship now)
- `ScheduleShowingForm` build (form already validated in `ContactForm` pattern)
- `RecentlyViewed` (localStorage-only)
- `SeoLinkGrid` (programmatic from `content/communities.ts`)
