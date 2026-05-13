'use client';

import { useState, type FormEvent } from 'react';
import { CapsLabel } from '@/components/shared/CapsLabel';
import { siteContent } from '@/content/site';

type ScheduleShowingFormProps = {
  listingKey: string;
  /** Address used in the message body (e.g. "10845 E Silverleaf Ridge Way"). */
  listingAddress: string;
};

/**
 * Compact 4-field showing-request form for the sidebar. Submits to
 * `/api/contact` with a pre-formatted message that includes the
 * listing address and the visitor's preferred date.
 *
 * Status states: idle → sending → sent (success) | error.
 * Hair-thin underlines on inputs per the editorial language; no
 * filled background, no rounded corners.
 */
export function ScheduleShowingForm({ listingKey, listingAddress }: ScheduleShowingFormProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      message: `I'd like to tour ${listingAddress} on or around ${String(data.get('date') ?? 'a date that works')}.`,
      interest: 'Buying' as const,
      source_listing: listingKey,
    };
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="bg-ink-elevated/30 p-6 md:p-7 border border-gold/30 text-center">
        <CapsLabel as="div" className="text-gold mb-3">Thank you</CapsLabel>
        <p className="font-serif italic text-stone text-lg leading-relaxed">
          Yong reviews every inquiry personally and replies within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-ink-elevated/30 p-6 md:p-7 border border-white/5"
      data-testid="schedule-showing-form"
    >
      <CapsLabel as="h3" className="text-[10px] text-stone/60 mb-5">Request a Private Tour</CapsLabel>
      <div className="space-y-4">
        <Field name="name" label="Name" required autoComplete="name" />
        <Field name="email" label="Email" type="email" required autoComplete="email" />
        <Field name="phone" label="Phone" type="tel" autoComplete="tel" />
        <Field name="date" label="Preferred date" type="date" />
      </div>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="caps inline-flex items-center justify-center gap-2 w-full mt-6 px-5 py-3 bg-gold text-ink hover:bg-gold-muted transition-colors disabled:opacity-60 text-[11px] tracking-widest"
      >
        {status === 'sending' ? 'Sending…' : (
          <>
            <span>Request</span>
            <span aria-hidden="true">→</span>
          </>
        )}
      </button>
      {status === 'error' ? (
        <p className="text-xs text-red-400 mt-3 text-center">
          Couldn&rsquo;t send. Please try again or email {siteContent.contact.email}.
        </p>
      ) : null}
      <p className="text-[10px] text-stone/40 text-center mt-4 leading-relaxed">
        Reviewed personally. Replies within 24 hours.
      </p>
    </form>
  );
}

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
      <span className="caps text-[10px] text-stone/55 block mb-2">
        {label}
        {required ? '' : ' (optional)'}
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
