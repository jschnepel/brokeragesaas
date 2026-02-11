import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { MarketScope } from '../models/MarketScope';
import type { MarketOverview } from '../models/MarketOverview';
import type { ScopeLevel } from '../models/types';

interface InsightsScopeValue {
  scope: MarketScope;
  overview: MarketOverview;
  level: ScopeLevel;
  scopeKey: string; // unique key for transition animations
}

const InsightsScopeContext = createContext<InsightsScopeValue | null>(null);

export function InsightsScopeProvider({
  value,
  children,
}: {
  value: InsightsScopeValue;
  children: ReactNode;
}) {
  return (
    <InsightsScopeContext.Provider value={value}>
      {children}
    </InsightsScopeContext.Provider>
  );
}

export function useInsightsScopeContext(): InsightsScopeValue {
  const ctx = useContext(InsightsScopeContext);
  if (!ctx) {
    throw new Error('useInsightsScopeContext must be used within InsightsScopeProvider');
  }
  return ctx;
}
