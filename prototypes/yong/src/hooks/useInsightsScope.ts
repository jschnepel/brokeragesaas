import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MarketRegistry } from '../models';
import type { MarketScope } from '../models/MarketScope';
import type { MarketOverview } from '../models/MarketOverview';
import type { ScopeLevel } from '../models/types';

interface InsightsScopeResult {
  scope: MarketScope;
  overview: MarketOverview;
  level: ScopeLevel;
  scopeKey: string;
  notFound: boolean;
}

export function useInsightsScope(): InsightsScopeResult {
  const { region, zipcode, community } = useParams<{
    region?: string;
    zipcode?: string;
    community?: string;
  }>();

  return useMemo(() => {
    const overview = MarketRegistry.getOverview();
    const resolved = MarketRegistry.getByUrl(region, zipcode, community);

    if (!resolved) {
      return {
        scope: overview,
        overview,
        level: 'market' as const,
        scopeKey: 'market',
        notFound: true,
      };
    }

    const key = [region, zipcode, community].filter(Boolean).join('/') || 'market';

    return {
      scope: resolved,
      overview,
      level: resolved.level,
      scopeKey: key,
      notFound: false,
    };
  }, [region, zipcode, community]);
}
