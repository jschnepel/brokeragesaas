"use client";

import { GlassCard } from "@/components/primitives";
import type { ThemeTokens } from "@/services";

const COLOR_TOKENS: { key: keyof ThemeTokens; label: string }[] = [
  { key: "brand-primary", label: "Primary" },
  { key: "brand-primary-dark", label: "Primary Dark" },
  { key: "brand-accent", label: "Accent" },
  { key: "brand-surface", label: "Surface" },
  { key: "brand-surface-alt", label: "Surface Alt" },
  { key: "brand-dark", label: "Dark" },
  { key: "brand-sidebar", label: "Sidebar" },
];

const TEXT_TOKENS: { key: keyof ThemeTokens; label: string }[] = [
  { key: "brand-font-display", label: "Display Font" },
  { key: "brand-font-body", label: "Body Font" },
  { key: "brand-font-mono", label: "Mono Font" },
  { key: "brand-radius", label: "Border Radius" },
  { key: "brand-glow-opacity", label: "Glow Opacity" },
  { key: "brand-card-blur", label: "Card Blur" },
  { key: "brand-sidebar-width", label: "Sidebar Width" },
];

interface Props {
  tokens: ThemeTokens;
  onChange: (key: keyof ThemeTokens, value: string) => void;
}

export function TokenEditor({ tokens, onChange }: Props) {
  return (
    <GlassCard>
      <h3
        className="mb-4 text-base font-semibold"
        style={{ fontFamily: "var(--brand-font-display)" }}
      >
        Design Tokens
      </h3>

      {/* Color tokens */}
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        Colors
      </p>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {COLOR_TOKENS.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              {label}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={tokens[key]}
                onChange={(e) => onChange(key, e.target.value)}
                className="size-8 cursor-pointer rounded border border-[var(--border)]"
              />
              <input
                type="text"
                value={tokens[key]}
                onChange={(e) => onChange(key, e.target.value)}
                className="flex-1 rounded-md border border-[var(--border)] bg-white/60 px-2 py-1 text-xs font-mono"
              />
            </div>
          </label>
        ))}
      </div>

      {/* Text tokens */}
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        Typography & Layout
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {TEXT_TOKENS.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              {label}
            </span>
            <input
              type="text"
              value={tokens[key]}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-white/60 px-2 py-1.5 text-xs font-mono"
            />
          </label>
        ))}
      </div>
    </GlassCard>
  );
}
