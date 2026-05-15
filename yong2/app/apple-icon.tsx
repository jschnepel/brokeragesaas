import { ImageResponse } from 'next/og';

/**
 * iOS Safari + the "Add to Home Screen" flow request /apple-touch-icon.png
 * automatically. Without a real asset Safari logs a console warning
 * and falls back to a generic screenshot for the home-screen tile.
 *
 * Renders the same brand mark as `app/icon.tsx` but at the iOS
 * recommended 180×180 size with safe-area padding.
 */
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0B1620',
          color: '#D4B88A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          fontStyle: 'italic',
          letterSpacing: '-0.02em',
        }}
      >
        <div style={{ fontSize: 110, lineHeight: 1, marginBottom: 6 }}>Y</div>
        <div
          style={{
            fontSize: 13,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: '#EFE9DF',
            opacity: 0.6,
          }}
        >
          Choi
        </div>
      </div>
    ),
    { ...size },
  );
}
