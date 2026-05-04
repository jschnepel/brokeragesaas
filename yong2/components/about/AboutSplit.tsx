import Image from 'next/image';
import { yongBio } from '@/content/yong';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { StatsStrip } from './StatsStrip';

function emphasize(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((c, i) =>
    c.startsWith('*') && c.endsWith('*') ? <em key={i} className="font-light">{c.slice(1, -1)}</em> : <span key={i}>{c}</span>
  );
}

export function AboutSplit() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
      <div className="relative aspect-[3/4] overflow-hidden bg-ink-elevated">
        <Image
          src={yongBio.photoUrl}
          alt={yongBio.name}
          fill
          priority
          fetchPriority="high"
          quality={75}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div>
        <CapsLabel as="div">{yongBio.kicker}</CapsLabel>
        {/* h2 — page-level h1 lives in PageHero. */}
        <h2 className="display-xl mt-4">{emphasize(yongBio.headline)}</h2>
        {yongBio.paragraphs.map((p, i) => (
          <p key={i} className="mt-4 text-stone/85 leading-relaxed">{p}</p>
        ))}
        <StatsStrip />
      </div>
    </div>
  );
}
