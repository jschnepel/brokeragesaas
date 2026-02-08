'use client';

import { useState } from 'react';
import { createLead } from '@/lib/api-client';

interface ContactFormProps {
  propertyId?: string;
  propertyAddress?: string;
  className?: string;
}

export function ContactForm({ propertyId, propertyAddress, className = '' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: propertyAddress ? `I'm interested in ${propertyAddress}` : '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await createLead({
      ...formData,
      property_id: propertyId,
      source: propertyId ? 'property_page' : 'contact_form',
    });

    if (response.error) {
      setError(response.error.message);
    } else {
      setSubmitted(true);
    }

    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="mb-4 text-green-500">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-secondary-900 font-medium">Thank you!</p>
        <p className="mt-1 text-sm text-secondary-500">We&apos;ll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <input
          type="text"
          placeholder="Your Name *"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div>
        <input
          type="email"
          placeholder="Email *"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div>
        <input
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div>
        <textarea
          placeholder="Message"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
