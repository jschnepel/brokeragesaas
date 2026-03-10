import { useState, useEffect } from "react";
import { FileText, LayoutGrid, BarChart2, Film, BookOpen, Mail } from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  navy:        "#0F2B4F",
  navyDark:    "#071428",
  sidebar:     "#0A1F3A",
  gold:        "#C9A96E",
  surface:     "#FAF7F2",
  surfaceAlt:  "#F3EFE8",
  border:      "#E5DFD5",
  borderDark:  "#D1C9BC",
  muted:       "#9CA3AF",
  mutedLight:  "#C4B9AA",
};

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY    = "Outfit, system-ui, sans-serif";
const FONT_MONO    = "'Geist Mono', monospace";

// ─── Groups ───────────────────────────────────────────────────────────────────
const GROUPS = [
  { key: "tokens",      label: "Design Tokens",      count: 14, icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
  { key: "primitives",  label: "Primitives",          count: 14, icon: "M4 6h16M4 12h16M4 18h7" },
  { key: "cards",       label: "Cards & Containers",  count:  6, icon: "M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" },
  { key: "tables",      label: "Tables",              count:  5, icon: "M3 10h18M3 6h18M3 14h18M3 18h18" },
  { key: "forms",       label: "Forms",               count:  6, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { key: "modals",      label: "Modals & Drawers",    count:  5, icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M7 7h10" },
  { key: "navigation",  label: "Navigation",          count:  4, icon: "M4 8V4m0 0h4M4 4l5 5M20 4h-4m4 0v4m0-4l-5 5" },
  { key: "chat",        label: "Chat & Messaging",    count:  4, icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
  { key: "blog",        label: "Blog & Content",       count:  4, icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h6" },
  { key: "notifications", label: "Notifications & Alerts", count:  5, icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { key: "empty",         label: "Empty States",           count:  4, icon: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" },
  { key: "timeline",      label: "Activity & Timeline",    count:  3, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

// ─── Reusable status config ───────────────────────────────────────────────────
const STATUS_CONFIG = {
  submitted:          { label: "Submitted",           bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  assigned:           { label: "Assigned",            bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE" },
  in_progress:        { label: "In Progress",         bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
  awaiting_materials: { label: "Awaiting Materials",  bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  in_review:          { label: "In Review",           bg: "#F0FDFA", color: "#0F766E", border: "#99F6E4" },
  completed:          { label: "Completed",           bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  cancelled:          { label: "Cancelled",           bg: "#F9FAFB", color: "#6B7280", border: "#E5E7EB" },
  draft:              { label: "Draft",               bg: "#F9FAFB", color: "#374151", border: "#D1D5DB" },
};

// ─── Tiny components ─────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px",
      background: `${cfg.color}12`,
      border: `1px solid ${cfg.color}55`,
      color: cfg.color,
      fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      fontFamily: FONT_BODY }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color,
        boxShadow: `0 0 6px ${cfg.color}` }} />
      {cfg.label}
    </span>
  );
}

function RushBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
      background: "linear-gradient(135deg,#991B1B,#B91C1C)",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 0 12px rgba(185,28,28,0.5)",
      fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: "white" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "white",
        boxShadow: "0 0 5px rgba(255,255,255,0.8)",
        animation: "rushPulse 1.4s ease-in-out infinite" }} />
      RUSH
    </span>
  );
}

function SLABadge({ state }) {
  const cfg = {
    healthy:  { color: "#22C55E", glow: "rgba(34,197,94,0.5)",   label: "Due in 2d 4h", pulse: false },
    warning:  { color: "#F59E0B", glow: "rgba(245,158,11,0.5)",  label: "Due in 2h",    pulse: false },
    breached: { color: "#EF4444", glow: "rgba(239,68,68,0.6)",   label: "BREACHED",     pulse: true  },
    done:     { color: "#9CA3AF", glow: "rgba(156,163,175,0.3)", label: "Completed",    pulse: false },
  }[state];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
      background: `${cfg.color}12`, border: `1px solid ${cfg.color}55`,
      fontSize: 9, fontWeight: 700, color: cfg.color, letterSpacing: "0.08em", fontFamily: FONT_BODY }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color,
        boxShadow: `0 0 7px ${cfg.glow}`,
        animation: cfg.pulse ? "rushPulse 1.2s ease-in-out infinite" : "none" }} />
      {cfg.label}
    </span>
  );
}

function Btn({ children, variant = "primary", size = "md" }) {
  const sizes = { sm: "5px 12px", md: "9px 20px", lg: "12px 28px" };
  const styles = {
    primary:       { background: `linear-gradient(135deg,${T.navy},#1A3A6B)`, color: "white",
                     border: "1px solid rgba(255,255,255,0.1)",
                     boxShadow: "0 0 16px rgba(15,43,79,0.45), inset 0 1px 0 rgba(255,255,255,0.08)" },
    gold:          { background: `linear-gradient(135deg,${T.gold},#B8935A)`, color: "white",
                     border: "1px solid rgba(201,169,110,0.4)",
                     boxShadow: "0 0 20px rgba(201,169,110,0.45), inset 0 1px 0 rgba(255,255,255,0.15)" },
    ghost:         { background: "rgba(15,43,79,0.05)", color: T.navy,
                     border: "1px solid rgba(15,43,79,0.22)",
                     boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" },
    danger:        { background: `linear-gradient(135deg,#991B1B,#B91C1C)`, color: "white",
                     border: "1px solid rgba(255,255,255,0.1)",
                     boxShadow: "0 0 16px rgba(185,28,28,0.4)" },
    "ghost-danger":{ background: "rgba(185,28,28,0.06)", color: "#B91C1C",
                     border: "1px solid rgba(185,28,28,0.3)", boxShadow: "none" },
    outline:       { background: "transparent", color: T.navy,
                     border: `1px solid ${T.navy}`,
                     boxShadow: `0 0 10px rgba(15,43,79,0.1)` },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button style={{ ...s, padding: sizes[size], fontSize: size === "sm" ? 9 : 11, fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
      fontFamily: FONT_BODY, transition: "opacity .15s" }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.82"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
      {children}
    </button>
  );
}

function Sparkline({ points, color, width = 80, height = 28 }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * width);
  const ys = points.map(p => height - ((p - min) / range) * (height * 0.75) - height * 0.1);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${d} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#","")})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="2.5" fill={color} opacity="0.9" />
    </svg>
  );
}

function KPITile({ label, value, accent, sub, trend, points }) {
  const [hovered, setHovered] = useState(false);
  const up = trend && !trend.startsWith("-");
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "linear-gradient(160deg,#071428 0%,#0D2240 100%)",
        borderLeft: `1px solid ${accent}`,
        padding: "20px 20px 18px", minWidth: 140, position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* top hairline */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "rgba(255,255,255,0.06)" }} />
      {/* label — top center */}
      <div style={{ fontSize: 7, letterSpacing: "0.18em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.3)", fontWeight: 700, fontFamily: FONT_BODY,
        marginBottom: 14, marginTop: 4, textAlign: "center" }}>{label}</div>
      {/* value — center */}
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 42, fontWeight: 600, color: "white",
        lineHeight: 1, letterSpacing: "-0.02em", textAlign: "center", flex: 1,
        display: "flex", alignItems: "center" }}>{value}</div>
      {/* sub-label — bottom center */}
      {sub && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 14 }}>
          <div style={{ width: 14, height: "1px", background: accent, opacity: 0.5 }} />
          <span style={{ fontSize: 9, color: accent, fontFamily: FONT_BODY,
            letterSpacing: "0.06em", fontWeight: 500 }}>{sub}</span>
          <div style={{ width: 14, height: "1px", background: accent, opacity: 0.5 }} />
        </div>
      )}
      {/* sparkline — below sub-label, centered */}
      {points && (
        <div style={{ marginTop: 10, opacity: 0.7 }}>
          <Sparkline points={points} color={accent} width={80} height={24} />
        </div>
      )}
      {/* hover tooltip — period comparison */}
      {trend && hovered && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)", zIndex: 99,
          background: "#071428", border: `1px solid ${up ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
          padding: "6px 12px", whiteSpace: "nowrap",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", fontFamily: FONT_BODY, marginBottom: 3 }}>vs prior period</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 10, color: up ? "#4ADE80" : "#F87171",
              fontFamily: FONT_MONO, fontWeight: 600 }}>{up ? "▲" : "▼"} {trend}</span>
          </div>
          {/* tooltip arrow */}
          <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
            width: 8, height: 8, background: "#071428",
            border: `1px solid ${up ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
            borderTop: "none", borderLeft: "none",
            transform: "translateX(-50%) rotate(45deg)" }} />
        </div>
      )}
    </div>
  );
}

// ─── Story Card ───────────────────────────────────────────────────────────────
function StoryCard({ name, description, variant, fullWidth, children, onExpand }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={() => onExpand({ name, description, variant, children })}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ gridColumn: fullWidth ? "1/-1" : undefined,
        background: "white", border: `1px solid ${hov ? T.gold : T.border}`,
        display: "flex", flexDirection: "column", cursor: "pointer", overflow: "hidden",
        transition: "border-color .15s, box-shadow .15s",
        boxShadow: hov ? `0 6px 24px rgba(15,43,79,.09)` : "none" }}>
      {/* preview */}
      <div style={{ padding: "28px 20px", minHeight: 90, display: "flex", alignItems: "center",
        justifyContent: "center", flexWrap: "wrap", gap: 8,
        background: T.surface, borderBottom: `1px solid ${T.border}`, flex: 1, position: "relative" }}>
        {children}
        {/* expand hint */}
        <div style={{ position: "absolute", top: 8, right: 10, opacity: hov ? 1 : 0,
          transition: "opacity .15s", fontSize: 9, color: T.gold, fontWeight: 700, letterSpacing: "0.06em" }}>
          EXPAND ↗
        </div>
      </div>
      {/* label */}
      <div style={{ padding: "10px 14px", background: "white" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, letterSpacing: "0.01em" }}>{name}</div>
        {description && <div style={{ fontSize: 9, color: T.muted, marginTop: 2, lineHeight: 1.5 }}>{description}</div>}
        {variant && (
          <div style={{ display: "inline-block", marginTop: 5, fontSize: 8, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 6px",
            background: T.surfaceAlt, color: T.muted }}>
            {variant}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Expand Modal ─────────────────────────────────────────────────────────────
function ExpandModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(7,20,40,.72)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", maxWidth: 800,
        width: "100%", maxHeight: "88vh", overflow: "auto",
        boxShadow: "0 32px 96px rgba(0,0,0,.35)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 22px", background: T.navy, display: "flex",
          justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: T.gold, marginBottom: 3 }}>Component Preview</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 300, color: "white" }}>{item.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.1)", border: "none",
            color: "rgba(255,255,255,.7)", width: 32, height: 32, cursor: "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {item.description && (
          <div style={{ padding: "10px 22px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`,
            fontSize: 11, color: "#6B7280", lineHeight: 1.6, flexShrink: 0 }}>
            {item.description}
          </div>
        )}
        <div style={{ padding: "48px 40px", flex: 1, display: "flex", alignItems: "center",
          justifyContent: "center", flexWrap: "wrap", gap: 12, minHeight: 180 }}>
          {item.children}
        </div>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function GroupHeader({ group }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
        textTransform: "uppercase", color: T.gold, marginBottom: 4 }}>
        Component Library
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 300,
        color: T.navy, letterSpacing: "-0.02em", lineHeight: 1 }}>
        {group.label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <div style={{ height: 1, background: T.border, flex: 1 }} />
        <span style={{ fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing: "0.08em" }}>
          {group.count} COMPONENTS
        </span>
      </div>
    </div>
  );
}

