import type { MetadataRoute } from 'next';

/**
 * PWA web app manifest. Two reasons it ships:
 *   1. Eliminates the silent /manifest.json → 404 some browsers (and
 *      Lighthouse audits) request automatically.
 *   2. Gives "Add to Home Screen" on iOS / Android a real install
 *      experience with the brand colors instead of a generic
 *      screenshot tile.
 *
 * No service worker is registered — `display: 'browser'` keeps the
 * site behaving like a normal browser tab; we're not opting into
 * full PWA mode, just declaring metadata.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yong Choi · Sotheby's International Realty",
    short_name: 'Yong Choi',
    description:
      'Scottsdale + Paradise Valley luxury real estate, represented by Yong Choi of Sotheby’s International Realty.',
    start_url: '/',
    display: 'browser',
    background_color: '#0B1620',
    theme_color: '#0B1620',
    icons: [
      // Next.js auto-routes app/icon.tsx to /icon and emits the
      // <link rel="icon"> tag; this entry is the explicit manifest
      // declaration for installable contexts.
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
