import { describe, expect, it } from 'vitest';
import { type Attribution, deriveTouch, mergeAttribution } from './attribution';
import { type Behavior, type FormFields, scoreLead } from './lead-score';

const NOW = 1_761_700_000_000;

function attrFromUrl(url: string, referrer: string | null = null): Attribution {
  const t = deriveTouch({ url: new URL(url), referrer, nowMs: NOW });
  return mergeAttribution(null, t);
}

const baseForm: FormFields = {
  email: 'jane@somecompany.com',
  phone: '(602) 555-0100',
  interest: 'Buying',
  message: 'Looking for a home in Silverleaf around $5M, ideally with mountain views.',
};

const baseBehavior: Behavior = {
  sessionCount: 1,
  spanDays: 0,
  uniqueListingViews: 0,
  maxListingPrice: 0,
  minPriceFilter: 0,
  favoritedAny: false,
  activeMs: 0,
};

describe('scoreLead', () => {
  it('cold for empty behavior + free email + short message + Selling', () => {
    const result = scoreLead({
      form: {
        email: 'someone@gmail.com',
        phone: 'not a phone',
        interest: 'Selling',
        message: 'hi',
      },
      attribution: null,
      behavior: baseBehavior,
    });
    expect(result.band).toBe('cold');
    expect(result.total).toBeLessThan(25);
  });

  it('hot when all signals stack — buyer with deep engagement + paid search brand', () => {
    const attr = attrFromUrl(
      'https://yong-choi.com/?gclid=abc&utm_source=google&utm_medium=cpc&utm_campaign=yong-brand',
    );
    const result = scoreLead({
      form: baseForm,
      attribution: attr,
      behavior: {
        sessionCount: 4,
        spanDays: 5,
        uniqueListingViews: 8,
        maxListingPrice: 7_500_000,
        minPriceFilter: 3_000_000,
        favoritedAny: true,
        activeMs: 5 * 60_000,
      },
    });
    expect(result.band).toBe('hot');
    expect(result.total).toBeGreaterThanOrEqual(80);
  });

  it('warm for typical luxury inquiry with moderate engagement', () => {
    const attr = attrFromUrl('https://yong-choi.com/', 'https://google.com/');
    const result = scoreLead({
      form: baseForm,
      attribution: attr,
      behavior: {
        sessionCount: 2,
        spanDays: 1,
        uniqueListingViews: 3,
        maxListingPrice: 4_500_000,
        minPriceFilter: 2_000_000,
        favoritedAny: false,
        activeMs: 3 * 60_000,
      },
    });
    expect(result.band === 'warm' || result.band === 'cool').toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(25);
  });

  it('penalizes disposable email domains', () => {
    const result = scoreLead({
      form: { ...baseForm, email: 'spam@mailinator.com' },
      attribution: null,
      behavior: baseBehavior,
    });
    const emailSignal = result.breakdown.find((s) => s.key === 'email_domain');
    expect(emailSignal?.points).toBe(0);
    expect(emailSignal?.evidence).toContain('disposable');
  });

  it('rewards business email domains over free providers', () => {
    const biz = scoreLead({
      form: { ...baseForm, email: 'jane@acmecorp.com' },
      attribution: null,
      behavior: baseBehavior,
    });
    const free = scoreLead({
      form: { ...baseForm, email: 'jane@gmail.com' },
      attribution: null,
      behavior: baseBehavior,
    });
    const bizPts = biz.breakdown.find((s) => s.key === 'email_domain')!.points;
    const freePts = free.breakdown.find((s) => s.key === 'email_domain')!.points;
    expect(bizPts).toBeGreaterThan(freePts);
  });

  it('rewards messages that name a community', () => {
    const namesCommunity = scoreLead({
      form: { ...baseForm, message: 'Looking at Silverleaf and Estancia for a $5M home.' },
      attribution: null,
      behavior: baseBehavior,
    });
    const generic = scoreLead({
      form: { ...baseForm, message: 'Looking at homes for a similar amount of money.' },
      attribution: null,
      behavior: baseBehavior,
    });
    const namesPts = namesCommunity.breakdown.find((s) => s.key === 'message')!.points;
    const genericPts = generic.breakdown.find((s) => s.key === 'message')!.points;
    expect(namesPts).toBeGreaterThan(genericPts);
  });

  it('attaches breakdown rows for every signal', () => {
    const result = scoreLead({
      form: baseForm,
      attribution: null,
      behavior: baseBehavior,
    });
    const keys = result.breakdown.map((s) => s.key).sort();
    expect(keys).toEqual(
      [
        'active_time',
        'email_domain',
        'favorited',
        'intent',
        'listing_engagement',
        'message',
        'phone',
        'price_filter',
        'return_visits',
        'utm_quality',
      ].sort(),
    );
  });

  it('total never exceeds 100', () => {
    const attr = attrFromUrl('https://yong-choi.com/?gclid=a&utm_campaign=yong-brand');
    const result = scoreLead({
      form: {
        ...baseForm,
        message:
          'Interested in Silverleaf, Estancia, Desert Mountain, and Paradise Valley homes ' +
          'around $8M; have looked at MLS #1234567 already and want to schedule a tour.',
      },
      attribution: attr,
      behavior: {
        sessionCount: 5,
        spanDays: 10,
        uniqueListingViews: 12,
        maxListingPrice: 12_000_000,
        minPriceFilter: 5_000_000,
        favoritedAny: true,
        activeMs: 20 * 60_000,
      },
    });
    expect(result.total).toBeLessThanOrEqual(100);
  });
});
