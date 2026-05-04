import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Yong Choi · Sotheby’s International Realty';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        background: '#0B1620', color: '#EFE9DF',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '80px',
      }}>
        <div style={{ fontSize: 16, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#D4B88A', marginBottom: 32 }}>
          Sotheby’s International Realty
        </div>
        <div style={{ fontSize: 96, fontStyle: 'italic', lineHeight: 1.0 }}>
          Yong Choi
        </div>
        <div style={{ fontSize: 24, marginTop: 24, color: '#8A93A0' }}>
          Scottsdale &middot; Paradise Valley &middot; Desert Mountain
        </div>
      </div>
    ),
    { ...size }
  );
}
