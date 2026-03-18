import Link from 'next/link';
import type { ListingDetail } from '@platform/database/src/queries/listings';

interface AgentSidebarProps {
  agent: {
    name: string;
    title: string;
    photoUrl: string;
    brokerage: string;
    contact: { phone: string };
  };
  contactHref: string;
  listing: ListingDetail;
  primaryPhoto: string | null;
}

function formatNumber(n: number | null | undefined): string {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

export function AgentSidebar({ agent, contactHref, listing, primaryPhoto }: AgentSidebarProps) {
  // Build "At a Glance" stats from listing data
  const stats: { label: string; value: string }[] = [];
  if (listing.bedrooms_total != null) stats.push({ label: 'Bedrooms', value: String(listing.bedrooms_total) });
  if (listing.bathrooms_total_integer != null) stats.push({ label: 'Bathrooms', value: String(listing.bathrooms_total_integer) });
  if (listing.living_area) stats.push({ label: 'Living Area', value: `${formatNumber(listing.living_area)} SF` });
  if (listing.year_built) stats.push({ label: 'Year Built', value: String(listing.year_built) });
  if (listing.garage_spaces) stats.push({ label: 'Garage', value: `${listing.garage_spaces}-Car` });
  if (listing.stories_total) stats.push({ label: 'Stories', value: String(listing.stories_total) });

  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      {/* Gallery Image */}
      {primaryPhoto && (
        <div className="relative h-[320px] overflow-hidden bg-cream-alt">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={primaryPhoto} alt="Property" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white z-10">
            <span className="text-[9px] uppercase tracking-widest text-gold font-bold block">
              {listing.standard_status}
            </span>
            <h3 className="text-lg font-serif">{listing.property_type}</h3>
          </div>
        </div>
      )}

      {/* At a Glance — navy card matching CommunityDemographics */}
      <div className="bg-navy p-6">
        <span className="text-gold text-[9px] uppercase tracking-[0.3em] font-bold mb-5 block">
          At a Glance
        </span>
        <div className="space-y-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex justify-between items-center ${
                i < stats.length - 1 ? 'pb-3 border-b border-white/10' : ''
              }`}
            >
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{stat.label}</span>
              <span className="text-xl font-serif text-white">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="mt-5 space-y-3">
          <a
            href={`tel:${agent.contact.phone.replace(/[^+\d]/g, '')}`}
            className="w-full bg-gold text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2"
          >
            Contact {agent.name.split(' ')[0]}
          </a>
          <Link
            href={contactHref}
            className="w-full border border-white/20 text-white py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-navy transition-all flex items-center justify-center gap-2"
          >
            Schedule Showing
          </Link>
        </div>
      </div>
    </div>
  );
}
