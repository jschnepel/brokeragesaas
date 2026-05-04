/**
 * Server-side lead scoring for the contact form. Score range 0–100, computed
 * from attribution + behavioral context attached to the form POST.
 *
 * Rubric (max points per signal):
 *
 *   Min price filter ≥ $2M (sticky)               20  — hardest predictor;
 *                                                       tire-kickers don't change
 *                                                       the default filter
 *   Returning visitor (≥3 sessions, ≥2 days apart) 15  — beats time-on-site for
 *                                                       consideration depth
 *   Listing engagement                              12  — viewed ≥5 unique with
 *                                                       at least one ≥ $5M
 *   Saved/favorited a listing                       10  — explicit intent
 *   UTM source quality                              10  — direct/organic/sothebys = 10,
 *                                                       paid Google brand = 8,
 *                                                       paid Google generic = 5,
 *                                                       Instagram = 4, FB = 2,
 *                                                       unknown = 0
 *   Phone provided + valid format                    8  — phone is the luxury signal
 *   Message ≥ 80 chars + names a community/MLS      10  — message vocabulary
 *   Intent = Buying or Both                          5  — Selling routes differently
 *   Email domain quality (not disposable, not free) 5  — biz email beats gmail
 *   Time on site this session ≥ 4 min                5  — engagement floor
 *
 * Bands:
 *    80+ = hot      — call within 15 min
 *    50–79 = warm   — call same day
 *    25–49 = cool   — email within 24h
 *    <25 = cold     — autoresponder, archive at 30d if no return
 *
 * The scoring is intentionally explicit and easy to tune. Each signal returns
 * a `{ key, label, points, max, evidence }` row in the breakdown so we can
 * surface the *why* in Yong's email, audit a score after the fact, and
 * change weights without rewriting callers.
 */

import { type Attribution } from './attribution';

export type ScoreBand = 'hot' | 'warm' | 'cool' | 'cold';

export type ScoreSignal = {
  key: string;
  label: string;
  points: number;
  max: number;
  evidence: string;
};

export type LeadScore = {
  total: number;
  band: ScoreBand;
  breakdown: ScoreSignal[];
};

export type Behavior = {
  /** Total session count attached to this anon visitor. */
  sessionCount: number;
  /** Days between first and last session (proxy for "≥2 days apart"). */
  spanDays: number;
  /** Number of distinct listings viewed across all sessions. */
  uniqueListingViews: number;
  /** Highest list price among viewed listings (USD). */
  maxListingPrice: number;
  /** Lowest "min price filter" the visitor stuck with (USD). */
  minPriceFilter: number;
  /** Whether they favorited any listing. */
  favoritedAny: boolean;
  /** Active ms accumulated this session (from session.ts). */
  activeMs: number;
};

export type FormFields = {
  email: string;
  phone: string;
  interest: 'Buying' | 'Selling' | 'Both';
  message: string;
};

const BANDS: Array<{ band: ScoreBand; min: number }> = [
  { band: 'hot', min: 80 },
  { band: 'warm', min: 50 },
  { band: 'cool', min: 25 },
  { band: 'cold', min: 0 },
];

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
  'proton.me',
  'live.com',
  'msn.com',
]);

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'temp-mail.org',
  'throwaway.email',
  'tempmail.com',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'maildrop.cc',
]);

// A small starter list of communities/areas we know the site indexes. Hits
// here boost the message-vocabulary signal. Match is case-insensitive.
const KNOWN_AREAS = [
  'silverleaf',
  'estancia',
  'desert mountain',
  'paradise valley',
  'dc ranch',
  'troon',
  'whisper rock',
  'mirabel',
  'ancala',
  'gainey ranch',
  'arcadia',
  'biltmore',
  'mcdowell mountain',
  'scottsdale',
  'cave creek',
  'carefree',
  'fountain hills',
];

function bandFor(total: number): ScoreBand {
  for (const b of BANDS) {
    if (total >= b.min) return b.band;
  }
  return 'cold';
}

