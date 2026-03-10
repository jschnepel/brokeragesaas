"use client";

import { useState, useCallback, useEffect } from "react";
import { Save, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SectionHeader, GlassCard } from "@/components/primitives";
import { saveTheme } from "@/actions/theme";
import type { TenantTheme, ThemeTokens } from "@/services";
import { TokenEditor } from "./TokenEditor";
import { PreviewGrid } from "./PreviewGrid";

const DEFAULT_TOKENS: ThemeTokens = {
  "brand-primary": "#0F2B4F",
  "brand-primary-dark": "#0a1f38",
  "brand-accent": "#C9A96E",
  "brand-surface": "#FAF7F2",
  "brand-surface-alt": "#F0EDE6",
  "brand-dark": "#1a1a2e",
  "brand-sidebar": "#0C1C2E",
  "brand-font-display": '"Cormorant Garamond", serif',
  "brand-font-body": '"DM Sans", sans-serif',
  "brand-font-mono": '"Geist Mono", monospace',
  "brand-radius": "0.5rem",
  "brand-glow-opacity": "0.08",
  "brand-card-blur": "12px",
  "brand-sidebar-width": "260px",
};

interface Props {
  currentTheme: TenantTheme | null;
  allThemes: TenantTheme[];
}

export function ComponentLibraryClient({ currentTheme, allThemes }: Props) {
  const [tokens, setTokens] = useState<ThemeTokens>(
    currentTheme?.tokens ?? DEFAULT_TOKENS,
  );
  const [themeName, setThemeName] = useState(
    currentTheme?.themeName ?? "Default",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Live-preview: apply token changes to CSS vars
  useEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(tokens)) {
      root.style.setProperty(`--${key}`, value);
    }
  }, [tokens]);

  const handleTokenChange = useCallback(
    (key: keyof ThemeTokens, value: string) => {
      setTokens((prev) => ({ ...prev, [key]: value }));
      setSaved(false);
    },
    [],
  );

  function handleThemeSelect(id: string) {
    const selected = allThemes.find((t) => t.id === id);
    if (selected) {
      setTokens(selected.tokens);
      setThemeName(selected.themeName);
      setSaved(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveTheme(themeName, tokens);
      setSaved(true);
    } catch (err) {
      console.error("Failed to save theme:", err);
    } finally {
      setSaving(false);
    }
  }

  const saveButton = (
    <button
      onClick={handleSave}
      disabled={saving}
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {saved ? <Check className="size-4" /> : <Save className="size-4" />}
      {saving ? "Saving..." : saved ? "Saved" : "Save Theme"}
    </button>
  );

  return (
    <AppShell title="Component Library" action={saveButton}>
      {/* Theme selector */}
      {allThemes.length > 0 && (
        <GlassCard className="mb-8">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Theme:
            </label>
            <select
              value={currentTheme?.id ?? ""}
              onChange={(e) => handleThemeSelect(e.target.value)}
              className="rounded-md border border-[var(--border)] bg-white/60 px-3 py-1.5 text-sm"
            >
              {allThemes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.themeName}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={themeName}
              onChange={(e) => {
                setThemeName(e.target.value);
                setSaved(false);
              }}
              placeholder="Theme name"
              className="rounded-md border border-[var(--border)] bg-white/60 px-3 py-1.5 text-sm"
            />
          </div>
        </GlassCard>
      )}

      {/* Token editor */}
      <div className="mb-8">
        <TokenEditor tokens={tokens} onChange={handleTokenChange} />
      </div>

      {/* Preview */}
      <SectionHeader title="Component Preview" subtitle="Live preview reflecting current token values" className="mb-6" />
      <PreviewGrid />
    </AppShell>
  );
}
