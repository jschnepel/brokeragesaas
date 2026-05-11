import type { Metadata } from 'next';
import { Navigation } from '@/components/chrome/Navigation';
import { Footer } from '@/components/chrome/Footer';
import { siteUrl } from '@/lib/seo';
import { SavedListingsClient } from './SavedListingsClient';

export const metadata: Metadata = {
  title: 'Saved Listings · Yong Choi',
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
