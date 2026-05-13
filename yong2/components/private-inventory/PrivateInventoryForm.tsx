'use client';

import { useState, type FormEvent } from 'react';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { siteContent } from '@/content/site';
import { track } from '@/lib/analytics/events';

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

const BUDGET_BANDS = [
  'Under $2M',
  '$2M – $5M',
  '$5M – $10M',
  '$10M – $25M',
  '$25M+',
] as const;
type BudgetBand = typeof BUDGET_BANDS[number];

const TIMELINES = [
  'Active search',
  '3–6 months',
  '6–12 months',
  '12+ months',
  'Exploring',
] as const;
type Timeline = typeof TIMELINES[number];

const COMMUNITIES = [
  'Silverleaf',
  'Desert Mountain',
  'Estancia',
  'Paradise Valley',
  'DC Ranch',
  'Arcadia / Biltmore',
  'Troon North',
  'Carefree / Cave Creek',
] as const;
type CommunityOption = typeof COMMUNITIES[number];

/**
 * Off-market inventory signup. Distinct from the general /contact form
 * in three ways:
 *   - More qualifying fields (budget band, timeline, communities) — the
 *     audience self-segments before submit, so Yong sees a higher-signal
 *     intake.
 *   - Compressed copy. The page does the persuasion; the form is the
 *     punctuation.
 *   - Routes through the same /api/contact endpoint with the off-market
 *     metadata folded into the `message` body so the email surface
 *     reads as a marked-up brief, not a freeform note.
 */
