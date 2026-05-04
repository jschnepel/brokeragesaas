import { describe, expect, it } from 'vitest';
import {
  ATTRIBUTION_VERSION,
  attributionChanged,
  deriveTouch,
  isCampaignTouch,
  isDirect,
  mergeAttribution,
  parseAttributionCookie,
  serializeAttributionCookie,
} from './attribution';

const NOW = 1_761_700_000_000;

function urlOf(s: string): URL {
  return new URL(s);
}

describe('deriveTouch — channel inference', () => {
  it('classifies gclid as paid_search/google', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/?gclid=abc123'),
      referrer: null,
      nowMs: NOW,
    });
    expect(t.channel).toBe('paid_search');
    expect(t.source).toBe('google');
    expect(t.medium).toBe('cpc');
    expect(t.gclid).toBe('abc123');
  });

  it('classifies fbclid as paid_social/facebook', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/?fbclid=xyz'),
      referrer: 'https://facebook.com/',
      nowMs: NOW,
    });
    expect(t.channel).toBe('paid_social');
    expect(t.source).toBe('facebook');
    expect(t.fbclid).toBe('xyz');
  });

  it('classifies msclkid as paid_search/bing', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/?msclkid=ms123'),
      referrer: null,
      nowMs: NOW,
    });
    expect(t.channel).toBe('paid_search');
    expect(t.source).toBe('bing');
  });

  it('classifies utm_medium=cpc as paid_search', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/?utm_source=google&utm_medium=cpc&utm_campaign=luxury'),
      referrer: null,
      nowMs: NOW,
    });
    expect(t.channel).toBe('paid_search');
    expect(t.source).toBe('google');
    expect(t.campaign).toBe('luxury');
  });

  it('classifies utm_medium=email as email', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/?utm_source=newsletter&utm_medium=email'),
      referrer: null,
      nowMs: NOW,
    });
    expect(t.channel).toBe('email');
  });

  it('classifies google.com referrer (no click id) as organic_search', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/'),
      referrer: 'https://google.com/search?q=scottsdale+luxury',
      nowMs: NOW,
    });
    expect(t.channel).toBe('organic_search');
    expect(t.source).toBe('google');
    expect(t.medium).toBe('organic');
  });

  it('classifies instagram.com referrer as social', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/'),
      referrer: 'https://instagram.com/yongchoi',
      nowMs: NOW,
    });
    expect(t.channel).toBe('social');
    expect(t.source).toBe('instagram');
  });

  it('classifies any other off-site referrer as referral', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/'),
      referrer: 'https://sothebysrealty.com/agents/yong-choi',
      nowMs: NOW,
    });
    expect(t.channel).toBe('referral');
    expect(t.source).toBe('sothebysrealty.com');
  });

  it('classifies same-host referrer as direct (internal nav, not a touch)', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/portfolio'),
      referrer: 'https://yongchoi.com/',
      nowMs: NOW,
    });
    expect(t.channel).toBe('direct');
    expect(t.referrer).toBeNull();
  });

  it('classifies no-referrer no-utm load as direct', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/'),
      referrer: null,
      nowMs: NOW,
    });
    expect(t.channel).toBe('direct');
    expect(t.source).toBeNull();
  });
});

describe('isCampaignTouch / isDirect', () => {
  it('isDirect true on direct touch', () => {
    expect(
      isDirect(
        deriveTouch({
          url: urlOf('https://yongchoi.com/'),
          referrer: null,
          nowMs: NOW,
        }),
      ),
    ).toBe(true);
  });

  it('isCampaignTouch true on click-id touch', () => {
    expect(
      isCampaignTouch(
        deriveTouch({
          url: urlOf('https://yongchoi.com/?gclid=abc'),
          referrer: null,
          nowMs: NOW,
        }),
      ),
    ).toBe(true);
  });

  it('isCampaignTouch false on direct touch', () => {
    expect(
      isCampaignTouch(
        deriveTouch({
          url: urlOf('https://yongchoi.com/'),
          referrer: null,
          nowMs: NOW,
        }),
      ),
    ).toBe(false);
  });
});

