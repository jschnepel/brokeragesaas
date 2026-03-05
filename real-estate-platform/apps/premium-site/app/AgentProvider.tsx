'use client';

import { createContext, useContext } from 'react';
import type { AgentSiteConfig } from '@platform/shared';

const AgentContext = createContext<AgentSiteConfig | null>(null);

export function AgentProvider({
  config,
  children,
}: {
  config: AgentSiteConfig;
  children: React.ReactNode;
}) {
  return (
    <AgentContext.Provider value={config}>{children}</AgentContext.Provider>
  );
}

/**
 * Access the current agent's site config from any client component.
 * Must be used inside an <AgentProvider>.
 */
export function useAgent(): AgentSiteConfig {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error('useAgent must be used within an <AgentProvider>');
  }
  return ctx;
}
