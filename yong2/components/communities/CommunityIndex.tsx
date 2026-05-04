import type { CuratedCommunitySummary } from '@/lib/communities';
import type { CommunityKpis } from '@/lib/types';
import { CommunityCard } from './CommunityCard';

type Props = {
  communities: CuratedCommunitySummary[];
  kpisByKey: Record<string, CommunityKpis>;
  slugToKey: Record<string, string>;
};

export function CommunityIndex({ communities, kpisByKey, slugToKey }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {communities.map((c, i) => {
        const key = slugToKey[c.slug] ?? '';
        return (
          <CommunityCard
            key={c.slug}
            community={c}
            kpis={kpisByKey[key] ?? null}
            position={i}
          />
        );
      })}
    </div>
  );
}
