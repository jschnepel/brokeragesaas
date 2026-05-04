'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { identify, track } from '@/lib/analytics/events';
import {
  deriveContactSource,
  deriveLeadScore,
  deriveSourceListing,
  sha256Hex,
} from '@/lib/analytics/contact-helpers';
import { getSessionEnrichment } from '@/lib/analytics/contact-payload';
import { CONTACT_DISCLOSURE, SMS_OPT_IN_LABEL } from '@/content/legal';

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

export interface ContactFormInitialValues {
  name?: string;
  email?: string;
  phone?: string;
  interest?: 'Buying' | 'Selling' | 'Both' | '';
  message?: string;
}

interface ContactFormProps {
  initialValues?: ContactFormInitialValues;
}

const VALID_INTERESTS = ['Buying', 'Selling', 'Both'] as const;
type Interest = typeof VALID_INTERESTS[number];

/**
 * Lead-funnel form. Tracks every step the visitor takes:
 *   - contact_form_view              (mount)
 *   - contact_form_focus_first       (first focus, once per session)
 *   - contact_form_field_complete    (onBlur with non-empty value)
 *   - contact_form_validation_error  (client-side validation fail at submit)
 *   - contact_form_submit_attempt    (every submit click)
 *   - contact_form_submit_success    (200 from /api/contact)
 *   - contact_form_submit_failure    (non-200 or thrown)
 *   - contact_form_abandon           (beforeunload with partial fill)
 *
 * On successful submit we also call `identify()` with a SHA-256 of the
 * email — never the raw email — so PostHog can stitch prior anon events
 * to the converted lead.
 */
