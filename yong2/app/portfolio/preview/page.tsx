/**
 * MOCK PREVIEW — DELETE WHEN DATA + NARRATIVE WORKFLOWS LAND
 *
 * Server entry — exposes metadata (noindex/nofollow) and delegates
 * the body to PreviewListingClient. The client wrapper exists
 * because the body uses localStorage-backed hooks (saved listings).
 *
 * Cleanup checklist in MEMORY.md → project_yong2_mock_listing_cleanup.md.
 */
import type { Metadata } from 'next';
import { MOCK_NARRATIVE } from '@/lib/listing-narrative';
import { PreviewListingClient } from './PreviewListingClient';

export const metadata: Metadata = {
  title: 'Preview · Listing Detail',
  description: MOCK_NARRATIVE.summary,
  robots: { index: false, follow: false },
};

export default function PreviewListingPage() {
  return <PreviewListingClient />;
}