function emailDomain(email: string): string {
  const at = email.indexOf('@');
  return at >= 0 ? email.slice(at + 1).toLowerCase().trim() : '';
}

function looksDisposable(domain: string): boolean {
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

function looksFreeProvider(domain: string): boolean {
  return FREE_EMAIL_DOMAINS.has(domain);
}

// E.164-ish: accept +CC NNN... with at least 10 digits total. Cheap; the real
// validation happens in libphonenumber-js when we wire CRM.
function looksValidPhone(phone: string): boolean {
  const digits = phone.replace(/[^\d]/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function scorePriceFilter(min: number): ScoreSignal {
  const max = 20;
  const points = min >= 2_000_000 ? 20 : min >= 1_000_000 ? 10 : 0;
  return {
    key: 'price_filter',
    label: 'Min price filter',
    points,
    max,
    evidence: min > 0 ? `${formatUsd(min)} sticky filter` : 'no price filter set',
  };
}

function scoreReturnVisits(b: Behavior): ScoreSignal {
  const max = 15;
  let points = 0;
  if (b.sessionCount >= 3 && b.spanDays >= 2) points = 15;
  else if (b.sessionCount >= 2) points = 8;
  return {
    key: 'return_visits',
    label: 'Return visits',
    points,
    max,
    evidence: `${b.sessionCount} sessions over ${b.spanDays}d`,
  };
}

function scoreListingEngagement(b: Behavior): ScoreSignal {
  const max = 12;
  let points = 0;
  if (b.uniqueListingViews >= 5 && b.maxListingPrice >= 5_000_000) points = 12;
  else if (b.uniqueListingViews >= 5) points = 8;
  else if (b.uniqueListingViews >= 2) points = 4;
  return {
    key: 'listing_engagement',
    label: 'Listing engagement',
    points,
    max,
    evidence: `${b.uniqueListingViews} listings, max ${formatUsd(b.maxListingPrice)}`,
  };
}

function scoreFavorited(b: Behavior): ScoreSignal {
  const max = 10;
  return {
    key: 'favorited',
    label: 'Favorited a listing',
    points: b.favoritedAny ? 10 : 0,
    max,
    evidence: b.favoritedAny ? 'yes' : 'no',
  };
}

function scoreUtmQuality(attr: Attribution | null): ScoreSignal {
  const max = 10;
  if (!attr) {
    return { key: 'utm_quality', label: 'Source quality', points: 0, max, evidence: 'unknown' };
  }
  const t = attr.first;
  let points = 0;
  let evidence = '';
  if (t.channel === 'direct') {
    points = 10;
    evidence = 'direct';
  } else if (t.channel === 'organic_search') {
    points = 10;
    evidence = `organic ${t.source ?? 'search'}`;
  } else if (t.channel === 'referral' && (t.source?.includes('sothebys') || t.source?.includes('sothebysrealty'))) {
    points = 10;
    evidence = 'sothebys referral';
  } else if (t.channel === 'paid_search') {
    // Brand vs generic — heuristic: if the campaign name includes the brand,
    // call it brand search (premium quality).
    const isBrand = (t.campaign ?? '').toLowerCase().includes('yong') ||
      (t.campaign ?? '').toLowerCase().includes('brand');
    points = isBrand ? 8 : 5;
    evidence = `paid_search ${isBrand ? 'brand' : 'generic'}`;
  } else if (t.channel === 'social' && t.source === 'instagram') {
    points = 4;
    evidence = 'instagram';
  } else if (t.channel === 'paid_social' || t.channel === 'social') {
    points = 2;
    evidence = `${t.channel} ${t.source ?? ''}`.trim();
  } else if (t.channel === 'email') {
    points = 6;
    evidence = `email ${t.source ?? ''}`.trim();
  } else if (t.channel === 'referral') {
    points = 4;
    evidence = `referral from ${t.source ?? '?'}`;
  } else {
    points = 0;
    evidence = t.channel;
  }
  return { key: 'utm_quality', label: 'Source quality', points, max, evidence };
}

function scorePhone(form: FormFields): ScoreSignal {
  const max = 8;
  const ok = looksValidPhone(form.phone);
  return {
    key: 'phone',
    label: 'Phone provided + valid',
    points: ok ? 8 : 0,
    max,
    evidence: ok ? form.phone : 'invalid or missing',
  };
}

function scoreMessage(form: FormFields): ScoreSignal {
  const max = 10;
  const text = form.message.trim();
  let points = 0;
  if (text.length >= 80) {
    points += 5;
  } else if (text.length >= 40) {
    points += 2;
  }
  const lower = text.toLowerCase();
  const matchedAreas = KNOWN_AREAS.filter((a) => lower.includes(a));
  const hasMlsRef = /\bmls\s*#?\s*\d{5,}\b/i.test(text) || /\b#\d{6,}\b/.test(text);
  if (matchedAreas.length > 0) points += 3;
  if (hasMlsRef) points += 2;
  points = Math.min(points, max);
  const evidenceParts = [`${text.length} chars`];
  if (matchedAreas.length > 0) evidenceParts.push(`mentions ${matchedAreas.join(', ')}`);
  if (hasMlsRef) evidenceParts.push('mentions MLS#');
  return {
    key: 'message',
    label: 'Message vocabulary',
    points,
    max,
    evidence: evidenceParts.join('; '),
  };
}

function scoreIntent(form: FormFields): ScoreSignal {
  const max = 5;
  const points = form.interest === 'Buying' || form.interest === 'Both' ? 5 : 0;
  return {
    key: 'intent',
    label: 'Intent',
    points,
    max,
    evidence: form.interest,
  };
}

function scoreEmailDomain(form: FormFields): ScoreSignal {
  const max = 5;
  const domain = emailDomain(form.email);
  let points = 0;
  let evidence = domain || 'no domain';
  if (!domain) {
    points = 0;
  } else if (looksDisposable(domain)) {
    points = 0;
    evidence = `disposable: ${domain}`;
  } else if (looksFreeProvider(domain)) {
    points = 2;
    evidence = `free provider: ${domain}`;
  } else {
    points = 5;
    evidence = `business: ${domain}`;
  }
  return { key: 'email_domain', label: 'Email domain quality', points, max, evidence };
}

function scoreActiveTime(b: Behavior): ScoreSignal {
  const max = 5;
  const minutes = b.activeMs / 60_000;
  const points = minutes >= 4 ? 5 : minutes >= 2 ? 2 : 0;
  return {
    key: 'active_time',
    label: 'Active time on site',
    points,
    max,
    evidence: `${minutes.toFixed(1)} min active this session`,
  };
}

function formatUsd(n: number): string {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/** Score a lead. Pure function — no I/O, deterministic given inputs. */
export function scoreLead(opts: {
  form: FormFields;
  attribution: Attribution | null;
  behavior: Behavior;
}): LeadScore {
  const breakdown: ScoreSignal[] = [
    scorePriceFilter(opts.behavior.minPriceFilter),
    scoreReturnVisits(opts.behavior),
    scoreListingEngagement(opts.behavior),
    scoreFavorited(opts.behavior),
    scoreUtmQuality(opts.attribution),
    scorePhone(opts.form),
    scoreMessage(opts.form),
    scoreIntent(opts.form),
    scoreEmailDomain(opts.form),
    scoreActiveTime(opts.behavior),
  ];
  const total = breakdown.reduce((acc, s) => acc + s.points, 0);
  return { total, band: bandFor(total), breakdown };
}

export function bandLabel(band: ScoreBand): string {
  switch (band) {
    case 'hot':
      return 'Hot — call within 15 min';
    case 'warm':
      return 'Warm — call same day';
    case 'cool':
      return 'Cool — email within 24h';
    case 'cold':
      return 'Cold — autoresponder';
  }
}
