/**
 * Listing Narrative — the structured output an automated narrative
 * workflow produces for each listing. Every prose surface on the
 * detail page consumes this shape; nothing on the page is free-text
 * artisanal copy.
 *
 * Workflow contract: given a `Listing` (raw ARMLS fields), comp pool
 * aggregates, area aggregates, and community profile, produce a
 * `ListingNarrative` that fully populates this type. Fields with
 * fixed slots (story.lede, editorial.site, etc.) are templated; the
 * workflow can leave optional slots null and the page will skip
 * those sub-sections.
 *
 * Spec for the workflow itself: yong2/docs/listing-narrative-workflow.md
 */

// ── Feature group labels — fixed enum ──────────────────────────────
//
// All listings categorize features into the same set of buckets so
// the page reads consistently across inventory. The workflow's
// categorization step is deterministic given the ARMLS source arrays
// (interior_features, exterior_features, etc.) — no per-listing
// custom labels.

export const FEATURE_GROUP_LABELS = [
  'Architecture',
  'Interior',
  'Kitchen',
  'Primary Suite',
  'Exterior',
  'Views',
  'Garage',
  'Guest',
  'Community',
  'Construction',
  'Climate',
] as const;

export type FeatureGroupLabel = typeof FEATURE_GROUP_LABELS[number];

export interface FeatureGroup {
  label: FeatureGroupLabel;
  items: ReadonlyArray<string>;
}

// ── Story — 4 fixed paragraphs ─────────────────────────────────────
//
// Each paragraph has a defined intent so the workflow can template
// against listing facts:
//   lede     — distinctive lede; opens with what makes this listing
//              singular (architectural style, location, scale).
//   setting  — parcel, topography, view orientation, lot premium.
//   interior — program (BR/BA wings), materials, kitchen, special
//              rooms (wine, gym, casita).
//   closing  — showings policy, agent voice, qualifying note.
//
// 50–80 words each. Workflow rejects outputs outside that range.

export interface NarrativeStory {
  lede: string;
  setting: string;
  interior: string;
  closing: string;
}

// ── Editorial sub-sections — 4 fixed slots ─────────────────────────
//
// Optional. When present, each renders below the main story as
// italic-serif heading + body paragraph. The workflow fills slots it
// has confidence in; sparse listings render shorter editorial
// blocks. Slot order on the page is fixed: site → materials →
// program → presentation.

export interface NarrativeEditorial {
  /** Site, parcel, topography, neighbors. */
  site?: string;
  /** Materials chosen — limestone, concrete, walnut, etc. — and why. */
  materials?: string;
  /** Program — wings, bedroom layout, special rooms, casitas. */
  program?: string;
  /** Showings policy and agent voice. */
  presentation?: string;
}

// ── The Read — numerical block + optional commentary lines ─────────
//
// Numbers (subject ppsf, comp median, DOM, etc.) come from the
// analytics layer, not the narrative workflow. The commentary lines
// here are 1-sentence interpretations the workflow optionally
// produces given the numerical deltas.

export interface NarrativeTheRead {
  /**
   * 1-sentence interpretation of the comp-position number (e.g.,
   * "Priced 14.5% above the active comp median, reflecting the
   *  Horseshoe Canyon lot premium and 2022 build vintage").
   * Templated against the magnitude + sign of the delta.
   */
  compsCommentary?: string;
  /**
   * 1-sentence interpretation of the area aggregate (e.g.,
   * "Silverleaf trended +8.2% YoY against a metro of +3.1% — the
   *  community has been a relative outperformer").
   * Templated against the area's YoY + DOM + months-supply numbers
   *  vs the metro baseline.
   */
  areaCommentary?: string;
}

// ── The full narrative ─────────────────────────────────────────────

export interface ListingNarrative {
  /**
   * Required. 1-sentence summary, 15–25 words. Used in OG meta,
   * summary cards, and as the lede if the long story isn't shown.
   */
  summary: string;

  /** Required 4-paragraph story. */
  story: NarrativeStory;

  /** Optional editorial sub-sections. */
  editorial: NarrativeEditorial;

  /** Optional The Read commentary. */
  theRead: NarrativeTheRead;

  /**
   * Feature groups — array form so order is deterministic. Workflow
   * categorizes raw ARMLS feature arrays into these fixed buckets;
   * groups with no items are omitted from the array.
   */
  featureGroups: ReadonlyArray<FeatureGroup>;
}

// ── Mock narrative — the shape the workflow will produce ───────────
//
// This MOCK_NARRATIVE is what the automated workflow would emit for
// the mock Silverleaf listing. Each field demonstrates the templated
// shape; values are illustrative.
//
// To plug in a real listing: replace this constant with the
// workflow's output for that listing's listing_key.