describe('mergeAttribution', () => {
  it('seeds first + last on first touch', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/?gclid=a'),
      referrer: null,
      nowMs: NOW,
    });
    const merged = mergeAttribution(null, t);
    expect(merged.first).toEqual(t);
    expect(merged.last).toEqual(t);
  });

  it('preserves first across subsequent touches', () => {
    const t1 = deriveTouch({
      url: urlOf('https://yongchoi.com/?utm_source=google&utm_medium=cpc'),
      referrer: null,
      nowMs: NOW,
    });
    const merged1 = mergeAttribution(null, t1);
    const t2 = deriveTouch({
      url: urlOf('https://yongchoi.com/?fbclid=xyz'),
      referrer: 'https://facebook.com/',
      nowMs: NOW + 60_000,
    });
    const merged2 = mergeAttribution(merged1, t2);
    expect(merged2.first.gclid).toBe(merged1.first.gclid);
    expect(merged2.first.source).toBe('google');
    expect(merged2.last.source).toBe('facebook');
    expect(merged2.last.ts).toBe(NOW + 60_000);
  });

  it('does NOT replace last on a pure-direct revisit', () => {
    const t1 = deriveTouch({
      url: urlOf('https://yongchoi.com/?gclid=a'),
      referrer: null,
      nowMs: NOW,
    });
    const merged1 = mergeAttribution(null, t1);
    const t2 = deriveTouch({
      url: urlOf('https://yongchoi.com/'),
      referrer: null,
      nowMs: NOW + 86_400_000,
    });
    const merged2 = mergeAttribution(merged1, t2);
    expect(merged2.last.gclid).toBe('a');
    expect(merged2.last.ts).toBe(NOW);
  });

  it('replaces last on an organic-search revisit (non-direct)', () => {
    const t1 = deriveTouch({
      url: urlOf('https://yongchoi.com/?gclid=a'),
      referrer: null,
      nowMs: NOW,
    });
    const merged1 = mergeAttribution(null, t1);
    const t2 = deriveTouch({
      url: urlOf('https://yongchoi.com/'),
      referrer: 'https://google.com/',
      nowMs: NOW + 86_400_000,
    });
    const merged2 = mergeAttribution(merged1, t2);
    expect(merged2.last.channel).toBe('organic_search');
    expect(merged2.last.gclid).toBeNull();
  });

  it('reseeds when prev.first is older than 180 days', () => {
    const t1 = deriveTouch({
      url: urlOf('https://yongchoi.com/?gclid=old'),
      referrer: null,
      nowMs: NOW,
    });
    const merged1 = mergeAttribution(null, t1);
    const veryLater = NOW + 200 * 24 * 60 * 60 * 1000;
    const t2 = deriveTouch({
      url: urlOf('https://yongchoi.com/?gclid=new'),
      referrer: null,
      nowMs: veryLater,
    });
    const merged2 = mergeAttribution(merged1, t2);
    expect(merged2.first.gclid).toBe('new');
    expect(merged2.last.gclid).toBe('new');
  });
});

describe('cookie serialization', () => {
  it('round-trips via serialize/parse', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/?utm_source=google'),
      referrer: 'https://google.com/',
      nowMs: NOW,
    });
    const merged = mergeAttribution(null, t);
    const cookieValue = serializeAttributionCookie(merged);
    const parsed = parseAttributionCookie(cookieValue);
    expect(parsed).toEqual(merged);
  });

  it('returns null on garbage input', () => {
    expect(parseAttributionCookie('not-json')).toBeNull();
    expect(parseAttributionCookie('')).toBeNull();
    expect(parseAttributionCookie(null)).toBeNull();
    expect(parseAttributionCookie(undefined)).toBeNull();
  });

  it('returns null when version mismatches', () => {
    const wrongVersion = encodeURIComponent(
      JSON.stringify({ v: 999, first: { ts: 1 }, last: { ts: 1 } }),
    );
    expect(parseAttributionCookie(wrongVersion)).toBeNull();
  });
});

describe('attributionChanged', () => {
  it('true when prev is null', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/'),
      referrer: null,
      nowMs: NOW,
    });
    const merged = mergeAttribution(null, t);
    expect(attributionChanged(null, merged)).toBe(true);
  });

  it('false when first.ts and last.ts unchanged', () => {
    const t = deriveTouch({
      url: urlOf('https://yongchoi.com/?gclid=a'),
      referrer: null,
      nowMs: NOW,
    });
    const m1 = mergeAttribution(null, t);
    const m2: typeof m1 = { v: ATTRIBUTION_VERSION, first: m1.first, last: m1.last };
    expect(attributionChanged(m1, m2)).toBe(false);
  });

  it('true when last.ts changes', () => {
    const t1 = deriveTouch({
      url: urlOf('https://yongchoi.com/?gclid=a'),
      referrer: null,
      nowMs: NOW,
    });
    const m1 = mergeAttribution(null, t1);
    const t2 = deriveTouch({
      url: urlOf('https://yongchoi.com/'),
      referrer: 'https://google.com/',
      nowMs: NOW + 86_400_000,
    });
    const m2 = mergeAttribution(m1, t2);
    expect(attributionChanged(m1, m2)).toBe(true);
  });
});
