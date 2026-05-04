import Image from 'next/image';
import Link from 'next/link';
import type { Listing } from '@/lib/types';
import { formatPrice } from '@/components/shared/formatters';

type ListingTileProps = { listing: Listing };

export function ListingTile({ listing }: ListingTileProps) {
  const tag =
    listing.status === 'Coming Soon' ? 'Coming Soon'
      : listing.status === 'Pending' || listing.status === 'Active Under Contract' ? 'Under Contract'
      : null;
  const headline =
    listing.unparsedAddress
      || `${listing.streetNumber ?? ''} ${listing.streetName ?? ''}`.trim()
      || listing.community;
  return (
    <Link href={`/portfolio/${listing.slug}`} className="relative aspect-[4/5] overflow-hidden bg-ink-elevated group">
      {listing.coverPhotoUrl ? (
        <Image
          src={listing.coverPhotoUrl}
          alt={headline}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-[900ms] group-hover:scale-105"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
      {tag ? <span className="absolute top-3 left-3 caps bg-ink/70 px-2 py-1">{tag}</span> : null}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="caps mb-1">{listing.community}</div>
        <div className="font-serif text-lg leading-tight">{headline}</div>
        <div className="caps text-stone/80 mt-1">{formatPrice(listing.listPrice)}</div>
      </div>
    </Link>
  );
}
