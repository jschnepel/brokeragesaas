'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProperty } from '@/lib/api-client';
import { useAgent } from '@/lib/agent-context';
import type { StandardProperty } from '@platform/shared';

export default function PropertyDetailPage() {
  const params = useParams();
  const agent = useAgent();
  const [property, setProperty] = useState<StandardProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    async function loadProperty() {
      if (!params.slug) return;

      setLoading(true);
      setError(null);

      const response = await getProperty(params.slug as string);

      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        setProperty(response.data.property);
      }

      setLoading(false);
    }

    loadProperty();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container py-16">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error || 'Property not found'}
        </div>
        <Link href="/properties" className="mt-4 inline-block text-primary-600 hover:text-primary-500">
          ← Back to properties
        </Link>
      </div>
    );
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <main className="py-8">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href="/properties" className="text-primary-600 hover:text-primary-500">
            ← Back to properties
          </Link>
        </nav>

        {/* Photo Gallery */}
        <div className="mb-8">
          <div className="aspect-[16/9] rounded-lg overflow-hidden bg-secondary-100">
            {property.photos[selectedPhoto] && (
              <img
                src={property.photos[selectedPhoto].url}
                alt={property.address}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {property.photos.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {property.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPhoto(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden ${
                    index === selectedPhoto ? 'ring-2 ring-primary-600' : ''
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-secondary-900">
                  {formatter.format(property.price)}
                </h1>
                <p className="mt-1 text-lg text-secondary-600">
                  {property.address}
                </p>
                <p className="text-secondary-500">
                  {property.city}, {property.state} {property.zip}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${
                property.status === 'Active' ? 'bg-green-100 text-green-800' :
                property.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                property.status === 'Sold' ? 'bg-red-100 text-red-800' :
                'bg-secondary-100 text-secondary-800'
              }`}>
                {property.status}
              </span>
            </div>

            {/* Key Details */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-secondary-200 p-4 text-center">
                <p className="text-2xl font-bold text-secondary-900">{property.beds}</p>
                <p className="text-sm text-secondary-500">Beds</p>
              </div>
              <div className="rounded-lg border border-secondary-200 p-4 text-center">
                <p className="text-2xl font-bold text-secondary-900">{property.baths}</p>
                <p className="text-sm text-secondary-500">Baths</p>
              </div>
              <div className="rounded-lg border border-secondary-200 p-4 text-center">
                <p className="text-2xl font-bold text-secondary-900">{property.sqft.toLocaleString()}</p>
                <p className="text-sm text-secondary-500">Sqft</p>
              </div>
              <div className="rounded-lg border border-secondary-200 p-4 text-center">
                <p className="text-2xl font-bold text-secondary-900">{property.year_built || 'N/A'}</p>
                <p className="text-sm text-secondary-500">Year Built</p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-secondary-900">Description</h2>
              <p className="mt-4 text-secondary-600 whitespace-pre-line">
                {property.description}
              </p>
            </div>
          </div>

          {/* Sidebar - Contact Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-lg border border-secondary-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-secondary-900">
                Contact {agent.name}
              </h3>
              <p className="mt-1 text-sm text-secondary-500">
                {agent.brokerage_name}
              </p>
              <form className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="Message"
                  rows={4}
                  className="w-full rounded-md border border-secondary-300 px-3 py-2 text-sm"
                  defaultValue={`I'm interested in ${property.address}`}
                />
                <button
                  type="submit"
                  className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500"
                >
                  Send Message
                </button>
              </form>
              <div className="mt-6 border-t border-secondary-200 pt-6">
                <a href={`tel:${agent.phone}`} className="block text-center text-primary-600 hover:text-primary-500">
                  Call {agent.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
