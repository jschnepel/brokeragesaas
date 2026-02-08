'use client';

import { useState } from 'react';
import { useAgent } from '@/lib/agent-context';
import { createLead } from '@/lib/api-client';

export default function ContactPage() {
  const agent = useAgent();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
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
      source: 'contact_page',
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
      <main className="py-16">
        <div className="container">
          <div className="mx-auto max-w-lg text-center">
            <div className="mb-6 text-green-500">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-secondary-900">Thank You!</h1>
            <p className="mt-4 text-secondary-600">
              Your message has been sent. {agent.name} will get back to you shortly.
            </p>
            <a
              href="/"
              className="mt-8 inline-block rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-500"
            >
              Return Home
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-16">
      <div className="container">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-secondary-900">
            Contact {agent.name}
          </h1>
          <p className="mt-4 text-lg text-secondary-600">
            Have questions about buying or selling? Fill out the form below and I&apos;ll get back to you as soon as possible.
          </p>

          {/* Contact Info */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-secondary-200 p-4">
              <p className="text-sm text-secondary-500">Email</p>
              <a href={`mailto:${agent.email}`} className="text-primary-600 hover:text-primary-500">
                {agent.email}
              </a>
            </div>
            <div className="rounded-lg border border-secondary-200 p-4">
              <p className="text-sm text-secondary-500">Phone</p>
              <a href={`tel:${agent.phone}`} className="text-primary-600 hover:text-primary-500">
                {agent.phone}
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-secondary-300 px-4 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
                Email *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border border-secondary-300 px-4 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-secondary-700">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border border-secondary-300 px-4 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-secondary-700">
                Message *
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="mt-1 block w-full rounded-md border border-secondary-300 px-4 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
