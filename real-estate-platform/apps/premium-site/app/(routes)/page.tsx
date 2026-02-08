'use client';

import { useAgent } from '@/lib/agent-context';
import Link from 'next/link';

export default function HomePage() {
  const agent = useAgent();

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-primary-900 text-white">
        <div className="container py-24 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find Your Dream Home
            </h1>
            <p className="mt-6 text-lg leading-8 text-primary-100">
              Work with {agent.name} to find the perfect property.
              Trusted by families throughout the area.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/properties"
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-900 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Browse Properties
              </Link>
              <Link
                href="/contact"
                className="text-sm font-semibold leading-6 text-white hover:text-primary-100"
              >
                Contact Me <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-secondary-900">
                Featured Properties
              </h2>
              <p className="mt-2 text-secondary-600">
                Hand-picked listings just for you
              </p>
            </div>
            <Link
              href="/properties"
              className="text-sm font-semibold text-primary-600 hover:text-primary-500"
            >
              View all <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Property cards will be loaded here */}
            <div className="rounded-lg border border-secondary-200 p-6">
              <p className="text-secondary-500">Loading properties...</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-secondary-50 py-16 lg:py-24">
        <div className="container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-secondary-900">
                About {agent.name}
              </h2>
              <p className="mt-6 text-lg leading-8 text-secondary-600">
                With years of experience in the local real estate market,
                I&apos;m dedicated to helping you find the perfect home.
                Whether you&apos;re buying or selling, I&apos;ll guide you
                through every step of the process.
              </p>
              <div className="mt-8">
                <p className="text-sm text-secondary-500">{agent.brokerage_name}</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              {/* Agent photo placeholder */}
              <div className="h-64 w-64 rounded-full bg-secondary-200"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Contact me today to begin your real estate journey.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
