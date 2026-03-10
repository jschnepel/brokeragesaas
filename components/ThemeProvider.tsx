"use client";

import { useEffect } from "react";
import type { ThemeTokens } from "@/services";

export function ThemeProvider({
  tokens,
  children,
}: {
  tokens: ThemeTokens | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!tokens) return;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(tokens)) {
      root.style.setProperty(`--${key}`, value);
    }
    return () => {
      for (const key of Object.keys(tokens)) {
        root.style.removeProperty(`--${key}`);
      }
    };
  }, [tokens]);

  return <>{children}</>;
}
