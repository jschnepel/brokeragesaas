/**
 * Consent module tests. We run vitest in `node` environment, so there's no
 * `document` / `navigator` by default — each test installs a tiny shim via
 * `vi.stubGlobal` before exercising the cookie code.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_COOKIE_NAME,
  CONSENT_VERSION,
  DEFAULT_CONSENT,
  buildDecision,
  readConsent,
  respectsDoNotTrack,
  shouldPromptAgain,
  writeConsent,
} from './consent';

type CookieJar = { value: string };

function installDocumentShim(): CookieJar {
  const jar: CookieJar = { value: '' };
  vi.stubGlobal('document', {
    get cookie() {
      return jar.value;
    },
    set cookie(next: string) {
      // Mirror real browser semantics just enough for our tests: a `Max-Age=0`
      // (or =-...) clears the cookie; anything else stores the `name=value`
      // portion (everything before the first `;`).
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
  });
  return jar;
}

function installNavigatorShim(dnt: string | null) {
  vi.stubGlobal('navigator', dnt === null ? {} : { doNotTrack: dnt });
}

beforeEach(() => {
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readConsent', () => {
  it('returns DEFAULT_CONSENT when no cookie is present', () => {
    installDocumentShim();
    expect(readConsent()).toEqual(DEFAULT_CONSENT);
  });

  it('returns DEFAULT_CONSENT when cookie is malformed', () => {
    const jar = installDocumentShim();
    jar.value = `${CONSENT_COOKIE_NAME}=not-json`;
    expect(readConsent()).toEqual(DEFAULT_CONSENT);
  });

  it('returns DEFAULT_CONSENT when cookie has wrong version', () => {
    const jar = installDocumentShim();
    const stale = encodeURIComponent(JSON.stringify({ version: 0, analytics: true, marketing: true, decidedAt: '2026-01-01T00:00:00Z' }));
    jar.value = `${CONSENT_COOKIE_NAME}=${stale}`;
    expect(readConsent()).toEqual(DEFAULT_CONSENT);
  });

  it('parses a valid stored decision', () => {
    const jar = installDocumentShim();
    const decision = encodeURIComponent(
      JSON.stringify({
        version: CONSENT_VERSION,
        necessary: true,
        analytics: true,
        marketing: false,
        decidedAt: '2026-04-01T00:00:00.000Z',
      }),
    );
    jar.value = `${CONSENT_COOKIE_NAME}=${decision}`;
    expect(readConsent()).toEqual({
      necessary: true,
      analytics: true,
      marketing: false,
      decidedAt: '2026-04-01T00:00:00.000Z',
      version: CONSENT_VERSION,
    });
  });
});

describe('writeConsent', () => {
  it('produces a cookie that round-trips through readConsent', () => {
    installDocumentShim();
    const decision = buildDecision({ analytics: true, marketing: false });
    writeConsent(decision);
    const round = readConsent();
    expect(round.analytics).toBe(true);
    expect(round.marketing).toBe(false);
    expect(round.necessary).toBe(true);
    expect(round.version).toBe(CONSENT_VERSION);
    expect(round.decidedAt).toBe(decision.decidedAt);
  });

  it('writes a properly formatted cookie string with required attributes', () => {
    let captured = '';
    vi.stubGlobal('document', {
      get cookie() {
        return '';
      },
      set cookie(next: string) {
        captured = next;
      },
    });
    writeConsent(buildDecision({ analytics: false, marketing: false }));
    expect(captured).toContain(`${CONSENT_COOKIE_NAME}=`);
    expect(captured).toContain('Max-Age=');
    expect(captured).toContain('Path=/');
    expect(captured).toContain('SameSite=Lax');
    expect(captured).toContain('Secure');
  });
});

describe('shouldPromptAgain', () => {
  it('returns true when no decision has been made', () => {
    expect(shouldPromptAgain(DEFAULT_CONSENT)).toBe(true);
  });

  it('returns false within 365 days of a decision', () => {
    const within = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      shouldPromptAgain({
        necessary: true,
        analytics: true,
        marketing: true,
        decidedAt: within,
        version: CONSENT_VERSION,
      }),
    ).toBe(false);
  });

  it('returns true after 365 days', () => {
    const old = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      shouldPromptAgain({
        necessary: true,
        analytics: true,
        marketing: false,
        decidedAt: old,
        version: CONSENT_VERSION,
      }),
    ).toBe(true);
  });

  it('returns true when version is bumped', () => {
    const recent = new Date().toISOString();
    expect(
      shouldPromptAgain({
        necessary: true,
        analytics: true,
        marketing: false,
        decidedAt: recent,
        // Force a stale version to confirm the version gate trips even with a fresh decidedAt.
        version: 0 as unknown as 1,
      }),
    ).toBe(true);
  });
});

describe('respectsDoNotTrack', () => {
  it("returns true when navigator.doNotTrack === '1'", () => {
    installNavigatorShim('1');
    expect(respectsDoNotTrack()).toBe(true);
  });

  it("returns true when navigator.doNotTrack === 'yes'", () => {
    installNavigatorShim('yes');
    expect(respectsDoNotTrack()).toBe(true);
  });

  it('returns false when DNT is unset', () => {
    installNavigatorShim(null);
    expect(respectsDoNotTrack()).toBe(false);
  });

  it("returns false when navigator.doNotTrack === '0'", () => {
    installNavigatorShim('0');
    expect(respectsDoNotTrack()).toBe(false);
  });
});