// ─── Stories per group ────────────────────────────────────────────────────────
function getStories(key) {

  // ── TOKENS ──────────────────────────────────────────────────────────────────
  if (key === "tokens") return [
    { name: "Brand Colors", description: "Layer 1 tokens from russ-lyon.css. Edit via token editor.", variant: "layer-1", fullWidth: true,
      el: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, width: "100%" }}>
          {[
            { token: "--brand-primary",      hex: "#0F2B4F", label: "Primary" },
            { token: "--brand-primary-dark", hex: "#0A1F3A", label: "Primary Dark" },
            { token: "--brand-accent",       hex: "#C9A96E", label: "Accent / Gold" },
            { token: "--brand-surface",      hex: "#FAF7F2", label: "Surface" },
            { token: "--brand-surface-alt",  hex: "#F3EFE8", label: "Surface Alt" },
            { token: "--brand-dark",         hex: "#071428", label: "Deep Dark" },
            { token: "--brand-sidebar",      hex: "#0A1F3A", label: "Sidebar" },
          ].map(c => (
            <div key={c.token} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ height: 56, background: c.hex, border: `1px solid ${T.border}` }} />
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.navy }}>{c.label}</div>
                <div style={{ fontSize: 9, color: T.muted, fontFamily: FONT_MONO }}>{c.hex}</div>
                <div style={{ fontSize: 8, color: T.mutedLight, fontFamily: FONT_MONO, marginTop: 1 }}>{c.token}</div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    { name: "Type Scale", description: "Playfair Display for headlines, Outfit for UI/body, Geist Mono for data.", variant: "layer-1",  fullWidth: true,
      el: (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { token: "--text-display", size: "32px", label: "Display — Hero titles, section headings", family: FONT_DISPLAY },
            { token: "--text-2xl",     size: "24px", label: "2XL — Page headings",                    family: FONT_DISPLAY },
            { token: "--text-xl",      size: "20px", label: "XL — Section headings",              family: FONT_BODY },
            { token: "--text-lg",      size: "16px", label: "LG — Subheadings, card titles",      family: FONT_BODY },
            { token: "--text-base",    size: "14px", label: "Base — Body text",                   family: FONT_BODY },
            { token: "--text-sm",      size: "12px", label: "SM — Secondary text, table cells",   family: FONT_BODY },
            { token: "--text-xs",      size: "11px", label: "XS — Labels, badges, metadata",      family: FONT_BODY },
          ].map(t => (
            <div key={t.token} style={{ display: "flex", alignItems: "baseline", gap: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>
              <div style={{ fontSize: t.size, fontFamily: t.family, color: T.navy, fontWeight: 300, minWidth: 220, lineHeight: 1 }}>
                {t.label.split("—")[0].trim()}
              </div>
              <div style={{ fontSize: 9, color: T.muted, fontFamily: FONT_MONO }}>{t.token} · {t.size}</div>
            </div>
          ))}
        </div>
      )
    },
    { name: "Spacing Scale", description: "4px base unit. All spacing values are multiples of 4.", variant: "4px grid",
      el: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          {[2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64].map(n => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: n, height: 8, background: T.gold, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontFamily: FONT_MONO, color: T.muted }}>{n}px</span>
            </div>
          ))}
        </div>
      )
    },
    { name: "Border Radius", description: "Brand radius: 2px — intentionally sharp for luxury editorial.", variant: "2px",
      el: (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
          {[{r: 0, label: "0"}, {r: 2, label: "2px"}, {r: 4, label: "4px"}, {r: 8, label: "8px"}, {r: 50, label: "pill"}].map(x => (
            <div key={x.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: 48, height: 48, background: T.navy, borderRadius: x.r }} />
              <span style={{ fontSize: 9, color: T.muted, fontFamily: FONT_MONO }}>{x.label}</span>
            </div>
          ))}
        </div>
      )
    },
  ];

  // ── PRIMITIVES ──────────────────────────────────────────────────────────────
  if (key === "primitives") return [
    { name: "Button — Primary", description: "Main CTA. Navy fill.", variant: "primary",
      el: (
        <div style={{ background: "linear-gradient(135deg,#0F2B4F,#1A3A6B)", padding: "9px 22px",
          color: "white", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          cursor: "pointer", display: "inline-flex", alignItems: "center",
          boxShadow: "0 0 20px rgba(15,43,79,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.1)" }}>Submit Request</div>
      )
    },
    { name: "Button — Gold", description: "Accent action.", variant: "gold",
      el: (
        <div style={{ background: "linear-gradient(135deg,#C9A96E,#B8935A)", padding: "9px 22px",
          color: "white", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          cursor: "pointer", display: "inline-flex", alignItems: "center",
          boxShadow: "0 0 24px rgba(201,169,110,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
          border: "1px solid rgba(201,169,110,0.4)" }}>Approve</div>
      )
    },
    { name: "Button — Ghost", description: "Secondary action. Bordered.", variant: "ghost",
      el: (
        <div style={{ background: "rgba(15,43,79,0.06)", backdropFilter: "blur(6px)", padding: "9px 22px",
          color: T.navy, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          cursor: "pointer", display: "inline-flex", alignItems: "center",
          border: "1px solid rgba(15,43,79,0.25)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)" }}>Cancel</div>
      )
    },
    { name: "Button — Danger", description: "Destructive. Red fill.", variant: "danger",
      el: (
        <div style={{ background: "linear-gradient(135deg,#991B1B,#B91C1C)", padding: "9px 22px",
          color: "white", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          cursor: "pointer", display: "inline-flex", alignItems: "center",
          boxShadow: "0 0 20px rgba(185,28,28,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.1)" }}>Delete</div>
      )
    },
    { name: "Button — Ghost Danger", description: "Soft destructive.", variant: "ghost-danger",
      el: (
        <div style={{ background: "rgba(185,28,28,0.06)", backdropFilter: "blur(6px)", padding: "9px 22px",
          color: "#B91C1C", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          cursor: "pointer", display: "inline-flex", alignItems: "center",
          border: "1px solid rgba(185,28,28,0.3)" }}>Cancel Request</div>
      )
    },
    { name: "Button — Outline", description: "Outlined navy.", variant: "outline",
      el: (
        <div style={{ background: "transparent", padding: "9px 22px",
          color: T.navy, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          cursor: "pointer", display: "inline-flex", alignItems: "center",
          border: `1px solid ${T.navy}`, boxShadow: `0 0 12px rgba(15,43,79,0.12)` }}>View Details</div>
      )
    },
    { name: "Status Badges — All States", description: "8 request lifecycle states.", variant: "all-states", fullWidth: true,
      el: (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "16px 20px",
          background: "#FAF7F2",
          border: `1px solid ${T.border}` }}>
          {Object.keys(STATUS_CONFIG).map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} style={{ padding: "4px 10px", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: `${cfg.color}12`,
                border: `1px solid ${cfg.color}55`,
                color: cfg.color }}>
                {cfg.label}
              </div>
            );
          })}
        </div>
      )
    },
    { name: "Rush Badge", description: "Urgency indicator. Red pill.", variant: "rush",
      el: (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px",
          background: "linear-gradient(135deg,#991B1B,#B91C1C)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 0 16px rgba(185,28,28,0.55)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white",
            animation: "rushPulse 1.4s ease-in-out infinite",
            boxShadow: "0 0 6px rgba(255,255,255,0.8)" }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "white" }}>Rush</span>
        </div>
      )
    },
    { name: "SLA Indicators", description: "4 states: healthy, warning, breached, done.", variant: "all-states",
      el: (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 16px",
          background: "linear-gradient(135deg,#071428,#0A1F3A)",
          border: "1px solid rgba(201,169,110,0.12)" }}>
          {[
            { label: "SLA Healthy",  color: "#22C55E", glow: "rgba(34,197,94,0.35)",  bar: 0.72 },
            { label: "SLA Warning",  color: "#F59E0B", glow: "rgba(245,158,11,0.35)", bar: 0.45 },
            { label: "SLA Breached", color: "#EF4444", glow: "rgba(239,68,68,0.45)",  bar: 0.15, pulse: true },
            { label: "SLA Done",     color: "#6B7280", glow: "rgba(107,114,128,0.2)", bar: 1.0 },
          ].map(({ label, color, glow, bar, pulse }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color,
                boxShadow: `0 0 8px ${glow}`,
                animation: pulse ? "rushPulse 1.2s ease-in-out infinite" : "none" }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color, minWidth: 88 }}>{label}</span>
              <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 1 }}>
                <div style={{ width: `${bar * 100}%`, height: "100%", background: color,
                  boxShadow: `0 0 6px ${glow}`, borderRadius: 1 }} />
              </div>
            </div>
          ))}
        </div>
      )
    },
    { name: "Avatar — Initials", description: "User avatar with initials fallback.", variant: "initials",
      el: (
        <div style={{ display: "flex", gap: 10, padding: "16px 20px",
          background: "linear-gradient(135deg,#071428,#0F2B4F)",
          border: "1px solid rgba(201,169,110,0.15)" }}>
          {[["YC","#0F2B4F","#3A5A8A"],["LB",T.gold,"#D4B97E"],["DK","#1F2937","#4B5563"],["MW","#4C1D95","#7C3AED"]].map(([initials,bg,rim])=>(
            <div key={initials} style={{ width: 42, height: 42, borderRadius: "50%",
              background: `linear-gradient(135deg,${bg},${rim})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "white", letterSpacing: "0.06em",
              border: `1px solid ${rim}55`,
              boxShadow: `0 0 14px ${bg}88, inset 0 1px 0 rgba(255,255,255,0.15)` }}>{initials}</div>
          ))}
        </div>
      )
    },
    { name: "Section Header", description: "Page / section heading with eyebrow.", variant: "default",
      el: (
        <div style={{ padding: "18px 20px", background: "linear-gradient(135deg,#071428,#0A1F3A)",
          border: "1px solid rgba(201,169,110,0.15)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.6),transparent)" }} />
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
            color: T.gold, marginBottom: 6,
            textShadow: "0 0 12px rgba(201,169,110,0.6)" }}>Marketing</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600,
            color: "white", letterSpacing: "-0.01em",
            textShadow: "0 2px 20px rgba(15,43,79,0.8)" }}>My Requests</div>
        </div>
      )
    },
    { name: "Feasibility Flags", description: "Risk dot for intake triage.", variant: "hard + soft",
      el: (
        <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "14px 18px",
          background: "linear-gradient(135deg,#071428,#0A1F3A)",
          border: "1px solid rgba(201,169,110,0.12)" }}>
          {[
            { color: "#EF4444", glow: "rgba(239,68,68,0.6)", label: "Hard Flag", pulse: true },
            { color: "#F59E0B", glow: "rgba(245,158,11,0.5)", label: "Soft Flag", pulse: false },
          ].map(({ color, glow, label, pulse }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: color,
                boxShadow: `0 0 10px ${glow}, 0 0 20px ${glow}`,
                animation: pulse ? "rushPulse 1.4s ease-in-out infinite" : "none" }} />
              <span style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", textShadow: `0 0 10px ${glow}` }}>{label}</span>
            </div>
          ))}
        </div>
      )
    },
    { name: "Divider", description: "Horizontal rule. Two weights.", variant: "both",
      el: (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14, padding: "16px 0" }}>
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.35),transparent)" }} />
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.7),transparent)",
            boxShadow: "0 0 8px rgba(201,169,110,0.3)" }} />
        </div>
      )
    },
    { name: "Icon Button", description: "Icon-only control. Square.", variant: "icon",
      el: (
        <div style={{ display: "flex", gap: 8, padding: "16px 20px",
          background: "linear-gradient(135deg,#071428,#0F2B4F)",
          border: "1px solid rgba(201,169,110,0.15)" }}>
          {[[T.gold,"rgba(201,169,110,0.4)"],[T.navy,"rgba(59,130,246,0.25)"],["#6B7280","rgba(107,114,128,0.2)"]].map(([c,glow],i) => (
            <button key={i} style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)",
              border: `1px solid ${c}44`,
              width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: c, boxShadow: `0 0 12px ${glow}` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
            </button>
          ))}
        </div>
      )
    },
  ];

  // ── CARDS ────────────────────────────────────────────────────────────────────
  if (key === "cards") return [
    { name: "KPI Tiles", description: "Top-line metric. Accent left border, sparkline, period trend.", variant: "default",
      el: (
        <div style={{ display: "flex", gap: 10 }}>
          <KPITile label="Active"    value="7"  accent={T.gold}  sub="This week"
            trend="+2 vs last week" points={[3,5,4,6,5,7,7]} />
          <KPITile label="In Review" value="2"  accent="#7C3AED" sub="Awaiting approval"
            trend="-1 vs last week" points={[4,3,5,3,4,3,2]} />
          <KPITile label="Rush"      value="1"  accent="#F87171" sub="Due today"
            trend="flat vs last week" points={[2,1,2,1,1,2,1]} />
        </div>
      )
    },
    { name: "Exec KPI Cards", description: "Large number + sparkline + MoM comparison.", variant: "exec",
      el: (
        <div style={{ display: "flex", gap: 10 }}>
          <KPITile label="Total Requests" value="247" accent={T.gold}   sub="YTD"
            trend="+18% vs last mo." points={[160,175,188,200,210,230,247]} />
          <KPITile label="SLA Compliance" value="91%" accent="#4ADE80"  sub="On track"
            trend="+3% vs last mo."  points={[82,84,86,87,89,90,91]} />
          <KPITile label="Overdue"        value="4"   accent="#F87171"  sub="Critical"
            trend="+2 vs last mo."  points={[1,2,1,3,2,2,4]} />
        </div>
      )
    },
    { name: "Request Card", description: "Agent my-requests view. Status left border.", variant: "in-progress", fullWidth: true,
      el: (
        <div style={{ maxWidth: 400, width: "100%", overflow: "hidden",
          border: `1px solid rgba(201,169,110,0.15)`,
          borderLeft: "3px solid #F59E0B",
          boxShadow: "0 4px 24px rgba(7,20,40,0.18)",
          background: "#FAF7F2" }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, lineHeight: 1.35, fontFamily: FONT_BODY }}>
                16020 N Horseshoe Dr — Open House Flyer
              </div>
              <RushBadge />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", marginTop: 8 }}>
              {[["Material","Flyer"],["Due","Mar 12"],["Designer","Lex Baum"],["Queue","#42"]].map(([l,v])=>(
                <div key={l} style={{ display: "flex", gap: 5, alignItems: "baseline" }}>
                  <span style={{ fontSize: 8, color: T.muted, textTransform: "uppercase",
                    letterSpacing: "0.1em", fontWeight: 700, fontFamily: FONT_BODY }}>{l}</span>
                  <span style={{ fontSize: 10, color: T.navy, fontWeight: 600,
                    fontFamily: l === "Queue" ? FONT_MONO : FONT_BODY }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "9px 16px", display: "flex", alignItems: "center",
            justifyContent: "space-between", background: "white" }}>
            <StatusBadge status="in_progress" />
            <SLABadge state="warning" />
          </div>
        </div>
      )
    },
    { name: "Glass Card", description: "Frosted surface for overlays and elevated panels.", variant: "glow",
      el: (
        <div style={{ background: `linear-gradient(135deg,#071428,#0F2B4F)`, padding: 28 }}>
          <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "20px 24px", position: "relative", overflow: "hidden",
            boxShadow: "0 0 40px rgba(201,169,110,0.12), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.6),transparent)" }} />
            <div style={{ fontSize: 8, color: T.gold, fontWeight: 700, letterSpacing: "0.16em",
              textTransform: "uppercase", marginBottom: 6, fontFamily: FONT_BODY,
              textShadow: "0 0 12px rgba(201,169,110,0.6)" }}>Glass Card</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: "white",
              letterSpacing: "-0.01em" }}>Elevated surface with glow</div>
          </div>
        </div>
      )
    },
    { name: "Designer Health Tile", description: "Capacity status per designer. Color-coded.", variant: "3 states",
      el: (
        <div style={{ background: "linear-gradient(160deg,#071428,#0D2240)",
          border: "1px solid rgba(255,255,255,0.06)", width: "100%", maxWidth: 460 }}>
          {/* header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 7, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)", fontWeight: 700, fontFamily: FONT_BODY }}>Designer Capacity</span>
            <span style={{ fontSize: 7, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)", fontFamily: FONT_BODY }}>Mar 9, 2026</span>
          </div>
          {/* rows */}
          {[
            { name: "Lex Baum",    label: "Available",   color: "#4ADE80", load: 3,  max: 8 },
            { name: "Marcus Webb", label: "At Capacity", color: "#F59E0B", load: 7,  max: 8 },
            { name: "D. Torres",   label: "Overloaded",  color: "#F87171", load: 10, max: 8 },
          ].map(({ name, label, color, load, max }, i, arr) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 18px",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              {/* initials */}
              <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)",
                letterSpacing: "0.04em", fontFamily: FONT_BODY }}>
                {name.split(" ").map(n => n[0]).join("")}
              </div>
              {/* name + status */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "white",
                  fontFamily: FONT_BODY, marginBottom: 3 }}>{name}</div>
                {/* progress bar */}
                <div style={{ height: 2, background: "rgba(255,255,255,0.08)", width: "100%" }}>
                  <div style={{ height: "100%", width: `${Math.min(load / max, 1) * 100}%`,
                    background: color, transition: "width 0.3s" }} />
                </div>
              </div>
              {/* load count */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 500,
                  color: "white", letterSpacing: "-0.01em" }}>{load}<span style={{ fontSize: 9,
                  color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>/{max}</span></div>
                <div style={{ fontSize: 8, color, letterSpacing: "0.1em", textTransform: "uppercase",
                  fontFamily: FONT_BODY, marginTop: 2, fontWeight: 700 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    { name: "Announcement Card", description: "Pinned brokerage announcement. Lyon's Den feed.", variant: "pinned", fullWidth: true,
      el: (
        <div style={{ maxWidth: 420, width: "100%", overflow: "hidden",
          border: `1px solid rgba(201,169,110,0.2)`,
          boxShadow: "0 8px 32px rgba(7,20,40,0.2)" }}>
          {/* Hero banner — dark glass */}
          <div style={{ height: 96, background: `linear-gradient(135deg,#071428,#0F2B4F,#1A3A6B)`,
            position: "relative", display: "flex", alignItems: "flex-end", padding: "12px 16px" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.5),transparent)" }} />
            {/* Pinned badge */}
            <div style={{ position: "absolute", top: 12, left: 12, padding: "3px 9px",
              background: `linear-gradient(135deg,${T.gold},#B8935A)`,
              fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "white", boxShadow: "0 0 12px rgba(201,169,110,0.4)" }}>PINNED</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: "white",
              letterSpacing: "-0.01em" }}>Q1 2026 Market Report — Now Live</div>
          </div>
          {/* Body */}
          <div style={{ padding: "12px 16px", background: "#FAF7F2",
            borderTop: "1px solid rgba(201,169,110,0.15)" }}>
            <div style={{ fontSize: 11, color: "#4B5563", lineHeight: 1.6, fontFamily: FONT_BODY }}>
              Sotheby's holds #1 in all 14 Arizona luxury markets.
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 9, color: T.muted, fontFamily: FONT_BODY }}>David Kim · Mar 3, 2026</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: T.gold, cursor: "pointer", fontFamily: FONT_BODY }}>Read →</div>
            </div>
          </div>
        </div>
      )
    },
  ];


  // ── TABLES ───────────────────────────────────────────────────────────────────
  if (key === "tables") return [
    { name: "Design Queue Table Row", description: "Sortable. Hoverable. Action buttons inline.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", overflowX: "auto", border: `1px solid rgba(201,169,110,0.2)`,
          boxShadow: "0 4px 24px rgba(7,20,40,0.18)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                borderBottom: "1px solid rgba(201,169,110,0.25)", position: "relative" }}>
                {["#", "Requester", "Designer", "Material", "Due", "SLA", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 8,
                    fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(201,169,110,0.85)", whiteSpace: "nowrap", fontFamily: FONT_BODY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { id: "#42", req: "Yong Choi", des: "Lex Baum", mat: "Flyer",  due: "Mar 12", sla: "warning",  status: "in_progress", hover: false },
                { id: "#41", req: "M. Torres", des: "M. Webb",  mat: "Social", due: "Mar 14", sla: "healthy",  status: "submitted",   hover: true  },
                { id: "#40", req: "D. Kim",    des: "Lex Baum", mat: "Report", due: "Mar 10", sla: "breached", status: "blocked",     hover: false },
              ].map((row) => (
                <tr key={row.id} style={{
                  borderBottom: `1px solid ${T.border}`,
                  background: row.hover ? T.surfaceAlt : "#FAF7F2",
                }}>
                  <td style={{ padding: "11px 14px", color: T.gold, fontWeight: 700, fontFamily: FONT_MONO, fontSize: 12,
                    textShadow: "0 0 8px rgba(201,169,110,0.4)" }}>{row.id}</td>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: T.navy, fontSize: 11 }}>{row.req}</td>
                  <td style={{ padding: "11px 14px", color: "#4B5563", fontSize: 11 }}>{row.des}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                      color: "#6B7280", background: "#F3F4F6", padding: "3px 8px",
                      border: "1px solid #E5E7EB" }}>{row.mat}</span>
                  </td>
                  <td style={{ padding: "11px 14px", color: "#6B7280", fontFamily: FONT_MONO, fontSize: 10 }}>{row.due}</td>
                  <td style={{ padding: "11px 14px" }}><SLABadge state={row.sla} /></td>
                  <td style={{ padding: "11px 14px" }}><StatusBadge status={row.status} /></td>
                  <td style={{ padding: "8px 14px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {/* Ghost button — matches primitive */}
                      <div style={{ padding: "5px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                        textTransform: "uppercase", background: "rgba(15,43,79,0.05)",
                        border: "1px solid rgba(15,43,79,0.2)", color: T.navy, cursor: "pointer",
                        fontFamily: FONT_BODY }}>Review</div>
                      {/* Primary button — matches primitive */}
                      <div style={{ padding: "5px 12px", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                        textTransform: "uppercase", background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                        color: "white", cursor: "pointer", fontFamily: FONT_BODY,
                        boxShadow: "0 0 10px rgba(15,43,79,0.35)" }}>Approve</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    { name: "Triage Queue Row", description: "Feasibility flag + assign dropdown + 3-action decision.", variant: "flagged", fullWidth: true,
      el: (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { id: "iq-003", title: "Full Rebrand Package", meta: "47pp · Rush · 2 business days · Yong Choi", flag: "#EF4444", glow: "rgba(239,68,68,0.5)", rush: true },
            { id: "iq-004", title: "Open House Flyer Set", meta: "3pp · Standard · 5 business days · M. Torres", flag: "#F59E0B", glow: "rgba(245,158,11,0.4)", rush: false },
          ].map((item) => (
            <div key={item.id} style={{ padding: "12px 16px", background: "#FAF7F2",
              border: `1px solid ${T.border}`, borderLeft: `3px solid ${item.flag}`,
              display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 }}>
                {/* Glowing flag dot — matches primitive */}
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: item.flag,
                  boxShadow: `0 0 10px ${item.glow}, 0 0 20px ${item.glow}`, flexShrink: 0,
                  animation: item.rush ? "rushPulse 1.4s ease-in-out infinite" : "none" }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: T.gold,
                      textShadow: "0 0 8px rgba(201,169,110,0.4)" }}>{item.id}</span>
                    {item.title}
                    {item.rush && <RushBadge />}
                  </div>
                  <div style={{ fontSize: 9, color: T.muted, marginTop: 2, letterSpacing: "0.02em", fontFamily: FONT_BODY }}>{item.meta}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                <select style={{ fontSize: 10, border: `1px solid ${T.border}`, padding: "6px 10px",
                  color: T.navy, background: "white", fontFamily: FONT_BODY, outline: "none" }}>
                  <option>Assign to…</option>
                  <option>Lex Baum</option>
                  <option>Marcus Webb</option>
                </select>
                {/* Begin — Primary gradient */}
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  padding: "6px 14px", background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                  color: "white", cursor: "pointer", fontFamily: FONT_BODY,
                  boxShadow: "0 0 12px rgba(15,43,79,0.4)" }}>Begin</div>
                {/* Flag — warning soft */}
                <div style={{ fontSize: 9, fontWeight: 700, padding: "6px 10px",
                  background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.4)",
                  color: "#92400E", cursor: "pointer", fontFamily: FONT_BODY }}>?</div>
                {/* Reject — danger soft */}
                <div style={{ fontSize: 9, fontWeight: 700, padding: "6px 10px",
                  background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.3)",
                  color: "#B91C1C", cursor: "pointer", fontFamily: FONT_BODY }}>✕</div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    { name: "Column Sort Headers", description: "Active sort with asc/desc chevron indicator.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", overflowX: "auto", border: `1px solid rgba(201,169,110,0.2)`,
          boxShadow: "0 4px 24px rgba(7,20,40,0.15)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)` }}>
                {[["#", true, "asc"], ["Requester", false, null], ["Status", false, null], ["Due", true, "desc"], ["SLA", false, null]].map(([l, a, d]) => (
                  <th key={l} style={{ padding: "11px 14px", textAlign: "left", cursor: "pointer",
                    userSelect: "none", whiteSpace: "nowrap" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em",
                        textTransform: "uppercase", fontFamily: FONT_BODY,
                        color: a ? "rgba(201,169,110,1)" : "rgba(201,169,110,0.45)",
                        textShadow: a ? "0 0 10px rgba(201,169,110,0.5)" : "none" }}>{l}</span>
                      {a && <span style={{ fontSize: 10, color: T.gold }}>{d === "asc" ? "↑" : "↓"}</span>}
                      {!a && <span style={{ fontSize: 9, color: "rgba(201,169,110,0.2)" }}>⇅</span>}
                    </div>
                  </th>
                ))}
              </tr>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt }}>
                <td colSpan={5} style={{ padding: "9px 14px", fontSize: 10, color: T.muted,
                  fontStyle: "italic", fontFamily: FONT_BODY }}>
                  Showing 3 of 47 requests — sorted by Due ↓
                </td>
              </tr>
            </thead>
          </table>
        </div>
      )
    },
    { name: "Pagination Bar", description: "Page controls with rows-per-page and page numbers.", variant: "default", fullWidth: true,
      el: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", background: "#FAF7F2",
          borderTop: `2px solid rgba(201,169,110,0.2)`,
          border: `1px solid rgba(201,169,110,0.15)`,
          width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: T.muted, fontFamily: FONT_BODY }}>
            <span>Rows per page:</span>
            <select style={{ border: `1px solid ${T.border}`, padding: "4px 8px",
              fontSize: 10, color: T.navy, background: "white", fontFamily: FONT_BODY, outline: "none" }}>
              <option>10</option><option>25</option><option>50</option>
            </select>
            <span style={{ color: T.navy, fontWeight: 600 }}>Showing 11–20 of 47</span>
          </div>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {["‹", "1", "2", "3", "…", "5", "›"].map((p, i) => (
              <div key={i} style={{
                minWidth: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                background: p === "2" ? `linear-gradient(135deg,${T.navy},#1A3A6B)` : "white",
                color: p === "2" ? "white" : T.muted,
                border: `1px solid ${p === "2" ? "transparent" : T.border}`,
                fontSize: p === "‹" || p === "›" ? 14 : 11,
                fontWeight: p === "2" ? 700 : 400,
                cursor: p === "…" ? "default" : "pointer",
                fontFamily: FONT_BODY,
                boxShadow: p === "2" ? "0 0 14px rgba(15,43,79,0.45)" : "none",
              }}>{p}</div>
            ))}
          </div>
        </div>
      )
    },
    { name: "Empty Table State", description: "Zero results. Shown inside table body.", variant: "empty", fullWidth: true,
      el: (
        <div style={{ width: "100%", border: `1px solid rgba(201,169,110,0.2)`,
          boxShadow: "0 4px 24px rgba(7,20,40,0.12)" }}>
          <div style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`, padding: "11px 14px",
            display: "flex", alignItems: "center", gap: 3,
            borderBottom: "1px solid rgba(201,169,110,0.25)" }}>
            {["#", "Requester", "Material", "Due", "Status"].map(h => (
              <div key={h} style={{ flex: h === "Requester" ? 2 : 1, fontSize: 8, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "rgba(201,169,110,0.6)", fontFamily: FONT_BODY }}>{h}</div>
            ))}
          </div>
          <div style={{ padding: "52px 20px", textAlign: "center", background: "#FAF7F2" }}>
            <div style={{ width: 42, height: 42, border: `1px solid rgba(201,169,110,0.25)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: "0 0 20px rgba(201,169,110,0.08)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M9 12h6M9 16h4"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4, fontFamily: FONT_BODY }}>No requests found</div>
            <div style={{ fontSize: 11, color: T.muted, fontFamily: FONT_BODY }}>Try adjusting your filters or search terms</div>
          </div>
        </div>
      )
    },
  ];


  // ── FORMS ────────────────────────────────────────────────────────────────────
  if (key === "forms") return [
    { name: "Text Input", description: "Standard field. Default, focused, and error states.", variant: "default",
      el: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 300,
          padding: "20px", background: "#FAF7F2", border: `1px solid ${T.border}` }}>
          {/* Default — focused (navy border) */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <label style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: T.muted, fontFamily: FONT_BODY }}>Project Title</label>
              <span style={{ fontSize: 8, color: T.muted, fontFamily: FONT_BODY }}>Required</span>
            </div>
            <div style={{ position: "relative" }}>
              <input readOnly value="16020 N Horseshoe — Open House Flyer"
                style={{ width: "100%", border: `1px solid ${T.navy}`,
                  borderLeft: `3px solid ${T.navy}`,
                  padding: "9px 12px", fontSize: 11, color: T.navy, background: "white",
                  boxSizing: "border-box", outline: "none", fontFamily: FONT_BODY,
                  boxShadow: "0 0 0 3px rgba(15,43,79,0.06)" }} />
            </div>
          </div>
          {/* Default — empty/placeholder */}
          <div>
            <label style={{ display: "block", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: T.muted, marginBottom: 5, fontFamily: FONT_BODY }}>Agent Name</label>
            <input readOnly placeholder="Enter agent name"
              style={{ width: "100%", border: `1px solid ${T.border}`,
                padding: "9px 12px", fontSize: 11, color: T.mutedLight, background: "white",
                boxSizing: "border-box", fontFamily: FONT_BODY }} />
          </div>
          {/* Error state */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <label style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "#B91C1C", fontFamily: FONT_BODY }}>Due Date</label>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <span style={{ fontSize: 8, color: "#B91C1C", fontFamily: FONT_BODY }}>Required</span>
              </div>
            </div>
            <input readOnly placeholder="MM / DD / YYYY"
              style={{ width: "100%", border: "1px solid #FCA5A5",
                borderLeft: "3px solid #EF4444",
                padding: "9px 12px", fontSize: 11, color: "#B91C1C", background: "#FEF2F2",
                boxSizing: "border-box", fontFamily: FONT_BODY }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <span style={{ fontSize: 9, color: "#B91C1C", fontFamily: FONT_BODY }}>Please enter a due date</span>
            </div>
          </div>
        </div>
      )
    },
    { name: "Textarea", description: "Multi-line input. Brief, notes, cancel reason.", variant: "default",
      el: (
        <div style={{ width: 340, padding: "20px", background: "#FAF7F2", border: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
            <label style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: T.muted, fontFamily: FONT_BODY }}>Creative Brief</label>
            <span style={{ fontSize: 8, color: T.muted, fontFamily: FONT_MONO }}>142 / 500</span>
          </div>
          <textarea readOnly rows={4}
            style={{ width: "100%", border: `1px solid ${T.navy}`, borderLeft: `3px solid ${T.navy}`,
              padding: "9px 12px", fontSize: 11, color: T.navy, background: "white",
              resize: "none", boxSizing: "border-box", fontFamily: FONT_BODY, lineHeight: 1.6,
              outline: "none", boxShadow: "0 0 0 3px rgba(15,43,79,0.06)" }}
            defaultValue="Luxury open house flyer for 16020 N Horseshoe. Emphasize the mountain views and resort-style pool. Gold and navy color palette to match brand." />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 8, color: T.muted, fontFamily: FONT_BODY }}>Markdown supported</span>
            <div style={{ height: 2, width: 60, background: T.border, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, height: "100%",
                width: "28%", background: T.navy }} />
            </div>
          </div>
        </div>
      )
    },
    { name: "Select / Dropdown", description: "Material type selector, designer assign dropdown.", variant: "default",
      el: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 260,
          padding: "20px", background: "#FAF7F2", border: `1px solid ${T.border}` }}>
          <div>
            <label style={{ display: "block", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: T.muted, marginBottom: 5, fontFamily: FONT_BODY }}>Material Type</label>
            <div style={{ position: "relative" }}>
              <select style={{ width: "100%", border: `1px solid ${T.navy}`,
                borderLeft: `3px solid ${T.navy}`,
                padding: "9px 32px 9px 12px", fontSize: 11, color: T.navy,
                background: "white", fontFamily: FONT_BODY, outline: "none",
                appearance: "none", cursor: "pointer",
                boxShadow: "0 0 0 3px rgba(15,43,79,0.06)" }}>
                {["Flyer", "Social Pack", "Email Campaign", "Video Script", "Brochure", "Report"].map(o => <option key={o}>{o}</option>)}
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.navy}
                strokeWidth="2" strokeLinecap="round"
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: T.muted, marginBottom: 5, fontFamily: FONT_BODY }}>Assign Designer</label>
            <div style={{ position: "relative" }}>
              <select style={{ width: "100%", border: `1px solid ${T.border}`,
                padding: "9px 32px 9px 12px", fontSize: 11, color: T.navy,
                background: "white", fontFamily: FONT_BODY, outline: "none",
                appearance: "none", cursor: "pointer" }}>
                <option>Unassigned</option>
                <option>Lex Baum</option>
                <option>Marcus Webb</option>
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted}
                strokeWidth="2" strokeLinecap="round"
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>
          </div>
        </div>
      )
    },
    { name: "File Upload Zone", description: "Drag-drop reference image upload.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", maxWidth: 420,
          border: `1px dashed rgba(201,169,110,0.4)`,
          background: "rgba(201,169,110,0.03)",
          padding: "32px 24px", textAlign: "center", cursor: "pointer",
          position: "relative", overflow: "hidden" }}>
          {/* corner accents */}
          {[["0","0","right","bottom"],["0","auto","right","top"],["auto","0","left","bottom"],["auto","auto","left","top"]].map(([t,b,bl,tr], i) => (
            <div key={i} style={{ position: "absolute", top: t === "0" ? 0 : "auto",
              bottom: b === "0" ? 0 : "auto", left: bl === "left" ? 0 : "auto",
              right: bl === "right" ? 0 : "auto", width: 10, height: 10,
              borderTop: tr === "top" ? `1px solid ${T.gold}` : "none",
              borderBottom: tr === "bottom" ? `1px solid ${T.gold}` : "none",
              borderLeft: bl === "left" ? `1px solid ${T.gold}` : "none",
              borderRight: bl === "right" ? `1px solid ${T.gold}` : "none" }} />
          ))}
          <div style={{ width: 40, height: 40, border: `1px solid rgba(201,169,110,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={T.gold} strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 5, fontFamily: FONT_BODY }}>
            Drop reference files here
          </div>
          <div style={{ fontSize: 9, color: T.muted, marginBottom: 14, fontFamily: FONT_BODY,
            letterSpacing: "0.04em" }}>JPEG · PNG · WebP · PDF &nbsp;·&nbsp; Max 10MB</div>
          <div style={{ display: "inline-flex", padding: "7px 18px", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            background: "white", border: `1px solid ${T.border}`,
            color: T.navy, cursor: "pointer", fontFamily: FONT_BODY }}>Browse Files</div>
        </div>
      )
    },
    { name: "Rush Toggle", description: "Rush request indicator. shadcn Switch style.", variant: "on + off",
      el: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px",
          background: "#FAF7F2", border: `1px solid ${T.border}`, width: 280 }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
            color: T.muted, fontFamily: FONT_BODY, marginBottom: 2 }}>Request Priority</div>
          {[true, false].map(on => (
            <div key={String(on)} style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: "12px 14px",
              background: on ? "rgba(185,28,28,0.05)" : "white",
              border: `1px solid ${on ? "rgba(185,28,28,0.2)" : T.border}`,
              borderLeft: `3px solid ${on ? "#EF4444" : T.border}` }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700,
                  color: on ? "#B91C1C" : T.navy, fontFamily: FONT_BODY,
                  display: "flex", alignItems: "center", gap: 6 }}>
                  {on && <RushBadge />}
                  {!on && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: T.muted, fontFamily: FONT_BODY }}>Standard</span>}
                </div>
                <div style={{ fontSize: 9, color: on ? "rgba(185,28,28,0.7)" : T.muted,
                  marginTop: 4, fontFamily: FONT_BODY }}>
                  {on ? "SLA: 24h · Elevated priority queue" : "SLA: 5 business days"}
                </div>
              </div>
              {/* shadcn Switch */}
              <div style={{ width: 44, height: 24, flexShrink: 0,
                background: on ? "linear-gradient(135deg,#991B1B,#B91C1C)" : "#E5E7EB",
                border: `1px solid ${on ? "rgba(255,255,255,0.1)" : "#D1D5DB"}`,
                position: "relative", cursor: "pointer",
                boxShadow: on ? "0 0 10px rgba(185,28,28,0.3)" : "none" }}>
                <div style={{ position: "absolute", top: 2, left: on ? 22 : 2,
                  width: 18, height: 18, background: "white",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  transition: "left 0.2s" }} />
              </div>
            </div>
          ))}
        </div>
      )
    },
    { name: "Date Picker", description: "Due date selector. shadcn Popover + Calendar pattern.", variant: "default", fullWidth: true,
      el: (
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap",
          padding: "20px", background: "#FAF7F2", border: `1px solid ${T.border}` }}>
          {/* Input trigger */}
          <div style={{ width: 220 }}>
            <label style={{ display: "block", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: T.muted, marginBottom: 5, fontFamily: FONT_BODY }}>Due Date</label>
            <div style={{ display: "flex", alignItems: "center", gap: 0,
              border: `1px solid ${T.navy}`, borderLeft: `3px solid ${T.navy}`,
              background: "white", boxShadow: "0 0 0 3px rgba(15,43,79,0.06)", cursor: "pointer" }}>
              <div style={{ flex: 1, padding: "9px 12px", fontSize: 11, color: T.navy,
                fontFamily: FONT_MONO, letterSpacing: "0.04em" }}>Mar 12, 2026</div>
              <div style={{ padding: "0 10px", borderLeft: `1px solid ${T.border}`,
                height: "100%", display: "flex", alignItems: "center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke={T.navy} strokeWidth="1.8" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
            </div>
          </div>
          {/* Calendar popover — shadcn Calendar */}
          <div style={{ background: "white", border: `1px solid rgba(201,169,110,0.25)`,
            boxShadow: "0 8px 32px rgba(7,20,40,0.14)", padding: "0", overflow: "hidden", minWidth: 240 }}>
            {/* Calendar header */}
            <div style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
              padding: "10px 14px", display: "flex", alignItems: "center",
              justifyContent: "space-between", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.5),transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" style={{ cursor: "pointer" }}>
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "white", fontFamily: FONT_BODY,
                  letterSpacing: "0.04em" }}>March 2026</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" style={{ cursor: "pointer" }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
              <span style={{ fontSize: 8, color: T.gold, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", fontFamily: FONT_BODY, cursor: "pointer" }}>Today</span>
            </div>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
              padding: "8px 10px 4px", borderBottom: `1px solid ${T.border}` }}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 8, fontWeight: 700,
                  color: T.muted, letterSpacing: "0.08em", fontFamily: FONT_BODY,
                  padding: "2px 0" }}>{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
              padding: "6px 10px 10px", gap: "2px 0" }}>
              {[
                [null,null,"1","2","3","4","5"],
                ["6","7","8","9","10","11","12"],
                ["13","14","15","16","17","18","19"],
                ["20","21","22","23","24","25","26"],
                ["27","28","29","30","31",null,null],
              ].flat().map((d, i) => {
                const isSelected = d === "12";
                const isToday = d === "9";
                const isPast = d && parseInt(d) < 9;
                return (
                  <div key={i} style={{ textAlign: "center", padding: "5px 2px",
                    fontSize: 10, cursor: d ? "pointer" : "default",
                    fontFamily: FONT_MONO, fontWeight: isSelected ? 700 : 400,
                    color: !d ? "transparent"
                      : isSelected ? "white"
                      : isPast ? "rgba(107,114,128,0.4)"
                      : isToday ? T.gold
                      : T.navy,
                    background: isSelected
                      ? `linear-gradient(135deg,${T.navy},#1A3A6B)`
                      : isToday ? "rgba(201,169,110,0.1)"
                      : "transparent",
                    outline: isToday && !isSelected ? `1px solid rgba(201,169,110,0.3)` : "none",
                  }}>{d || ""}</div>
                );
              })}
            </div>
            {/* footer */}
            <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 12px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "#FAF7F2" }}>
              <span style={{ fontSize: 9, color: T.muted, fontFamily: FONT_BODY }}>
                <span style={{ color: T.gold, fontWeight: 700 }}>Mar 12</span> selected
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ padding: "5px 12px", fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  background: "white", border: `1px solid ${T.border}`,
                  color: T.muted, cursor: "pointer", fontFamily: FONT_BODY }}>Clear</div>
                <div style={{ padding: "5px 12px", fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                  color: "white", cursor: "pointer", fontFamily: FONT_BODY }}>Confirm</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    { name: "Material Type Picker", description: "Icon grid selector for request type.", variant: "step-1", fullWidth: true,
      el: (
        <div style={{ width: "100%", background: "#FAF7F2", border: `1px solid ${T.border}`,
          padding: "16px" }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
            color: T.muted, fontFamily: FONT_BODY, marginBottom: 12 }}>Select Material Type</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {[[FileText,"Flyer",true],[LayoutGrid,"Social Pack",false],[BarChart2,"Report",false],[Film,"Video",false],[BookOpen,"Brochure",false],[Mail,"Email",false]].map(([Icon,l,sel]) => (
              <div key={l} style={{ padding: "16px 8px", textAlign: "center",
                background: sel ? "white" : "white",
                border: `1px solid ${sel ? T.navy : T.border}`,
                borderTop: `2px solid ${sel ? T.navy : "transparent"}`,
                boxShadow: sel ? "0 0 0 1px rgba(15,43,79,0.08), 0 4px 12px rgba(15,43,79,0.1)" : "none",
                cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <Icon size={18} strokeWidth={1.5} color={sel ? T.navy : "#9CA3AF"} />
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: sel ? T.navy : "#9CA3AF", fontFamily: FONT_BODY }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
  ];

  // ── MODALS ────────────────────────────────────────────────────────────────────
  if (key === "modals") return [
    { name: "Cancel Modal", description: "Agent cancellation confirm. Optional reason.", variant: "agent", fullWidth: true,
      el: (
        <div style={{ pointerEvents: "none", maxWidth: 440, width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(201,169,110,0.12)",
          background: "white", overflow: "hidden" }}>
          {/* shadcn DialogHeader — dark glass */}
          <div style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`, padding: "18px 20px",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            borderBottom: "1px solid rgba(201,169,110,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.5),transparent)" }} />
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
                color: T.gold, marginBottom: 5, textShadow: "0 0 12px rgba(201,169,110,0.5)" }}>Cancel Request</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: "white",
                letterSpacing: "-0.01em" }}>Pinnacle Peak Twilight Flyer</div>
            </div>
            <div style={{ width: 28, height: 28, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>×</div>
          </div>
          {/* shadcn DialogContent */}
          <div style={{ padding: "18px 20px", background: "#FAF7F2" }}>
            {/* Request summary card */}
            <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "white",
              border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, background: `linear-gradient(135deg,${T.navy},#2A4A7A)`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={18} strokeWidth={1.5} color="white" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: FONT_BODY }}>#42 · Flyer · Standard</div>
                <div style={{ fontSize: 9, color: T.muted, marginTop: 2, fontFamily: FONT_BODY }}>Submitted 2 days ago · Due Mar 12</div>
              </div>
            </div>
            {/* Reason field */}
            <label style={{ display: "block", fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: T.muted, marginBottom: 6, fontFamily: FONT_BODY }}>Reason (optional)</label>
            <div style={{ border: `1px solid ${T.border}`, height: 60, background: "white",
              marginBottom: 18, padding: "8px 10px" }}>
              <span style={{ fontSize: 11, color: T.mutedLight, fontFamily: FONT_BODY }}>Describe why you're cancelling…</span>
            </div>
            {/* shadcn DialogFooter */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <div style={{ padding: "9px 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", background: "white", border: `1px solid ${T.border}`,
                color: T.muted, cursor: "pointer", fontFamily: FONT_BODY }}>Keep Request</div>
              <div style={{ padding: "9px 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", background: "linear-gradient(135deg,#991B1B,#B91C1C)",
                color: "white", cursor: "pointer", fontFamily: FONT_BODY,
                boxShadow: "0 0 16px rgba(185,28,28,0.35)" }}>Cancel Request</div>
            </div>
          </div>
        </div>
      )
    },
    { name: "Cancel Blocked", description: "In-progress request cannot be cancelled by agent.", variant: "blocked", fullWidth: true,
      el: (
        <div style={{ pointerEvents: "none", maxWidth: 440, width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(201,169,110,0.12)",
          background: "white", overflow: "hidden" }}>
          <div style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`, padding: "18px 20px",
            borderBottom: "1px solid rgba(201,169,110,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.5),transparent)" }} />
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
              color: T.gold, marginBottom: 5 }}>Cancel Request</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: "white" }}>Social Pack — Spring 2026</div>
          </div>
          <div style={{ padding: "18px 20px", background: "#FAF7F2" }}>
            {/* shadcn Alert — warning variant */}
            <div style={{ display: "flex", gap: 12, padding: "12px 14px",
              background: "#FFFBEB", border: "1px solid #FDE68A", marginBottom: 16 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B"
                strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 9v4M12 17h.01"/>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#92400E", marginBottom: 3, fontFamily: FONT_BODY }}>Request In Progress</div>
                <span style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5, fontFamily: FONT_BODY }}>
                  This request is already in progress. Contact the designer directly to discuss changes.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ padding: "9px 24px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", background: "white", border: `1px solid ${T.border}`,
                color: T.navy, cursor: "pointer", fontFamily: FONT_BODY }}>Close</div>
            </div>
          </div>
        </div>
      )
    },
    { name: "Profile Drawer", description: "Slide-in right panel. About / Calendar tabs. Social + contact.", variant: "about", fullWidth: true,
      el: (
        <div style={{ pointerEvents: "none", display: "flex", justifyContent: "flex-end", width: "100%" }}>
          {/* shadcn Sheet */}
          <div style={{ width: 360, background: "white", overflow: "hidden",
            boxShadow: "-12px 0 48px rgba(0,0,0,0.15), -1px 0 0 rgba(201,169,110,0.15)" }}>
            {/* Sheet header — dark glass */}
            <div style={{ background: `linear-gradient(160deg,#071428,#0F2B4F,#1A3A6B)`,
              padding: "22px 20px 0", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.5),transparent)" }} />
              {/* Avatar */}
              <div style={{ width: 58, height: 58, borderRadius: "50%",
                background: `linear-gradient(135deg,${T.gold},#B8935A)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 700, color: "white", letterSpacing: "0.05em",
                marginBottom: 12, border: "2px solid rgba(201,169,110,0.4)",
                boxShadow: "0 0 20px rgba(201,169,110,0.3)" }}>YC</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: "white",
                letterSpacing: "-0.01em" }}>Yong Choi</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 3,
                fontFamily: FONT_BODY }}>Associate Broker · Scottsdale North</div>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 0, marginTop: 16 }}>
                {["About", "Calendar", "Schedule"].map((t, i) => (
                  <div key={t} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase", padding: "8px 16px",
                    color: i === 0 ? T.gold : "rgba(255,255,255,0.35)",
                    borderBottom: `2px solid ${i === 0 ? T.gold : "transparent"}`,
                    cursor: "pointer", fontFamily: FONT_BODY }}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
            {/* Sheet content */}
            <div style={{ padding: "4px 0" }}>
              {[["Email","yong.choi@russlyon.com"],["Phone","(480) 555-0142"],["Office","Scottsdale North"],["License","SA.12345678"]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: T.muted, textTransform: "uppercase",
                    letterSpacing: "0.12em", fontFamily: FONT_BODY }}>{l}</span>
                  <span style={{ fontSize: 11, color: T.navy, fontWeight: 500, fontFamily: FONT_BODY }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    { name: "New Request Modal", description: "Multi-step. Material type → details → submit.", variant: "step 1", fullWidth: true,
      el: (
        <div style={{ pointerEvents: "none", maxWidth: 560, width: "100%", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(201,169,110,0.12)",
          background: "white" }}>
          {/* Dialog header */}
          <div style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`, padding: "18px 20px",
            borderBottom: "1px solid rgba(201,169,110,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.5),transparent)" }} />
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
              color: T.gold, marginBottom: 10, fontFamily: FONT_BODY }}>New Marketing Request</div>
            {/* Step indicator — shadcn-style */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {[["Material Type", true], ["Details", false], ["Submit", false]].map(([s, active], i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6,
                    padding: "4px 12px",
                    background: active ? "rgba(201,169,110,0.2)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${active ? "rgba(201,169,110,0.5)" : "rgba(255,255,255,0.1)"}`,
                    boxShadow: active ? "0 0 12px rgba(201,169,110,0.2)" : "none" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%",
                      background: active ? T.gold : "rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 8, fontWeight: 700, color: "white", flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                      color: active ? T.gold : "rgba(255,255,255,0.3)", fontFamily: FONT_BODY }}>{s}</span>
                  </div>
                  {i < 2 && <div style={{ width: 16, height: 1, background: "rgba(255,255,255,0.1)" }} />}
                </div>
              ))}
            </div>
          </div>
          {/* Dialog body */}
          <div style={{ padding: "20px", background: "#FAF7F2" }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 14, fontFamily: FONT_BODY }}>
              Select a material type to begin your request.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
              {[[FileText,"Flyer",true],[LayoutGrid,"Social Pack",false],[BarChart2,"Report",false],[Film,"Video",false],[BookOpen,"Brochure",false],[Mail,"Email",false]].map(([Icon,l,sel]) => (
                <div key={l} style={{ padding: "14px 8px", textAlign: "center",
                  background: sel ? "white" : "white",
                  border: `1px solid ${sel ? T.navy : T.border}`,
                  boxShadow: sel ? `0 0 0 1px ${T.navy}, 0 4px 12px rgba(15,43,79,0.12)` : "none",
                  cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                    <Icon size={18} strokeWidth={1.5} color={sel ? T.navy : "#9CA3AF"} />
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                    color: sel ? T.navy : "#6B7280", fontFamily: FONT_BODY }}>{l}</div>
                </div>
              ))}
            </div>
            {/* Dialog footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18,
              paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
              <div style={{ padding: "9px 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", background: "white", border: `1px solid ${T.border}`,
                color: T.muted, cursor: "pointer", fontFamily: FONT_BODY }}>Cancel</div>
              <div style={{ padding: "9px 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                color: "white", cursor: "pointer", fontFamily: FONT_BODY,
                boxShadow: `0 0 16px rgba(15,43,79,0.35)` }}>Next: Details →</div>
            </div>
          </div>
        </div>
      )
    },
    { name: "Revision Request Modal", description: "Designer requests revisions. Checklist + note.", variant: "default", fullWidth: true,
      el: (
        <div style={{ pointerEvents: "none", maxWidth: 480, width: "100%", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(201,169,110,0.12)",
          background: "white" }}>
          <div style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`, padding: "18px 20px",
            borderBottom: "1px solid rgba(201,169,110,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.5),transparent)" }} />
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
              color: T.gold, marginBottom: 5, fontFamily: FONT_BODY }}>Request Revisions</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: "white" }}>Pinnacle Peak Twilight Flyer</div>
          </div>
          <div style={{ padding: "18px 20px", background: "#FAF7F2" }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
              color: T.muted, marginBottom: 10, fontFamily: FONT_BODY }}>Items needed from agent</div>
            {["Updated copy from client", "New hero photo (see brief)", "Color correction on gold elements"].map((item, n) => (
              <div key={n} style={{ display: "flex", gap: 10, alignItems: "center",
                padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                {/* shadcn Checkbox */}
                <div style={{ width: 18, height: 18, flexShrink: 0,
                  background: n < 2 ? `linear-gradient(135deg,${T.navy},#1A3A6B)` : "white",
                  border: `1px solid ${n < 2 ? T.navy : T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: n < 2 ? `0 0 8px rgba(15,43,79,0.3)` : "none" }}>
                  {n < 2 && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 11, fontFamily: FONT_BODY,
                  color: n < 2 ? T.navy : T.muted,
                  fontWeight: n < 2 ? 600 : 400,
                  textDecoration: n < 2 ? "none" : "none" }}>{item}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end",
              paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
              <div style={{ padding: "9px 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", background: "white", border: `1px solid ${T.border}`,
                color: T.muted, cursor: "pointer", fontFamily: FONT_BODY }}>Cancel</div>
              <div style={{ padding: "9px 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                color: "white", cursor: "pointer", fontFamily: FONT_BODY,
                boxShadow: `0 0 16px rgba(15,43,79,0.35)` }}>Send Revision Request</div>
            </div>
          </div>
        </div>
      )
    },
  ];

  // ── NAVIGATION ────────────────────────────────────────────────────────────────
  if (key === "navigation") return [
    { name: "Sidebar", description: "Dark navy. Gold active state. Expandable groups. Notification badges.", variant: "full", fullWidth: true,
      el: (
        <div style={{ width: 232, background: T.sidebar, pointerEvents: "none",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.3)" }}>
          {/* brand header */}
          <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.4),transparent)" }} />
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: "white",
              letterSpacing: "0.01em" }}>Russ Lyon</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em",
              textTransform: "uppercase", marginTop: 3, fontFamily: FONT_BODY }}>Sotheby's Platform</div>
            {/* tenant badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8,
              padding: "3px 8px", background: "rgba(201,169,110,0.1)",
              border: "1px solid rgba(201,169,110,0.2)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80" }} />
              <span style={{ fontSize: 8, color: "rgba(201,169,110,0.8)", letterSpacing: "0.1em",
                textTransform: "uppercase", fontFamily: FONT_BODY, fontWeight: 700 }}>Scottsdale North</span>
            </div>
          </div>
          {/* nav section label */}
          <div style={{ padding: "12px 18px 4px" }}>
            <span style={{ fontSize: 7, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)", fontFamily: FONT_BODY, fontWeight: 700 }}>Main</span>
          </div>
          {/* nav items */}
          {[
            { label: "Lyon's Den",        icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z",  active: false, badge: null },
            { label: "Dashboard",         icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z", active: false, badge: null },
            { label: "Marketing",         icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", active: true,  badge: "7" },
            { label: "Messages",          icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", active: false, badge: "3" },
            { label: "Component Library", icon: "M4 6h16M4 12h16M4 18h7", active: false, badge: null },
          ].map(({ label, icon, active, badge }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "9px 18px",
              background: active ? "rgba(201,169,110,0.1)" : "transparent",
              borderLeft: `2px solid ${active ? T.gold : "transparent"}`,
              cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={active ? T.gold : "rgba(255,255,255,0.35)"}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={icon}/>
              </svg>
              <span style={{ flex: 1, fontSize: 11, fontWeight: active ? 600 : 400,
                color: active ? T.gold : "rgba(255,255,255,0.5)",
                fontFamily: FONT_BODY, letterSpacing: "0.01em" }}>{label}</span>
              {badge && (
                <div style={{
                  background: active ? `linear-gradient(135deg,${T.gold},#B8935A)` : "rgba(255,255,255,0.1)",
                  color: active ? "white" : "rgba(255,255,255,0.5)",
                  fontSize: 8, fontWeight: 700, padding: "1px 6px",
                  fontFamily: FONT_BODY, minWidth: 18, textAlign: "center" }}>{badge}</div>
              )}
            </div>
          ))}
          {/* sub-nav */}
          <div style={{ margin: "4px 0 0", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 4 }}>
            <div style={{ padding: "8px 18px 4px" }}>
              <span style={{ fontSize: 7, letterSpacing: "0.18em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)", fontFamily: FONT_BODY, fontWeight: 700 }}>Marketing</span>
            </div>
            {[["My Requests", true, "4"], ["Design Queue", false, null], ["Operations", false, null]].map(([l, a, b]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "7px 18px 7px 38px", cursor: "pointer" }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%",
                  background: a ? T.gold : "rgba(255,255,255,0.15)" }} />
                <span style={{ flex: 1, fontSize: 10, color: a ? T.gold : "rgba(255,255,255,0.3)",
                  fontWeight: a ? 600 : 400, fontFamily: FONT_BODY }}>{l}</span>
                {b && <span style={{ fontSize: 8, color: a ? T.gold : "rgba(255,255,255,0.25)",
                  fontFamily: FONT_MONO }}>{b}</span>}
              </div>
            ))}
          </div>
          {/* user footer */}
          <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "10px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%",
              background: `linear-gradient(135deg,${T.gold},#B8935A)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: "white", flexShrink: 0,
              border: "1px solid rgba(201,169,110,0.4)" }}>YC</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "white", fontFamily: FONT_BODY }}>Yong Choi</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontFamily: FONT_BODY,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Agent · Scottsdale North</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.25)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
      )
    },
    { name: "Top Bar", description: "Fixed header. Breadcrumb left, search center, actions right.", variant: "full", fullWidth: true,
      el: (
        <div style={{ background: "#FAF7F2", borderBottom: "1px solid rgba(201,169,110,0.2)",
          padding: "0 20px", height: 52, display: "flex", alignItems: "center", gap: 16,
          width: "100%", boxSizing: "border-box", pointerEvents: "none",
          boxShadow: "0 1px 12px rgba(7,20,40,0.06)" }}>
          {/* breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {["Platform", "Marketing", "My Requests"].map((c, i, arr) => (
              <span key={c} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: i === arr.length - 1 ? 700 : 400,
                  color: i === arr.length - 1 ? T.navy : T.muted,
                  fontFamily: FONT_BODY,
                  cursor: i < arr.length - 1 ? "pointer" : "default" }}>{c}</span>
                {i < arr.length - 1 && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke={T.muted} strokeWidth="1.5" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                )}
              </span>
            ))}
          </div>
          {/* search — shadcn Input */}
          <div style={{ flex: 1, maxWidth: 320, height: 32, background: "white",
            border: `1px solid ${T.border}`, display: "flex", alignItems: "center",
            gap: 8, padding: "0 12px", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke={T.muted} strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <span style={{ fontSize: 11, color: T.mutedLight, fontFamily: FONT_BODY }}>Search requests, people…</span>
            {/* shadcn kbd badge */}
            <div style={{ marginLeft: "auto", padding: "1px 6px",
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              fontSize: 9, color: T.muted, fontFamily: FONT_MONO }}>⌘K</div>
          </div>
          {/* right actions */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, color: T.muted, fontFamily: FONT_MONO }}>Mar 9, 2026</span>
            {/* notification bell */}
            <div style={{ position: "relative" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={T.muted} strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <div style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8,
                borderRadius: "50%", background: "linear-gradient(135deg,#991B1B,#B91C1C)",
                border: "1.5px solid #FAF7F2" }} />
            </div>
            {/* avatar */}
            <div style={{ width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg,${T.gold},#B8935A)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "white",
              border: "1px solid rgba(201,169,110,0.35)" }}>YC</div>
          </div>
        </div>
      )
    },
    { name: "Breadcrumb", description: "Page location indicator. Chevron separators.", variant: "default",
      el: (
        <div style={{ display: "flex", alignItems: "center", gap: 4,
          padding: "8px 12px", background: "#FAF7F2", border: `1px solid ${T.border}`,
          width: "fit-content" }}>
          {["Platform", "Marketing", "My Requests"].map((c, i, arr) => (
            <span key={c} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: i === arr.length - 1 ? 700 : 400,
                color: i === arr.length - 1 ? T.navy : T.muted,
                fontFamily: FONT_BODY,
                cursor: i < arr.length - 1 ? "pointer" : "default" }}>{c}</span>
              {i < arr.length - 1 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={T.muted} strokeWidth="1.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              )}
            </span>
          ))}
        </div>
      )
    },
    { name: "Tab Bar", description: "Content filter / view switcher. Counts. Active gold underline.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", background: "#FAF7F2",
          borderBottom: `1px solid rgba(201,169,110,0.2)` }}>
          <div style={{ display: "flex", gap: 0, padding: "0 4px" }}>
            {[["All Requests", true, 12], ["In Progress", false, 3], ["Completed", false, 8], ["Cancelled", false, 1]].map(([l, active, count]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 7,
                padding: "12px 16px", cursor: "pointer", position: "relative",
                borderBottom: `2px solid ${active ? T.gold : "transparent"}`,
                marginBottom: "-1px" }}>
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 400,
                  color: active ? T.navy : T.muted, fontFamily: FONT_BODY,
                  whiteSpace: "nowrap" }}>{l}</span>
                {/* shadcn Badge */}
                <div style={{ padding: "1px 7px",
                  background: active ? T.navy : T.surfaceAlt,
                  border: `1px solid ${active ? T.navy : T.border}`,
                  fontSize: 9, fontWeight: 700,
                  color: active ? "white" : T.muted,
                  fontFamily: FONT_BODY }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
  ];

  // ── CHAT ─────────────────────────────────────────────────────────────────────
  if (key === "chat") return [
    { name: "Chat Thread", description: "Own messages right (navy). Other left (cream). System events centered. Avatars, timestamps, read receipts.", variant: "thread", fullWidth: true,
      el: (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: 480,
          background: "#FAF7F2", border: `1px solid rgba(201,169,110,0.15)`,
          boxShadow: "0 4px 24px rgba(7,20,40,0.12)" }}>
          {/* shadcn Card header */}
          <div style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
            padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
            borderBottom: "1px solid rgba(201,169,110,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.5),transparent)" }} />
            <div style={{ width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg,${T.gold},#B8935A)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0,
              border: "1px solid rgba(201,169,110,0.4)" }}>YC</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "white", fontFamily: FONT_BODY }}>Yong Choi</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80" }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontFamily: FONT_BODY }}>Online · #42 Pinnacle Peak Flyer</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {["M4 6h16M4 12h16M4 18h16", "M6 18L18 6M6 6l12 12"].map((p, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round">
                  <path d={p}/>
                </svg>
              ))}
            </div>
          </div>
          {/* message list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "16px 16px 8px" }}>
            {/* date separator */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 12px" }}>
              <div style={{ flex: 1, height: 1, background: `${T.border}` }} />
              <span style={{ fontSize: 8, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: FONT_BODY, whiteSpace: "nowrap" }}>Today, Mar 9</span>
              <div style={{ flex: 1, height: 1, background: `${T.border}` }} />
            </div>
            {/* outbound message */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <div style={{ maxWidth: 280,
                  background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                  padding: "10px 14px", fontSize: 11, lineHeight: 1.6, color: "white",
                  fontFamily: FONT_BODY,
                  borderRadius: "0", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Can we add the mountain view callout in the copy?
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 8, color: T.muted, fontFamily: FONT_BODY }}>9:45 AM</span>
                {/* read receipt */}
                <svg width="14" height="8" viewBox="0 0 24 12" fill="none">
                  <path d="M1 6l4 4L14 2" stroke={T.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 6l4 4L21 2" stroke={T.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {/* system event — shadcn Badge style */}
            <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px",
                background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.18)" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
                </svg>
                <span style={{ fontSize: 8, color: T.gold, letterSpacing: "0.1em", textTransform: "uppercase",
                  fontFamily: FONT_BODY, fontWeight: 700 }}>Status: Submitted → In Progress · Lex Baum · 9:52 AM</span>
              </div>
            </div>
            {/* inbound message */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: "rgba(15,43,79,0.12)", border: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: T.navy, fontFamily: FONT_BODY }}>LB</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 280 }}>
                <div style={{ background: "white", border: `1px solid ${T.border}`,
                  padding: "10px 14px", fontSize: 11, lineHeight: 1.6, color: T.navy,
                  fontFamily: FONT_BODY }}>
                  Sure — I'll add it above the price point. Will send draft v2 shortly.
                </div>
                <span style={{ fontSize: 8, color: T.muted, fontFamily: FONT_BODY }}>Lex Baum · 10:02 AM</span>
              </div>
            </div>
            {/* file attachment bubble */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: "rgba(15,43,79,0.12)", border: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: T.navy, fontFamily: FONT_BODY }}>LB</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ background: "white", border: `1px solid ${T.border}`,
                  padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={14} strokeWidth={1.5} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.navy, fontFamily: FONT_BODY }}>flyer-v2-draft.pdf</div>
                    <div style={{ fontSize: 8, color: T.muted, fontFamily: FONT_MONO, marginTop: 1 }}>2.4 MB · PDF</div>
                  </div>
                  <div style={{ marginLeft: 8, padding: "4px 10px", fontSize: 8, fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                    color: "white", cursor: "pointer", fontFamily: FONT_BODY }}>View</div>
                </div>
                <span style={{ fontSize: 8, color: T.muted, fontFamily: FONT_BODY }}>Lex Baum · 10:04 AM</span>
              </div>
            </div>
            {/* outbound with reaction */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, marginBottom: 4 }}>
              <div style={{ maxWidth: 280,
                background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                padding: "10px 14px", fontSize: 11, lineHeight: 1.6, color: "white",
                fontFamily: FONT_BODY, border: "1px solid rgba(255,255,255,0.08)" }}>
                Perfect. Also can you make the price bolder?
              </div>
              {/* reaction chip */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px",
                background: "white", border: `1px solid ${T.border}`,
                cursor: "pointer" }}>
                <span style={{ fontSize: 11 }}>👍</span>
                <span style={{ fontSize: 9, color: T.muted, fontFamily: FONT_MONO }}>1</span>
              </div>
              <span style={{ fontSize: 8, color: T.muted, fontFamily: FONT_BODY }}>10:15 AM</span>
            </div>
          </div>
          {/* typing indicator */}
          <div style={{ padding: "0 16px 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: "rgba(15,43,79,0.12)", border: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, color: T.navy, fontFamily: FONT_BODY }}>LB</div>
            <div style={{ background: "white", border: `1px solid ${T.border}`,
              padding: "8px 14px", display: "flex", alignItems: "center", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: "50%",
                  background: T.muted, opacity: 0.5,
                  animation: `rushPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
          {/* shadcn-style input — Chat Input */}
          <div style={{ borderTop: "1px solid rgba(201,169,110,0.15)", padding: "10px 12px",
            background: "white", display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4,
              color: T.muted, display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <div style={{ flex: 1, border: `1px solid ${T.border}`, padding: "8px 12px",
              fontSize: 11, color: T.mutedLight, lineHeight: 1.5, background: "#FAF7F2",
              fontFamily: FONT_BODY }}>Reply to thread…</div>
            <button style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
              border: "1px solid rgba(255,255,255,0.1)", color: "white",
              padding: "8px 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: FONT_BODY,
              display: "flex", alignItems: "center", gap: 6 }}>
              Send
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </div>
      )
    },
    { name: "Chat Input", description: "Message composer. Attachment, input, send.", variant: "default", fullWidth: true,
      el: (
        <div style={{ borderTop: "1px solid rgba(201,169,110,0.15)", padding: "10px 12px",
          background: "white", display: "flex", alignItems: "center", gap: 8,
          border: `1px solid ${T.border}`, maxWidth: 480, width: "100%" }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4,
            color: T.muted, display: "flex", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <div style={{ flex: 1, border: `1px solid ${T.border}`, padding: "8px 12px",
            fontSize: 11, color: T.mutedLight, lineHeight: 1.5, background: "#FAF7F2",
            fontFamily: FONT_BODY }}>Reply to thread…</div>
          <button style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
            border: "1px solid rgba(255,255,255,0.1)", color: "white",
            padding: "8px 16px", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", cursor: "pointer", fontFamily: FONT_BODY,
            display: "flex", alignItems: "center", gap: 6 }}>
            Send
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      )
    },
    { name: "Messenger Panel", description: "Floating chat panel. Dark glass header, contact list.", variant: "expanded",
      el: (
        <div style={{ pointerEvents: "none", width: 280,
          border: `1px solid rgba(201,169,110,0.15)`,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.3)", overflow: "hidden" }}>
          {/* shadcn Card header */}
          <div style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
            padding: "10px 14px", display: "flex", alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(201,169,110,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.5),transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "white", fontFamily: FONT_BODY,
                letterSpacing: "0.04em" }}>Messages</span>
              <div style={{ background: "linear-gradient(135deg,#991B1B,#B91C1C)", color: "white",
                fontSize: 8, fontWeight: 700, padding: "1px 6px", fontFamily: FONT_BODY }}>3</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["–","×"].map(c => (
                <span key={c} style={{ fontSize: 13, color: "rgba(255,255,255,0.4)",
                  cursor: "pointer", fontFamily: FONT_BODY }}>{c}</span>
              ))}
            </div>
          </div>
          {/* contact rows */}
          {[
            { initials: "YC", name: "Yong Choi",    preview: "Can we add the mountain…", time: "10:15",  unread: 2, online: true  },
            { initials: "DK", name: "David Kim",     preview: "Report looks great 👍",    time: "Yesterday", unread: 0, online: false },
            { initials: "LB", name: "Lex Baum",      preview: "Sending v2 now",           time: "9:52 AM", unread: 1, online: true  },
          ].map((c, i, arr) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", background: i === 0 ? T.surfaceAlt : "#FAF7F2",
              borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none",
              cursor: "pointer" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%",
                  background: i === 0 ? `linear-gradient(135deg,${T.gold},#B8935A)` : "rgba(15,43,79,0.1)",
                  border: `1px solid ${i === 0 ? "rgba(201,169,110,0.4)" : T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700,
                  color: i === 0 ? "white" : T.navy, fontFamily: FONT_BODY }}>
                  {c.initials}
                </div>
                {c.online && (
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8,
                    borderRadius: "50%", background: "#4ADE80",
                    border: "1.5px solid #FAF7F2" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, fontWeight: c.unread > 0 ? 700 : 500,
                    color: T.navy, fontFamily: FONT_BODY }}>{c.name}</span>
                  <span style={{ fontSize: 8, color: T.muted, fontFamily: FONT_MONO,
                    flexShrink: 0, marginLeft: 6 }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 9, color: T.muted, marginTop: 2, fontFamily: FONT_BODY,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.preview}</div>
              </div>
              {c.unread > 0 && (
                <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700, color: "white", fontFamily: FONT_BODY }}>{c.unread}</div>
              )}
            </div>
          ))}
        </div>
      )
    },
    { name: "Unread Indicator", description: "Badge on sidebar nav item for unread messages.", variant: "default",
      el: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
          background: T.sidebar, width: 220,
          borderLeft: `2px solid rgba(201,169,110,0.3)` }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: FONT_BODY }}>Messages</span>
          <div style={{ marginLeft: "auto", background: "linear-gradient(135deg,#991B1B,#B91C1C)",
            color: "white", fontSize: 8, fontWeight: 700, padding: "2px 7px",
            fontFamily: FONT_BODY, minWidth: 18, textAlign: "center" }}>3</div>
        </div>
      )
    },
  ];

  // ── BLOG ─────────────────────────────────────────────────────────────────────
  if (key === "blog") return [
    { name: "Category Filter Bar", description: "Tab-style category switcher with post counts. shadcn Tabs pattern.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", background: T.navyDark,
          border: `1px solid rgba(255,255,255,0.05)` }}>
          {/* top gold line */}
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.4),transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 0,
            padding: "0 8px", overflowX: "auto" }}>
            {[["All", 24, true], ["Market Insights", 8, false], ["Announcements", 5, false], ["Community News", 6, false], ["Agent Spotlights", 5, false]].map(([label, count, active], i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 7,
                padding: "14px 16px", cursor: "pointer", flexShrink: 0,
                borderBottom: `2px solid ${active ? T.gold : "transparent"}`,
                position: "relative" }}>
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 400,
                  color: active ? "white" : "rgba(255,255,255,0.4)",
                  fontFamily: FONT_BODY, whiteSpace: "nowrap",
                  letterSpacing: active ? "0.01em" : "0" }}>{label}</span>
                <div style={{ padding: "1px 7px",
                  background: active ? `linear-gradient(135deg,${T.gold},${T.goldDim})` : "rgba(255,255,255,0.06)",
                  border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.08)"}`,
                  fontSize: 8, fontWeight: 700,
                  color: active ? "white" : "rgba(255,255,255,0.3)",
                  fontFamily: FONT_BODY }}>{count}</div>
              </div>
            ))}
            <div style={{ marginLeft: "auto", padding: "0 12px", display: "flex",
              alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)",
                  fontFamily: FONT_BODY }}>Search posts…</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    { name: "Featured Hero Post", description: "Large hero card for pinned or latest announcement. Full-bleed image with glass overlay.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", position: "relative", overflow: "hidden",
          border: `1px solid rgba(201,169,110,0.15)`,
          boxShadow: "0 8px 40px rgba(7,20,40,0.3)" }}>
          {/* simulated image background */}
          <div style={{ height: 260, background: `linear-gradient(135deg, #0A1F3A 0%, #1A3A6B 40%, #0F2B4F 70%, #071428 100%)`,
            position: "relative", overflow: "hidden" }}>
            {/* decorative geometry simulating photo */}
            <div style={{ position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 70% 40%, rgba(201,169,110,0.12) 0%, transparent 60%)" }} />
            <div style={{ position: "absolute", right: -40, top: -40, width: 280, height: 280,
              border: "1px solid rgba(201,169,110,0.08)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", right: 20, top: 20, width: 180, height: 180,
              border: "1px solid rgba(201,169,110,0.06)", borderRadius: "50%" }} />
            {/* PINNED badge */}
            <div style={{ position: "absolute", top: 16, left: 16,
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px",
              background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
              boxShadow: "0 2px 12px rgba(201,169,110,0.4)" }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span style={{ fontSize: 8, fontWeight: 700, color: "white",
                letterSpacing: "0.14em", textTransform: "uppercase",
                fontFamily: FONT_BODY }}>Pinned</span>
            </div>
            {/* glass overlay — bottom */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(to top, rgba(7,20,40,0.95) 0%, rgba(7,20,40,0.6) 60%, transparent 100%)",
              padding: "32px 24px 20px" }}>
              {/* category */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 8,
                padding: "3px 10px",
                background: "rgba(201,169,110,0.12)",
                border: "1px solid rgba(201,169,110,0.25)" }}>
                <span style={{ fontSize: 8, color: T.gold, fontWeight: 700,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  fontFamily: FONT_BODY }}>Market Insights</span>
              </div>
              {/* title */}
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600,
                color: "white", lineHeight: 1.25, marginBottom: 8, letterSpacing: "0.01em",
                maxWidth: 520 }}>
                Scottsdale Luxury Market Report: Q1 2026 Recap & Outlook
              </div>
              {/* excerpt */}
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)",
                fontFamily: FONT_BODY, lineHeight: 1.6, maxWidth: 480, marginBottom: 14 }}>
                Desert Mountain and Silverleaf continue to outperform the broader market, with median days-on-market reaching record lows amid constrained inventory.
              </div>
              {/* meta row */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%",
                    background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: "white", fontFamily: FONT_BODY,
                    border: "1px solid rgba(201,169,110,0.4)" }}>YC</div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)",
                    fontFamily: FONT_BODY }}>Yong Choi</span>
                </div>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)",
                  fontFamily: FONT_MONO }}>Mar 9, 2026</span>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)",
                  fontFamily: FONT_MONO }}>8 min read</span>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center",
                  gap: 6, padding: "6px 14px",
                  background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                  border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    fontFamily: FONT_BODY }}>Read</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    { name: "Article Card Grid", description: "3-column card grid. Compact post cards with category, title, excerpt, author, read time.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)", gap: 1,
          background: "rgba(255,255,255,0.04)" }}>
          {[
            { cat: "Announcements", catColor: "#818CF8", title: "Derek Webb Joins as Head of Brokerage Technology", excerpt: "Russ Lyon expands its tech leadership as the platform enters Phase 4 rollout.", author: "Lex Baum", date: "Mar 7", read: "3 min", initials: "LB" },
            { cat: "Community News", catColor: T.gold, title: "Desert Mountain Hosts Annual Member Appreciation Weekend", excerpt: "Over 400 members gathered at the Sonoran clubhouse for the spring event and property tour.", author: "Yong Choi", date: "Mar 5", read: "5 min", initials: "YC" },
            { cat: "Agent Spotlights", catColor: "#4ADE80", title: "Lonnie Lopez Closes Record Sale in Troon North at $4.2M", excerpt: "The property set a new neighborhood high-water mark, driven by strong out-of-state demand.", author: "Lex Baum", date: "Mar 3", read: "4 min", initials: "LB" },
          ].map((post, i) => (
            <div key={i} style={{ background: T.navyDark,
              borderTop: `2px solid ${post.catColor}`,
              padding: "18px", cursor: "pointer",
              display: "flex", flexDirection: "column", gap: 10,
              transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#0D2240"}
              onMouseLeave={e => e.currentTarget.style.background = T.navyDark}>
              {/* category */}
              <div style={{ display: "inline-flex", padding: "2px 8px",
                background: `${post.catColor}18`,
                border: `1px solid ${post.catColor}40`, width: "fit-content" }}>
                <span style={{ fontSize: 7, fontWeight: 700,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: post.catColor, fontFamily: FONT_BODY }}>{post.cat}</span>
              </div>
              {/* title */}
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600,
                color: "white", lineHeight: 1.35, letterSpacing: "0.01em" }}>
                {post.title}
              </div>
              {/* excerpt */}
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)",
                fontFamily: FONT_BODY, lineHeight: 1.6, flex: 1 }}>
                {post.excerpt}
              </div>
              {/* footer */}
              <div style={{ display: "flex", alignItems: "center", gap: 8,
                paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%",
                  background: "rgba(201,169,110,0.15)",
                  border: "1px solid rgba(201,169,110,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 7, fontWeight: 700, color: T.gold, fontFamily: FONT_BODY }}>
                  {post.initials}
                </div>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)",
                  fontFamily: FONT_BODY }}>{post.author}</span>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)",
                  fontFamily: FONT_MONO, marginLeft: "auto" }}>{post.date} · {post.read}</span>
              </div>
            </div>
          ))}
        </div>
      )
    },
    { name: "Article Detail View", description: "Full reading view. Header, byline, body typography, related posts.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", background: T.navyDark,
          border: `1px solid rgba(255,255,255,0.05)` }}>
          {/* article header */}
          <div style={{ padding: "28px 32px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.4),transparent)" }} />
            {/* breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 16 }}>
              {["Dashboard", "News & Announcements", "Article"].map((c, i, arr) => (
                <span key={c} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 9, color: i === arr.length - 1 ? "rgba(255,255,255,0.3)" : T.gold,
                    fontFamily: FONT_BODY, cursor: i < arr.length - 1 ? "pointer" : "default" }}>{c}</span>
                  {i < arr.length - 1 && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  )}
                </span>
              ))}
            </div>
            {/* category */}
            <div style={{ display: "inline-flex", marginBottom: 12,
              padding: "3px 10px", background: "rgba(201,169,110,0.1)",
              border: "1px solid rgba(201,169,110,0.25)" }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: T.gold,
                letterSpacing: "0.14em", textTransform: "uppercase",
                fontFamily: FONT_BODY }}>Market Insights</span>
            </div>
            {/* title */}
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600,
              color: "white", lineHeight: 1.25, letterSpacing: "0.01em", marginBottom: 14,
              maxWidth: 640 }}>
              Scottsdale Luxury Market Report: Q1 2026 Recap & Outlook
            </div>
            {/* byline */}
            <div style={{ display: "flex", alignItems: "center", gap: 16,
              paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%",
                  background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "white", fontFamily: FONT_BODY,
                  border: "1px solid rgba(201,169,110,0.4)" }}>YC</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "white",
                    fontFamily: FONT_BODY }}>Yong Choi</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)",
                    fontFamily: FONT_BODY }}>Scottsdale North · Agent</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginLeft: 8 }}>
                {["Mar 9, 2026", "8 min read", "1,204 views"].map((m, i) => (
                  <span key={i} style={{ fontSize: 9, color: "rgba(255,255,255,0.25)",
                    fontFamily: FONT_MONO }}>{m}</span>
                ))}
              </div>
              {/* share actions */}
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {["Share", "Save"].map((a, i) => (
                  <div key={a} style={{ padding: "5px 12px", fontSize: 8, fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    background: i === 0 ? `linear-gradient(135deg,${T.navy},#1A3A6B)` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${i === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)"}`,
                    color: "rgba(255,255,255,0.6)", cursor: "pointer",
                    fontFamily: FONT_BODY }}>{a}</div>
                ))}
              </div>
            </div>
          </div>
          {/* article body */}
          <div style={{ padding: "28px 32px", maxWidth: 680 }}>
            {/* lede */}
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.7)",
              fontFamily: FONT_BODY, fontWeight: 300, marginBottom: 20,
              borderLeft: `3px solid ${T.gold}`, paddingLeft: 16,
              fontStyle: "italic" }}>
              Desert Mountain and Silverleaf continue to outperform the broader market, with median days-on-market reaching record lows amid constrained inventory and sustained out-of-state demand.
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.9, color: "rgba(255,255,255,0.5)",
              fontFamily: FONT_BODY, marginBottom: 16 }}>
              The first quarter of 2026 confirmed what many in the Scottsdale luxury segment anticipated: supply remains the dominant constraint on transaction volume. With fewer than 40 active listings above $3M at any given point, qualified buyers are facing compressed decision windows and limited negotiating leverage.
            </p>
            {/* pull quote */}
            <div style={{ margin: "20px 0", padding: "16px 20px",
              background: "rgba(201,169,110,0.06)",
              border: "1px solid rgba(201,169,110,0.15)",
              borderLeft: `4px solid ${T.gold}` }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 500,
                color: "rgba(255,255,255,0.8)", lineHeight: 1.5, fontStyle: "italic" }}>
                "Median DOM in the $2M–$5M bracket fell to 18 days — the lowest on record for a Q1 period."
              </div>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.9, color: "rgba(255,255,255,0.5)",
              fontFamily: FONT_BODY }}>
              Troon North and Grayhawk recorded notable upticks in closed transactions, fueled by relative affordability within the luxury tier and improved ARMLS listing visibility following the platform's data feed refresh.
            </p>
          </div>
          {/* related posts */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "20px 32px" }}>
            <div style={{ fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)", fontWeight: 700, fontFamily: FONT_BODY,
              marginBottom: 14 }}>Related Posts</div>
            <div style={{ display: "flex", gap: 1 }}>
              {[
                { cat: "Announcements", catColor: "#818CF8", title: "Platform Update: Spark API Integration Live", meta: "Mar 6 · 2 min" },
                { cat: "Market Insights", catColor: T.gold, title: "Paradise Valley Q4 2025 Closed Sales Summary", meta: "Feb 28 · 6 min" },
              ].map((r, i) => (
                <div key={i} style={{ flex: 1, padding: "14px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderTop: `2px solid ${r.catColor}`,
                  cursor: "pointer" }}>
                  <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: r.catColor,
                    fontFamily: FONT_BODY, marginBottom: 6 }}>{r.cat}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)",
                    fontFamily: FONT_DISPLAY, lineHeight: 1.35, marginBottom: 6 }}>{r.title}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)",
                    fontFamily: FONT_MONO }}>{r.meta}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
  ];

  // ── NOTIFICATIONS & ALERTS ──────────────────────────────────────────────────
  if (key === "notifications") return [
    { name: "Toast Notifications", description: "Ephemeral system feedback. Success, warning, error, info. shadcn Toast pattern.", variant: "stack", fullWidth: true,
      el: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 380 }}>
          {[
            { type: "success", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#4ADE80", border: "#16A34A", bg: "rgba(74,222,128,0.08)", label: "Request submitted", sub: "Flyer #47 is now in the design queue." },
            { type: "error",   icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#F87171", border: "#DC2626", bg: "rgba(248,113,113,0.08)", label: "SLA breached", sub: "Request #31 is 4h past the 48h window." },
            { type: "warning", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "#FBBF24", border: "#D97706", bg: "rgba(251,191,36,0.08)", label: "Token expiring soon", sub: "ARMLS auth token expires in 2h. Refresh now." },
            { type: "info",    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "#60A5FA", border: "#2563EB", bg: "rgba(96,165,250,0.08)", label: "Sync complete", sub: "ARMLS mirror updated — 512,841 listings synced." },
          ].map(({ type, icon, color, border, bg, label, sub }) => (
            <div key={type} style={{ display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 14px", background: bg,
              border: `1px solid ${border}40`,
              borderLeft: `3px solid ${border}`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={color} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d={icon}/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "white",
                  fontFamily: FONT_BODY, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)",
                  fontFamily: FONT_BODY, lineHeight: 1.5 }}>{sub}</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"
                style={{ flexShrink: 0, cursor: "pointer", marginTop: 2 }}>
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
          ))}
        </div>
      )
    },
    { name: "Alert Banners", description: "Persistent inline alerts. Full-width contextual feedback inside panels.", variant: "stack", fullWidth: true,
      el: (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
          {[
            { type: "success", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#4ADE80", border: "#16A34A", bg: "rgba(74,222,128,0.06)", label: "Platform deployed successfully", action: "View log" },
            { type: "warning", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "#FBBF24", border: "#D97706", bg: "rgba(251,191,36,0.06)", label: "Listing photos blocked — Russ Lyon approval pending", action: "Details" },
            { type: "error",   icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#F87171", border: "#DC2626", bg: "rgba(248,113,113,0.06)", label: "ARMLS sync failed — EventBridge checkpoint missed", action: "Retry" },
          ].map(({ type, icon, color, border, bg, label, action }) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px", background: bg,
              borderLeft: `3px solid ${border}`,
              borderBottom: `1px solid ${border}20` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={color} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d={icon}/>
              </svg>
              <span style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.7)",
                fontFamily: FONT_BODY }}>{label}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: color,
                letterSpacing: "0.06em", cursor: "pointer",
                fontFamily: FONT_BODY }}>{action} →</span>
            </div>
          ))}
        </div>
      )
    },
    { name: "Notification Bell Panel", description: "Dropdown notification center. Unread count, grouped items, mark all read.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", maxWidth: 360,
          background: T.navyDark, border: `1px solid rgba(201,169,110,0.15)`,
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)", overflow: "hidden" }}>
          {/* header */}
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center",
            justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)",
            position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.4),transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "white",
                fontFamily: FONT_BODY }}>Notifications</span>
              <div style={{ padding: "1px 7px",
                background: "linear-gradient(135deg,#991B1B,#B91C1C)",
                fontSize: 8, fontWeight: 700, color: "white",
                fontFamily: FONT_BODY }}>4</div>
            </div>
            <span style={{ fontSize: 9, color: T.gold, cursor: "pointer",
              fontFamily: FONT_BODY, fontWeight: 600 }}>Mark all read</span>
          </div>
          {/* items */}
          {[
            { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#4ADE80", title: "Request #47 approved", sub: "Flyer approved by Lex Baum", time: "2m ago", unread: true },
            { icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#F87171", title: "SLA breached on #31", sub: "Past 48h window — escalation triggered", time: "18m ago", unread: true },
            { icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", color: "#FBBF24", title: "Token refresh complete", sub: "ARMLS OAuth token renewed", time: "1h ago", unread: true },
            { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "#60A5FA", title: "New message from Yong", sub: "Can we add the mountain view callout…", time: "3h ago", unread: true },
            { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2", color: "rgba(255,255,255,0.25)", title: "Q1 Report published", sub: "Visible to all brokerage staff", time: "Yesterday", unread: false },
          ].map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 16px", cursor: "pointer",
              background: n.unread ? "rgba(201,169,110,0.04)" : "transparent",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              borderLeft: `2px solid ${n.unread ? T.gold : "transparent"}` }}>
              <div style={{ width: 28, height: 28, flexShrink: 0,
                background: `${n.color}15`, border: `1px solid ${n.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke={n.color} strokeWidth="2" strokeLinecap="round">
                  <path d={n.icon}/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 10, fontWeight: n.unread ? 700 : 500,
                    color: n.unread ? "white" : "rgba(255,255,255,0.45)",
                    fontFamily: FONT_BODY }}>{n.title}</span>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)",
                    fontFamily: FONT_MONO, flexShrink: 0, marginLeft: 8 }}>{n.time}</span>
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)",
                  fontFamily: FONT_BODY, marginTop: 2, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.sub}</div>
              </div>
              {n.unread && (
                <div style={{ width: 6, height: 6, borderRadius: "50%",
                  background: T.gold, flexShrink: 0, marginTop: 4 }} />
              )}
            </div>
          ))}
          <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: 9, color: T.gold, cursor: "pointer",
              fontFamily: FONT_BODY, fontWeight: 700, letterSpacing: "0.06em" }}>
              View all notifications →
            </span>
          </div>
        </div>
      )
    },
    { name: "Inline Field Feedback", description: "Form-level validation messages and helper text states.", variant: "stack",
      el: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 300 }}>
          {[
            { state: "success", color: "#4ADE80", border: "#16A34A", bg: "rgba(74,222,128,0.08)", icon: "M9 12l2 2 4-4", label: "Username available", icon2: null },
            { state: "error",   color: "#F87171", border: "#DC2626", bg: "rgba(248,113,113,0.08)", icon: "M6 18L18 6M6 6l12 12", label: "This field is required" },
            { state: "warning", color: "#FBBF24", border: "#D97706", bg: "rgba(251,191,36,0.08)", icon: "M12 9v2m0 4h.01", label: "Due date is within 24h — Rush SLA applies" },
            { state: "info",    color: "#60A5FA", border: "#2563EB", bg: "rgba(96,165,250,0.08)", icon: "M13 16h-1v-4h-1m1-4h.01", label: "Supports Markdown formatting" },
          ].map(({ state, color, border, bg, icon, label }) => (
            <div key={state} style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "7px 10px", background: bg,
              border: `1px solid ${border}30`,
              borderLeft: `2px solid ${border}` }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={color} strokeWidth="2.5" strokeLinecap="round">
                {state === "warning" || state === "info"
                  ? <><circle cx="12" cy="12" r="10"/><path d={icon}/></>
                  : <path d={icon}/>}
              </svg>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)",
                fontFamily: FONT_BODY }}>{label}</span>
            </div>
          ))}
        </div>
      )
    },
    { name: "Loading Skeleton", description: "Placeholder shimmer for async content. Card, table row, and text block variants.", variant: "stack", fullWidth: true,
      el: (() => {
        const Skel = ({ w, h, style: s = {} }) => (
          <div style={{ width: w, height: h, background: "rgba(255,255,255,0.06)",
            position: "relative", overflow: "hidden", ...s }}>
            <div style={{ position: "absolute", inset: 0,
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
              animation: "shimmer 1.6s infinite" }} />
          </div>
        );
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
            {/* card skeleton */}
            <div style={{ padding: "16px", background: T.navyDark,
              border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <Skel w={36} h={36} style={{ borderRadius: "50%" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
                  <Skel w="60%" h={10} />
                  <Skel w="40%" h={8} />
                </div>
                <Skel w={60} h={22} />
              </div>
              <Skel w="100%" h={8} style={{ marginBottom: 6 }} />
              <Skel w="85%" h={8} style={{ marginBottom: 6 }} />
              <Skel w="70%" h={8} />
            </div>
            {/* table row skeletons */}
            <div style={{ background: T.navyDark, border: "1px solid rgba(255,255,255,0.05)",
              overflow: "hidden" }}>
              {/* header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
                gap: 12, padding: "10px 16px",
                background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
                borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Request","Type","Status","Designer",""].map((h, i) => (
                  <div key={i} style={{ fontSize: 8, fontWeight: 700, color: T.gold,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    fontFamily: FONT_BODY }}>{h}</div>
                ))}
              </div>
              {[80, 65, 72].map((pct, i) => (
                <div key={i} style={{ display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
                  gap: 12, padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <Skel w={`${pct}%`} h={9} />
                  <Skel w="70%" h={9} />
                  <Skel w={64} h={18} />
                  <Skel w="80%" h={9} />
                  <Skel w={60} h={24} />
                </div>
              ))}
            </div>
          </div>
        );
      })()
    },
  ];

  // ── EMPTY STATES ─────────────────────────────────────────────────────────────
  if (key === "empty") return [
    { name: "Empty Queue", description: "Design queue has no pending requests.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", background: T.navyDark,
          border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
          {/* chrome header */}
          <div style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
            padding: "10px 16px", display: "flex", alignItems: "center",
            justifyContent: "space-between", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.4),transparent)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "white",
              fontFamily: FONT_BODY, letterSpacing: "0.02em" }}>Design Queue</span>
            <div style={{ padding: "2px 8px", background: "rgba(255,255,255,0.08)",
              fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)",
              fontFamily: FONT_BODY }}>0 requests</div>
          </div>
          {/* empty body */}
          <div style={{ padding: "52px 24px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 12 }}>
            <div style={{ width: 56, height: 56, border: `1px solid rgba(201,169,110,0.2)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(201,169,110,0.04)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="rgba(201,169,110,0.4)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: "rgba(255,255,255,0.6)",
                marginBottom: 6 }}>Queue is clear</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)",
                fontFamily: FONT_BODY, lineHeight: 1.6, maxWidth: 260 }}>
                No pending design requests. New submissions from agents will appear here.
              </div>
            </div>
            <div style={{ padding: "8px 20px", marginTop: 4,
              background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "white", cursor: "pointer",
              fontFamily: FONT_BODY }}>New Request</div>
          </div>
        </div>
      )
    },
    { name: "Empty Search Results", description: "No matches for the current search/filter state.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", padding: "52px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          background: T.navyDark, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ width: 56, height: 56, border: `1px solid rgba(255,255,255,0.08)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,0.03)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              <path d="M8 11h6M11 8v6" stroke="rgba(255,255,255,0.15)"/>
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15,
              color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>No results found</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)",
              fontFamily: FONT_BODY, lineHeight: 1.6 }}>
              No requests match <span style={{ color: T.gold, fontFamily: FONT_MONO }}>"mountain view flyer"</span>.<br/>
              Try adjusting your filters or search term.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <div style={{ padding: "6px 14px", fontSize: 9, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: FONT_BODY }}>Clear filters</div>
            <div style={{ padding: "6px 14px", fontSize: 9, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
              border: "1px solid rgba(255,255,255,0.08)",
              color: "white", cursor: "pointer", fontFamily: FONT_BODY }}>New Request</div>
          </div>
        </div>
      )
    },
    { name: "First Run / Onboarding", description: "Zero state for a new tenant with no data. Guides to first action.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", background: T.navyDark,
          border: "1px solid rgba(201,169,110,0.15)",
          overflow: "hidden", position: "relative" }}>
          <div style={{ height: 2,
            background: `linear-gradient(90deg,transparent,${T.gold},transparent)` }} />
          <div style={{ padding: "40px 32px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 10, color: T.gold,
              letterSpacing: "0.18em", textTransform: "uppercase",
              marginBottom: 10, fontWeight: 400 }}>Welcome to</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600,
              color: "white", letterSpacing: "0.01em", marginBottom: 6 }}>Russ Lyon Platform</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: FONT_BODY,
              marginBottom: 28, maxWidth: 360, textAlign: "center", lineHeight: 1.6 }}>
              Your brokerage operating system is ready. Complete setup to unlock the full platform.
            </div>
            {/* steps */}
            <div style={{ display: "flex", gap: 1, width: "100%", maxWidth: 520 }}>
              {[
                { n: "1", label: "Connect ARMLS", sub: "Link your MLS credentials", done: true },
                { n: "2", label: "Invite Team",   sub: "Add designers & admins",   done: false, active: true },
                { n: "3", label: "First Request", sub: "Submit a design request",  done: false },
              ].map(({ n, label, sub, done, active }) => (
                <div key={n} style={{ flex: 1, padding: "14px 12px",
                  background: active ? "rgba(201,169,110,0.08)"
                    : done ? "rgba(74,222,128,0.05)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? "rgba(201,169,110,0.2)" : done ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}`,
                  borderTop: `2px solid ${active ? T.gold : done ? "#4ADE80" : "rgba(255,255,255,0.08)"}`,
                  display: "flex", flexDirection: "column", gap: 6, alignItems: "center",
                  textAlign: "center" }}>
                  <div style={{ width: 24, height: 24,
                    background: done ? "rgba(74,222,128,0.15)" : active ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${done ? "#4ADE80" : active ? T.gold : "rgba(255,255,255,0.1)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: done ? 12 : 10, color: done ? "#4ADE80" : active ? T.gold : "rgba(255,255,255,0.3)",
                    fontFamily: FONT_MONO, fontWeight: 700 }}>
                    {done ? "✓" : n}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700,
                    color: active ? "white" : done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                    fontFamily: FONT_BODY }}>{label}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)",
                    fontFamily: FONT_BODY, lineHeight: 1.4 }}>{sub}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "8px 24px", marginTop: 20,
              background: `linear-gradient(135deg,${T.gold},${T.goldDim})`,
              fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "white", cursor: "pointer",
              fontFamily: FONT_BODY, boxShadow: "0 4px 16px rgba(201,169,110,0.3)" }}>
              Invite Team Members
            </div>
          </div>
        </div>
      )
    },
    { name: "Content Unavailable", description: "Feature locked, permission denied, or data not yet available.", variant: "stack", fullWidth: true,
      el: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          {[
            { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", label: "Access Restricted", sub: "You don't have permission to view this section. Contact your admin.", color: "#818CF8" },
            { icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "ARMLS Phase 3 Locked", sub: "MLS data access requires Phase 3 activation. Setup fee pending.", color: T.gold },
          ].map(({ icon, label, sub, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 16,
              padding: "20px 20px", background: T.navyDark,
              border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: 44, height: 44, flexShrink: 0,
                background: `${color}10`, border: `1px solid ${color}25`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke={color} strokeWidth="1.5" strokeLinecap="round">
                  <path d={icon}/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)",
                  fontFamily: FONT_DISPLAY, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)",
                  fontFamily: FONT_BODY, lineHeight: 1.5 }}>{sub}</div>
              </div>
              <div style={{ padding: "6px 14px", fontSize: 8, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: `${color}15`, border: `1px solid ${color}30`,
                color: color, cursor: "pointer", fontFamily: FONT_BODY,
                flexShrink: 0 }}>Upgrade</div>
            </div>
          ))}
        </div>
      )
    },
  ];

  // ── ACTIVITY & TIMELINE ───────────────────────────────────────────────────────
  if (key === "timeline") return [
    { name: "Request Activity Feed", description: "Chronological event log for a single request. Status changes, comments, file uploads, assignments.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", background: T.navyDark,
          border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.4),transparent)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "white",
              fontFamily: FONT_BODY }}>Request #47 — Activity</span>
            <span style={{ fontSize: 8, color: T.gold, fontFamily: FONT_MONO }}>6 events</span>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { type: "status",   icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#4ADE80", border: "#16A34A", label: "Status changed to Approved",    sub: "by Lex Baum",                   time: "10:42 AM",   initials: "LB", isLast: false },
              { type: "comment",  icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "#60A5FA", border: "#2563EB", label: "Comment added",               sub: '"Can you make the price bolder?"', time: "10:15 AM",   initials: "YC", isLast: false },
              { type: "file",     icon: "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13", color: T.gold,    border: T.goldDim, label: "File uploaded",                sub: "flyer-v2-draft.pdf · 2.4 MB",   time: "10:04 AM",   initials: "LB", isLast: false },
              { type: "assign",   icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "#818CF8", border: "#6366F1", label: "Assigned to Lex Baum",         sub: "by David Kim",                  time: "9:58 AM",    initials: "DK", isLast: false },
              { type: "status",   icon: "M13 10V3L4 14h7v7l9-11h-7z",            color: "#FBBF24", border: "#D97706", label: "Status changed to In Progress", sub: "by Lex Baum",                   time: "9:52 AM",    initials: "LB", isLast: false },
              { type: "created",  icon: "M12 4v16m8-8H4",                         color: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.1)", label: "Request created",              sub: "Flyer #47 · Open House · Rush",  time: "Mar 9, 9:45", initials: "YC", isLast: true },
            ].map(({ type, icon, color, border, label, sub, time, initials, isLast }) => (
              <div key={label} style={{ display: "flex", gap: 12, position: "relative" }}>
                {/* vertical line */}
                {!isLast && (
                  <div style={{ position: "absolute", left: 13, top: 28, bottom: -2, width: 1,
                    background: "rgba(255,255,255,0.06)" }} />
                )}
                {/* icon node */}
                <div style={{ width: 28, height: 28, flexShrink: 0,
                  background: `${color}12`, border: `1px solid ${border}35`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 1, marginTop: 2 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke={color} strokeWidth="2" strokeLinecap="round">
                    <path d={icon}/>
                  </svg>
                </div>
                {/* content */}
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : 18 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8,
                    justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 18, height: 18,
                        background: "rgba(201,169,110,0.12)",
                        border: "1px solid rgba(201,169,110,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 7, fontWeight: 700, color: T.gold,
                        fontFamily: FONT_BODY }}>{initials}</div>
                      <span style={{ fontSize: 10, fontWeight: 600,
                        color: "rgba(255,255,255,0.75)", fontFamily: FONT_BODY }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)",
                      fontFamily: FONT_MONO, flexShrink: 0 }}>{time}</span>
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)",
                    fontFamily: FONT_BODY, marginTop: 3, paddingLeft: 26,
                    fontStyle: type === "comment" ? "italic" : "normal" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    { name: "Global Audit Log", description: "Platform-level audit trail. Paginated table of all system events.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", background: T.navyDark,
          border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <div style={{ background: `linear-gradient(135deg,${T.navy},#1A3A6B)`,
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 12,
            borderBottom: "1px solid rgba(201,169,110,0.15)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.4),transparent)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "white",
              fontFamily: FONT_BODY, flex: 1 }}>Audit Log</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "4px 10px", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)",
                fontFamily: FONT_BODY }}>All Events</span>
            </div>
          </div>
          {/* table */}
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 100px 80px",
            padding: "8px 16px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {["Timestamp","Event","Actor","Type"].map(h => (
              <div key={h} style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                fontFamily: FONT_BODY }}>{h}</div>
            ))}
          </div>
          {[
            { time: "10:42:18 AM", event: "request.approved #47",         actor: "Lex Baum",  type: "write",  typeColor: "#4ADE80" },
            { time: "10:04:52 AM", event: "file.uploaded flyer-v2-draft", actor: "Lex Baum",  type: "write",  typeColor: "#4ADE80" },
            { time: "09:58:01 AM", event: "request.assigned → lex_baum",  actor: "David Kim", type: "write",  typeColor: "#4ADE80" },
            { time: "09:52:33 AM", event: "token.refresh armls_oauth",     actor: "System",    type: "system", typeColor: "#818CF8" },
            { time: "09:45:07 AM", event: "request.created #47",           actor: "Yong Choi", type: "write",  typeColor: "#4ADE80" },
            { time: "09:30:00 AM", event: "armls.sync completed 512,841",  actor: "System",    type: "read",   typeColor: "#60A5FA" },
          ].map((row, i) => (
            <div key={i} style={{ display: "grid",
              gridTemplateColumns: "140px 1fr 100px 80px",
              padding: "9px 16px", alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)",
                fontFamily: FONT_MONO }}>{row.time}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)",
                fontFamily: FONT_MONO, overflow: "hidden", textOverflow: "ellipsis",
                whiteSpace: "nowrap" }}>{row.event}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)",
                fontFamily: FONT_BODY }}>{row.actor}</span>
              <div style={{ padding: "2px 7px", width: "fit-content",
                background: `${row.typeColor}12`, border: `1px solid ${row.typeColor}30`,
                fontSize: 7, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: row.typeColor,
                fontFamily: FONT_BODY }}>{row.type}</div>
            </div>
          ))}
        </div>
      )
    },
    { name: "Status Change Timeline", description: "Linear status progression for a request lifecycle. Completed, active, pending states.", variant: "default", fullWidth: true,
      el: (
        <div style={{ width: "100%", padding: "24px",
          background: T.navyDark, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
            fontFamily: FONT_BODY, marginBottom: 20 }}>Request #47 — Lifecycle</div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
            {[
              { label: "Submitted",   time: "9:45 AM",  done: true,   active: false },
              { label: "Triaged",     time: "9:52 AM",  done: true,   active: false },
              { label: "Assigned",    time: "9:58 AM",  done: true,   active: false },
              { label: "In Progress", time: "10:00 AM", done: false,  active: true  },
              { label: "Review",      time: null,       done: false,  active: false },
              { label: "Approved",    time: null,       done: false,  active: false },
              { label: "Delivered",   time: null,       done: false,  active: false },
            ].map(({ label, time, done, active }, i, arr) => (
              <div key={label} style={{ display: "flex", alignItems: "center", flex: i < arr.length - 1 ? 1 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  {/* node */}
                  <div style={{ width: 28, height: 28,
                    background: done ? `linear-gradient(135deg,${T.gold},${T.goldDim})`
                      : active ? `linear-gradient(135deg,${T.navy},#1A3A6B)`
                      : "rgba(255,255,255,0.05)",
                    border: `1px solid ${done ? "rgba(201,169,110,0.4)" : active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: active ? `0 0 12px rgba(15,43,79,0.5)` : "none" }}>
                    {done ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                        stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : (
                      <div style={{ width: active ? 8 : 6, height: active ? 8 : 6,
                        borderRadius: "50%",
                        background: active ? "white" : "rgba(255,255,255,0.1)" }} />
                    )}
                  </div>
                  {/* label */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 8, fontWeight: done || active ? 700 : 400,
                      color: done ? T.gold : active ? "white" : "rgba(255,255,255,0.2)",
                      fontFamily: FONT_BODY, whiteSpace: "nowrap" }}>{label}</div>
                    {time && (
                      <div style={{ fontSize: 7, color: "rgba(255,255,255,0.2)",
                        fontFamily: FONT_MONO, marginTop: 2 }}>{time}</div>
                    )}
                  </div>
                </div>
                {/* connector */}
                {i < arr.length - 1 && (
                  <div style={{ flex: 1, height: 1, marginBottom: 22,
                    background: done ? `linear-gradient(90deg,${T.gold}60,rgba(255,255,255,0.08))`
                      : "rgba(255,255,255,0.06)" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )
    },
  ];

  return [];
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ComponentLibrary() {
  const [active, setActive] = useState("tokens");
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");

  // Load fonts + keyframes into document head
  useEffect(() => {
    const id = "rl-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap";
      document.head.appendChild(link);
    }
    const sid = "rl-keyframes";
    if (!document.getElementById(sid)) {
      const style = document.createElement("style");
      style.id = sid;
      style.textContent = `
        @keyframes rushPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const group = GROUPS.find(g => g.key === active);
  const stories = getStories(active);
  const filtered = search.trim()
    ? stories.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.description || "").toLowerCase().includes(search.toLowerCase()))
    : stories;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: FONT_BODY, background: T.surface, overflow: "hidden" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 240, background: T.sidebar, display: "flex", flexDirection: "column", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", overflowY: "auto" }}>
        {/* Logo */}
        <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 400, color: "white", letterSpacing: "0.01em" }}>Russ Lyon</div>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.gold, marginTop: 1 }}>Component Library</div>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", padding: "6px 10px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search components…"
              style={{ background: "transparent", border: "none", outline: "none", fontSize: 11, color: "rgba(255,255,255,.7)", flex: 1, fontFamily: FONT_BODY }} />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "8px 0", flex: 1 }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,.2)", padding: "8px 16px 4px" }}>Groups</div>
          {GROUPS.map(g => (
            <button key={g.key} onClick={() => { setActive(g.key); setSearch(""); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 16px",
                background: active === g.key ? "rgba(201,169,110,0.12)" : "transparent",
                borderLeft: `2px solid ${active === g.key ? T.gold : "transparent"}`,
                border: "none", cursor: "pointer", textAlign: "left", transition: "background .15s" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke={active === g.key ? T.gold : "rgba(255,255,255,.38)"}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={g.icon} />
              </svg>
              <span style={{ fontSize: 11, fontWeight: active === g.key ? 600 : 400,
                color: active === g.key ? T.gold : "rgba(255,255,255,.55)", flex: 1 }}>{g.label}</span>
              <span style={{ fontSize: 9, color: active === g.key ? "rgba(201,169,110,.6)" : "rgba(255,255,255,.2)", fontFamily: FONT_MONO }}>{g.count}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,.2)", letterSpacing: "0.06em" }}>
            Echelon Point LLC · v2.0
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ background: "white", borderBottom: `1px solid ${T.border}`, padding: "0 28px", height: 52,
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.06em" }}>COMPONENT LIBRARY</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginTop: 1 }}>{group?.label}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: T.muted, fontFamily: FONT_MONO }}>
              {filtered.length} of {stories.length} components
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <GroupHeader group={group} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {filtered.map(s => (
              <StoryCard key={s.name} name={s.name} description={s.description} variant={s.variant} fullWidth={s.fullWidth} onExpand={setExpanded}>
                {s.el}
              </StoryCard>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 4 }}>No components match "{search}"</div>
              <div style={{ fontSize: 11, color: T.muted }}>Try a different search term</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Expand modal ── */}
      <ExpandModal item={expanded} onClose={() => setExpanded(null)} />
    </div>
  );
}
