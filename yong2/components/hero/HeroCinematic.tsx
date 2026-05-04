import Image from 'next/image';
import { yongBio } from '@/content/yong';
import { CapsLabel } from '@/components/shared/CapsLabel';

export function HeroCinematic() {
  const { heroCopy, stats } = yongBio;
  return (
    <header className="relative w-full h-screen min-h-[640px] overflow-hidden">
      <div className="absolute inset-0 animate-ken-burns">
        <Image
          src="/hero/hero-poster.svg"
          alt=""
          fill
          priority
          fetchPriority="high"
          quality={70}
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,22,32,0.25),rgba(11,22,32,0.85))]" />
      <div className="absolute inset-x-0 bottom-0 pb-20 pt-40 bg-gradient-to-b from-transparent to-ink/80">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 text-stone">
          <CapsLabel className="animate-fade-up" as="div">{heroCopy.localities}</CapsLabel>
          <h1 className="display-xxl mt-6 text-stone animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            {heroCopy.headlineLine1}
            <br />
            <em className="font-light">{heroCopy.headlineLine2}</em>
          </h1>
          <div className="mt-12 flex flex-col md:flex-row md:items-end md:justify-between gap-8 animate-fade-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
            <dl className="flex flex-wrap gap-10">
              {stats.slice(0, 3).map((s) => (
                <div key={s.label}>
                  <dt className="caps">{s.label}</dt>
                  <dd className="font-serif text-3xl mt-1">{s.value}</dd>
                </div>
              ))}
            </dl>
            <div className="caps text-stone/70">{heroCopy.scrollHint} ↓</div>
          </div>
        </div>
      </div>
    </header>
  );
}
