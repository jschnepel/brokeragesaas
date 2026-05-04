/**
 * Event catalog tests. We mock `@/components/analytics/PostHog` so the test
 * never imports the real `posthog-js` (which expects a browser global).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted to the top of the file by vitest, so the factory must
// not reference any module-level identifiers. Build the fake inline and pull
// references out via dynamic import below.
vi.mock('@/components/analytics/PostHog', () => ({
  posthog: {
    __loaded: false,
    capture: vi.fn(),
    identify: vi.fn(),
  },
}));

import { posthog as mockedPosthog } from '@/components/analytics/PostHog';
import { identify, track, type EventCatalog } from './events';

const fakePosthog = mockedPosthog as unknown as {
  __loaded: boolean;
  capture: ReturnType<typeof vi.fn>;
  identify: ReturnType<typeof vi.fn>;
};
const captureMock = fakePosthog.capture;
const identifyMock = fakePosthog.identify;

beforeEach(() => {
  captureMock.mockReset();
  identifyMock.mockReset();
  fakePosthog.__loaded = false;
  vi.stubGlobal('window', {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('track()', () => {
  it('is a no-op when window is undefined (SSR)', () => {
    vi.unstubAllGlobals();
    fakePosthog.__loaded = true;
    track('page_view', { pathname: '/' });
    expect(captureMock).not.toHaveBeenCalled();
  });

  it('is a no-op when posthog has not loaded', () => {
    fakePosthog.__loaded = false;
    track('page_view', { pathname: '/' });
    expect(captureMock).not.toHaveBeenCalled();
  });

  it('forwards to posthog.capture once loaded', () => {
    fakePosthog.__loaded = true;
    track('listing_view', {
      listingKey: 'abc',
      address: '123 Main St',
      price: 1_200_000,
      community: 'Silverleaf',
      source: 'home',
    });
    expect(captureMock).toHaveBeenCalledWith('listing_view', expect.objectContaining({ listingKey: 'abc' }));
  });

  // Type-only smoke checks. If any of these stop compiling the catalog has
  // drifted from the documented event surface — that's the failure mode we
  // want loud.
  it('compiles for representative catalog entries', () => {
    fakePosthog.__loaded = true;

    const samples: Array<() => void> = [
      () => track('page_view', { pathname: '/about' }),
      () => track('external_link_click', { href: 'https://example.com', label: 'mls' }),
      () => track('gallery_open', { listingKey: 'k', initialIndex: 0 }),
      () => track('search_query_clear', {}),
      () => track('filter_chip_toggle', { chip: 'Active', on: true }),
      () => track('map_zoom', { direction: 'in', level: 12 }),
      () =>
        track('contact_form_submit_success', {
          interest: 'Buying',
          source_listing: 'k',
        }),
      () => track('scroll_depth_50', { pathname: '/listings' }),
    ];
    for (const fn of samples) fn();
    expect(captureMock).toHaveBeenCalledTimes(samples.length);
  });

  it('exposes EventCatalog as a usable type', () => {
    // Compile-time assertion — if `listing_view` props change, this fails to build.
    const ev: EventCatalog['listing_view'] = {
      listingKey: 'k',
      address: 'a',
      price: null,
      community: null,
      source: 'direct',
    };
    expect(ev.source).toBe('direct');
  });
});

describe('identify()', () => {
  it('is a no-op until posthog is loaded', () => {
    identify('hash', { email: 'x@y.com' });
    expect(identifyMock).not.toHaveBeenCalled();
  });

  it('forwards to posthog.identify once loaded', () => {
    fakePosthog.__loaded = true;
    identify('hash', { email: 'x@y.com', interest: 'Buying', lead_score: 80 });
    expect(identifyMock).toHaveBeenCalledWith('hash', expect.objectContaining({ email: 'x@y.com' }));
  });
});
