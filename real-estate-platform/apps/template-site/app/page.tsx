import Link from 'next/link';
import { headers } from 'next/headers';

async function getAgentConfig() {
  const headersList = headers();
  const agentId = headersList.get('x-agent-id') || 'demo';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/agents`, {
      headers: {
        'x-agent-id': agentId,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.agent;
  } catch (error) {
    console.error('Failed to fetch agent config:', error);
    return null;
  }
}

export default async function HomePage() {
  const agent = await getAgentConfig();

  if (!agent) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900">Site Not Configured</h1>
          <p className="mt-2 text-secondary-600">Please contact support.</p>
        </div>
      </main>
    );
  }

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
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/properties"
                className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary-900 shadow-sm hover:bg-primary-50"
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

      {/* Featured Properties */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <h2 className="text-3xl font-bold tracking-tight text-secondary-900">
            Featured Properties
          </h2>
          <p className="mt-2 text-secondary-600">
            Browse available listings
          </p>
          <div className="mt-10 text-center text-secondary-500">
            Loading properties...
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-secondary-50 py-16 lg:py-24">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-secondary-900">
              About {agent.name}
            </h2>
            <p className="mt-6 text-lg leading-8 text-secondary-600">
              {agent.bio || 'Experienced real estate professional dedicated to helping you find your perfect home.'}
            </p>
            <p className="mt-4 text-sm text-secondary-500">
              {agent.brokerage_name}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold">{agent.name}</h3>
              <p className="mt-2 text-sm text-secondary-400">{agent.brokerage_name}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Contact</h3>
              <p className="mt-2 text-sm text-secondary-400">{agent.email}</p>
              <p className="text-sm text-secondary-400">{agent.phone}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Quick Links</h3>
              <ul className="mt-2 space-y-1 text-sm text-secondary-400">
                <li><Link href="/properties" className="hover:text-white">Properties</Link></li>
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-secondary-800 pt-8 text-center text-sm text-secondary-400">
            © {new Date().getFullYear()} {agent.name}. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
