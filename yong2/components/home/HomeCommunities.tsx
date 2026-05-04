import Image from 'next/image';
import Link from 'next/link';
import { homeContent } from '@/content/home';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

type CommunityTile = { slug: string; name: string; locality: string; imageUrl: string | null };
type HomeCommunitiesProps = { communities: CommunityTile[] };

export function HomeCommunities({ communities }: HomeCommunitiesProps) {
  const { communities: copy } = homeContent;
  return (
    <SectionFrame className="py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <CapsLabel as="div">{copy.kicker}</CapsLabel>
          <h2 className="display-lg italic mt-3">{copy.headline}</h2>
        </div>
        <Link href={copy.cta.href} className="caps hover:text-gold transition-colors hidden md:inline">
          {copy.cta.label} →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {communities.map((c) => (
          <Link
            key={c.slug}
            href={`/communities/${c.slug}`}
            className="relative aspect-square overflow-hidden bg-ink-elevated group"
          >
            {c.imageUrl ? (
              <Image
                src={c.imageUrl}
                alt={c.name}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-[900ms] group-hover:scale-105"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="caps mb-1 text-[10px] md:text-xs text-stone/85">{c.locality}</div>
              <div className="font-serif italic text-lg leading-tight">{c.name}</div>
            </div>
          </Link>
        ))}
      </div>
      {/* Mobile-only trailing CTA — mirrors FeaturedPortfolio. */}
      <div className="md:hidden mt-8 text-center">
        <Link href={copy.cta.href} className="caps hover:text-gold transition-colors">
          {copy.cta.label} →
        </Link>
      </div>
    </SectionFrame>
  );
}
