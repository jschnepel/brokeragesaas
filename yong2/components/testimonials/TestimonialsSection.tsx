import { SectionFrame } from '@/components/shared/SectionFrame';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { HairlineDivider } from '@/components/shared/HairlineDivider';
import {
  getFeaturedTestimonial,
  getSecondaryTestimonials,
  testimonialsSource,
  type Testimonial,
} from '@/content/testimonials';

type Size = 'sm' | 'md' | 'lg';

function StarRow({ size = 'md' }: { size?: Size }) {
  const dim = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-gold"
      aria-label="5 out of 5 stars"
      role="img"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={dim}
          height={dim}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.77l-5.2 2.73.99-5.78L1.58 7.62l5.82-.85L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

function FeaturedQuote({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="relative max-w-4xl">
      <blockquote className="font-serif text-2xl md:text-4xl lg:text-[2.75rem] leading-[1.2] text-stone text-balance">
        <span
          aria-hidden="true"
          className="text-gold font-serif text-6xl md:text-8xl leading-none mr-2 -mb-2 align-top inline-block"
        >
          &ldquo;
        </span>
        {testimonial.pullQuote}
      </blockquote>
      <figcaption className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
        <span className="caps text-gold">— Verified Client</span>
        <span aria-hidden="true" className="text-stone/30">·</span>
        <span className="caps text-stone/60">{testimonial.location}</span>
        <span aria-hidden="true" className="text-stone/30">·</span>
        <span className="caps text-stone/60">{testimonial.approxDate}</span>
        <a
          href={testimonial.url}
          target="_blank"
          rel="noopener noreferrer"
          className="md:ml-auto inline-flex items-center gap-1.5 caps text-gold hover:text-stone transition-colors duration-200"
          aria-label="View this verified review on RateMyAgent"
        >
          <span>Source on RateMyAgent</span>
          <span aria-hidden="true">↗</span>
        </a>
      </figcaption>
    </figure>
  );
}

function SecondaryCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <a
      href={testimonial.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Read full verified review: ${testimonial.title}`}
      className="group bg-ink-surface p-8 md:p-10 flex flex-col gap-5 transition-colors duration-200 hover:bg-ink-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
    >
      <div className="flex items-center justify-between">
        <StarRow size="sm" />
        <span className="caps text-stone/40 text-[10px]">{testimonial.approxDate}</span>
      </div>
      <h3 className="font-serif text-xl md:text-2xl leading-snug text-stone group-hover:text-gold transition-colors duration-200">
        &ldquo;{testimonial.title}&rdquo;
      </h3>
      <blockquote className="text-stone/75 text-sm leading-relaxed flex-1">
        {testimonial.pullQuote}
      </blockquote>
      <footer className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="caps text-stone/50 text-[10px]">{testimonial.location}</span>
        <span className="caps text-gold/70 text-[10px] group-hover:text-gold transition-colors duration-200">
          Verified <span aria-hidden="true">↗</span>
        </span>
      </footer>
    </a>
  );
}

type TestimonialsSectionProps = {
  /** Override the wrapper background. Defaults to the deepest surface for editorial gravitas. */
  className?: string;
  /** Cap on secondary cards (default 6, max 9). */
  secondaryLimit?: number;
};

export function TestimonialsSection({
  className = 'bg-ink-surface',
  secondaryLimit = 6,
}: TestimonialsSectionProps = {}) {
  const featured = getFeaturedTestimonial();
  const secondary = getSecondaryTestimonials(secondaryLimit);

  return (
    <SectionFrame
      id="testimonials"
      className={`relative overflow-hidden py-24 md:py-32 ${className}`}
    >
      {/* Oversized decorative quote — editorial accent, ignored by SR. */}
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute -top-12 right-2 md:right-8 font-serif leading-none text-gold/[0.06] text-[260px] md:text-[420px]"
      >
        &ldquo;
      </span>

      <header className="relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-end mb-16 md:mb-20">
        <div>
          <CapsLabel>Verified Client Reviews</CapsLabel>
          <h2 className="display-lg mt-4 text-balance text-stone max-w-3xl">
            Why clients return and refer their families.
          </h2>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="flex items-baseline gap-3">
            <StarRow size="lg" />
            <span className="font-serif text-3xl md:text-4xl text-stone leading-none">
              {testimonialsSource.rating.toFixed(1)}
            </span>
          </div>
          <span className="caps text-stone/60 text-[10px]">
            {testimonialsSource.totalReviews} verified reviews · RateMyAgent
          </span>
        </div>
      </header>

      <div className="relative">
        <FeaturedQuote testimonial={featured} />
      </div>

      <HairlineDivider className="mt-20 md:mt-24" />

      <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
        {secondary.map((t) => (
          <SecondaryCard key={t.id} testimonial={t} />
        ))}
      </div>

      <footer className="mt-16 md:mt-20 flex flex-col items-center text-center gap-5">
        <p className="text-stone/70 leading-relaxed max-w-xl">
          Every review above is pulled from Yong&rsquo;s public RateMyAgent profile and tied to
          an actual closed transaction. Click any quote to read the unedited review at the source.
        </p>
        <a
          href={testimonialsSource.reviewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-ghost"
          aria-label={`Read all ${testimonialsSource.totalReviews} verified reviews on RateMyAgent`}
        >
          <span>Read all {testimonialsSource.totalReviews} reviews on RateMyAgent</span>
          <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </SectionFrame>
  );
}
