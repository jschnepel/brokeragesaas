'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ThemeTokens, TenantTheme } from '@/services/theme';

interface TokenEditorProps {
  tokens: ThemeTokens;
  onChange: (tokens: ThemeTokens) => void;
  onSave: (themeName: string) => void;
  onReset: () => void;
  prebuiltThemes: TenantTheme[];
  onApplyPrebuilt: (theme: TenantTheme) => void;
  saving?: boolean;
}

const COLOR_TOKENS: { key: keyof ThemeTokens; label: string }[] = [
  { key: 'brand-primary',      label: 'Primary' },
  { key: 'brand-primary-dark', label: 'Sidebar Gradient' },
  { key: 'brand-accent',       label: 'Accent / Gold' },
  { key: 'brand-surface',      label: 'Background' },
  { key: 'brand-surface-alt',  label: 'Surface Alt' },
  { key: 'brand-dark',         label: 'Deep Dark' },
  { key: 'brand-sidebar',      label: 'Sidebar' },
];

const FONT_TOKENS: { key: keyof ThemeTokens; label: string }[] = [
  { key: 'brand-font-display', label: 'Display Font' },
  { key: 'brand-font-body',    label: 'Body Font' },
  { key: 'brand-font-mono',    label: 'Mono Font' },
];

export function TokenEditor({
  tokens,
  onChange,
  onSave,
  onReset,
  prebuiltThemes,
  onApplyPrebuilt,
  saving = false,
}: TokenEditorProps) {
  const [themeName, setThemeName] = useState('Custom');

  function update(key: keyof ThemeTokens, value: string) {
    onChange({ ...tokens, [key]: value });
  }

  return (
    <div style={{
      width: 320,
      background: 'white',
      borderLeft: '1px solid var(--color-border)',
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 18px 12px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'var(--brand-primary)',
        }}>Token Editor</div>
      </div>

      {/* Pre-built Themes */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>
          Pre-built Themes
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {prebuiltThemes.map(t => (
            <button
              key={t.tenantId}
              onClick={() => {
                onApplyPrebuilt(t);
                setThemeName(t.themeName);
              }}
              style={{
                fontSize: 9, fontWeight: 600, padding: '4px 10px',
                border: '1px solid var(--color-border)', borderRadius: 3,
                background: 'var(--brand-surface-alt)', cursor: 'pointer',
                color: 'var(--brand-primary)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#E5E0D8')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand-surface-alt)')}
            >
              {t.themeName}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Colors */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>
            Colors
          </div>
          {COLOR_TOKENS.map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 3,
                  background: tokens[key],
                  border: '1px solid rgba(0,0,0,0.15)',
                }} />
                <input
                  type="color"
                  value={tokens[key]}
                  onChange={e => update(key, e.target.value)}
                  style={{
                    position: 'absolute', inset: 0, opacity: 0,
                    width: '100%', height: '100%', cursor: 'pointer',
                  }}
                />
              </label>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 2 }}>{label}</div>
                <input
                  type="text"
                  value={tokens[key]}
                  onChange={e => update(key, e.target.value)}
                  style={{
                    width: '100%', fontSize: 10, fontFamily: 'var(--font-mono)',
                    padding: '3px 6px', border: '1px solid var(--color-border)',
                    borderRadius: 2, outline: 'none', color: 'var(--brand-primary)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Typography */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>
            Typography
          </div>
          {FONT_TOKENS.map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 3 }}>{label}</div>
              <input
                type="text"
                value={tokens[key]}
                onChange={e => update(key, e.target.value)}
                style={{
                  width: '100%', fontSize: 10, fontFamily: 'var(--font-mono)',
                  padding: '4px 6px', border: '1px solid var(--color-border)',
                  borderRadius: 2, outline: 'none', color: 'var(--brand-primary)',
                }}
              />
            </div>
          ))}
        </div>

        {/* Effects */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>
            Effects
          </div>

          {/* Border Radius */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--brand-primary)' }}>Border Radius</span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}>{tokens['brand-radius']}</span>
            </div>
            <input
              type="range"
              min={0}
              max={16}
              step={1}
              value={parseInt(tokens['brand-radius']) || 0}
              onChange={e => update('brand-radius', `${e.target.value}px`)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Glow Opacity */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--brand-primary)' }}>Glow Opacity</span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}>{tokens['brand-glow-opacity']}</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={parseFloat(tokens['brand-glow-opacity']) || 0}
              onChange={e => update('brand-glow-opacity', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Card Blur */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--brand-primary)' }}>Card Blur</span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#9CA3AF' }}>{tokens['brand-card-blur']}</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={parseInt(tokens['brand-card-blur']) || 0}
              onChange={e => update('brand-card-blur', `${e.target.value}px`)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Sidebar Width */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 3 }}>Sidebar Width</div>
            <input
              type="text"
              value={tokens['brand-sidebar-width']}
              onChange={e => update('brand-sidebar-width', e.target.value)}
              style={{
                width: '100%', fontSize: 10, fontFamily: 'var(--font-mono)',
                padding: '4px 6px', border: '1px solid var(--color-border)',
                borderRadius: 2, outline: 'none', color: 'var(--brand-primary)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 18px', borderTop: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
      }}>
        <input
          type="text"
          placeholder="Theme name..."
          value={themeName}
          onChange={e => setThemeName(e.target.value)}
          style={{
            width: '100%', fontSize: 11, padding: '6px 8px',
            border: '1px solid var(--color-border)', borderRadius: 2,
            outline: 'none', color: 'var(--brand-primary)',
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            onClick={() => onSave(themeName)}
            disabled={saving}
            style={{ flex: 1, fontSize: 11 }}
          >
            {saving ? 'Saving...' : 'Save Theme'}
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            style={{ fontSize: 11 }}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
