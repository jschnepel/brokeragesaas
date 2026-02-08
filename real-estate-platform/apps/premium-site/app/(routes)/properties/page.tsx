'use client';

import { useState, useEffect } from 'react';
import { getProperties } from '@/lib/api-client';
import type { StandardProperty, PropertyFilters } from '@platform/shared';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<StandardProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PropertyFilters>({
    limit: 24,
    offset: 0,
  });

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      setError(null);

      const response = await getProperties(filters);

      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        setProperties(response.data.properties);
      }

      setLoading(false);
    }

    loadProperties();
  }, [filters]);

  return (
    <main className="py-16">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-secondary-900">
            Properties
          </h1>
          <p className="mt-2 text-secondary-600">
            Browse all available listings
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4 rounded-lg border border-secondary-200 bg-white p-4">
          <select
            className="rounded-md border border-secondary-300 px-3 py-2 text-sm"
            onChange={(e) => setFilters({ ...filters, beds: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Beds</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>

          <select
            className="rounded-md border border-secondary-300 px-3 py-2 text-sm"
            onChange={(e) => setFilters({ ...filters, baths: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Baths</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>

          <select
            className="rounded-md border border-secondary-300 px-3 py-2 text-sm"
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Min Price</option>
            <option value="100000">$100k</option>
            <option value="200000">$200k</option>
            <option value="300000">$300k</option>
            <option value="400000">$400k</option>
            <option value="500000">$500k</option>
            <option value="750000">$750k</option>
            <option value="1000000">$1M</option>
          </select>

          <select
            className="rounded-md border border-secondary-300 px-3 py-2 text-sm"
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Max Price</option>
            <option value="200000">$200k</option>
            <option value="300000">$300k</option>
            <option value="400000">$400k</option>
            <option value="500000">$500k</option>
            <option value="750000">$750k</option>
            <option value="1000000">$1M</option>
            <option value="2000000">$2M</option>
          </select>

          <select
            className="rounded-md border border-secondary-300 px-3 py-2 text-sm"
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
          >
            <option value="">Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Sold">Sold</option>
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Properties Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.external_id} property={property} />
            ))}

            {properties.length === 0 && (
              <div className="col-span-full py-12 text-center text-secondary-500">
                No properties found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function PropertyCard({ property }: { property: StandardProperty }) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <a
      href={`/properties/${property.external_id}`}
      className="group block rounded-lg border border-secondary-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="aspect-[4/3] bg-secondary-100">
        {property.photos[0] && (
          <img
            src={property.photos[0].url}
            alt={property.address}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xl font-bold text-secondary-900">
          {formatter.format(property.price)}
        </p>
        <p className="mt-1 text-sm text-secondary-500">
          {property.beds} beds • {property.baths} baths • {property.sqft.toLocaleString()} sqft
        </p>
        <p className="mt-2 text-sm text-secondary-700 truncate">
          {property.address}
        </p>
        <p className="text-sm text-secondary-500">
          {property.city}, {property.state} {property.zip}
        </p>
        <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${
          property.status === 'Active' ? 'bg-green-100 text-green-800' :
          property.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          property.status === 'Sold' ? 'bg-red-100 text-red-800' :
          'bg-secondary-100 text-secondary-800'
        }`}>
          {property.status}
        </span>
      </div>
    </a>
  );
}
