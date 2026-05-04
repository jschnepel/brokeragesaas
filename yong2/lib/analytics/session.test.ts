/**
 * Session module tests. Vitest in `node` env — we shim `document`,
 * `sessionStorage`, and `crypto.randomUUID` per test. The module keeps
 * mutable in-memory state across tests, so each test calls `_resetForTest`
 * in beforeEach.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetForTest,
  bumpStep,
  endSession,
  getCurrentSessionContext,
  getOrCreateSession,
  recordActivity,
  recordScrollPct,
  SESSION_IDLE_TIMEOUT_MS,
} from './session';

type CookieJar = { value: string };
type StorageStore = Map<string, string>;

function installDocumentShim(): CookieJar {
  const jar: CookieJar = { value: '' };
  vi.stubGlobal('document', {
    get cookie() {
      return jar.value;
    },
    set cookie(next: string) {
      const head = next.split(';')[0]?.trim() ?? '';
      const eq = head.indexOf('=');
      if (eq < 0) return;
      const name = head.slice(0, eq);
      const value = head.slice(eq + 1);
      const isClear = /max-age=(0|-\d+)/i.test(next);
      const existing = jar.value ? jar.value.split('; ').filter(Boolean) : [];
      const without = existing.filter((c) => !c.startsWith(`${name}=`));
      if (isClear) {
        jar.value = without.join('; ');
      } else {
        without.push(`${name}=${value}`);
        jar.value = without.join('; ');
      }
    },
    visibilityState: 'visible',
  });
  return jar;
}

function installSessionStorageShim(): StorageStore {
  const store: StorageStore = new Map();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
  });
  return store;
}

function installCryptoShim(ids: string[]): void {
  let i = 0;
  vi.stubGlobal('crypto', {
    randomUUID: () => {
      const id = ids[i] ?? `uuid-${i}`;
      i += 1;
      return id;
    },
  });
}

beforeEach(() => {
  _resetForTest();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
afterEach(() => {
  _resetForTest();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('getOrCreateSession', () => {
  it('creates a fresh session when nothing exists', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-1']);
    const { session, isNew } = getOrCreateSession({
      analyticsConsent: true,
      pathname: '/',
      search: 'utm_source=google&utm_medium=cpc',
      referrer: 'https://google.com/',
    });
    expect(isNew).toBe(true);
    expect(session.id).toBe('session-1');
    expect(session.landing.pathname).toBe('/');
    expect(session.landing.referrer).toBe('https://google.com/');
    expect(session.landing.utmSource).toBe('google');
    expect(session.landing.utmMedium).toBe('cpc');
  });

  it('parses click IDs into the landing payload', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-x']);
    const { session } = getOrCreateSession({
      analyticsConsent: true,
      pathname: '/portfolio',
      search: 'gclid=abc&fbclid=def&msclkid=ghi&ttclid=jkl',
      referrer: '',
    });
    expect(session.landing.gclid).toBe('abc');
    expect(session.landing.fbclid).toBe('def');
    expect(session.landing.msclkid).toBe('ghi');
    expect(session.landing.ttclid).toBe('jkl');
  });

  it('resumes the same session within the idle window', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-1', 'session-2']);
    const first = getOrCreateSession({
      analyticsConsent: true,
      pathname: '/',
      search: '',
      referrer: '',
    });
    const second = getOrCreateSession({
      analyticsConsent: true,
      pathname: '/about',
      search: '',
      referrer: '',
    });
    expect(second.isNew).toBe(false);
    expect(second.session.id).toBe(first.session.id);
  });

  it('opens a new session after the idle timeout', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-1', 'session-2']);
    const start = 1_700_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(start);
    const first = getOrCreateSession({
      analyticsConsent: true,
      pathname: '/',
      search: '',
      referrer: '',
    });
    vi.setSystemTime(start + SESSION_IDLE_TIMEOUT_MS + 1);
    const second = getOrCreateSession({
      analyticsConsent: true,
      pathname: '/',
      search: '',
      referrer: '',
    });
    expect(second.isNew).toBe(true);
    expect(second.session.id).not.toBe(first.session.id);
  });

  it('does not write a cookie when analyticsConsent is false', () => {
    const jar = installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-1']);
    getOrCreateSession({
      analyticsConsent: false,
      pathname: '/',
      search: '',
      referrer: '',
    });
    expect(jar.value).toBe('');
  });
});

describe('bumpStep', () => {
  it('increments stepN and pageviewCount on each call', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-1']);
    getOrCreateSession({
      analyticsConsent: true,
      pathname: '/',
      search: '',
      referrer: '',
    });
    const a = bumpStep({ analyticsConsent: true, pathname: '/' });
    const b = bumpStep({ analyticsConsent: true, pathname: '/portfolio' });
    expect(a?.stepN).toBe(1);
    expect(a?.pageviewCount).toBe(1);
    expect(b?.stepN).toBe(2);
    expect(b?.pageviewCount).toBe(2);
    expect(b?.exitPathname).toBe('/portfolio');
  });

  it('returns null when there is no live session', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim([]);
    const result = bumpStep({ analyticsConsent: true, pathname: '/' });
    expect(result).toBeNull();
  });
});

describe('recordActivity', () => {
  it('accumulates active_ms only when visible and gap < idle threshold', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-1']);
    const start = 1_700_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(start);
    getOrCreateSession({
      analyticsConsent: true,
      pathname: '/',
      search: '',
      referrer: '',
    });
    vi.setSystemTime(start + 5_000);
    recordActivity({ analyticsConsent: true, visible: true });
    vi.setSystemTime(start + 10_000);
    recordActivity({ analyticsConsent: true, visible: true });
    const ctx = getCurrentSessionContext();
    expect(ctx.session_age_ms).toBe(10_000);
    // active_ms not exposed via context — assert via endSession
    const summary = endSession({ exitPathname: '/', analyticsConsent: true });
    expect(summary?.active_ms).toBe(10_000);
  });

  it('skips active_ms when document is hidden', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-1']);
    const start = 1_700_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(start);
    getOrCreateSession({
      analyticsConsent: true,
      pathname: '/',
      search: '',
      referrer: '',
    });
    vi.setSystemTime(start + 5_000);
    recordActivity({ analyticsConsent: true, visible: false });
    const summary = endSession({ exitPathname: '/', analyticsConsent: true });
    expect(summary?.active_ms).toBe(0);
  });

  it('skips active_ms when gap exceeds idle threshold', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-1']);
    const start = 1_700_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(start);
    getOrCreateSession({
      analyticsConsent: true,
      pathname: '/',
      search: '',
      referrer: '',
    });
    vi.setSystemTime(start + 60_000); // 60s — past 30s idle threshold
    recordActivity({ analyticsConsent: true, visible: true });
    const summary = endSession({ exitPathname: '/', analyticsConsent: true });
    expect(summary?.active_ms).toBe(0);
  });
});

describe('recordScrollPct', () => {
  it('keeps a max scroll percentage across calls', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-1']);
    getOrCreateSession({
      analyticsConsent: true,
      pathname: '/',
      search: '',
      referrer: '',
    });
    recordScrollPct(25, { analyticsConsent: true });
    recordScrollPct(80, { analyticsConsent: true });
    recordScrollPct(40, { analyticsConsent: true }); // lower — ignored
    const summary = endSession({ exitPathname: '/', analyticsConsent: true });
    expect(summary?.max_scroll_pct).toBe(80);
  });
});

describe('getCurrentSessionContext', () => {
  it('returns session_id, step_n, session_age_ms when a session is live', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-1']);
    const start = 1_700_000_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(start);
    getOrCreateSession({
      analyticsConsent: true,
      pathname: '/',
      search: '',
      referrer: '',
    });
    bumpStep({ analyticsConsent: true, pathname: '/' });
    bumpStep({ analyticsConsent: true, pathname: '/about' });
    vi.setSystemTime(start + 7_500);
    const ctx = getCurrentSessionContext();
    expect(ctx.session_id).toBe('session-1');
    expect(ctx.step_n).toBe(2);
    expect(ctx.session_age_ms).toBe(7_500);
  });

  it('returns an empty object when no session is live', () => {
    installDocumentShim();
    installSessionStorageShim();
    expect(getCurrentSessionContext()).toEqual({});
  });
});

describe('endSession', () => {
  it('returns a summary and clears in-memory state', () => {
    installDocumentShim();
    installSessionStorageShim();
    installCryptoShim(['session-1']);
    getOrCreateSession({
      analyticsConsent: true,
      pathname: '/',
      search: 'utm_source=google',
      referrer: '',
    });
    bumpStep({ analyticsConsent: true, pathname: '/' });
    bumpStep({ analyticsConsent: true, pathname: '/portfolio' });
    bumpStep({ analyticsConsent: true, pathname: '/contact' });
    const summary = endSession({ exitPathname: '/contact', analyticsConsent: true });
    expect(summary?.session_id).toBe('session-1');
    expect(summary?.page_count).toBe(3);
    expect(summary?.step_n).toBe(3);
    expect(summary?.exit_pathname).toBe('/contact');
    expect(summary?.landing.utmSource).toBe('google');
    // After end, session context is empty until cookie is reread.
    // (Cookie remains in place to support resume on return.)
  });

  it('returns null when no session is live', () => {
    installDocumentShim();
    installSessionStorageShim();
    const summary = endSession({ exitPathname: '/', analyticsConsent: true });
    expect(summary).toBeNull();
  });
});
