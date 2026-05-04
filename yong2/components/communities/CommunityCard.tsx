'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CuratedCommunitySummary } from '@/lib/communities';
import type { CommunityKpis } from '@/lib/types';
import { formatPrice, formatDom } from '@/components/shared/formatters';
import { track } from '@/lib/analytics/events';

type Props = {
  community: CuratedCommunitySummary;
  kpis: CommunityKpis | null;
  /**
   * Index in the parent grid — fed to `community_card_click` so we can
   * compare top-of-page vs deep-scroll clickthrough rates.
   */
  position?: number;
};

/**
 * Communities-index tile. Made client so the click can fire a typed
 * `community_card_click` before navigation. We added a dedicated event
 * (rather than reusing `result_card_click` with a fake listingKey) so the
 * funnel reports stay clean.
 */
export function CommunityCard({ community, kpis, position }: Props) {
  return (
    <Link
      href={`/communities/${community.slug}`}
      onClick={() =>
        track('community_card_click', { slug: community.slug, position: position ?? 0 })
      }
      className="relative block aspect-[16/10] overflow-hidden bg-ink-elevated group"
    >
      {community.imageUrl ? (
        <Image
          src={community.imageUrl}
          alt={community.name}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-[900ms] group-hover:scale-105"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        <div>
          <div className="caps">{community.locality}</div>
          <div className="font-serif italic text-2xl mt-2">{community.name}</div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-serif text-lg">{kpis?.medianPrice ? formatPrice(kpis.medianPrice) : '—'}</div>
            <div className="caps mt-0.5">Median</div>
          </div>
          <div>
            <div className="font-serif text-lg">{kpis?.totalActive ?? '—'}</div>
            <div className="caps mt-0.5">Active</div>
          </div>
          <div>
            <div className="font-serif text-lg">{formatDom(kpis?.medianDom ?? null)}</div>
            <div className="caps mt-0.5">Median DOM</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
