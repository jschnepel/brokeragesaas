import Image from 'next/image';
import { CapsLabel } from '@/components/shared/CapsLabel';

type PageHeroProps = {
  /** Public-path image src (e.g. `/page-heroes/portfolio.jpg`). */
  imageSrc: string;
  /** Caps eyebrow label above the headline (e.g. "The Portfolio"). */
  kicker: string;
  /** Display serif headline. */
  headline: string;
  /**
   * Optional italic emphasis fragment in the headline. If supplied, it
   * renders below `headline` in italic light weight. Lets us split a
   * two-line headline cleanly: e.g. "Where buyers" + "choose to live."
   */
  headlineItalic?: string;
  /** Optional sub-line below the headline (one short sentence). */
  sub?: string;
};

/**
 * Cinematic page hero — full-bleed photo, 70vh, kicker + serif headline
 * overlay anchored bottom-left. Used on every secondary page (Portfolio,
 * Communities, Market Reports, About, Contact) to establish a consistent
 * "lead with the image, then the data" cadence below the fold.
 *
 * The 70vh height (vs the landing's 100vh) is deliberate: secondary
 * pages need the visitor to feel the next section beckoning. A full
 * viewport hero on an interior page reads as "intro splash" — wrong
 * mode. 70vh leaves a visible band of the next section below, cuing
 * the scroll without cropping the image awkwardly.
 *
 * Photo carries the tone; the gradient ensures the headline always
 * reads against varied photo content. Honors prefers-reduced-motion
 * implicitly — no animation here.
 */
export function PageHero({
  imageSrc,
  kicker,
  headline,
  headlineItalic,
  sub,
}: PageHeroProps) {
  return (
    <header
      className="relative w-full overflow-hidden"
      style={{ height: '70vh', minHeight: '460px' }}
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        priority
        fetchPriority="high"
        quality={75}
        sizes="100vw"
        className="object-cover"
      />
      {/* Atmospheric darken — preserves headline legibility against any
       * photo. The bottom gradient is heavier so the type stack reads
       * even when the lower half of the image is bright (e.g. Camelback
       * sunset on the Contact page). */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,22,32,0.20),rgba(11,22,32,0.65))]" />
      <div className="absolute inset-x-0 bottom-0 pt-20 pb-12 md:pb-16 bg-gradient-to-b from-transparent to-ink/85">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 text-stone">
          <CapsLabel as="div" className="text-[10px] md:text-xs">
            {kicker}
          </CapsLabel>
          <h1 className="display-xl mt-4 md:mt-5 text-stone text-balance">
            {headline}
            {headlineItalic ? (
              <>
                <br />
                <em className="font-light">{headlineItalic}</em>
              </>
            ) : null}
          </h1>
          {sub ? (
            <p className="mt-4 max-w-xl text-stone/80 leading-relaxed text-base md:text-lg">
              {sub}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
