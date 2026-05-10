'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type MountOnViewProps = {
  /** Children to mount once the placeholder enters the viewport. */
  children: ReactNode;
  /**
   * IntersectionObserver rootMargin. Default '600px 0px' starts mounting
   * the children when they're roughly one viewport away from the visible
   * fold — ensures expensive subtrees (maps, charts) finish loading
   * before the visitor scrolls onto them.
   */
  rootMargin?: string;
  /** Placeholder rendered before the children mount. Defaults to a no-op div. */
  placeholder?: ReactNode;
  /** Aspect / min-height utility classes applied to the placeholder so the
   *  pre-mount state takes the same vertical space as the loaded subtree
   *  and the page doesn't shift when the children swap in. */
  className?: string;
};

/**
 * Render-on-scroll wrapper. Defers mounting heavy children (maps,
 * charts, third-party embeds) until they're about to enter the
 * viewport, keeping above-the-fold time-to-interactive fast and
 * letting the browser prioritize the critical render path.
 *
 * Usage:
 *   <MountOnView className="aspect-[16/9] bg-ink-elevated">
 *     <ListingMap latitude={lat} longitude={lng} address={addr} />
 *   </MountOnView>
 *
 * The `className` should reserve the layout space the children will
 * occupy so the page doesn't shift when they mount.
 */
export function MountOnView({
  children,
  rootMargin = '600px 0px',
  placeholder = null,
  className = '',
}: MountOnViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) return;
    const el = ref.current;
    if (!el) return;

    // Fallback: if IntersectionObserver isn't available, mount
    // immediately rather than leaving the section blank.
    if (typeof IntersectionObserver === 'undefined') {
      setMounted(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setMounted(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [mounted, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {mounted ? children : placeholder}
    </div>
  );
}