export function ContactForm({ initialValues }: ContactFormProps = {}) {
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const focusedFirstRef = useRef(false);
  const completedFieldsRef = useRef<Set<string>>(new Set());
  const submittedRef = useRef(false);

  // contact_form_view + abandon listener — once per mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search ?? '';
    const referrer = document.referrer ?? '';
    const hostname = window.location.hostname;
    const source = deriveContactSource({ search, referrer, hostname });
    track('contact_form_view', { source });

    const onUnload = () => {
      if (completedFieldsRef.current.size > 0 && !submittedRef.current) {
        track('contact_form_abandon', {
          fields_completed: Array.from(completedFieldsRef.current),
        });
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  function handleFocus() {
    if (focusedFirstRef.current) return;
    focusedFirstRef.current = true;
    track('contact_form_focus_first', {});
  }

  function handleBlur(field: string, value: string) {
    if (!value.trim()) return;
    if (completedFieldsRef.current.has(field)) return;
    completedFieldsRef.current.add(field);
    track('contact_form_field_complete', { field });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    track('contact_form_submit_attempt', {});

    setState('sending');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    // Local validation — required-field check + interest sanity. Catches the
    // same things the server checks but lets us label the failure mode in
    // the analytics event so we can see *why* people bail at submit.
    const validationError = validateLocally(data);
    if (validationError) {
      track('contact_form_validation_error', validationError);
      setState('idle');
      setErrorMsg('Please fill out all required fields.');
      return;
    }

    try {
      // Merge session + behavior context for server-side scoring. The
      // honeypot field stays in the payload — the server checks it before
      // any further processing, so dropping it would defeat bot detection.
      const enrichment = getSessionEnrichment();
      // Capture consent metadata at submission time. Server fills in IP +
      // UA from the request; client supplies the boolean SMS opt-in and the
      // exact timestamp (ms precision) the visitor clicked Send. The
      // canonical disclosure text is reconstructed server-side from
      // content/legal.ts, so even a tampered client can't lie about what
      // the visitor actually saw.
      const smsConsent = data.smsConsent === 'on';
      const consentTimestamp = new Date().toISOString();
      const payload = {
        ...data,
        smsConsent,
        consentTimestamp,
        ...enrichment,
      };
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        track('contact_form_submit_failure', { reason: `${res.status}` });
        throw new Error(body.error ?? 'Unable to send');
      }
      submittedRef.current = true;
      const interest = data.interest as Interest;
      const sourceListing = deriveSourceListing(window.location.search ?? '');
      track('contact_form_submit_success', {
        interest,
        source_listing: sourceListing,
      });
      // Identity stitching — PostHog gets a SHA-256 of the email so prior
      // anon events (listing views, page views, etc.) link to the converted
      // visitor without writing raw PII into analytics.
      try {
        const emailHash = await sha256Hex(data.email ?? '');
        identify(emailHash, {
          email: data.email,
          interest,
          lead_score: deriveLeadScore(),
        });
      } catch {
        // Hashing failed (very old browser?) — proceed without identify.
      }
      setState('sent');
      form.reset();
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      // submit_failure already fired for non-200; only fire for thrown
      // network errors that didn't go through the !res.ok branch.
      if (!(err instanceof Error) || !/^[0-9]{3}$/.test(reason)) {
        track('contact_form_submit_failure', { reason });
      }
      setState('error');
      setErrorMsg(reason || 'Unable to send');
    }
  }

  if (state === 'sent') {
    return (
      <div className="border border-gold/40 p-8 text-center">
        <div className="font-serif italic text-2xl mb-2">Message received.</div>
        <p className="text-stone/80 text-sm">Yong will be in touch within 24 hours.</p>
      </div>
    );
  }

  const iv = initialValues ?? {};

  return (
    <form onSubmit={onSubmit} className="border border-gold/30 p-6 md:p-8 space-y-5">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <Field label="Your Name" name="name" required defaultValue={iv.name} onFocus={handleFocus} onBlur={handleBlur} />
      <Field label="Email" name="email" type="email" required defaultValue={iv.email} onFocus={handleFocus} onBlur={handleBlur} />
      <Field label="Phone" name="phone" type="tel" required defaultValue={iv.phone} onFocus={handleFocus} onBlur={handleBlur} />
      <div>
        <label className="caps block mb-2">Interest</label>
        <select
          name="interest"
          required
          defaultValue={iv.interest ?? ''}
          onFocus={handleFocus}
          onBlur={(e) => handleBlur('interest', e.target.value)}
          className="w-full bg-transparent border-b border-white/15 py-2 text-stone focus:border-gold outline-none"
        >
          <option value="" disabled>Select one</option>
          <option>Buying</option>
          <option>Selling</option>
          <option>Both</option>
        </select>
      </div>
      <div>
        <label className="caps block mb-2">Message</label>
        <textarea
          name="message"
          required
          rows={5}
          defaultValue={iv.message}
          onFocus={handleFocus}
          onBlur={(e) => handleBlur('message', e.target.value)}
          className="w-full bg-transparent border-b border-white/15 py-2 text-stone focus:border-gold outline-none"
        />
      </div>
      {errorMsg ? <p className="text-red-400 text-sm">{errorMsg}</p> : null}
      {/* SMS opt-in — TCPA + AZ HB 2498. Defaulted off; the lead score
          treats opt-in as a soft positive signal. Label copy lives in
          content/legal.ts so any change is captured in audit. */}
      <label className="flex items-start gap-3 text-stone/70 text-xs leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          name="smsConsent"
          className="mt-0.5 h-4 w-4 accent-gold cursor-pointer"
        />
        <span>{SMS_OPT_IN_LABEL}</span>
      </label>
      {/* Canonical consent disclosure — same string captured server-side
          on submission. CAN-SPAM + ARMLS attribution are folded in. */}
      <p className="text-mute text-[0.65rem] leading-relaxed border-t border-white/10 pt-4">
        {CONTACT_DISCLOSURE}
      </p>
      <button type="submit" disabled={state === 'sending'} className="caps bg-gold text-ink px-6 py-4 hover:bg-stone transition-colors disabled:opacity-50">
        {state === 'sending' ? 'Sending…' : 'Send →'}
      </button>
    </form>
  );
}

function validateLocally(data: Record<string, string>): { field: string; reason: string } | null {
  const required = ['name', 'email', 'phone', 'interest', 'message'] as const;
  for (const f of required) {
    if (!data[f] || !data[f].trim()) {
      return { field: f, reason: 'required' };
    }
  }
  if (!VALID_INTERESTS.includes(data.interest as Interest)) {
    return { field: 'interest', reason: 'invalid' };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
    return { field: 'email', reason: 'format' };
  }
  return null;
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  defaultValue,
  onFocus,
  onBlur,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  onFocus?: () => void;
  onBlur?: (field: string, value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="caps block mb-2">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        onFocus={onFocus}
        onBlur={(e) => onBlur?.(name, e.target.value)}
        className="w-full bg-transparent border-b border-white/15 py-2 text-stone focus:border-gold outline-none"
      />
    </div>
  );
}
