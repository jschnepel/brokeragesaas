import { CapsLabel } from '@/components/shared/CapsLabel';
import { SectionFrame } from '@/components/shared/SectionFrame';

export type SyndicationItem = {
  name: string;
  logo?: string;
  logoWidth?: number;
  logoHeight?: number;
  displayHeight?: number;
};

const DEFAULT_HEIGHT = 24;

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
const SYNDICATION_PARTNERS: ReadonlyArray<SyndicationItem> = [
  { name: "The Wall Street Journal", logo: '/logos/wsj.svg', logoWidth: 797, logoHeight: 68, displayHeight: 22 },
  { name: 'James Edition', logo: '/logos/james-edition.svg', logoWidth: 150, logoHeight: 27, displayHeight: 18 },
  { name: 'Robb Report', logo: '/logos/robb-report.svg', logoWidth: 2578, logoHeight: 481, displayHeight: 26 },
  { name: "Barron's", logo: '/logos/barrons.svg', logoWidth: 400, logoHeight: 100, displayHeight: 28 },
  { name: 'Luxury Estate', logo: '/logos/luxury-estate.svg', logoWidth: 250, logoHeight: 40, displayHeight: 20 },
  { name: 'Architectural Digest', logo: '/logos/architectural-digest.svg', logoWidth: 219, logoHeight: 15, displayHeight: 14 },
  { name: 'Juwai', logo: '/logos/juwai.png', logoWidth: 300, logoHeight: 90, displayHeight: 26 },
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
    <section className="bg-ink-elevated border-y border-white/5 py-16 md:py-20">
      <SectionFrame>
        <div className="text-center">
          <CapsLabel as="div">As seen on</CapsLabel>
          <p className="mt-4 font-serif italic text-stone/80 text-lg md:text-xl max-w-xl mx-auto">
            Yong's listings reach buyers globally through the Sotheby's syndication network.
          </p>
        </div>
      </SectionFrame>
      <div className="syndication-marquee relative overflow-hidden mt-12 md:mt-14">
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
                className="shrink-0 px-10 md:px-14 flex items-center justify-center"
                style={{ height: `${DEFAULT_HEIGHT + 12}px` }}
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
