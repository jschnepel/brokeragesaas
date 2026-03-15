import type { ListingDetail } from '@platform/database/src/queries/listings';

interface HeroGalleryProps {
  listing: ListingDetail;
  gallery: string[];
  address: string;
  area: string;
  price: string;
  quickStats: string[];
}

export function HeroGallery({
  listing,
  gallery,
  address,
  area,
  price,
  quickStats,
}: HeroGalleryProps) {
  if (gallery.length === 0) {
    return (
      <section className="relative w-full bg-navy flex items-end" style={{ height: '50vh', minHeight: '320px' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/60 to-navy/80" />
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20 pb-8 md:pb-16">
          <HeroContent listing={listing} address={address} area={area} price={price} quickStats={quickStats} />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative w-full flex items-end" style={{ height: '65vh', minHeight: '400px' }}>
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-navy/85 backdrop-blur-sm text-white px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold">
            {listing.standard_status}
          </span>
        </div>
        <div className="absolute top-4 right-4 z-20">
          <span className="text-white/50 text-[10px] uppercase tracking-widest">
            MLS# {listing.listing_id}
          </span>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="hidden md:block w-full h-full cursor-pointer" data-hero-photo>
            <img src={gallery[0]} alt={address} className="w-full h-full object-cover" />
          </div>
          <div className="md:hidden w-full h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory flex" data-hero-photo>
            {gallery.map((url, i) => (
              <div key={i} className="w-full h-full flex-shrink-0 snap-center">
                <img src={url} alt={`${address} photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/40 to-transparent" />
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20 pb-8 md:pb-16">
          <HeroContent listing={listing} address={address} area={area} price={price} quickStats={quickStats} />
        </div>
      </section>
      {gallery.length > 1 && (
        <div className="hidden md:grid grid-cols-4 gap-0.5">
          {gallery.slice(1, 4).map((url, i) => (
            <div key={i} className="relative aspect-[16/9] overflow-hidden group/thumb cursor-pointer">
              <img src={url} alt={`${address} photo ${i + 2}`} className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500" data-photo-index={i + 1} />
            </div>
          ))}
          <div className="relative aspect-[16/9] overflow-hidden cursor-pointer">
            {gallery.length > 4 ? (
              <>
                <img src={gallery[4]} alt={`${address} photo 5`} className="w-full h-full object-cover" data-photo-index={4} />
                <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">+{gallery.length - 4} Photos</span>
                </div>
              </>
            ) : gallery[4] ? (
              <img src={gallery[4]} alt={`${address} photo 5`} className="w-full h-full object-cover" data-photo-index={4} />
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

function HeroContent({ listing, address, area, price, quickStats }: { listing: ListingDetail; address: string; area: string; price: string; quickStats: string[] }) {
  return (
    <div>
      <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-gold">{area}</span>
      <h1 className="text-3xl md:text-4xl lg:text-6xl font-serif text-white leading-[0.9] tracking-tight mt-2">{address}</h1>
      <p className="text-white/70 text-sm mt-2">
        {listing.city}{listing.state_or_province ? `, ${listing.state_or_province}` : ''}{listing.postal_code ? ` ${listing.postal_code}` : ''}
      </p>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mt-4">
        <span className="text-2xl md:text-3xl font-serif text-white">{price}</span>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {quickStats.map((stat) => (<span key={stat} className="text-sm text-white/60">{stat}</span>))}
        </div>
      </div>
    </div>
  );
}
