'use client';

import { useAgent } from '@/lib/agent-context';

export default function AboutPage() {
  const agent = useAgent();

  return (
    <main className="py-16">
      <div className="container">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Agent Photo */}
          <div className="flex justify-center">
            {agent.logo_url ? (
              <img
                src={agent.logo_url}
                alt={agent.name}
                className="rounded-lg object-cover w-full max-w-md"
              />
            ) : (
              <div className="h-96 w-full max-w-md rounded-lg bg-secondary-200"></div>
            )}
          </div>

          {/* Agent Info */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-secondary-900">
              About {agent.name}
            </h1>

            <p className="mt-2 text-lg text-secondary-500">
              {agent.brokerage_name}
            </p>

            <div className="mt-8 prose prose-secondary max-w-none">
              <p className="text-secondary-600 leading-relaxed">
                With extensive experience in the local real estate market,
                I am dedicated to providing exceptional service to my clients.
                Whether you&apos;re buying your first home, upgrading to your dream property,
                or selling your current residence, I will guide you through every step of the process.
              </p>

              <p className="text-secondary-600 leading-relaxed">
                My commitment to understanding your unique needs and goals ensures
                a personalized experience that leads to successful outcomes.
                I pride myself on my attention to detail, market knowledge,
                and negotiation skills that help my clients achieve their real estate objectives.
              </p>
            </div>

            {/* Contact Info */}
            <div className="mt-10 border-t border-secondary-200 pt-10">
              <h2 className="text-xl font-semibold text-secondary-900">
                Get in Touch
              </h2>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-sm text-secondary-500">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${agent.email}`}
                      className="text-primary-600 hover:text-primary-500"
                    >
                      {agent.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-secondary-500">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${agent.phone}`}
                      className="text-primary-600 hover:text-primary-500"
                    >
                      {agent.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-secondary-500">Brokerage</dt>
                  <dd className="text-secondary-900">{agent.brokerage_name}</dd>
                </div>
              </dl>
            </div>

            {/* CTA */}
            <div className="mt-10">
              <a
                href="/contact"
                className="inline-flex items-center rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
              >
                Schedule a Consultation
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
