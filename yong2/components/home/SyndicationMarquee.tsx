import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

export type SyndicationItem = {
  name: string;
  logo?: string;
  logoWidth?: number;
  logoHeight?: number;
  displayHeight?: number;
};

// Container height baseline. Per-logo displayHeight is the actual rendered
// glyph size; the container is taller so the strip has consistent vertical
// breathing room regardless of which logos happen to be on-screen.
const DEFAULT_HEIGHT = 24;
const CONTAINER_HEIGHT = 44;

// Audit item 3.1: Mansion Global removed — the text-only fallback
// read as a missing-asset bug in the otherwise-SVG marquee. Restore
// when an asset is sourced (the publisher does syndicate Sotheby's
// network listings, so the relationship is real; only the logo is
// absent).
//
// Juwai stays as PNG. It's the one non-SVG in the strip — Yong's
// $1.2B career carries international Chinese-buyer relationships
// through the Sotheby's network and Juwai is the canonical surface
// for that audience. Replace with SVG when one is sourced.
// displayHeight per logo is calibrated to roughly equalize the visible
// CAP-HEIGHT of each wordmark — not the SVG bounding-box height. Tall,
// thin wordmarks (Architectural Digest, Nikkei) get pushed up; chunky
// serif marks (Barron's) get trimmed down. Target range 18–24px so the
// strip reads as one editorial row rather than a ladder.
const SYNDICATION_PARTNERS: ReadonlyArray<SyndicationItem> = [
  { name: "The Wall Street Journal", logo: '/logos/wsj.svg', logoWidth: 797, logoHeight: 68, displayHeight: 22 },
  { name: 'James Edition', logo: '/logos/james-edition.svg', logoWidth: 150, logoHeight: 27, displayHeight: 20 },
  { name: 'Robb Report', logo: '/logos/robb-report.svg', logoWidth: 2578, logoHeight: 481, displayHeight: 24 },
  { name: "Barron's", logo: '/logos/barrons.svg', logoWidth: 400, logoHeight: 100, displayHeight: 24 },
  { name: 'Luxury Estate', logo: '/logos/luxury-estate.svg', logoWidth: 250, logoHeight: 40, displayHeight: 20 },
  { name: 'Architectural Digest', logo: '/logos/architectural-digest.svg', logoWidth: 219, logoHeight: 15, displayHeight: 18 },
  { name: 'Juwai', logo: '/logos/juwai.png', logoWidth: 300, logoHeight: 90, displayHeight: 24 },
  { name: 'Nikkei', logo: '/logos/nikkei.svg', logoWidth: 1920, logoHeight: 410, displayHeight: 22 },
];

function dims(item: SyndicationItem) {
  const h = item.displayHeight ?? DEFAULT_HEIGHT;
  if (!item.logoWidth || !item.logoHeight) return { h, w: 140 };
  return { h, w: Math.round((item.logoWidth / item.logoHeight) * h) };
}

/**
 * Press / "as seen on" marquee. Yong's listings syndicate to the
 * Sotheby's-network publisher set. Logos collapse to a uniform stone
 * silhouette via CSS filter so a mixed bag of asset styles reads as
 * one editorial row. CSS-only animation; pauses on hover.
 *
 * Adapted from Jeane's PressMarquee (/Jeane/jeane-site) — palette
 * inverted (brightness(0) invert(1)) for the dark Midnight bg.
 */
export function SyndicationMarquee() {
  const loop = [...SYNDICATION_PARTNERS, ...SYNDICATION_PARTNERS];
  return (
    <section className="bg-ink-elevated border-y border-white/5 py-20 md:py-24">
      <SectionFrame>
        <div className="text-center">
          <CapsLabel as="div">Worldwide distribution</CapsLabel>
          <h2 className="mt-5 font-serif italic text-stone text-3xl md:text-5xl leading-[1.1] tracking-tight max-w-3xl mx-auto">
            Where the world looks<br className="hidden md:block" /> for homes like yours.
          </h2>
          <p className="mt-6 text-stone/70 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Every listing is published through Sotheby's International Realty's global
            network — reaching qualified buyers across continents, on the platforms
            below and dozens more.
          </p>
        </div>
      </SectionFrame>
      <div className="syndication-marquee relative overflow-hidden mt-14 md:mt-16">
        <ul
          className="syndication-marquee-track flex items-center w-max m-0 p-0 list-none"
          aria-label="Syndication partners"
        >
          {loop.map((item, i) => {
            const isClone = i >= SYNDICATION_PARTNERS.length;
            const { h, w } = dims(item);
            return (
              <li
                key={`${item.name}-${i}`}
                aria-hidden={isClone || undefined}
                className="shrink-0 px-8 md:px-12 flex items-center justify-center"
                style={{ height: `${CONTAINER_HEIGHT}px` }}
              >
                {item.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.logo}
                    alt={item.name}
                    width={w}
                    height={h}
                    style={{ width: `${w}px`, height: `${h}px` }}
                    className="syndication-logo object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="caps text-stone/70 whitespace-nowrap text-[11px] md:text-[13px]">
                    {item.name}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
