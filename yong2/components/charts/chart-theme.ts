/**
 * Shared chart theme — Midnight & Stone palette tuned for dark backgrounds.
 * Charts render on var(--ink) so axes, grids, and ticks are warm-tinted
 * hairlines that read against the navy without overpowering the data.
 */

export const CHART_COLORS = {
  // Yong palette anchors
  gold: '#D4B88A',
  goldMuted: '#C9A96A',
  bronze: '#B89968',
  champagne: '#E5D5B0',
  stoneDeep: '#8A7A5E',
  // Surface
  ink: '#0B1620',
  inkElevated: '#1E2C38',
  stone: '#EFE9DF',
  // Hairlines / muted
  hairline: 'rgba(212, 184, 138, 0.18)',
  hairlineSoft: 'rgba(212, 184, 138, 0.10)',
  textMuted: 'rgba(239, 233, 223, 0.6)',
  textFaint: 'rgba(239, 233, 223, 0.4)',
} as const;

// Per-neighborhood palette for the multi-line trend chart — stable so the
// same color represents the same neighborhood across reports. Signature
// communities get the strongest gold tones; notable get bronze/sage; broader
// gets muted stone.
export const NEIGHBORHOOD_COLORS: Record<string, string> = {
  // Signature — warm gold tones (Yong's primary representation)
  Silverleaf: '#D4B88A', // gold (top per-sqft)
  'Paradise Valley': '#E5D5B0', // champagne
  'Desert Mountain': '#C9A96A', // gold-muted
  Estancia: '#E0C892', // soft champagne
  'DC Ranch': '#B89968', // bronze
  // Notable — bronze / sage / muted teal-warm
  Arcadia: '#9C8862', // dark bronze
  Biltmore: '#8A9985', // muted sage
  'Troon North': '#8A8068', // warm grey-bronze
  Scottsdale: '#7A8275', // dim sage
  'Carefree & Cave Creek': '#857A6A', // warm stone
  // Broader — muted stone
  'Fountain Hills': '#6B6660',
};

// Fallback — deterministic color for any neighborhood not in the map
export function colorFor(neighborhood: string): string {
  if (NEIGHBORHOOD_COLORS[neighborhood]) return NEIGHBORHOOD_COLORS[neighborhood];
  let h = 0;
  for (let i = 0; i < neighborhood.length; i++) {
    h = (h * 31 + neighborhood.charCodeAt(i)) >>> 0;
  }
  const pool = ['#9C8862', '#8A9985', '#8A8068', '#7A8275', '#857A6A'];
  return pool[h % pool.length];
}

export const AXIS_TICK_STYLE = {
  fontFamily: 'var(--font-sans), sans-serif',
  fontSize: 10,
  letterSpacing: '0.1em',
  fill: CHART_COLORS.textMuted,
  fontVariantNumeric: 'tabular-nums' as const,
};

export const CHART_MARGIN = { top: 20, right: 20, left: 20, bottom: 20 };
