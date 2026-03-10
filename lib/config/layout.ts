/**
 * Centralized layout constants — single source of truth for all sizing.
 * Import from here. No hardcoded pixel values in component files.
 */

export const LAYOUT = {
  /** Request/Queue detail page */
  detail: {
    /** Design preview + chat panel grid (65/35 split) */
    contentGrid: "65fr 35fr",
    previewMinHeight: 660,
    previewMaxHeight: 990,
    chatDefaultHeight: 462,
    chatExpandedHeight: 825,
    metaColumns: "1fr 1fr",
    briefColumns: "1fr",
    thumbnailWidth: 100,
    thumbnailHeight: 72,
  },

  /** Revision modal */
  revision: {
    modalMaxWidth: 1100,
    canvasWidth: 1200,
    canvasHeight: 750,
  },

  /** Queue operations page */
  queue: {
    analyticsHeight: 240,
    analyticsGrid: "minmax(200px, 1fr) 2fr minmax(240px, 1fr)",
    sectionGap: 24,
  },

  /** Tables */
  table: {
    rowHeight: 44,
    headerHeight: 40,
    defaultPageSize: 10,
  },

  /** Cards grid */
  card: {
    minWidth: 280,
    maxWidth: 360,
    minHeight: 180,
  },

  /** Spacing (px) */
  spacing: {
    sectionGap: 24,
    cardPadding: 16,
    panelPadding: 20,
  },
} as const
