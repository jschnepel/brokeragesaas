import Image from 'next/image';
import Link from 'next/link';
import { yongBio } from '@/content/yong';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

function emphasize(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((c, i) =>
    c.startsWith('*') && c.endsWith('*') ? <em key={i} className="font-light">{c.slice(1, -1)}</em> : <span key={i}>{c}</span>
  );
}

export function AboutSnippet() {
  return (
    <SectionFrame className="py-24 md:py-32 bg-ink-elevated">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-10 md:gap-16 items-center">
        <figure className="relative aspect-[3/4] overflow-hidden bg-ink-surface">
          <Image
            src={yongBio.photoUrl}
            alt={`Portrait of ${yongBio.name}`}
            fill
            sizes="(min-width: 768px) 320px, 100vw"
            className="object-cover"
          />
        </figure>
        <div>
          <CapsLabel as="div">Meet Your Advisor</CapsLabel>
          <h2 className="display-lg mt-4 text-balance">{emphasize(yongBio.headline)}</h2>
          <blockquote className="mt-6">
            {yongBio.paragraphs.map((p, i) => (
              <p key={i} className="mt-4 text-stone/80 leading-relaxed max-w-2xl">{p}</p>
            ))}
            <cite className="not-italic font-serif italic text-2xl text-gold mt-6 block">— Yong Choi</cite>
          </blockquote>
          <Link
            href="/about"
            className="cta-ghost mt-8"
            aria-label="Read more about Yong Choi"
          >
            <span>About Yong</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </SectionFrame>
  );
}