export function PrivateInventoryForm() {
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [communities, setCommunities] = useState<Set<CommunityOption>>(new Set());

  function toggleCommunity(name: CommunityOption) {
    setCommunities((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg('');
    setState('sending');
    const data = new FormData(event.currentTarget);

    // Honeypot — bots fill every visible field; this one is hidden.
    if (String(data.get('website') ?? '').trim().length > 0) {
      setState('sent');
      return;
    }

    const firstName = String(data.get('firstName') ?? '').trim();
    const lastName = String(data.get('lastName') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const budget = String(data.get('budget') ?? '');
    const timeline = String(data.get('timeline') ?? '');
    const notes = String(data.get('notes') ?? '').trim();
    const selectedCommunities = Array.from(communities);

    if (!firstName || !lastName || !email || !phone || !budget || !timeline) {
      setState('error');
      setErrorMsg('Please fill in name, email, mobile, budget, and timeline.');
      return;
    }

    const fullName = `${firstName} ${lastName}`;
    const communitiesLine =
      selectedCommunities.length > 0
        ? selectedCommunities.join(', ')
        : 'No preference indicated';
    const message = [
      'OFF-MARKET INVENTORY REQUEST',
      '',
      `Budget band:    ${budget}`,
      `Timeline:       ${timeline}`,
      `Communities:    ${communitiesLine}`,
      notes ? '' : null,
      notes ? 'Notes from prospect:' : null,
      notes,
    ]
      .filter((line): line is string => line !== null)
      .join('\n');

    try {
      track('cta_private_inventory_submit', {
        budget,
        timeline,
        communityCount: selectedCommunities.length,
      });
    } catch {
      // Tracking failure must not block the submit. Swallow.
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          // The endpoint schema currently caps `interest` at
          // Buying|Selling|Both. Off-market enquiries are inherently
          // "Buying" — tag the message body for clear routing on Yong's
          // side.
          interest: 'Buying',
          message,
          consentTimestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        setState('error');
        setErrorMsg(errBody.error ?? 'Unable to send your request. Please try again.');
        return;
      }
      setState('sent');
    } catch {
      setState('error');
      setErrorMsg('Network error. Please try again or email yong directly.');
    }
  }

  if (state === 'sent') {
    return (
      <div className="bg-ink-elevated/40 border border-gold/30 p-8 md:p-10 text-center max-w-2xl mx-auto">
        <CapsLabel as="div" className="text-gold mb-4">
          Thank you
        </CapsLabel>
        <p className="font-serif italic text-stone text-xl md:text-2xl leading-snug">
          Yong will be in touch personally.
        </p>
        <p className="mt-4 text-sm text-stone/70 leading-relaxed max-w-md mx-auto">
          Off-market introductions are made by phone or email, never by bulk mailing. Expect a
          reply within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-ink-elevated/30 border border-white/5 p-7 md:p-10"
      data-testid="private-inventory-form"
      aria-label="Request off-market inventory access"
    >
      {/* Honeypot — visually hidden but in DOM. Real users never fill it. */}
      <label className="sr-only">
        Leave this empty:
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        <Field name="firstName" label="First name" required autoComplete="given-name" />
        <Field name="lastName" label="Last name" required autoComplete="family-name" />
        <Field name="email" type="email" label="Email" required autoComplete="email" />
        <Field name="phone" type="tel" label="Mobile" required autoComplete="tel" />
      </div>

      <RadioGroup name="budget" label="Budget range" options={BUDGET_BANDS} required />
      <RadioGroup name="timeline" label="Timeline" options={TIMELINES} required />

      <fieldset className="mt-8">
        <legend className="caps text-[10px] text-stone/55 tracking-[0.3em] mb-3">
          Target communities (optional)
        </legend>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {COMMUNITIES.map((c) => {
            const checked = communities.has(c);
            return (
              <button
                type="button"
                key={c}
                onClick={() => toggleCommunity(c)}
                aria-pressed={checked}
                className={`caps text-[10px] tracking-[0.25em] px-3 py-2 border transition-colors text-left ${
                  checked
                    ? 'bg-gold text-ink border-gold'
                    : 'border-white/15 text-stone/75 hover:border-gold hover:text-gold'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8">
        <label className="block">
          <span className="caps text-[10px] text-stone/55 tracking-[0.3em] block mb-3">
            Anything else worth noting (optional)
          </span>
          <textarea
            name="notes"
            rows={4}
            className="w-full bg-transparent border border-white/15 focus:border-gold focus:outline-none p-3 text-stone placeholder:text-stone/30 text-sm leading-relaxed resize-y"
            placeholder="Specific addresses you'd like an introduction to, club memberships you'd value, design preferences, etc."
          />
        </label>
      </div>

      <p className="mt-6 text-[11px] text-stone/55 leading-relaxed">
        Off-market introductions are made personally; we don&rsquo;t add visitors to bulk mailings
        or distribution lists. Inquiries are typically answered within 24 hours.
      </p>

      <button
        type="submit"
        disabled={state === 'sending'}
        className="caps inline-flex items-center justify-center gap-3 w-full md:w-auto mt-8 px-8 py-4 bg-gold text-ink hover:bg-[color:var(--gold-muted)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-[11px] tracking-[0.32em]"
      >
        {state === 'sending' ? (
          'Sending…'
        ) : (
          <>
            <span>Request a conversation</span>
            <span aria-hidden="true">→</span>
          </>
        )}
      </button>

      {state === 'error' ? (
        <p className="mt-4 text-sm text-red-400 leading-relaxed">{errorMsg}</p>
      ) : null}

      <p className="mt-6 text-[10px] text-stone/40 leading-relaxed">
        Or email {siteContent.contact.email} directly.
      </p>
    </form>
  );
}

// ─────────────────── Form atoms ───────────────────

function Field({
  name,
  label,
  type = 'text',
  required,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="caps text-[10px] text-stone/55 tracking-[0.3em] block mb-2">
        {label}
        {required ? '' : <span className="text-stone/35"> (optional)</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        className="w-full bg-transparent border-b border-white/15 focus:border-gold focus:outline-none py-2 text-stone placeholder:text-stone/30 text-sm"
      />
    </label>
  );
}

function RadioGroup({
  name,
  label,
  options,
  required,
}: {
  name: string;
  label: string;
  options: readonly string[];
  required?: boolean;
}) {
  return (
    <fieldset className="mt-8">
      <legend className="caps text-[10px] text-stone/55 tracking-[0.3em] mb-3">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="caps text-[10px] tracking-[0.25em] px-3 py-2 border border-white/15 text-stone/75 hover:border-gold hover:text-gold transition-colors cursor-pointer has-[:checked]:bg-gold has-[:checked]:text-ink has-[:checked]:border-gold"
          >
            <input
              type="radio"
              name={name}
              value={opt}
              required={required}
              className="sr-only"
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
