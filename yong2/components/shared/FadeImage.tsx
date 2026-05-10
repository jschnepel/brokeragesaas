'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

type FadeImageProps = ImageProps & {
  /** Optional class on the wrapping image; merged with the fade transition. */
  className?: string;
};

/**
 * next/image wrapper that fades in once the bitmap finishes decoding.
 *
 * Why: snapping a freshly-decoded photo into place reads as abrupt; an
 * 800ms ease-out fade reads as cinematic, especially when the parent
 * already provides a darker fallback surface (bg-ink / bg-ink-elevated).
 *
 * Behavior:
 *   - Initial state opacity-0 (the parent surface shows through).
 *   - onLoad → opacity-100 with a transition.
 *   - SSR-safe: when JS isn't ready (`loaded` defaults to false on the
 *     client), the image is still rendered with the same `src` so the
 *     browser starts decoding immediately. The opacity flip happens
 *     after the first render once `onLoad` fires.
 *
 * Use for hero photos, thumbnails, and card cover images. Below-the-fold
 * images that aren't immediately on-screen don't need this — Next/Image's
 * native lazy loading + browser progressive decode are already gentle.
 */
export function FadeImage({ className = '', ...rest }: FadeImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      {...rest}
      onLoad={(e) => {
        setLoaded(true);
        rest.onLoad?.(e);
      }}
      className={`${className} transition-opacity duration-[800ms] ease-out ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
