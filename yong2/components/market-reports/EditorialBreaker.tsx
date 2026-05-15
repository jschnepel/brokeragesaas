import Image from 'next/image';

/**
 * Slim full-bleed image strip used as a visual breather between data
 * sections on a market-report page. Renders as a 40vh atmospheric band
 * with an optional caption stack overlaid bottom-left — gives the
 * scroll a rhythm break instead of stacking six tiled-data sections
 * back-to-back.
 *
 * Photo is decorative; alt left empty so screen readers skip past it
 * and land on the next data section's heading.
 */
export interface EditorialBreakerProps {
  imageSrc: string;
  kicker?: string;
  headline?: string;
  /** Optional italic fragment under the headline. */
  italic?: string;
  /** Show a gold accent line above the kicker. Default true. */
  withAccent?: boolean;
}

export function EditorialBreaker({
  imageSrc,
  kicker,
  headline,
  italic,
  withAccent = true,
}: EditorialBreakerProps) {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(280px, 40vh, 480px)' }}
      aria-hidden={!kicker && !headline ? 'true' : undefined}
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        loading="lazy"
        quality={70}
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-ink/30" />
      {(kicker || headline) ? (
        <div className="relative h-full flex items-end pb-12 md:pb-16">
          <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 lg:px-16">
            {withAccent ? (
              <span aria-hidden="true" className="block w-12 h-px bg-gold/70 mb-5" />
            ) : null}
            {kicker ? (
              <p className="caps text-[10px] md:text-xs text-gold tracking-[0.32em]">
                {kicker}
              </p>
            ) : null}
            {headline ? (
              <h2 className="display-lg mt-3 text-stone text-balance tracking-[-0.005em] max-w-3xl">
                {headline}
                {italic ? (
                  <>
                    <br />
                    <em className="font-light">{italic}</em>
                  </>
                ) : null}
              </h2>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
