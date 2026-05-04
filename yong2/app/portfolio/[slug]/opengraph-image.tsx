import { ImageResponse } from 'next/og';
import { getListingBySlug } from '@/lib/listings';

export const runtime = 'nodejs';
export const revalidate = 3600;
export const alt = 'Listing · Yong Choi';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type RouteProps = { params: Promise<{ slug: string }> };

function formatPrice(n: number | null): string {
  if (n === null) return 'Price upon request';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

/**
 * Per-listing 1200x630 OG image. The cover photo fills the canvas, then
 * a left-side dark gradient overlays for text legibility, with the
 * brand + address + community + price stacked bottom-left.
 *
 * Satori (the renderer behind ImageResponse) requires every container
 * with multiple children to declare `display: flex` (or contents/none)
 * AND positioning is most reliable as `position: absolute` for layered
 * overlays. We avoid the trap by stacking everything as absolute layers
 * on a single root flex container.
 */
export default async function OgImage({ params }: RouteProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug).catch(() => null);

  if (!listing) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#0B1620',
            color: '#EFE9DF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '80px',
          }}
        >
          <div
            style={{
              fontSize: 16,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#D4B88A',
              marginBottom: 32,
              display: 'flex',
            }}
          >
            Sotheby&rsquo;s International Realty
          </div>
          <div
            style={{
              fontSize: 96,
              fontStyle: 'italic',
              lineHeight: 1.0,
              display: 'flex',
            }}
          >
            Yong Choi
          </div>
        </div>
      ),
      { ...size },
    );
  }

  const photo = listing.coverPhotoUrl;
  const community = listing.community || listing.city || 'Scottsdale';
  const price = formatPrice(listing.listPrice);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0B1620',
          color: '#EFE9DF',
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Background photo (or fallback panel) */}
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={listing.unparsedAddress}
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              left: 480,
              top: 0,
              width: 720,
              height: 630,
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              left: 480,
              top: 0,
              width: 720,
              height: 630,
              background: '#13212F',
              display: 'flex',
            }}
          />
        )}

        {/* Solid left panel */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 480,
            height: 630,
            background: '#0B1620',
            display: 'flex',
          }}
        />

        {/* Gradient fade extending from the panel into the photo */}
        <div
          style={{
            position: 'absolute',
            left: 480,
            top: 0,
            width: 220,
            height: 630,
            background:
              'linear-gradient(to right, #0B1620 0%, rgba(11,22,32,0) 100%)',
            display: 'flex',
          }}
        />

        {/* Brand mark — top-left */}
        <div
          style={{
            position: 'absolute',
            left: 48,
            top: 56,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontStyle: 'italic',
              lineHeight: 1,
              fontFamily: 'Georgia, serif',
              display: 'flex',
            }}
          >
            Yong Choi
          </div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#D4B88A',
              marginTop: 12,
              display: 'flex',
            }}
          >
            Sotheby&rsquo;s International Realty
          </div>
        </div>

        {/* Address + community + price — bottom-left */}
        <div
          style={{
            position: 'absolute',
            left: 48,
            bottom: 56,
            width: 410,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              lineHeight: 1.1,
              display: 'flex',
            }}
          >
            {listing.unparsedAddress}
          </div>
          <div
            style={{
              fontSize: 14,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#D4B88A',
              marginTop: 24,
              display: 'flex',
            }}
          >
            {community} &middot; {price}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
