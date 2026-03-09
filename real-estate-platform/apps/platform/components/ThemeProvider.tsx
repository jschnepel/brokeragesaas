'use client';

import { useEffect } from 'react';
import type { ThemeTokens } from '@/services/theme';

interface ThemeProviderProps {
  tokens: ThemeTokens | null;
  children: React.ReactNode;
}

export function ThemeProvider({ tokens, children }: ThemeProviderProps) {
  useEffect(() => {
    if (!tokens) return;
    const styleId = 'platform-theme-tokens';
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = `:root {\n${Object.entries(tokens)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join('\n')}\n}`;
  }, [tokens]);

  return <>{children}</>;
}
