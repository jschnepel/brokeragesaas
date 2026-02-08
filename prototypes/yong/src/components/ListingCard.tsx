import type { SparkListing } from '../lib/sparkApi';
import { formatPrice, formatSqft, getPrimaryPhoto } from '../lib/sparkApi';

interface ListingCardProps {
  listing: SparkListing;
  variant?: 'default' | 'compact' | 'featured';
  onClick?: () => void;
}

export function ListingCard({ listing, variant = 'default', onClick }: ListingCardProps) {
  const { StandardFields: fields } = listing;
  const photoUrl = getPrimaryPhoto(listing);
  const address = fields.UnparsedFirstLineAddress || fields.UnparsedAddress ||
    `${fields.StreetNumber || ''} ${fields.StreetName || ''} ${fields.StreetSuffix || ''}`.trim();

  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3 bg-white hover:bg-[#F9F8F6] transition-colors text-left group"
      >
        <div className="w-16 h-16 bg-[#F9F8F6] flex-shrink-0 overflow-hidden">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={address}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#0C1C2E]/30">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#0C1C2E] truncate">{address}</p>
          <p className="text-xs text-[#0C1C2E]/60">{fields.City}, {fields.StateOrProvince}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold text-[#Bfa67a]">{formatPrice(fields.ListPrice)}</span>
            <span className="text-xs text-[#0C1C2E]/50">
              {fields.BedsTotal} bd · {fields.BathsFull} ba
              {fields.BuildingAreaTotal && ` · ${formatSqft(fields.BuildingAreaTotal)} sqft`}
            </span>
          </div>
        </div>
      </button>
    );
  }

  if (variant === 'featured') {
    return (
      <button
        onClick={onClick}
        className="group relative w-full overflow-hidden bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
      >
        <div className="aspect-[4/3] overflow-hidden">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={address}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-[#F9F8F6] flex items-center justify-center">
              <svg className="w-16 h-16 text-[#0C1C2E]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <p className="text-2xl font-semibold mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
            {formatPrice(fields.ListPrice)}
          </p>
          <p className="text-sm opacity-90">{address}</p>
          <p className="text-xs opacity-70">{fields.City}, {fields.StateOrProvince}</p>
          <div className="flex items-center gap-3 mt-3 text-xs opacity-80">
            <span>{fields.BedsTotal} Beds</span>
            <span className="w-1 h-1 rounded-full bg-white/50" />
            <span>{fields.BathsFull} Baths</span>
            {fields.BuildingAreaTotal && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/50" />
                <span>{formatSqft(fields.BuildingAreaTotal)} Sq Ft</span>
              </>
            )}
          </div>
        </div>
        <div className="absolute top-4 left-4">
          <span className={`px-2 py-1 text-xs font-medium ${
            fields.MlsStatus === 'Active' ? 'bg-emerald-500' :
            fields.MlsStatus === 'Pending' ? 'bg-amber-500' : 'bg-[#0C1C2E]'
          } text-white`}>
            {fields.MlsStatus}
          </span>
        </div>
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={onClick}
      className="group w-full bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
    >
      <div className="aspect-[16/10] overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-[#F9F8F6] flex items-center justify-center">
            <svg className="w-12 h-12 text-[#0C1C2E]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xl font-semibold text-[#0C1C2E]" style={{ fontFamily: 'var(--font-serif)' }}>
            {formatPrice(fields.ListPrice)}
          </p>
          <span className={`px-2 py-0.5 text-xs font-medium ${
            fields.MlsStatus === 'Active' ? 'bg-emerald-50 text-emerald-700' :
            fields.MlsStatus === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {fields.MlsStatus}
          </span>
        </div>
        <p className="text-sm text-[#0C1C2E] mb-1">{address}</p>
        <p className="text-xs text-[#0C1C2E]/60 mb-3">{fields.City}, {fields.StateOrProvince} {fields.PostalCode}</p>
        <div className="flex items-center gap-4 text-sm text-[#0C1C2E]/70">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {fields.BedsTotal} bd
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            {fields.BathsFull} ba
          </span>
          {fields.BuildingAreaTotal && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              {formatSqft(fields.BuildingAreaTotal)} sqft
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// Loading skeleton for listing cards
export function ListingCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'featured' }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 bg-white animate-pulse">
        <div className="w-16 h-16 bg-[#0C1C2E]/10 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-[#0C1C2E]/10 rounded w-3/4 mb-2" />
          <div className="h-3 bg-[#0C1C2E]/10 rounded w-1/2 mb-2" />
          <div className="h-3 bg-[#0C1C2E]/10 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="relative w-full overflow-hidden bg-white shadow-lg animate-pulse">
        <div className="aspect-[4/3] bg-[#0C1C2E]/10" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="h-7 bg-white/20 rounded w-1/3 mb-2" />
          <div className="h-4 bg-white/20 rounded w-2/3 mb-1" />
          <div className="h-3 bg-white/20 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-[#0C1C2E]/10" />
      <div className="p-4">
        <div className="h-6 bg-[#0C1C2E]/10 rounded w-1/3 mb-3" />
        <div className="h-4 bg-[#0C1C2E]/10 rounded w-3/4 mb-2" />
        <div className="h-3 bg-[#0C1C2E]/10 rounded w-1/2 mb-4" />
        <div className="flex gap-4">
          <div className="h-4 bg-[#0C1C2E]/10 rounded w-12" />
          <div className="h-4 bg-[#0C1C2E]/10 rounded w-12" />
          <div className="h-4 bg-[#0C1C2E]/10 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
