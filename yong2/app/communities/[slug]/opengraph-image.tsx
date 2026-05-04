import { ImageResponse } from 'next/og';
import { communitiesContent, type CommunitySlug } from '@/content/communities';

export const runtime = 'nodejs';
export const revalidate = 3600;
export const alt = 'Community · Yong Choi';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type RouteProps = { params: Promise<{ slug: string }> };

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3200';

/**
 * Per-community 1200x630 OG. Hero image fills the canvas with a dark
 * gradient overlay; community name + locality + Yong's brand sit
 * bottom-left on top of the gradient.
 *
 * Falls back to the brand-only treatment if the slug is unknown so
 * social embeds never 500.
 */
export default async function CommunityOgImage({ params }: RouteProps) {
  const { slug } = await params;
  const c = slug in communitiesContent ? communitiesContent[slug as CommunitySlug] : null;

  if (!c) {
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
            }}
          >
            Sotheby&rsquo;s International Realty
          </div>
          <div style={{ fontSize: 96, fontStyle: 'italic', lineHeight: 1.0 }}>
            Yong Choi
          </div>
        </div>
      ),
      { ...size },
    );
  }

  // Hero images are stored in /public; resolve to absolute URL for ImageResponse.
  const heroAbsolute = c.heroImageUrl
    ? c.heroImageUrl.startsWith('http')
      ? c.heroImageUrl
      : `${SITE_URL}${c.heroImageUrl}`
    : null;

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
        {heroAbsolute ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroAbsolute}
            alt={c.name}
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
        {/* Bottom-up dark gradient for legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(11,22,32,0.92) 0%, rgba(11,22,32,0.55) 45%, rgba(11,22,32,0.15) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 64,
            bottom: 64,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 14,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#D4B88A',
              marginBottom: 16,
            }}
          >
            {c.locality}
          </div>
          <div
            style={{
              fontSize: 96,
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              lineHeight: 1.0,
            }}
          >
            {c.name}
          </div>
          <div
            style={{
              fontSize: 16,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#EFE9DF',
              marginTop: 24,
            }}
          >
            Yong Choi &middot; Sotheby&rsquo;s International Realty
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