export const MOCK_NARRATIVE: ListingNarrative = {
  summary:
    'A 2022 Horseshoe Canyon residence on 1.18 acres with western exposure to the McDowell ridge — six ensuite bedrooms across 7,206 square feet.',

  story: {
    lede:
      'A study in restrained modernism on one of Silverleaf\'s most coveted Horseshoe Canyon parcels. Designed by an award-winning Scottsdale studio in 2022, this 7,206-square-foot residence pairs glass-and-stone exteriors with interiors scaled for a serious wardrobe and a serious kitchen.',
    setting:
      'Sited at the back of a discreet cul-de-sac on 1.18 acres with unobstructed western exposure to the McDowell ridge. The build steps down with the topography rather than fighting it; every principal room captures the mountain face. Pinnacle Peak frames the southern view.',
    interior:
      'Six ensuite bedrooms across two wings, anchored by a primary suite with private courtyard, dual baths, and a dressing room. Folding glass walls dissolve the great room into a 70-foot infinity-edge pool. Wine room (1,800 bottles), catering pantry, and a separate guest casita complete the program.',
    closing:
      'Offered furnished with selected pieces by Holly Hunt and Christian Liaigre. Shown by appointment to qualified buyers; Yong personally accompanies every tour. Inquiries reviewed within 24 hours.',
  },

  editorial: {
    site:
      'One of the last elevated parcels in Horseshoe Canyon to come to market. The 1.18-acre lot sits at the back of a discreet cul-de-sac with no through-traffic and unobstructed western exposure — the McDowell ridge fills the principal sight line.',
    materials:
      'Limestone flooring sourced from a single European quarry. Walnut millwork by a Salt Lake atelier. Board-formed concrete walls poured in place. Patina bronze hardware throughout. Materials chosen once, then committed to across the build.',
    program:
      'Two wings split family from guest. Primary on its own wing — private courtyard, dual baths, dedicated dressing. Five additional ensuite bedrooms — three configured for family, two for guests. A separate detached casita provides genuine privacy for extended visitors.',
    presentation:
      'Shown by appointment. Yong personally accompanies every qualified showing. Inquiries reviewed within 24 hours; tours typically scheduled within the week.',
  },

  theRead: {
    compsCommentary:
      'Priced 14.5% above the active comp median — consistent with the lot premium and the 2022 build vintage relative to a comp set heavily weighted to 2018-2020 product.',
    areaCommentary:
      'Silverleaf trended +8.2% YoY against a Phoenix metro baseline near +3.0% — the community has outperformed the broader market for four consecutive quarters.',
  },

  featureGroups: [
    {
      label: 'Architecture',
      items: ['Contemporary', 'Glass + Stone', 'Single-Story Wings'],
    },
    {
      label: 'Interior',
      items: [
        '12-Foot Ceilings',
        'Heated Limestone Floors',
        'Folding Glass Walls',
        'Wet Bar',
        'Wine Room (1,800 Bottle)',
        'Catering Pantry',
        'Smart Home (Crestron)',
      ],
    },
    {
      label: 'Kitchen',
      items: ['Gaggenau Suite', 'Dual Subzero Refrigeration', 'Wolf 6-Burner', 'Marble Waterfall Island'],
    },
    {
      label: 'Primary Suite',
      items: ['Private Courtyard', 'Dual Baths', 'Dressing Room', 'Steam Shower', 'Soaking Tub'],
    },
    {
      label: 'Exterior',
      items: [
        'Infinity-Edge Pool (70ft)',
        'Outdoor Kitchen',
        'Fire Feature',
        'Bocce Court',
        'Putting Green',
      ],
    },
    {
      label: 'Views',
      items: ['McDowell Mountains', 'Pinnacle Peak', 'City Lights', 'Sunset Western Exposure'],
    },
    {
      label: 'Garage',
      items: ['4-Car Climate-Controlled', 'EV Charging × 2', 'Epoxy Floors'],
    },
    {
      label: 'Guest',
      items: ['Detached Casita (1 BR / 1 BA)', 'Private Entrance'],
    },
    {
      label: 'Community',
      items: ['24/7 Manned Gates', 'Member-Only Trails', 'Silverleaf Club Eligible'],
    },
    {
      label: 'Construction',
      items: ['Steel + Concrete Frame', 'Standing-Seam Metal Roof', '2022 Build'],
    },
    {
      label: 'Climate',
      items: ['Zoned Geothermal', 'Whole-House Filtration', 'Insulated Glazing'],
    },
  ],
};
