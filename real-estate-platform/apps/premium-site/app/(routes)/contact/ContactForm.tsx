'use client';

import { useState } from 'react';

const INTERESTS = [
  '',
  'Buying a Home',
  'Selling a Home',
  'Relocation to Arizona',
  'Investment Property',
  'Market Analysis',
  'General Inquiry',
];

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);

    try {
      const { submitContactForm } = await import('./actions');
      const result = await submitContactForm({ success: false, error: null }, formData);

      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(result.error);
      }
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again or contact us directly.');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gold"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-serif text-navy mb-2">Message Sent</h3>
        <p className="text-navy/60 text-sm">
          Thank you for reaching out. I&apos;ll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="name"
            className="text-meta uppercase tracking-widest text-navy/50 font-bold block mb-2"
          >
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full border border-navy/15 rounded px-4 py-3 text-navy bg-white focus:outline-none focus:border-gold transition-colors"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="text-meta uppercase tracking-widest text-navy/50 font-bold block mb-2"
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full border border-navy/15 rounded px-4 py-3 text-navy bg-white focus:outline-none focus:border-gold transition-colors"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="phone"
            className="text-meta uppercase tracking-widest text-navy/50 font-bold block mb-2"
          >
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="w-full border border-navy/15 rounded px-4 py-3 text-navy bg-white focus:outline-none focus:border-gold transition-colors"
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label
            htmlFor="interest"
            className="text-meta uppercase tracking-widest text-navy/50 font-bold block mb-2"
          >
            I&apos;m Interested In
          </label>
          <select
            id="interest"
            name="interest"
            className="w-full border border-navy/15 rounded px-4 py-3 text-navy bg-white focus:outline-none focus:border-gold transition-colors"
          >
            {INTERESTS.map((interest) => (
              <option key={interest} value={interest}>
                {interest || 'Select an option'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="message"
          className="text-meta uppercase tracking-widest text-navy/50 font-bold block mb-2"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className="w-full border border-navy/15 rounded px-4 py-3 text-navy bg-white focus:outline-none focus:border-gold transition-colors resize-none"
          placeholder="Tell me about what you're looking for..."
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-gold px-8 py-4 text-label uppercase tracking-md font-bold text-white hover:bg-navy transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
