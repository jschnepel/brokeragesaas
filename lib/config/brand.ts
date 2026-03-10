/**
 * Brand configuration — single source of truth for all visual constants.
 * Nothing hardcoded in components. Import from here.
 */

export const BRAND = {
  name: "Russ Lyon",
  tagline: "Marketing Platform",
  fullName: "Russ Lyon Sotheby's International Realty",
  initials: "RL",
} as const;

export const BRAND_COLORS = {
  navy: "#0F2B4F",
  navyDark: "#0a1f38",
  gold: "#C9A96E",
  cream: "#FAF7F2",
  creamAlt: "#F0EDE6",
  dark: "#1a1a2e",
  sidebar: "#0C1C2E",
} as const;

export const CHART_COLORS = {
  primary: BRAND_COLORS.navy,
  secondary: BRAND_COLORS.gold,
  palette: [
    BRAND_COLORS.navy,
    BRAND_COLORS.gold,
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#6b7280",
  ],
} as const;

export const CHART_STYLE = {
  gridStroke: "#e5e7eb",
  gridDash: "3 3",
  tickFontSize: 11,
  tickColor: "#6b7280",
  tooltipRadius: 8,
  tooltipBorder: "1px solid #e5e7eb",
  tooltipFontSize: 12,
  legendFontSize: 12,
  barRadius: [4, 4, 0, 0] as [number, number, number, number],
  areaStrokeWidth: 2,
  areaOpacityStart: 0.3,
  areaOpacityEnd: 0,
  donutOuterRadius: 100,
  donutInnerRadius: 50,
  donutPaddingAngle: 2,
} as const;

export const BRAND_FONTS = {
  display: "var(--brand-font-display)",
  body: "var(--brand-font-body)",
  mono: "var(--brand-font-mono)",
} as const;
