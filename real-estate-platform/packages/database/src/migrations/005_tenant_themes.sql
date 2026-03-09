CREATE TABLE IF NOT EXISTS tenant_themes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     TEXT NOT NULL UNIQUE,
  theme_name    TEXT NOT NULL DEFAULT 'Custom',
  tokens        JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the default Russ Lyon theme
INSERT INTO tenant_themes (tenant_id, theme_name, tokens) VALUES (
  'russ-lyon',
  'Russ Lyon Sotheby''s',
  '{
    "brand-primary":       "#0F2B4F",
    "brand-primary-dark":  "#0A1F3A",
    "brand-accent":        "#C9A96E",
    "brand-surface":       "#FAF7F2",
    "brand-surface-alt":   "#F3EFE8",
    "brand-dark":          "#071428",
    "brand-sidebar":       "#0A1F3A",
    "brand-font-display":  "Cormorant Garamond, Georgia, serif",
    "brand-font-body":     "DM Sans, system-ui, sans-serif",
    "brand-font-mono":     "Geist Mono, Fira Code, monospace",
    "brand-radius":        "2px",
    "brand-glow-opacity":  "0.18",
    "brand-card-blur":     "0px",
    "brand-sidebar-width": "224px"
  }'::jsonb
) ON CONFLICT (tenant_id) DO NOTHING;

-- Pre-built alternate theme: Dark Elegance
INSERT INTO tenant_themes (tenant_id, theme_name, tokens) VALUES (
  'russ-lyon-dark',
  'Dark Elegance',
  '{
    "brand-primary":       "#F9F6F1",
    "brand-primary-dark":  "#E8E2D9",
    "brand-accent":        "#C9A96E",
    "brand-surface":       "#0A1F3A",
    "brand-surface-alt":   "#0F2B4F",
    "brand-dark":          "#060F1E",
    "brand-sidebar":       "#060F1E",
    "brand-font-display":  "Cormorant Garamond, Georgia, serif",
    "brand-font-body":     "DM Sans, system-ui, sans-serif",
    "brand-font-mono":     "Geist Mono, Fira Code, monospace",
    "brand-radius":        "2px",
    "brand-glow-opacity":  "0.25",
    "brand-card-blur":     "8px",
    "brand-sidebar-width": "224px"
  }'::jsonb
) ON CONFLICT (tenant_id) DO NOTHING;

-- Pre-built alternate theme: Modern Professional
INSERT INTO tenant_themes (tenant_id, theme_name, tokens) VALUES (
  'russ-lyon-modern',
  'Modern Professional',
  '{
    "brand-primary":       "#1A1A2E",
    "brand-primary-dark":  "#0F0F1A",
    "brand-accent":        "#E94560",
    "brand-surface":       "#F8F9FA",
    "brand-surface-alt":   "#EAECEF",
    "brand-dark":          "#0D0D1A",
    "brand-sidebar":       "#1A1A2E",
    "brand-font-display":  "Cormorant Garamond, Georgia, serif",
    "brand-font-body":     "DM Sans, system-ui, sans-serif",
    "brand-font-mono":     "Geist Mono, Fira Code, monospace",
    "brand-radius":        "6px",
    "brand-glow-opacity":  "0.2",
    "brand-card-blur":     "0px",
    "brand-sidebar-width": "224px"
  }'::jsonb
) ON CONFLICT (tenant_id) DO NOTHING;
