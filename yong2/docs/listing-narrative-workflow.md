# Listing Narrative Workflow — Input/Output Contract

> Specification for the automated narrative-generation workflow that
> produces every prose surface on the listing-detail page. Source of
> truth for what the workflow takes in and what it must emit.
>
> Companion: `lib/listing-narrative.ts` (the typed shape) and
> `app/portfolio/preview/page.tsx` (the rendering reference).

---

## Why this exists

Every prose surface on the listing-detail page (lede, story, editorial
sub-sections, The Read commentary, feature-group categorization)
follows a fixed shape. No free-form artisanal copy per listing. This
makes the page automatable across hundreds of listings without
inviting visual or voice drift.

The workflow runs once per listing on data refresh; the page consumes
the cached output. It does not run at request time.

---

## Inputs

The workflow receives **per listing**:

| Input | Source | Used for |
|---|---|---|
| `Listing` (typed) | RDS `listing_records` post-normalization (`yong2/lib/types.ts`) | Facts: address, price, beds/baths/sqft, year built, lot, lat/lng, status |
| `feature_arrays` | ARMLS jsonb fields (interior_features, exterior_features, appliances, flooring, cooling, heating, pool_features, parking_features, architectural_style, construction_materials, roof, community_features, view_features) | Categorized into `featureGroups` |
| `comps_aggregate` | `lib/analytics/comps.ts` | The Read numerical block + `theRead.compsCommentary` interpretation |
| `area_aggregate` | `lib/analytics/area.ts` | The Read area numbers + `theRead.areaCommentary` interpretation |
| `community_profile` | `content/communities.ts` | Tone of `editorial.site` + community-specific phrasing |
| `metro_baseline` | rolling Phoenix-metro 12-month aggregate | Compared against area aggregate to write `theRead.areaCommentary` |

---

## Output

The workflow emits a `ListingNarrative` (defined in
`lib/listing-narrative.ts`). All required fields must be present;
optional fields can be omitted when the workflow lacks confidence.

### `summary` (required) — 1 sentence, 15-25 words

Used in OG meta + summary cards + as the lede on the detail page.

**Template intent**: open with the most distinctive facet of the
listing — usually a triple of (year + community + scale) or
(architectural style + parcel + view). Avoid superlatives that aren't
backed by specific facts.

**Examples**:
- ✅ `"A 2022 Horseshoe Canyon residence on 1.18 acres with western exposure to the McDowell ridge — six ensuite bedrooms across 7,206 square feet."`
- ❌ `"This stunning luxury home is a must-see for the discerning buyer."` (generic, no specifics)

### `story` (required) — 4 paragraphs, 50–80 words each

Fixed slot order: `lede → setting → interior → closing`.

| Slot | Intent | Mandatory facts |
|---|---|---|
| `lede` | Open with what makes this listing singular | Architectural style, year, community, scale |
| `setting` | Parcel, topography, view orientation | Lot acres, view direction, neighbors/cul-de-sac context |
| `interior` | Program (bedrooms, special rooms), materials | Bedroom count, bathroom configuration, kitchen, specialty rooms (wine, gym, casita) |
| `closing` | Showings policy, agent voice | "By appointment", "Yong personally accompanies", inquiry SLA |

The page renders the `lede` with a drop-cap; the `closing` paragraph
gets italicized stone-muted treatment.

### `editorial` (optional) — 4 fixed slots

| Slot | Heading rendered | Intent |
|---|---|---|
| `site` | "The site." | Site-level deep dive — parcel, topography, neighbors |
| `materials` | "Materials." | Materials chosen + why they were chosen |
| `program` | "Program." | Wing layout, bedroom split, special rooms |
| `presentation` | "Presentation." | Showings policy + agent voice |

Each slot is a single paragraph (60–120 words). Workflow fills the
slots it has confidence in. **Sparse listings render shorter editorial
blocks** rather than the workflow inventing content.

Headings come from the slot key — never from free-form text. This
keeps the visual rhythm consistent across listings.

### `theRead` (optional) — 1-sentence commentary

Two slots, both optional. The numerical block is rendered from the
analytics layer regardless; commentary is sugar that interprets the
numbers.

| Slot | Triggers | Template |
|---|---|---|
| `compsCommentary` | `\|delta\| > 2%` | "Priced [N]% above/beneath the active comp median, reflecting [lot premium / build vintage / size / view]" |
| `areaCommentary` | `\|YoY - metro_YoY\| > 1%` | "[Community] trended [+N%] YoY against a Phoenix metro baseline near [+M%] — the community has [outperformed / lagged] the broader market" |

Within ±tolerance, the workflow omits the slot rather than producing
weak boilerplate.

### `featureGroups` (required) — categorized chips

Workflow maps the 13 ARMLS jsonb arrays into the `FeatureGroupLabel`
enum (11 labels). Mapping is deterministic — no per-listing label
invention. Empty groups are omitted from the array.

**Mapping rules** (the workflow's categorization step):

| ARMLS source | Feature group label | Notes |
|---|---|---|
| `architectural_style` | `Architecture` | direct mapping |
| `interior_features` (curated subset) | `Interior` | filter for marketing-grade items only |
| `interior_features` (kitchen-tagged subset) | `Kitchen` | items mentioning Gaggenau / Wolf / Subzero / island |
| `interior_features` (primary-suite-tagged subset) | `Primary Suite` | items mentioning master / dressing / walk-in |
| `exterior_features` + `pool_features` | `Exterior` | combined |
| `view_features` | `Views` | direct |
| `parking_features` | `Garage` | filter for garage-related items |
| (community section if present) | `Guest` | casita / guest-house items |
| `community_features` | `Community` | direct |
| `construction_materials` + `roof` | `Construction` | combined |
| `cooling` + `heating` | `Climate` | combined |

Categorization confidence: workflow uses a curated keyword dictionary
to assign each raw feature to its group. If a feature's group is
ambiguous, default to `Interior` (broadest bucket).

---

## What the workflow MUST NOT do

- Invent facts not present in the source data
- Write superlatives ("stunning", "must-see", "one-of-a-kind") unless
  backed by a specific number
- Vary heading text across listings (fixed slot enums only)
- Mention specific dollar prices in the `story` paragraphs (already
  surfaced as a structured field)
- Reference photos in the prose (the prose stands on its own; photos
  are a parallel surface)

---

## Versioning

When the shape changes:

1. Bump `LISTING_NARRATIVE_VERSION` (to be added to
   `lib/listing-narrative.ts`)
2. Re-run the workflow against all listings
3. Cache invalidate

The narrative cache is keyed on `listing_key` + version — old
versions are served until re-rendered.

---

## Mock vs. real

The mock at `app/portfolio/preview/page.tsx` consumes
`MOCK_NARRATIVE` from `lib/listing-narrative.ts`. When the workflow
ships:

1. Replace `MOCK_NARRATIVE` import with `getNarrativeFor(listing.listingKey)`
2. Delete the `MOCK_NARRATIVE` constant (keep types)
3. Delete `app/portfolio/preview/`

Until then, `MOCK_NARRATIVE` IS the contract example — it
demonstrates the exact shape and tone the workflow must produce.
