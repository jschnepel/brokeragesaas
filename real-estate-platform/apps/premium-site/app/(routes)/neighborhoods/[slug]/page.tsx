'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function NeighborhoodPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <main className="py-16">
      <div className="container">
        <nav className="mb-6">
          <Link href="/" className="text-primary-600 hover:text-primary-500">
            ← Back to home
          </Link>
        </nav>

        <h1 className="text-4xl font-bold tracking-tight text-secondary-900 capitalize">
          {slug.replace(/-/g, ' ')}
        </h1>

        <p className="mt-4 text-secondary-600">
          Neighborhood information and listings coming soon.
        </p>

        <div className="mt-10">
          <Link
            href="/properties"
            className="inline-flex items-center rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
          >
            View All Properties
          </Link>
        </div>
      </div>
    </main>
  );
}
