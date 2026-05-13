import Image from 'next/image';
import Link from 'next/link';
import { yongBio } from '@/content/yong';
import { CapsLabel } from '@/components/shared/CapsLabel';

/**
 * Hero — first frame of the experience.
 *
 * Composition follows the luxury real-estate convention surveyed across
 * Sotheby's-tier sites (David Parnes, Richard Steinberg Team, Private
 * Listings by Harold x Clarke): four elements only — kicker / headline /
 * single ghost CTA / scroll affordance. Stats / proof points live in a
 * dedicated sub-band below the hero (`StatsBand`), per the universal
 * pattern of keeping the hero quiet and letting credibility live one
 * scroll down.
 *
 * Ken-burns animation is intentionally omitted while the placeholder is
 * a flat SVG (no perceptible motion on a silhouette = wasted budget).
 * Re-enable when the real photograph lands by wrapping the image div
 * with `animate-ken-burns`.
 */
export function HeroCinematic() {
  const { heroCopy } = yongBio;
  return (
    <header className="relative w-full h-screen min-h-[640px] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/hero/hero-poster.jpg"
          alt="Sonoran desert at golden hour, McDowell range in the distance — North Scottsdale, Arizona"
          fill
          priority
          fetchPriority="high"
          quality={70}
          sizes="100vw"
          className="object-cover"
        />
      </div>
      {/* Atmospheric darken — preserves photo legibility behind the type stack. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,22,32,0.25),rgba(11,22,32,0.85))]" />
      <div className="absolute inset-x-0 bottom-0 pt-32 pb-16 md:pt-40 md:pb-20 bg-gradient-to-b from-transparent to-ink/80">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 text-stone">
          <CapsLabel className="animate-fade-up text-[9px] md:text-xs leading-relaxed" as="div">
            {heroCopy.localities}
          </CapsLabel>
          <h1
            className="display-xxl mt-5 md:mt-6 text-stone animate-fade-up text-balance"
            style={{ animationDelay: '0.2s', opacity: 0 }}
          >
            {heroCopy.headlineLine1}
            <br />
            <em className="font-light">{heroCopy.headlineLine2}</em>
          </h1>
          <div
            className="mt-10 md:mt-12 animate-fade-up"
            style={{ animationDelay: '0.5s', opacity: 0 }}
          >
            <Link
              href="/portfolio"
              className="cta-ghost inline-flex items-center gap-3 group"
              aria-label="View Yong Choi's current portfolio of listings"
            >
              <span>View the Portfolio</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>
      {/* Scroll affordance — desktop only; thin animated line, no word.
       * Industry pattern: Sotheby's, Aman, Mandarin Oriental all use a
       * line, never a chevron + label. Hides on mobile (no fold space). */}
      <div
        aria-hidden="true"
        className="hidden md:flex absolute inset-x-0 bottom-6 items-center justify-center pointer-events-none"
      >
        <span className="scroll-line" />
      </div>
    </header>
  );
}
