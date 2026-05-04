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
    <SectionFrame className="py-24 bg-ink-elevated">
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 items-center">
        <div className="relative aspect-[3/4] overflow-hidden bg-ink-surface">
          <Image
            src={yongBio.photoUrl}
            alt={yongBio.name}
            fill
            sizes="(min-width: 768px) 280px, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <CapsLabel as="div">Meet Your Advisor</CapsLabel>
          <h2 className="display-lg mt-4">{emphasize(yongBio.headline)}</h2>
          {yongBio.paragraphs.map((p, i) => (
            <p key={i} className="mt-4 text-stone/80 leading-relaxed max-w-2xl">{p}</p>
          ))}
          <div className="font-serif italic text-2xl text-gold mt-6">— Yong Choi</div>
          <Link href="/about" className="caps mt-8 inline-block hover:text-stone">About Yong →</Link>
        </div>
      </div>
    </SectionFrame>
  );
}
