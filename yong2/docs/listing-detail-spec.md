# Listing Detail — Data Capture + Design Pattern

> Source-of-truth spec for the polished listing-detail page in yong2.
> Captured from `apps/premium-site` (Yong's existing production site)
> and `Jeane/jeane-site` (parallel agent site, more polished detail UI).
> Dated 2026-05-04.

---

## Part 1 — Data inventory (Yong Premium)

`real-estate-platform/apps/premium-site/app/(routes)/listings/[slug]/page.tsx`
(444 lines, monolithic) reads these fields from `fetchListingDetail()` +
`fetchListingPhotos()`. **All of these need to flow through yong2's
`Listing` type when the data layer ships** so the polished detail can
render every section.

### Identifiers
| Field | Type | Use |
|---|---|---|
| `listing_key` | string | ARMLS unique key — permalink lookup |
| `listing_id` | string | Public MLS# shown to humans (footer + back-bar) |
| `slug` | string | URL slug — derived from address + listing_id |
| `standard_status` | enum | Active / Pending / Coming Soon / etc. — status badge |
| `modification_timestamp` | ISO date | "Last updated" line in IDX footer |

### Address
| Field | Use |
|---|---|
| `unparsed_address` | h1 headline |
| `street_number`, `street_name`, `street_suffix` | Composed fallback if unparsed missing |
| `city`, `state_or_province`, `postal_code` | Address sub-line |
| `county_or_parish` | Property Details row |
| `subdivision_name` | Kicker / area label above headline |
| `latitude`, `longitude` | Map placement |

### Pricing
| Field | Use |
|---|---|
| `list_price` | Display price (formatPrice). Falls back to "Price Upon Request" |
| `days_on_market` | Inline next to price |
| `price_per_sqft` | Derived; quick stat (often hidden until shown) |

### Beds / Baths / Size
| Field | Use |
|---|---|
| `bedrooms_total` | Quick stat: "6 Bed" |
| `bathrooms_total_integer` | Quick stat: "8 Bath" |
| `bathrooms_full`, `bathrooms_half` | More precise breakdown if needed |
| `living_area` | Quick stat: "11,420 SF" |
| `year_built` | Quick stat: "Built 2019" |
| `stories_total` | Quick stat: "2 Story" |
| `garage_spaces` | Quick stat: "4-Car Garage" |
| `lot_size_acres`, `lot_size_square_feet` | `formatLotSize()` → "3.20 ac" or "12,500 SF" |

### Type
| Field | Use |
|---|---|
| `property_type` | Property Details row |
| `property_sub_type` | Property Details row |

### Description
| Field | Use |
|---|---|
| `public_remarks` | Full prose paragraph; main editorial body |

### Photos (separate fetch)
| Field | Use |
|---|---|
| `photo.media_url[]` | Hero gallery; lightbox set |
| (`photos[0]`) | Cover for cards + OG image |

### Feature arrays (JSONB, may need parsing)
Each rendered as a chip group with caps gold label + chip cards:
- `interior_features`
- `exterior_features`
- `appliances`
- `flooring`
- `cooling`
- `heating`
- `pool_features`
- `parking_features`
- `architectural_style`
- `construction_materials`
- `roof`
- `community_features`
- `view_features`

### Financial / Legal
| Field | Use |
|---|---|
| `association_yn`, `association_fee`, `association_fee_frequency` | "HOA: $1,200/mo" |
| `tax_annual_amount` | "Tax: $24,500/yr" |
| `parcel_number` | Property Details row |
| `pool_private_yn` | "Pool: Private" boolean row |

### Schools
| Field | Use |
|---|---|
| `elementary_school` | Schools block |
| `middle_or_junior_school` | Schools block |
| `high_school_district` | Schools block |

### Listing source (IDX compliance — required, ≥12px, contact info shown)
| Field | Use |
|---|---|
| `list_agent_full_name` | "Listed by: …" attribution |
| `list_office_name` | Brokerage name |
| `agent_cell_phone` | Compliance contact info |
| `list_office_phone` | Compliance contact info |

### Compliance footer (mandatory)
- ARMLS IDX logo
- Copyright + last-updated timestamp
- Broker reciprocity notice (full prose paragraph)

---

## Part 2 — Jeane's representation pattern

`Jeane/jeane-site/app/listings/[slug]/page.tsx` (314 lines, decomposed
into 6 ordered sections + 4 reusable components: `ListingHero`,
`GalleryLightbox`, `DetailMapWrapper`, `ShowingScheduler`).

### Section order (top → bottom)

1. **HERO** (`ListingHero` component)
   - Full-bleed photo, **85svh / 560px min**, ken-burns animation
   - Dark gradient overlays for legibility
   - Status badge top-left
   - "View Gallery · N" button top-right (opens lightbox)
   - **Bottom-left**: caps kicker `{neighborhood} · {city}, {state}` + display title (text-display, up to 7xl)
   - **Bottom-right**: italic-script price (3xl-5xl) + beds/baths/sqft sub-line
   - **Below hero**: 4-thumb strip (clickable, opens lightbox at index)

2. **STORY + FEATURES + INQUIRE** (single padded section, 2-col grid `1.5fr 1fr`)
   - **Left column (article)**:
     - Caps eyebrow "About this residence"
     - Display heading = `summary` (one-line punchy summary, *not* the full prose)
     - 3 description paragraphs (first one in charcoal, rest in muted)
     - Editorial sub-sections (optional): each is `italic-cormorant heading + body paragraph`. Used for narrative depth — siting, materials, program, presentation.
     - Share row: 3 social icons (Facebook, X, Email) in hairline buttons
   - **Right sidebar**:
     - Caps eyebrow "Key features"
     - Hairline-bulleted list of 5-6 marketing-language features (NOT the raw ARMLS feature arrays — *editorialized*)
     - dl with year_built, lot_acres, mls_id (mono font)
     - Inquire CTA card: caps eyebrow + body + "Inquire Now" outline button + "Or call 480…" tel link

3. **LOCATION + REAL MAP** (cream-soft bg, 2-col grid `1fr 1.8fr`)
   - **Left**: caps "Location" + display "City, State" (state in teal accent) + dl (Neighborhood, Address) + privacy note ("Precise address shared with qualified buyers...")
   - **Right**: interactive map (`DetailMapWrapper` — wraps a real map component)

4. **SCHEDULE A SHOWING** (charcoal/dark bg, 2-col grid `1fr 1.2fr`)
   - **Left**: caps "Schedule a showing" + display "Private tours by appointment." + body + tel link
   - **Right**: `ShowingScheduler` form

5. **SIMILAR LISTINGS** (cream bg, 3-col grid)
   - Header row: caps "Other offerings" + display "You may also consider." + "View All Listings" link
   - 3 `ListingCard` tiles

6. **Recently viewed** (localStorage-driven horizontal strip)

7. **SEO link grid** (programmatic location/community links for SEO)

### Design language patterns
- **Hairline rules** (`hairline` utility) replace all heavy borders
- **Italic-script accents** (`text-script italic`) for prices, headings, editorial leads
- **Caps eyebrows** (`text-label`) at the start of every block
- **Dark section interlude** between bright sections (the dark scheduler block) to break the page rhythm
- **Sticky-only on the right sidebar** during the long story section
- **No multi-CTA stacking** — one quiet CTA per section, with optional tel-link as secondary
- **Neighborhood-driven SEO** at the bottom (recently viewed + link grid)

### Components used
| Component | Purpose |
|---|---|
| `ListingHero` | Hero + gallery thumb strip (client) |
| `GalleryLightbox` | Render-prop wrapper that exposes `openAt(i)` |
| `DetailMapWrapper` | Real map (MapLibre/Mapbox via dynamic import) |
| `ShowingScheduler` | Multi-step inquiry form |
| `ListingCard` | Similar-listings tile |
| `SeoLinkGrid` | Bottom programmatic-SEO link grid |
| `RecentlyViewed` | localStorage-backed horizontal strip |

---

## Part 3 — Mapping to yong2

### Yong's listing data → Jeane's sections

| Jeane Section | Where Yong's data lives |
|---|---|
| Hero kicker | `subdivisionDisplay` ?? `communityName` ?? `city` |
| Hero title | `unparsedAddress` |
| Hero price (script italic) | `formatPrice(listPrice)` |
| Hero stats | `bedrooms`, `bathroomsTotal`, `livingArea`, `lotAcres` |
| Hero status badge | `status` |
| Hero gallery | `photos[]` |
| Story summary (one-line) | First sentence of `publicRemarks` (auto) OR a content-side override field if we add one |
| Story description paragraphs | Rest of `publicRemarks`, split on sentence boundary into 2-3 chunks |
| Story editorial sub-sections (optional) | NEW content-side override field — Yong / listing-prep team writes these manually for top listings only |
| Sidebar key features | EDITORIALIZED features — for now, top 5-6 from concatenated `interior_features + exterior_features + view_features` filtered for marketing-grade language. Better: content-side override per listing. |
| Sidebar dl | `yearBuilt`, `lotAcres`, `listingId` |
| Sidebar inquire CTA | Same `RequestTourCta` we already have |
| Location heading | `city, state` |
| Location dl | Neighborhood (`communityName`/`subdivisionDisplay`), Address (`unparsedAddress`) |
| Location map | `latitude`, `longitude` → existing `ListingMap` component |
| Schedule showing form | NEW component — `ListingInquiryForm` modeled on Jeane's `ShowingScheduler` |
| Similar listings | 3 listings filtered by community OR price tier |
| IDX compliance footer | NEW — Yong Premium has it but yong2 doesn't yet. Required: ARMLS logo, last-updated, reciprocity notice. |

### Gaps yong2 needs to fill (build order)

1. **Editorial summary line** — derive from `publicRemarks.split('.')[0]` for now; add `summary?: string` to a `content/listing-overrides.ts` for hand-curated listings later.
2. **Editorial sub-sections** — optional `editorial?: { heading, body }[]` on the same content-side override map.
3. **Editorialized key features** — same content-side override; falls back to a curated subset of the raw arrays.
4. **Schedule a showing form** — port `ShowingScheduler` pattern. Yong already has `RequestTourCta` that links to `/contact?listing=…`; can either land on /contact (current) or embed a 4-field inquiry form inline (Jeane pattern).
5. **Similar listings strip** — needs a `getSimilarListings(listing, n)` query helper.
6. **IDX compliance footer** — port from `apps/premium-site/page.tsx` lines 399-441. Mandatory before the site can show real ARMLS data.
7. **SEO link grid** — programmatic neighborhood/price-band links for footer SEO.
8. **Recently viewed** — localStorage strip; nice-to-have.
9. **Decompose monolithic page** — split into `ListingHero`, `ListingStory`, `ListingFeatures`, `ListingLocation`, `ListingInquiry`, `ListingSimilar`, `ListingComplianceFooter`. Already partially done (`ListingHeroGallery`, `ListingFactSheet`, `ListingMap` exist).

### What yong2 already has (don't rebuild)

- `ListingHeroGallery` — equivalent to Jeane's `ListingHero`. Polished in commit `4b2556e`.
- `ListingLightbox` — equivalent to `GalleryLightbox`.
- `ListingFactSheet` — sidebar-style fact list. More compact than Jeane's pattern but functionally similar; refined in commit `4b2556e`.
- `ListingMap` — equivalent to `DetailMapWrapper`.
- `ShareButton` — Yong has it as a button; Jeane has 3 social icons inline. Preference: keep yong2's `ShareButton` (Web Share API + fallback) since it serves the same goal more universally.
- `RequestTourCta` — equivalent to Jeane's "Inquire Now" outline link.
- `StickyContact` — sticky bottom-right pill. Jeane doesn't have this; it's an additional yong2 polish from commit `4b2556e`.
- `TheRead` — analytics block (active comps + area aggregate). NOT in Jeane's pattern; keep it as yong2-distinct value.

### Section order recommendation for yong2 (Jeane-aligned, yong2-extended)

1. Hero (`ListingHeroGallery` — already polished)
2. Story (description with drop-cap) + Fact sheet sidebar — currently exists at `[slug]/page.tsx` lines 107-117
3. **NEW**: Key features chip grid (port from Yong Premium's chip layout — section already designed there)
4. **NEW** (optional, content-driven): Editorial sub-sections beneath story
5. Location + Map — currently exists, extend with privacy note
6. The Read (yong2-distinct analytics block) — currently exists
7. **NEW**: Schedule a showing inline form (or keep current /contact link if simpler)
8. **NEW**: Similar listings (3 cards)
9. **NEW**: IDX compliance footer (mandatory for ARMLS)
10. Existing back-link + share + tour CTA row
11. Footer (existing site footer)

---

## Implementation backlog (when data layer lands)

### Phase 1 — Required for parity with Yong Premium
- [ ] Add missing fields to `Listing` type: `subdivisionDisplay`, `bathroomsHalf`, `storiesTotal`, `garageSpaces`, `propertyType`, `propertySubType`, `associationYn`, `associationFee`, `associationFeeFrequency`, `taxAnnualAmount`, `parcelNumber`, `poolPrivateYn`, `elementarySchool`, `middleOrJuniorSchool`, `highSchoolDistrict`, `agentCellPhone`, `listOfficePhone` + 13 feature arrays
- [ ] Update the data-fetch (S3 active-snapshot pipeline + mappers) to surface these fields
- [ ] Build `KeyFeaturesGrid` component (chip groups by category)
- [ ] Build `IDXComplianceFooter` component (ARMLS logo + reciprocity + last-updated)

### Phase 2 — Jeane-pattern editorial polish
- [ ] Build `ListingStory` with editorial summary + drop-cap description + optional editorial sub-sections
- [ ] Add `content/listing-overrides.ts` for hand-curated `summary`, `editorial[]`, `editorializedFeatures[]` per listing slug (Yong opts in for top listings only)
- [ ] Build `ListingInquiryForm` (4 fields: name, email, phone, message — modeled on `ShowingScheduler`)
- [ ] Build `SimilarListingsStrip` + `getSimilarListings(listing, n)` query

### Phase 3 — SEO + retention
- [ ] `RecentlyViewed` (localStorage)
- [ ] `SeoLinkGrid` (neighborhood + price-tier programmatic links)

### Phase 4 — Cleanup
- [ ] Delete `app/portfolio/preview/` and `public/mock-listing/` (mock page from this work — see `MEMORY.md`)
- [ ] Update sitemap to include real `/portfolio/[slug]` pages
