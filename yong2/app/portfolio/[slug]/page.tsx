/**
 * Portfolio detail — placeholder.
 *
 * /portfolio is hand-curated and currently empty (see app/portfolio/
 * page.tsx). Until Yong populates a portfolio entry, every slug
 * resolves to 404. The full live ARMLS feed is at /listings (Home
 * Search), Spark-backed.
 *
 * The listing-detail components (ListingHeroGallery, TheRead, etc.)
 * remain in components/portfolio/ for reuse when curated entries
 * land — see /portfolio/preview for the working demo of that layout.
 */
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PortfolioListingPage(): never {
  notFound();
}
