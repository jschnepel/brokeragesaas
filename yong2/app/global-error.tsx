'use client';

export const dynamic = 'force-dynamic';

/**
 * Bare-minimum global-error. Pure HTML, no hooks, no imports beyond React.
 * Avoids any LayoutRouterContext lookup that triggers `useContext` null on
 * the synthetic /_global-error prerender path in Next 16.2.4.
 */
export default function GlobalError() {
  return (
    <html>
      <body
        style={{
          margin: 0,
          padding: '48px',
          fontFamily: 'sans-serif',
          background: '#0B1620',
          color: '#EFE9DF',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            color: '#D4B88A',
            letterSpacing: '0.3em',
            fontSize: 11,
            textTransform: 'uppercase',
          }}
        >
          Error
        </p>
        <h1>Something went wrong.</h1>
        <a href="/" style={{ color: '#D4B88A' }}>
          Return home
        </a>
      </body>
    </html>
  );
}
