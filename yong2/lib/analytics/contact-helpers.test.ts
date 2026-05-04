import { describe, expect, it } from 'vitest';
import {
  deriveContactSource,
  deriveLeadScore,
  deriveSourceListing,
  sha256Hex,
} from './contact-helpers';

describe('deriveContactSource()', () => {
  it('returns "listing_tour" when ?listing=… is present', () => {
    expect(
      deriveContactSource({
        search: '?listing=10440%20E%20Desert%20Hills',
        referrer: 'https://yong.example/portfolio/foo',
        hostname: 'yong.example',
      }),
    ).toBe('listing_tour');
  });

  it('returns "cta_button" for same-host referrer without ?listing', () => {
    expect(
      deriveContactSource({
        search: '',
        referrer: 'https://yong.example/',
        hostname: 'yong.example',
      }),
    ).toBe('cta_button');
  });

  it('returns "external" for off-host referrer', () => {
    expect(
      deriveContactSource({
        search: '',
        referrer: 'https://google.com/',
        hostname: 'yong.example',
      }),
    ).toBe('external');
  });

  it('returns "direct" when no referrer', () => {
    expect(
      deriveContactSource({ search: '', referrer: '', hostname: 'yong.example' }),
    ).toBe('direct');
  });
});

describe('deriveSourceListing()', () => {
  it('returns the listing query param when present', () => {
    expect(deriveSourceListing('?listing=foo')).toBe('foo');
  });
  it('returns undefined when missing', () => {
    expect(deriveSourceListing('')).toBeUndefined();
    expect(deriveSourceListing('?other=1')).toBeUndefined();
  });
});

describe('deriveLeadScore()', () => {
  it('returns the P2 placeholder 0 (proper scoring is P3)', () => {
    expect(deriveLeadScore()).toBe(0);
  });
});

describe('sha256Hex()', () => {
  it('hashes lowercased+trimmed input deterministically', async () => {
    const a = await sha256Hex('Yong@example.COM');
    const b = await sha256Hex('  yong@example.com  ');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces a known SHA-256 digest for a known input', async () => {
    // Known SHA-256("hello") — sanity-check the WebCrypto wiring.
    const got = await sha256Hex('hello');
    expect(got).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });
});
