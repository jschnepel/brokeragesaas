import Link from 'next/link';

const TABS: { href: string; label: string }[] = [
  { href: '/phoenix',           label: 'Overview' },
  { href: '/phoenix/pricing',   label: 'Pricing' },
  { href: '/phoenix/inventory', label: 'Inventory' },
  { href: '/phoenix/activity',  label: 'Activity' },
  { href: '/phoenix/timing',    label: 'Timing' },
];

/**
 * Server-rendered tab strip for the Phoenix dashboard. Active state is
 * derived from the current pathname (passed in as `current`); rendered
 * link styling matches yong2's caps + gold idiom.
 */
export function PhoenixSubnav({ current }: { current: string }) {
  return (
    <nav
      aria-label="Phoenix dashboard sections"
      className="border-y border-white/10 bg-[var(--color-ink-elevated)]/30"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
        <ul className="flex gap-8 overflow-x-auto py-4 -mx-6 px-6 md:mx-0 md:px-0">
          {TABS.map(({ href, label }) => {
            const isActive = href === current;
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  className={
                    isActive
                      ? 'caps text-gold border-b-2 border-gold pb-3 -mb-3'
                      : 'caps text-stone-muted hover:text-stone transition-colors pb-3 -mb-3'
                  }
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
