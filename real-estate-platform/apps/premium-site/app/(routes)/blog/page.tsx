import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from './data';

export const metadata: Metadata = {
  title: 'Blog | Market News & Insights',
  description:
    'Stay informed with the latest real estate market news, insights, and expert analysis for Scottsdale, Paradise Valley, and Greater Phoenix.',
};

export default function BlogPage() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <main>
      {/* Hero */}
      <section className="bg-navy text-white py-20 lg:py-28">
        <div className="mx-auto max-w-content-lg px-8 lg:px-20">
          <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
            Insights &amp; Analysis
          </span>
          <h1 className="text-4xl font-serif font-medium tracking-tight sm:text-5xl lg:text-6xl leading-tight">
            Market Intelligence
          </h1>
          <p className="mt-4 text-lg text-white/60 max-w-xl">
            Expert insights on North Scottsdale&apos;s luxury real estate
            market, community guides, and strategic advice for buyers and
            sellers.
          </p>
        </div>
      </section>

      <section className="bg-cream py-20 lg:py-28">
        <div className="mx-auto max-w-content-lg px-8 lg:px-20">
          {/* Featured Post */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group block mb-16"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="aspect-[16/10] overflow-hidden rounded-lg bg-navy/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-meta uppercase tracking-widest text-gold font-bold">
                      {featured.category}
                    </span>
                    <span className="text-navy/30">|</span>
                    <span className="text-meta text-navy/40">
                      {featured.readTime}
                    </span>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-serif text-navy group-hover:text-gold transition-colors duration-300">
                    {featured.title}
                  </h2>
                  <p className="mt-4 text-navy/60 leading-relaxed">
                    {featured.excerpt}
                  </p>
                  <time className="block mt-4 text-sm text-navy/40">
                    {formatDate(featured.date)}
                  </time>
                </div>
              </div>
            </Link>
          )}

          {/* Post Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group"
              >
                <article className="bg-white rounded-lg overflow-hidden shadow-card hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-meta uppercase tracking-widest text-gold font-bold">
                        {post.category}
                      </span>
                      <span className="text-navy/30">|</span>
                      <span className="text-meta text-navy/40">
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-lg font-serif text-navy group-hover:text-gold transition-colors duration-300 leading-snug">
                      {post.title}
                    </h3>
                    <p className="mt-3 text-sm text-navy/60 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    <time className="block mt-4 text-sm text-navy/40">
                      {formatDate(post.date)}
                    </time>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
