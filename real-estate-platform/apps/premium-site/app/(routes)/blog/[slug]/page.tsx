import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlug } from '../data';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.image }],
    },
  };
}

function renderInlineText(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="text-navy">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function renderBlock(block: string, i: number): React.ReactNode {
  if (block.startsWith('## ')) {
    return (
      <h2 key={i} className="text-2xl font-serif text-navy mt-12 mb-4">
        {block.replace('## ', '')}
      </h2>
    );
  }
  if (block.startsWith('- ')) {
    const items = block.split('\n').filter(Boolean);
    return (
      <ul key={i} className="space-y-2 my-4">
        {items.map((item, j) => (
          <li key={j} className="text-navy/70">
            {renderInlineText(item.replace(/^- /, ''))}
          </li>
        ))}
      </ul>
    );
  }
  if (/^\d+\. /.test(block)) {
    const items = block.split('\n').filter(Boolean);
    return (
      <ol key={i} className="space-y-2 my-4 list-decimal pl-5">
        {items.map((item, j) => (
          <li key={j} className="text-navy/70">
            {renderInlineText(item.replace(/^\d+\. /, ''))}
          </li>
        ))}
      </ol>
    );
  }
  return (
    <p key={i} className="mb-4">
      {renderInlineText(block)}
    </p>
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const blocks = post.content.split('\n\n');

  return (
    <main>
      {/* Hero */}
      <section className="bg-navy text-white py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-8 lg:px-20">
          <Link
            href="/blog"
            className="text-sm text-white/40 hover:text-gold transition-colors duration-300 mb-6 inline-block"
          >
            &larr; All Insights
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-meta uppercase tracking-widest text-gold font-bold">
              {post.category}
            </span>
            <span className="text-white/30">|</span>
            <span className="text-meta text-white/40">{post.readTime}</span>
          </div>
          <h1 className="text-3xl font-serif font-medium tracking-tight sm:text-4xl lg:text-5xl leading-tight">
            {post.title}
          </h1>
          <time className="block mt-6 text-sm text-white/40">
            {formatDate(post.date)}
          </time>
        </div>
      </section>

      {/* Featured Image */}
      <section className="bg-cream">
        <div className="mx-auto max-w-4xl px-8 lg:px-20 -mt-4">
          <div className="aspect-[2/1] overflow-hidden rounded-lg shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-cream py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-8 lg:px-20">
          <article className="prose prose-lg max-w-none text-navy/80 leading-relaxed">
            {blocks.map((block, i) => renderBlock(block, i))}
          </article>

          {/* Author / CTA */}
          <div className="mt-16 pt-10 border-t border-navy/10">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-navy/5 flex-shrink-0 flex items-center justify-center">
                <span className="text-meta text-navy/30 font-bold">YC</span>
              </div>
              <div>
                <p className="font-serif text-lg text-navy">Yong Choi</p>
                <p className="text-sm text-navy/50 mt-1">
                  Global Real Estate Advisor at Russ Lyon Sotheby&apos;s
                  International Realty
                </p>
                <div className="flex gap-4 mt-4">
                  <Link
                    href="/contact"
                    className="text-sm text-gold hover:text-navy transition-colors duration-300 font-semibold"
                  >
                    Contact Yong &rarr;
                  </Link>
                  <a
                    href="tel:+19093765494"
                    className="text-sm text-navy/50 hover:text-gold transition-colors duration-300"
                  >
                    (909) 376-5494
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="mt-10">
            <Link
              href="/blog"
              className="text-sm text-navy/50 hover:text-gold transition-colors duration-300"
            >
              &larr; Back to All Insights
            </Link>
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
