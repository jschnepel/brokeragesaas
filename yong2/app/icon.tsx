import { ImageResponse } from 'next/og';

/**
 * Browser-tab favicon — replaces the silent `/favicon.ico → 404` that
 * every browser auto-requests on every navigation. Chrome with DevTools
 * open logs each failure as a network error, and accumulating across
 * a typical 20-50-page session burns a meaningful slice of the
 * "Console alerts" badge count.
 *
 * Renders programmatically via Next.js's `ImageResponse` (same primitive
 * as `opengraph-image.tsx`) so we don't need to commit a binary asset.
 * Brand mark = italic "Y" in gold on the Midnight Sky background —
 * fits the existing palette + matches the OG image's typography cues.
 *
 * Next.js auto-emits this at /icon and links to it from <head> on
 * every page; /favicon.ico is also served from the same handler so
 * even agents that ignore the <link rel="icon"> tag stop hitting a 404.
 */
export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0B1620',
          color: '#D4B88A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          fontStyle: 'italic',
          fontSize: 24,
          fontWeight: 400,
          letterSpacing: '-0.02em',
        }}
      >
        Y
      </div>
    ),
    { ...size },
  );
}
