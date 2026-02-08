'use client';

import { useState, FormEvent } from 'react';
import { Button } from './Button';

export interface ContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<void>;
  propertyAddress?: string;
  className?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export function ContactForm({ onSubmit, propertyAddress, className = '' }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: propertyAddress ? `I'm interested in ${propertyAddress}` : '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
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
        <label htmlFor="contact-name" className="sr-only">Name</label>
        <input
          type="text"
          id="contact-name"
          placeholder="Your Name *"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="sr-only">Email</label>
        <input
          type="email"
          id="contact-email"
          placeholder="Email *"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div>
        <label htmlFor="contact-phone" className="sr-only">Phone</label>
        <input
          type="tel"
          id="contact-phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="sr-only">Message</label>
        <textarea
          id="contact-message"
          placeholder="Message"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm placeholder:text-secondary-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full"
      >
        {submitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
