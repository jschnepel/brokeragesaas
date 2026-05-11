import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { siteUrl } from '@/lib/seo';
import { SavedListingsClient } from './SavedListingsClient';

export const metadata: Metadata = {
  // Title gets the "· Yong Choi" suffix from app/layout.tsx's title.template,
  // so we set just the page-specific label here to avoid the double suffix.
  title: 'Saved Listings',
  description: 'Listings you have saved while browsing the Phoenix-metro market.',
  alternates: { canonical: siteUrl('/saved') },
  robots: { index: false, follow: false },
};

export default function SavedListingsPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-32 bg-ink text-stone min-h-screen">
        <SavedListingsClient />
      </main>
      <Footer />
    </>
  );
}
