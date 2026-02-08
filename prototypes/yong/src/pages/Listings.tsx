import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  Bath,
  Ruler,
  MapPin,
  Grid3X3,
  List,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  Home,
  ArrowUpRight,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useSparkListings } from '../hooks/useSparkListings';
import { formatPrice, formatSqft, getPrimaryPhoto } from '../lib/sparkApi';
import { createListingSlug } from './ListingDetail';

// Placeholder images for listings without photos
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600',
];

// Get a consistent placeholder image based on listing ID
const getPlaceholderImage = (listingId: string): string => {
  const hash = listingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PLACEHOLDER_IMAGES[hash % PLACEHOLDER_IMAGES.length];
};

const Listings: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('-ListPrice');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch listings from Spark API
  const { listings, loading, error, refetch } = useSparkListings({
    limit: 20,
    orderby: sortBy,
  });

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] page-zoom-90 font-sans">
      <Navigation />

      {/* Hero Header */}
      <section className="bg-[#0C1C2E] pt-32 pb-16">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-px bg-[#Bfa67a]" />
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold">
              MLS Listings
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">
            Available <span className="italic font-light">Properties</span>
          </h1>
          <p className="text-white/60 max-w-xl">
            Browse our curated selection of luxury properties from the MLS. Each listing is updated in real-time from the Spark API.
          </p>
        </div>
      </section>

      {/* Toolbar */}
      <section className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Results count */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span><strong className="text-[#0C1C2E]">{listings.length}</strong> properties found</span>
                )}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-gray-100 border-0 text-sm text-[#0C1C2E] pl-4 pr-10 py-2.5 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <option value="-ListPrice">Price: High to Low</option>
                  <option value="ListPrice">Price: Low to High</option>
                  <option value="-ModificationTimestamp">Recently Updated</option>
                  <option value="-BedsTotal">Most Bedrooms</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                  showFilters ? 'bg-[#0C1C2E] text-white' : 'bg-gray-100 text-[#0C1C2E] hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>

              {/* View toggle */}
              <div className="flex border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-colors ${
                    viewMode === 'grid' ? 'bg-[#0C1C2E] text-white' : 'bg-white text-gray-400 hover:text-[#0C1C2E]'
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-colors ${
                    viewMode === 'list' ? 'bg-[#0C1C2E] text-white' : 'bg-white text-gray-400 hover:text-[#0C1C2E]'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2">
                  Property Type
                </label>
                <select className="w-full bg-gray-100 border-0 text-sm text-[#0C1C2E] px-3 py-2">
                  <option>All Types</option>
                  <option>Residential</option>
                  <option>Condo</option>
                  <option>Land</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2">
                  Bedrooms
                </label>
                <select className="w-full bg-gray-100 border-0 text-sm text-[#0C1C2E] px-3 py-2">
                  <option>Any</option>
                  <option>1+</option>
                  <option>2+</option>
                  <option>3+</option>
                  <option>4+</option>
                  <option>5+</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2">
                  Min Price
                </label>
                <select className="w-full bg-gray-100 border-0 text-sm text-[#0C1C2E] px-3 py-2">
                  <option>No Min</option>
                  <option>$500,000</option>
                  <option>$1,000,000</option>
                  <option>$2,000,000</option>
                  <option>$5,000,000</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2">
                  Max Price
                </label>
                <select className="w-full bg-gray-100 border-0 text-sm text-[#0C1C2E] px-3 py-2">
                  <option>No Max</option>
                  <option>$1,000,000</option>
                  <option>$2,000,000</option>
                  <option>$5,000,000</option>
                  <option>$10,000,000</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Listings Grid/List */}
      <section className="py-12">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-20">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="animate-spin text-[#Bfa67a] mb-4" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                Loading MLS Listings...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => refetch()}
                className="bg-[#0C1C2E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && listings.length === 0 && (
            <div className="text-center py-20">
              <Home size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-serif text-[#0C1C2E] mb-2">No Listings Found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more results.</p>
            </div>
          )}

          {/* Grid View */}
          {!loading && !error && listings.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => {
                const photo = getPrimaryPhoto(listing);
                const address = listing.StandardFields.UnparsedFirstLineAddress ||
                                listing.StandardFields.UnparsedAddress ||
                                `${listing.StandardFields.StreetNumber || ''} ${listing.StandardFields.StreetName || ''}`.trim() ||
                                'Address Not Available';

                return (
                  <Link
                    key={listing.Id}
                    to={createListingSlug({
                      City: listing.StandardFields.City,
                      PostalCode: listing.StandardFields.PostalCode,
                      Address: address,
                      SubdivisionName: listing.StandardFields.SubdivisionName,
                    })}
                    className="group bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
                      {photo ? (
                        <img
                          src={photo}
                          alt={address}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home size={40} className="text-gray-300" />
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className={`absolute top-3 left-3 px-2 py-1 text-[9px] uppercase tracking-wider font-bold ${
                        listing.StandardFields.MlsStatus === 'Active'
                          ? 'bg-emerald-500 text-white'
                          : listing.StandardFields.MlsStatus === 'Pending'
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {listing.StandardFields.MlsStatus}
                      </div>
                      {/* Quick View Overlay */}
                      <div className="absolute inset-0 bg-[#0C1C2E]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-white text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                          View Details <ArrowUpRight size={14} />
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <p className="text-2xl font-serif text-[#0C1C2E] mb-1 group-hover:text-[#Bfa67a] transition-colors">
                        {formatPrice(listing.StandardFields.ListPrice)}
                      </p>
                      <p className="text-sm text-gray-700 mb-1 truncate">{address}</p>
                      <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                        <MapPin size={10} />
                        {listing.StandardFields.City}, {listing.StandardFields.StateOrProvince} {listing.StandardFields.PostalCode}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-gray-400 pt-4 border-t border-gray-100">
                        <span className="flex items-center gap-1.5">
                          <BedDouble size={12} className="text-[#Bfa67a]" />
                          {listing.StandardFields.BedsTotal || 0} bd
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Bath size={12} className="text-[#Bfa67a]" />
                          {listing.StandardFields.BathsFull || 0} ba
                        </span>
                        {listing.StandardFields.BuildingAreaTotal && (
                          <span className="flex items-center gap-1.5">
                            <Ruler size={12} className="text-[#Bfa67a]" />
                            {formatSqft(listing.StandardFields.BuildingAreaTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* List View */}
          {!loading && !error && listings.length > 0 && viewMode === 'list' && (
            <div className="space-y-4">
              {listings.map((listing) => {
                const photo = getPrimaryPhoto(listing);
                const address = listing.StandardFields.UnparsedFirstLineAddress ||
                                listing.StandardFields.UnparsedAddress ||
                                `${listing.StandardFields.StreetNumber || ''} ${listing.StandardFields.StreetName || ''}`.trim() ||
                                'Address Not Available';

                return (
                  <Link
                    key={listing.Id}
                    to={createListingSlug({
                      City: listing.StandardFields.City,
                      PostalCode: listing.StandardFields.PostalCode,
                      Address: address,
                      SubdivisionName: listing.StandardFields.SubdivisionName,
                    })}
                    className="group flex bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {/* Image */}
                    <div className="w-72 flex-shrink-0 overflow-hidden relative bg-gray-100">
                      {photo ? (
                        <img
                          src={photo}
                          alt={address}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home size={32} className="text-gray-300" />
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className={`absolute top-3 left-3 px-2 py-1 text-[9px] uppercase tracking-wider font-bold ${
                        listing.StandardFields.MlsStatus === 'Active'
                          ? 'bg-emerald-500 text-white'
                          : listing.StandardFields.MlsStatus === 'Pending'
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {listing.StandardFields.MlsStatus}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col justify-center">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-2xl font-serif text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors">
                            {formatPrice(listing.StandardFields.ListPrice)}
                          </p>
                          <p className="text-sm text-gray-700">{address}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin size={10} />
                            {listing.StandardFields.City}, {listing.StandardFields.StateOrProvince} {listing.StandardFields.PostalCode}
                          </p>
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.15em] text-gray-400 font-bold">
                          MLS# {listing.StandardFields.ListingId || listing.Id}
                        </span>
                      </div>

                      {listing.StandardFields.PublicRemarks && (
                        <p className="text-sm text-gray-500 line-clamp-2 my-3">
                          {listing.StandardFields.PublicRemarks}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-600 mt-auto">
                        <span className="flex items-center gap-2">
                          <BedDouble size={16} className="text-[#Bfa67a]" />
                          {listing.StandardFields.BedsTotal || 0} Beds
                        </span>
                        <span className="flex items-center gap-2">
                          <Bath size={16} className="text-[#Bfa67a]" />
                          {listing.StandardFields.BathsFull || 0} Baths
                        </span>
                        {listing.StandardFields.BuildingAreaTotal && (
                          <span className="flex items-center gap-2">
                            <Ruler size={16} className="text-[#Bfa67a]" />
                            {formatSqft(listing.StandardFields.BuildingAreaTotal)} Sq Ft
                          </span>
                        )}
                        {listing.StandardFields.YearBuilt && (
                          <span className="text-gray-400">
                            Built {listing.StandardFields.YearBuilt}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="w-16 flex items-center justify-center bg-gray-50 group-hover:bg-[#0C1C2E] transition-colors">
                      <ArrowUpRight size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Listings;
