import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Maximize,
  TrendingUp,
  Share2,
  Heart,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  LocateFixed,
  Plane,
  Hospital,
  Mountain,
  CheckCircle2,
  BarChart2,
  Activity,
  Droplets,
  Layers,
  Zap,
  Info,
  ChefHat,
  CircleDot,
  PlusSquare,
  X,
  Play,
  BedDouble,
  Bath,
  Car,
  Ruler,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Home,
  Maximize2,
  Grid3X3,
  Eye,
  Loader2,
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useScrollAnimation } from '../components/shared/useScrollAnimation';
import { useSparkListing, useSparkListings } from '../hooks/useSparkListings';
import { formatPrice, formatSqft, getPrimaryPhoto, getAllPhotos } from '../lib/sparkApi';

// --- Listing Data ---
interface DetailedHomeSpecs {
  ListingId: string;
  ListPrice: string;
  MlsStatus: string;
  PublicRemarks: string;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  LivingArea: number;
  LotSizeAcres: string;
  YearBuilt: number | string;
  GarageSpaces: number;
  ConstructionMaterials: string[];
  Roof: string[];
  Flooring: string[];
  InteriorFeatures: string[];
  Appliances: string[];
  FireplaceFeatures: string[];
  Heating: string[];
  Cooling: string[];
  PoolFeatures: string[];
  SpaFeatures: string[];
  View: string[];
  ParkingFeatures: string[];
  Sewer: string[];
  WaterSource: string[];
  Utilities: string[];
  SubdivisionName: string;
  City: string;
  PostalCode: string;
  ParcelNumber: string;
  TaxAnnualAmount: string;
  AssociationFee: string;
  Zoning: string;
  Latitude: string;
  Longitude: string;
  // API-specific fields
  Address?: string;
  StateOrProvince?: string;
  PropertyType?: string;
  PropertySubType?: string;
}

const LISTING_DATA: DetailedHomeSpecs = {
  ListingId: "6724911",
  ListPrice: "$6,850,000",
  MlsStatus: "Active",
  PublicRemarks: "A Masterpiece of Cantilevered Modernism suspended above the Sonoran Desert floor. Located in the world-renowned Saguaro Forest enclave of Desert Mountain, this residence is a dialogue between raw earth and architectural precision. Every sightline has been choreographed to frame the McDowell Mountains, while floor-to-ceiling glass walls dissolve the boundary between interior luxury and the ancient desert landscape.",
  BedroomsTotal: 5,
  BathroomsTotalInteger: 6.5,
  LivingArea: 7240,
  LotSizeAcres: "1.42",
  YearBuilt: 2023,
  GarageSpaces: 4,
  ConstructionMaterials: ["Steel Frame", "Masonry", "Stone Veneer"],
  Roof: ["Hand-crimped Copper", "Flat Concrete Tile"],
  Flooring: ["Honed Limestone", "European White Oak", "Polished Concrete"],
  InteriorFeatures: ["Savant Smart Home", "Walk-in Humidor", "Glass Elevator", "800-Bottle Cellar", "Negative Edge Fireplace"],
  Appliances: ["Sub-Zero Dual Column", "Wolf 60\" Range", "Miele Built-in Coffee", "La Cornue Rotisserie"],
  FireplaceFeatures: ["Gas Lighter", "Linear Glass", "Master Terrace Pit"],
  Heating: ["Multi-Zone High Efficiency", "Radiant Floor Primary BA"],
  Cooling: ["Zoned Refrigeration", "Energy Recovery Ventilation"],
  PoolFeatures: ["Negative Edge", "Saltwater Chlorine", "Black Basalt Tile"],
  SpaFeatures: ["Infinity Edge Hot Tub", "Steam Room Access"],
  View: ["McDowell Mountains", "City Lights", "Pinnacle Peak"],
  ParkingFeatures: ["Overheight 4-Car", "Climate Controlled", "EV Level 2 Hookup"],
  Sewer: ["Public Sewer"],
  WaterSource: ["City Water"],
  Utilities: ["Underground Electric", "Optic Fiber 1Gbps"],
  SubdivisionName: "Desert Mountain - Saguaro Forest",
  City: "Scottsdale",
  PostalCode: "85262",
  ParcelNumber: "216-77-042A",
  TaxAnnualAmount: "$18,450",
  AssociationFee: "$1,250",
  Zoning: "R1-43",
  Latitude: "33.8340° N",
  Longitude: "111.8322° W"
};

// Gallery images - all working Unsplash URLs
const GALLERY_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1600",
    caption: "Primary Exterior",
    category: "exterior"
  },
  {
    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1600",
    caption: "Great Room & Horizon",
    category: "interior"
  },
  {
    url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1600",
    caption: "Gourmet Kitchen",
    category: "interior"
  },
  {
    url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600",
    caption: "Primary Suite",
    category: "interior"
  },
  {
    url: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&q=80&w=1600",
    caption: "Infinity Pool",
    category: "exterior"
  },
  {
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600",
    caption: "Evening Terrace",
    category: "exterior"
  },
  {
    url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1600",
    caption: "Spa Bathroom",
    category: "interior"
  },
  {
    url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=1600",
    caption: "Wine Cellar",
    category: "interior"
  },
];

// Similar properties
const SIMILAR_PROPERTIES = [
  {
    id: 1,
    address: "9821 E Desert Cove Ave",
    price: "$5,450,000",
    beds: 4,
    baths: 5,
    sqft: 5800,
    image: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 2,
    address: "10040 E Happy Valley Rd",
    price: "$7,200,000",
    beds: 5,
    baths: 6,
    sqft: 7500,
    image: "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 3,
    address: "41870 N 102nd Way",
    price: "$5,975,000",
    beds: 5,
    baths: 5.5,
    sqft: 6200,
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 4,
    address: "38750 N 104th Place",
    price: "$6,125,000",
    beds: 4,
    baths: 5.5,
    sqft: 6850,
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=600"
  },
];

// Helper to create SEO-friendly URL slug
export const createListingSlug = (listing: {
  City?: string;
  PostalCode?: string;
  Address?: string;
  SubdivisionName?: string;
}): string => {
  const city = (listing.City || 'arizona').toLowerCase().replace(/\s+/g, '-');
  const zip = listing.PostalCode || '00000';
  const address = (listing.Address || 'property')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  if (listing.SubdivisionName) {
    const community = listing.SubdivisionName.toLowerCase().replace(/\s+/g, '-').substring(0, 30);
    return `/listings/${city}/${zip}/${community}/${address}`;
  }
  return `/listings/${city}/${zip}/${address}`;
};

const ListingDetail: React.FC = () => {
  const { id, city, zipcode, address, community } = useParams<{
    id?: string;
    city?: string;
    zipcode?: string;
    address?: string;
    community?: string;
  }>();
  const [isStaged, setIsStaged] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'interior' | 'exterior'>('all');
  const [matchedListing, setMatchedListing] = useState<typeof sparkListing>(null);

  // Fetch listing from Spark API - by ID or search by address
  const { listing: sparkListing, loading: listingLoading, error: listingError } = useSparkListing(id);

  // If using SEO URL, fetch all listings and find match
  const { listings: allListings, loading: allLoading } = useSparkListings({
    limit: 50,
    autoFetch: !id && !!address
  });

  // Find listing by URL params if not using ID
  useEffect(() => {
    if (!id && address && allListings.length > 0) {
      const addressSlug = address.toLowerCase();
      const found = allListings.find(l => {
        const listingAddress = (l.StandardFields.UnparsedFirstLineAddress || l.StandardFields.UnparsedAddress || '')
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
        const listingCity = (l.StandardFields.City || '').toLowerCase().replace(/\s+/g, '-');
        const listingZip = l.StandardFields.PostalCode || '';

        return listingAddress.includes(addressSlug) || addressSlug.includes(listingAddress.substring(0, 20));
      });
      if (found) {
        setMatchedListing(found);
      }
    }
  }, [id, address, city, zipcode, allListings]);

  // Use matched listing or spark listing
  const activeListing = id ? sparkListing : matchedListing;
  const isLoading = id ? listingLoading : allLoading;

  // Fetch similar listings
  const { listings: similarListings, loading: similarLoading } = useSparkListings({ limit: 4 });

  // Get photos from API or use fallbacks
  const apiPhotos = activeListing ? getAllPhotos(activeListing) : [];
  const galleryImages = apiPhotos.length > 0
    ? apiPhotos.map((url, i) => ({ url, caption: `Photo ${i + 1}`, category: i % 2 === 0 ? 'interior' : 'exterior' as const }))
    : GALLERY_IMAGES;

  // Map API data to display format
  const listingData = activeListing ? {
    ListingId: activeListing.StandardFields.ListingId || activeListing.Id,
    ListPrice: formatPrice(activeListing.StandardFields.ListPrice),
    MlsStatus: activeListing.StandardFields.MlsStatus || 'Active',
    PublicRemarks: activeListing.StandardFields.PublicRemarks || LISTING_DATA.PublicRemarks,
    BedroomsTotal: activeListing.StandardFields.BedsTotal || 0,
    BathroomsTotalInteger: activeListing.StandardFields.BathsTotal || activeListing.StandardFields.BathsFull || 0,
    LivingArea: activeListing.StandardFields.BuildingAreaTotal || 0,
    LotSizeAcres: activeListing.StandardFields.LotSizeArea ? `${(activeListing.StandardFields.LotSizeArea / 43560).toFixed(2)}` : LISTING_DATA.LotSizeAcres,
    YearBuilt: activeListing.StandardFields.YearBuilt || 0,
    GarageSpaces: LISTING_DATA.GarageSpaces,
    City: activeListing.StandardFields.City || '',
    PostalCode: activeListing.StandardFields.PostalCode || '',
    Address: activeListing.StandardFields.UnparsedFirstLineAddress || activeListing.StandardFields.UnparsedAddress || '',
    StateOrProvince: activeListing.StandardFields.StateOrProvince || 'AZ',
    Latitude: activeListing.StandardFields.Latitude?.toFixed(4) || LISTING_DATA.Latitude,
    Longitude: activeListing.StandardFields.Longitude?.toFixed(4) || LISTING_DATA.Longitude,
    PropertyType: activeListing.StandardFields.PropertyType || '',
    PropertySubType: activeListing.StandardFields.PropertySubType || '',
  } : LISTING_DATA;

  // Scroll tracking for parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter images by category
  const filteredImages = activeTab === 'all'
    ? galleryImages
    : galleryImages.filter(img => img.category === activeTab);

  // Navigation functions
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  // Animation refs
  const editorialAnim = useScrollAnimation();
  const featuresAnim = useScrollAnimation();
  const proximityAnim = useScrollAnimation();
  const agentAnim = useScrollAnimation();
  const similarAnim = useScrollAnimation();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#Bfa67a] mx-auto mb-4" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Loading Property Details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if ((listingError && !activeListing) || (!isLoading && !activeListing && (id || address))) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-[#0C1C2E] mb-4">Property Not Found</h1>
          <p className="text-gray-500 mb-8">The property you're looking for doesn't exist or is no longer available.</p>
          <Link
            to="/listings"
            className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#Bfa67a] transition-all"
          >
            Browse All Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] page-zoom-90 font-sans selection:bg-[#0C1C2E] selection:text-white antialiased">

      {/* Navigation */}
      <Navigation variant="transparent" />


      <main>

        {/* Hero: Cinematic Scale with Parallax */}
        <section className="relative h-[85vh] min-h-[600px] w-full bg-black overflow-hidden">
          <div
            className="absolute inset-0 w-full h-[110%]"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          >
            <img
              src={galleryImages[0]?.url || GALLERY_IMAGES[0].url}
              className="w-full h-full object-cover"
              alt="Main Visual"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

          {/* Gallery controls overlay */}
          <div className="absolute top-1/2 -translate-y-1/2 left-6 z-20">
            <button
              onClick={() => { setCurrentImageIndex(0); setIsLightboxOpen(true); }}
              className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white hover:text-[#0C1C2E] transition-all group"
            >
              <Grid3X3 size={20} />
            </button>
          </div>

          {/* Virtual Tour Button */}
          <button
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 group"
          >
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl">
                <Play size={24} className="text-[#0C1C2E] ml-1" fill="#0C1C2E" />
              </div>
            </div>
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap bg-black/50 backdrop-blur-sm px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Virtual Tour
            </span>
          </button>

          {/* Listing Actions - Top Right */}
          <div className="absolute top-24 right-6 z-20 flex items-center gap-3">
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-bold text-[#Bfa67a] bg-black/50 backdrop-blur-sm px-4 py-2 text-white">
              <CircleDot size={10} className="animate-pulse text-[#Bfa67a]"/>
              <span className="text-white/80">MLS #{listingData.ListingId}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 text-white">
              <Eye size={14} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">{galleryImages.length} Photos</span>
            </div>
            <button className="p-2.5 bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/70 transition-all">
              <Share2 size={18}/>
            </button>
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2.5 transition-all ${isLiked ? 'text-rose-500 bg-rose-500/20 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm text-white/70 hover:text-rose-400'}`}
            >
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'}/>
            </button>
          </div>

          {/* Hero Content - Bottom Aligned */}
          <div className="absolute bottom-32 left-12 max-w-4xl text-left z-10">
            <span
              className="text-[#Bfa67a] text-xs font-black uppercase tracking-[0.6em] mb-6 block animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: '0.5s', animationDuration: '1.2s', animationFillMode: 'both' }}
            >
              Exclusive Offering
            </span>
            <h1
              className="text-5xl lg:text-7xl font-serif text-white leading-[0.85] tracking-tight mb-6 drop-shadow-2xl animate-in fade-in slide-in-from-bottom-8"
              style={{ animationDelay: '0.8s', animationDuration: '1.5s', animationFillMode: 'both' }}
            >
               {listingData.Address ? (
                 <>
                   {listingData.Address.split(' ').slice(0, 2).join(' ')} <br/>
                   <span className="italic font-light opacity-60">{listingData.Address.split(' ').slice(2).join(' ')}</span>
                 </>
               ) : (
                 <>N. Saguaro <br/> <span className="italic font-light opacity-60">Forest Drive</span></>
               )}
            </h1>
            <div
              className="flex gap-8 text-[10px] uppercase tracking-[0.4em] font-black text-white/60 pl-2 mb-8 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: '1.4s', animationDuration: '1.2s', animationFillMode: 'both' }}
            >
               <span className="flex items-center gap-2"><Maximize size={12}/> {listingData.LivingArea.toLocaleString()} SQ FT</span>
               <span className="flex items-center gap-2"><MapPin size={12}/> {listingData.City}, {listingData.StateOrProvince} {listingData.PostalCode}</span>
            </div>

            {/* CTA Buttons */}
            <div
              className="hidden lg:flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: '1.8s', animationDuration: '1.2s', animationFillMode: 'both' }}
            >
              <button className="bg-[#Bfa67a] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 group shadow-xl">
                Schedule Private Tour
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
              </button>
              <button className="bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 shadow-xl">
                <Mail size={14} />
                Request Details
              </button>
            </div>
          </div>
        </section>

        {/* KPI Cards - Overlapping Hero */}
        <div className="relative z-20 max-w-[1700px] mx-auto px-12 -mt-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: <BedDouble size={18} />, label: 'Bedrooms', value: listingData.BedroomsTotal },
              { icon: <Bath size={18} />, label: 'Bathrooms', value: listingData.BathroomsTotalInteger },
              { icon: <Ruler size={18} />, label: 'Square Feet', value: listingData.LivingArea.toLocaleString() },
              { icon: <Car size={18} />, label: 'Garage', value: listingData.GarageSpaces },
              { icon: <Calendar size={18} />, label: 'Year Built', value: listingData.YearBuilt || 'N/A' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white shadow-lg shadow-black/5 p-6 border-t-2 border-[#Bfa67a]"
              >
                <div className="flex items-center gap-2 text-[#Bfa67a] mb-2">
                  {stat.icon}
                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400">{stat.label}</span>
                </div>
                <span className="text-2xl font-serif text-[#0C1C2E]">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Info Strip */}
        <section className="bg-white border-b border-gray-100 pt-8">
          <div className="max-w-[1700px] mx-auto px-12 py-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12 text-left">
             <div className="flex-1">
                <span className="text-gray-400 text-[9px] uppercase tracking-[0.5em] font-black block mb-3">Capital Valuation</span>
                <p className="text-5xl lg:text-6xl font-serif text-[#0C1C2E] leading-none mb-3">{listingData.ListPrice}</p>
                <div className="flex items-center gap-4 text-emerald-600 text-[11px] uppercase tracking-widest font-black">
                   <TrendingUp size={16}/> +12.4% Sub-Market Absorption Gain
                </div>
             </div>

             <div className="flex flex-col items-end gap-4 w-full lg:w-auto">
                <button
                  onClick={() => setIsStaged(!isStaged)}
                  className="w-full lg:w-72 py-5 px-8 text-[10px] uppercase font-black tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-lg"
                  style={{
                    backgroundColor: isStaged ? '#3B82F6' : '#0C1C2E',
                    color: 'white',
                    border: `2px solid ${isStaged ? '#3B82F6' : '#0C1C2E'}`
                  }}
                >
                  {isStaged ? <CheckCircle2 size={16}/> : <BarChart2 size={16}/>}
                  {isStaged ? 'Staged for Analysis' : 'Add to Comparison'}
                </button>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Benchmarking Against {listingData.City} Market</p>
             </div>
          </div>
        </section>

        {/* Interactive Image Gallery */}
        <section className="bg-white py-16">
          <div className="max-w-[1700px] mx-auto px-12">
            {/* Gallery Filter Tabs */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-2">
                {(['all', 'interior', 'exterior'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-all
                      ${activeTab === tab
                        ? 'bg-[#0C1C2E] text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }
                    `}
                  >
                    {tab === 'all' ? 'All Photos' : tab}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setCurrentImageIndex(0); setIsLightboxOpen(true); }}
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors"
              >
                <Maximize2 size={16} />
                View Fullscreen
              </button>
            </div>

            {/* Main Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Large featured image */}
              <div
                className="md:col-span-8 relative aspect-[16/10] overflow-hidden group cursor-pointer"
                onClick={() => { setCurrentImageIndex(0); setIsLightboxOpen(true); }}
              >
                <img
                  src={filteredImages[0]?.url || GALLERY_IMAGES[0].url}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={filteredImages[0]?.caption || 'Property'}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] uppercase font-black tracking-widest block mb-1">Perspective 01</span>
                  <h3 className="text-2xl font-serif">{filteredImages[0]?.caption || 'Primary View'}</h3>
                </div>
              </div>

              {/* Side images */}
              <div className="md:col-span-4 grid grid-rows-2 gap-4">
                {filteredImages.slice(1, 3).map((image, index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden group cursor-pointer"
                    onClick={() => { setCurrentImageIndex(index + 1); setIsLightboxOpen(true); }}
                  >
                    <img
                      src={image.url}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={image.caption}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-serif">{image.caption}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thumbnail strip */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => { setCurrentImageIndex(index); setIsLightboxOpen(true); }}
                  className={`
                    flex-shrink-0 w-24 h-16 overflow-hidden transition-all
                    ${currentImageIndex === index ? 'ring-2 ring-[#Bfa67a]' : 'opacity-60 hover:opacity-100'}
                  `}
                >
                  <img src={image.url} className="w-full h-full object-cover" alt={image.caption} />
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="text-[11px] uppercase tracking-[0.4em] font-black text-[#0C1C2E] border-b-2 border-[#Bfa67a] pb-2 hover:text-[#Bfa67a] transition-all flex items-center gap-3"
              >
                <Grid3X3 size={16} />
                Expand Architectural Folio ({galleryImages.length})
              </button>
            </div>
          </div>
        </section>

        {/* BENTO BOX - Property Details Grid */}
        <section ref={editorialAnim.ref} className="max-w-[1700px] mx-auto px-12 py-16">
          <div className="grid grid-cols-12 gap-4">

            {/* THE NARRATIVE - Main Editorial (Full Width) */}
            <div
              className={`
                col-span-12 bg-white shadow-lg shadow-black/5 p-8 lg:p-12
                transition-all duration-1000
                ${editorialAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
              `}
            >
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8">
                  <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.4em] font-bold block mb-6">The Narrative</span>
                  <p className="text-2xl lg:text-4xl font-serif leading-[1.15] text-[#0C1C2E] mb-8 max-w-3xl">
                    A dialogue between <span className="italic text-gray-400 font-light underline decoration-[#Bfa67a] decoration-2 underline-offset-8">raw sonoran earth</span> and modernist geometric precision.
                  </p>
                  <div className="columns-1 md:columns-2 gap-10 text-gray-500 font-light leading-relaxed text-sm">
                    <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-[#0C1C2E] first-letter:mr-3 first-letter:float-left mb-4">
                      {listingData.PublicRemarks}
                    </p>
                    <p>
                      The residence unfolds across a single level, with soaring 14-foot ceilings that amplify the sense of space and light. A cantilevered steel frame allows vast expanses of glass to frame panoramic views of the McDowell Mountains without interruption. Every material was selected for both its aesthetic purity and its ability to age gracefully in the Sonoran environment.
                    </p>
                    <p>
                      The primary suite occupies its own wing, featuring a private terrace with mountain views, a spa-inspired bathroom with heated limestone floors, and a custom closet system designed by a Beverly Hills atelier. The gourmet kitchen showcases a 60-inch Wolf range, Sub-Zero refrigeration, and an adjacent butler's pantry that rivals many restaurant prep areas.
                    </p>
                  </div>
                </div>
                <div className="col-span-12 lg:col-span-4 flex flex-col justify-center">
                  <div className="bg-[#F9F8F6] p-6 border-l-4 border-[#Bfa67a]">
                    <span className="text-[8px] uppercase font-bold text-gray-400 tracking-[0.2em] block mb-4">Signature Features</span>
                    <ul className="space-y-3">
                      {LISTING_DATA.InteriorFeatures.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-[#0C1C2E]">
                          <CheckCircle2 size={14} className="text-[#Bfa67a] flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOOR PLAN SECTION */}
            <div className="col-span-12 lg:col-span-8 bg-white shadow-lg shadow-black/5 overflow-hidden">
              <div className="grid grid-cols-12">
                <div className="col-span-12 lg:col-span-5 p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <Home size={16} className="text-[#Bfa67a]" />
                    <span className="text-[9px] uppercase tracking-[0.3em] text-[#Bfa67a] font-bold">Floor Plan</span>
                  </div>
                  <h3 className="text-2xl font-serif text-[#0C1C2E] mb-4">Single-Level Living</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    The floor plan maximizes the {listingData.LivingArea.toLocaleString()} square feet through thoughtful zoning: a public entertaining wing, a private family wing, and a guest casita with independent access.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-[#F9F8F6] p-4">
                      <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-1">Main Level</span>
                      <span className="text-lg font-serif text-[#0C1C2E]">6,100</span>
                      <span className="text-xs text-gray-400 ml-1">sq ft</span>
                    </div>
                    <div className="bg-[#F9F8F6] p-4">
                      <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-1">Guest Casita</span>
                      <span className="text-lg font-serif text-[#0C1C2E]">1,140</span>
                      <span className="text-xs text-gray-400 ml-1">sq ft</span>
                    </div>
                    <div className="bg-[#F9F8F6] p-4">
                      <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-1">Lot Size</span>
                      <span className="text-lg font-serif text-[#0C1C2E]">{LISTING_DATA.LotSizeAcres}</span>
                      <span className="text-xs text-gray-400 ml-1">acres</span>
                    </div>
                    <div className="bg-[#F9F8F6] p-4">
                      <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-1">Ceiling Height</span>
                      <span className="text-lg font-serif text-[#0C1C2E]">14</span>
                      <span className="text-xs text-gray-400 ml-1">feet</span>
                    </div>
                  </div>
                  <button className="mt-6 text-[10px] uppercase tracking-[0.2em] font-bold text-[#Bfa67a] flex items-center gap-2 hover:text-[#0C1C2E] transition-colors">
                    Download Floor Plan PDF <ArrowRight size={14} />
                  </button>
                </div>
                <div className="col-span-12 lg:col-span-7 h-80 lg:h-auto relative bg-[#0C1C2E]">
                  {/* Floor plan placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white/40">
                      <Grid3X3 size={48} className="mx-auto mb-4 text-[#Bfa67a]/40" />
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Interactive Floor Plan</p>
                      <p className="text-[9px] mt-2">Click rooms for details</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* INSTITUTIONAL LEDGER */}
            <div className="col-span-12 lg:col-span-4 bg-[#0C1C2E] text-white p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#Bfa67a]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold">Institutional Ledger</h3>
                <BarChart3 size={16} className="text-[#Bfa67a]"/>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  { label: "MLS ID", val: listingData.ListingId },
                  { label: "Property Type", val: listingData.PropertyType || 'Residential' },
                  { label: "Sub Type", val: listingData.PropertySubType || 'Single Family' },
                  { label: "Lot Size", val: `${listingData.LotSizeAcres} AC` },
                  { label: "Living Area", val: `${listingData.LivingArea.toLocaleString()} FT²` },
                  { label: "Year Built", val: listingData.YearBuilt || 'N/A' },
                  { label: "Status", val: listingData.MlsStatus }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-end border-b border-white/5 pb-2 group hover:border-[#Bfa67a] transition-all cursor-pointer">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest group-hover:text-[#Bfa67a] transition-colors">{item.label}</span>
                    <span className="text-sm font-serif">{item.val}</span>
                  </div>
                ))}
              </div>

              <button className="w-full py-4 bg-white text-[#0C1C2E] text-[9px] uppercase font-bold tracking-[0.3em] hover:bg-[#Bfa67a] hover:text-white transition-all">
                Request Private Folio
              </button>
            </div>

            {/* INTERIOR ARCHITECTURE */}
            <div ref={featuresAnim.ref} className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white shadow-lg shadow-black/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-[#Bfa67a]"/>
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#0C1C2E]">Interior Architecture</span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 tracking-[0.2em] block mb-2">Primary Suite</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Private Terrace", "Morning Bar", "Fireplace"].map((tag, i) => (
                      <span key={i} className="text-xs text-[#0C1C2E] bg-gray-100 px-2.5 py-1 hover:bg-[#Bfa67a] hover:text-white transition-colors cursor-pointer">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 tracking-[0.2em] block mb-2">Flooring</span>
                  <div className="flex flex-wrap gap-1.5">
                    {LISTING_DATA.Flooring.map((tag, i) => (
                      <span key={i} className="text-xs text-[#0C1C2E] bg-gray-100 px-2.5 py-1 hover:bg-[#Bfa67a] hover:text-white transition-colors cursor-pointer">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CULINARY INTELLIGENCE */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white shadow-lg shadow-black/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ChefHat size={16} className="text-[#Bfa67a]"/>
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#0C1C2E]">Culinary Intelligence</span>
              </div>
              <div className="bg-[#F9F8F6] p-4 border-l-4 border-[#Bfa67a] space-y-3">
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 tracking-[0.2em] block mb-1">Professional Suite</span>
                  <p className="text-sm text-[#0C1C2E] leading-relaxed">{LISTING_DATA.Appliances.join(' • ')}</p>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 tracking-[0.2em] block mb-1">Surfaces</span>
                  <p className="text-sm text-[#0C1C2E]">Bespoke White Oak • Statuario Limestone</p>
                </div>
              </div>
            </div>

            {/* ENGINEERING & SITE */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white shadow-lg shadow-black/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers size={16} className="text-[#Bfa67a]"/>
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#0C1C2E]">Engineering & Site</span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 tracking-[0.2em] block mb-2">Structure</span>
                  <div className="flex flex-wrap gap-1.5">
                    {LISTING_DATA.ConstructionMaterials.map((tag, i) => (
                      <span key={i} className="text-xs text-[#0C1C2E] bg-gray-100 px-2.5 py-1 hover:bg-[#Bfa67a] hover:text-white transition-colors cursor-pointer">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 tracking-[0.2em] block mb-2">Views</span>
                  <div className="flex flex-wrap gap-1.5">
                    {LISTING_DATA.View.map((tag, i) => (
                      <span key={i} className="text-xs text-[#0C1C2E] bg-gray-100 px-2.5 py-1 hover:bg-[#Bfa67a] hover:text-white transition-colors cursor-pointer">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AQUATIC & OUTDOOR */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white shadow-lg shadow-black/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Droplets size={16} className="text-[#Bfa67a]"/>
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#0C1C2E]">Aquatic Design</span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 tracking-[0.2em] block mb-2">Pool Features</span>
                  <div className="flex flex-wrap gap-1.5">
                    {LISTING_DATA.PoolFeatures.map((tag, i) => (
                      <span key={i} className="text-xs text-[#0C1C2E] bg-gray-100 px-2.5 py-1 hover:bg-[#Bfa67a] hover:text-white transition-colors cursor-pointer">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 tracking-[0.2em] block mb-2">Spa</span>
                  <div className="flex flex-wrap gap-1.5">
                    {LISTING_DATA.SpaFeatures.map((tag, i) => (
                      <span key={i} className="text-xs text-[#0C1C2E] bg-gray-100 px-2.5 py-1 hover:bg-[#Bfa67a] hover:text-white transition-colors cursor-pointer">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* UTILITY INFRASTRUCTURE */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white shadow-lg shadow-black/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-[#Bfa67a]"/>
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#0C1C2E]">Utility Infrastructure</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <Droplets size={14}/>, label: "Water", val: LISTING_DATA.WaterSource[0] },
                  { icon: <Activity size={14}/>, label: "Filtration", val: "MERV-16" },
                  { icon: <PlusSquare size={14}/>, label: "Smart", val: "Savant" },
                  { icon: <Info size={14}/>, label: "Internet", val: "10Gb Fiber" }
                ].map((inf, i) => (
                  <div key={i} className="bg-[#F9F8F6] p-3 hover:bg-[#Bfa67a] hover:text-white transition-all cursor-pointer group">
                    <div className="text-[#Bfa67a] mb-1.5 group-hover:text-white">{inf.icon}</div>
                    <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold mb-0.5 group-hover:text-white/70">{inf.label}</p>
                    <p className="text-[10px] font-bold text-[#0C1C2E] group-hover:text-white">{inf.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* PARKING & GARAGE */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white shadow-lg shadow-black/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Car size={16} className="text-[#Bfa67a]"/>
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#0C1C2E]">Parking & Garage</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] uppercase font-bold text-gray-400 tracking-[0.2em]">Capacity</span>
                  <span className="text-lg font-serif text-[#0C1C2E]">{listingData.GarageSpaces} Vehicles</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 tracking-[0.2em] block mb-2">Features</span>
                  <div className="flex flex-wrap gap-1.5">
                    {LISTING_DATA.ParkingFeatures.map((tag, i) => (
                      <span key={i} className="text-xs text-[#0C1C2E] bg-gray-100 px-2.5 py-1 hover:bg-[#Bfa67a] hover:text-white transition-colors cursor-pointer">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Agent Contact Card */}
        <section ref={agentAnim.ref} className="py-16 bg-[#F9F8F6]">
          <div className="max-w-[1700px] mx-auto px-12">
            <div
              className={`
                grid grid-cols-12 gap-8
                transition-all duration-1000
                ${agentAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
              `}
            >
              {/* Agent Image */}
              <div className="col-span-12 lg:col-span-4">
                <div className="aspect-[3/4] overflow-hidden bg-white shadow-lg shadow-black/5 relative">
                  <img
                    src="https://media.placester.com/image/upload/c_fill,dpr_1.0,f_auto,fl_lossy,h_768,q_auto,w_768/c_scale,w_768/v1/inception-app-prod/NjY3YTZkOTktMzhiOS00OWVhLWJjMDQtNWZlMWRmODUyYTU3/content/2024/06/8bbcec7735e907c73a61342dd761093e5aed2002.jpg"
                    className="w-full h-full object-cover"
                    alt="Yong Choi"
                  />
                  {/* Sotheby's Logo Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white p-4 flex items-center justify-center">
                    <img
                      src="https://media.placester.com/image/upload/c_scale,dpr_1.0,f_auto,fl_lossy,q_auto/c_scale,w_3320/v1/inception-app-prod/MTU0NTVlNzktY2QyZC00ODFhLTkyNTQtYzAxNzY2ZGYyMGVk/content/2023/05/e8d40bc595dcf2e580a6dd7a0fde2a5e80f9327a.png"
                      alt="Russ Lyon Sotheby's International Realty"
                      className="h-12 object-contain brightness-0"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
                <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.4em] font-bold mb-4">Your Private Advisor</span>
                <h3 className="text-2xl lg:text-3xl font-serif text-[#0C1C2E] mb-1">Yong Choi</h3>
                <p className="text-gray-400 text-sm mb-2">Realtor® • License #SA713323000</p>
                <p className="text-[#Bfa67a] text-xs mb-6">Russ Lyon Sotheby's International Realty</p>

                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Yong brings over 32 years of impactful experience in the mortgage industry to the world of real estate.
                  His career trajectory includes advancing from Loan Originator to leadership roles such as Branch Manager,
                  Regional Manager, and Director of National Sales with some of the top mortgage lenders in the United States.
                  This extensive background provides Yong with a deep understanding of mortgage underwriting guidelines—a
                  crucial asset in today's dynamic market.
                </p>

                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  A proud Boston College graduate, Yong currently resides in North Scottsdale with his wife Orchid and their
                  six children. When not helping clients achieve their real estate goals, he enjoys traveling and golf.
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  <a href="tel:+19093765494" className="text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors text-sm flex items-center gap-2">
                    <Phone size={14} className="text-[#Bfa67a]" />
                    (909) 376-5494
                  </a>
                  <span className="text-gray-300">|</span>
                  <a href="mailto:yong.choi@russlyon.com" className="text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors text-sm flex items-center gap-2">
                    <Mail size={14} className="text-[#Bfa67a]" />
                    yong.choi@russlyon.com
                  </a>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button className="flex items-center gap-2 bg-[#0C1C2E] text-white px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-all">
                    <Phone size={14} />
                    Schedule Call
                  </button>
                  <button className="flex items-center gap-2 border border-gray-300 text-[#0C1C2E] px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] font-bold hover:border-[#0C1C2E] transition-all">
                    <Mail size={14} />
                    Send Message
                  </button>
                </div>
              </div>

              {/* Background & Expertise */}
              <div className="col-span-12 lg:col-span-3 flex flex-col justify-center gap-4">
                <div className="bg-white shadow-lg shadow-black/5 p-6 space-y-4">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#Bfa67a] font-bold">Expertise</span>
                  {[
                    { value: '32 Years', label: 'Mortgage Industry' },
                    { value: 'Director', label: 'National Sales' },
                    { value: 'Boston College', label: 'Education' },
                    { value: 'North Scottsdale', label: 'Residence' },
                  ].map((stat, i) => (
                    <div key={i} className="flex justify-between items-end border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold">{stat.label}</span>
                      <span className="text-sm font-serif text-[#0C1C2E]">{stat.value}</span>
                    </div>
                  ))}
                </div>

                {/* Latest Blog */}
                <div className="bg-white shadow-lg shadow-black/5 p-6">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#Bfa67a] font-bold block mb-4">Latest Insights</span>
                  <a href="#" className="group block">
                    <span className="text-[8px] uppercase tracking-[0.15em] text-gray-400 font-bold">Market Insight</span>
                    <h4 className="text-sm font-medium text-[#0C1C2E] group-hover:text-[#Bfa67a] transition-colors leading-snug mt-1">
                      5 Essential Financial Steps Before Investing In Real Estate
                    </h4>
                  </a>
                  <a href="https://www.yong-choi.com/blog" target="_blank" rel="noopener noreferrer" className="text-[9px] uppercase tracking-[0.15em] text-[#Bfa67a] font-bold mt-4 inline-flex items-center gap-1 hover:text-[#0C1C2E] transition-colors">
                    View All Posts <ArrowRight size={10} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Geospatial Context */}
        <section ref={proximityAnim.ref} className="bg-[#0C1C2E] py-20 relative overflow-hidden">
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>

           <div className="max-w-[1700px] mx-auto px-12 relative z-10 text-left">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                 <div
                   className={`
                     lg:col-span-7
                     transition-all duration-1000
                     ${proximityAnim.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}
                   `}
                 >
                    <div className="relative aspect-[16/10] bg-black/40 border border-white/10 overflow-hidden group shadow-2xl">
                       {/* Map placeholder with aerial view */}
                       <img
                         src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=1200"
                         className="w-full h-full object-cover opacity-40"
                         alt="Aerial view"
                       />
                       <div className="absolute inset-0 bg-gradient-to-br from-[#0C1C2E]/80 to-transparent" />

                       {/* Location marker */}
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                         <div className="relative">
                           <div className="w-4 h-4 bg-[#Bfa67a] rounded-full shadow-[0_0_20px_#Bfa67a]" />
                           <div className="absolute inset-0 w-4 h-4 bg-[#Bfa67a] rounded-full animate-ping opacity-50" />
                         </div>
                       </div>

                       <div className="absolute top-6 left-6 flex items-center gap-3 bg-[#0C1C2E]/90 backdrop-blur border border-white/10 px-4 py-2">
                          <LocateFixed size={14} className="text-[#Bfa67a]"/>
                          <span className="text-[9px] text-white font-bold uppercase tracking-[0.2em]">{listingData.Latitude} / {listingData.Longitude}</span>
                       </div>

                       <button className="absolute bottom-6 right-6 bg-[#Bfa67a] text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-[#0C1C2E] transition-all flex items-center gap-2 shadow-lg">
                         <MapPin size={14} />
                         Open in Maps
                       </button>
                    </div>
                 </div>

                 <div
                   className={`
                     lg:col-span-5 space-y-10
                     transition-all duration-1000 delay-200
                     ${proximityAnim.isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}
                   `}
                 >
                    <div>
                       <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.4em] font-bold block mb-3">Proximity Matrix</span>
                       <h3 className="text-3xl font-serif text-white">Strategic Infrastructure</h3>
                    </div>

                    <div className="space-y-5">
                       {[
                         { icon: <Plane size={16}/>, label: "Private Aviation", val: "14.2 NM", meta: "KSDL - Gulfstream Access" },
                         { icon: <Hospital size={16}/>, label: "Medical Center", val: "9.8 Mi", meta: "Mayo Clinic Campus" },
                         { icon: <Activity size={16}/>, label: "Security Gate", val: "2.4 Min", meta: "Saguaro Forest Gatehouse" },
                         { icon: <Mountain size={16}/>, label: "Desert Preserve", val: "0.5 Mi", meta: "McDowell Sonoran Entry" }
                       ].map((prox, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-5 group cursor-pointer"
                            style={{
                              opacity: proximityAnim.isVisible ? 1 : 0,
                              transform: proximityAnim.isVisible ? 'translateX(0)' : 'translateX(20px)',
                              transition: `all 0.5s ease-out ${i * 100 + 300}ms`
                            }}
                          >
                             <div className="p-3 bg-white/5 border border-white/10 text-[#Bfa67a] group-hover:bg-[#Bfa67a] group-hover:text-[#0C1C2E] transition-all duration-300">
                                {prox.icon}
                             </div>
                             <div className="flex-1 border-b border-white/5 pb-3">
                                <div className="flex justify-between items-end mb-1">
                                   <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">{prox.label}</span>
                                   <span className="text-lg font-serif text-white">{prox.val}</span>
                                </div>
                                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em]">{prox.meta}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Similar Properties */}
        <section ref={similarAnim.ref} className="py-20 bg-[#F9F8F6]">
          <div className="max-w-[1700px] mx-auto px-12">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.4em] font-bold block mb-3">Comparable Analysis</span>
                <h2 className="text-2xl lg:text-3xl font-serif text-[#0C1C2E]">Similar Properties</h2>
              </div>
              <button className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-[#0C1C2E] hover:text-[#Bfa67a] transition-colors">
                View All <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarLoading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-white shadow-lg shadow-black/5 overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200" />
                    <div className="p-5">
                      <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                      <div className="flex gap-4">
                        <div className="h-4 bg-gray-200 rounded w-12" />
                        <div className="h-4 bg-gray-200 rounded w-12" />
                        <div className="h-4 bg-gray-200 rounded w-16" />
                      </div>
                    </div>
                  </div>
                ))
              ) : similarListings.length > 0 ? (
                // API listings
                similarListings.filter(l => l.Id !== id).slice(0, 4).map((listing, index) => {
                  const photo = getPrimaryPhoto(listing);
                  const address = listing.StandardFields.UnparsedFirstLineAddress ||
                                  listing.StandardFields.UnparsedAddress ||
                                  `${listing.StandardFields.StreetNumber || ''} ${listing.StandardFields.StreetName || ''}`.trim();
                  return (
                    <Link
                      key={listing.Id}
                      to={`/listing/${listing.Id}`}
                      className={`
                        group cursor-pointer bg-white shadow-lg shadow-black/5 overflow-hidden
                        transition-all duration-700
                        ${similarAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
                      `}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <div className="aspect-[4/3] overflow-hidden relative">
                        {photo ? (
                          <img
                            src={photo}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            alt={address}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Home size={32} className="text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                      <div className="p-5">
                        <p className="text-xl font-serif text-[#0C1C2E] mb-1 group-hover:text-[#Bfa67a] transition-colors">
                          {formatPrice(listing.StandardFields.ListPrice)}
                        </p>
                        <p className="text-sm text-gray-500 mb-4 truncate">{address}</p>
                        <div className="flex gap-4 text-[9px] uppercase tracking-widest text-gray-400">
                          <span className="flex items-center gap-1.5"><BedDouble size={12} /> {listing.StandardFields.BedsTotal}</span>
                          <span className="flex items-center gap-1.5"><Bath size={12} /> {listing.StandardFields.BathsFull}</span>
                          {listing.StandardFields.BuildingAreaTotal && (
                            <span className="flex items-center gap-1.5"><Ruler size={12} /> {formatSqft(listing.StandardFields.BuildingAreaTotal)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                // Fallback to static data
                SIMILAR_PROPERTIES.map((property, index) => (
                  <div
                    key={property.id}
                    className={`
                      group cursor-pointer bg-white shadow-lg shadow-black/5 overflow-hidden
                      transition-all duration-700
                      ${similarAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
                    `}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img
                        src={property.image}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={property.address}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                    <div className="p-5">
                      <p className="text-xl font-serif text-[#0C1C2E] mb-1 group-hover:text-[#Bfa67a] transition-colors">{property.price}</p>
                      <p className="text-sm text-gray-500 mb-4">{property.address}</p>
                      <div className="flex gap-4 text-[9px] uppercase tracking-widest text-gray-400">
                        <span className="flex items-center gap-1.5"><BedDouble size={12} /> {property.beds}</span>
                        <span className="flex items-center gap-1.5"><Bath size={12} /> {property.baths}</span>
                        <span className="flex items-center gap-1.5"><Ruler size={12} /> {property.sqft.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="sm:hidden mt-8 text-center">
              <button className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-[#Bfa67a] mx-auto">
                View All Properties <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Compliance Disclaimer */}
        <section className="bg-gray-50 py-12 border-y border-gray-200">
           <div className="max-w-[1700px] mx-auto px-12 text-left">
              <div className="flex flex-col md:flex-row items-center gap-8 border border-dashed border-gray-300 p-8 rounded-sm opacity-60">
                 <div className="bg-[#0C1C2E] text-white p-4 font-serif text-sm tracking-widest font-black leading-none uppercase text-center shrink-0">ARMLS <br/> <span className="text-[11px] opacity-40">IDX</span></div>
                 <div className="flex-1">
                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium uppercase tracking-wider">
                       The data relating to real estate for sale on this website comes in part from the Internet Data Exchange (IDX) program of the Arizona Regional Multiple Listing Service, Inc. (ARMLS®). Real estate listings held by brokerage firms other than Russ Lyon Sotheby's International Realty are marked with the IDX logo.
                    </p>
                 </div>
              </div>
           </div>
        </section>

        {/* Footer */}
        <Footer />
      </main>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-10"
          >
            <X size={32} />
          </button>

          {/* Navigation */}
          <button
            onClick={prevImage}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={40} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <ChevronRight size={40} />
          </button>

          {/* Main image */}
          <div className="max-w-6xl max-h-[80vh] mx-auto px-20">
            <img
              src={galleryImages[currentImageIndex]?.url || GALLERY_IMAGES[0].url}
              className="max-w-full max-h-[80vh] object-contain"
              alt={galleryImages[currentImageIndex]?.caption || 'Property'}
            />
            <div className="text-center mt-6">
              <p className="text-white font-serif text-xl">{galleryImages[currentImageIndex]?.caption || 'Property Photo'}</p>
              <p className="text-white/40 text-sm mt-2">{currentImageIndex + 1} / {galleryImages.length}</p>
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {galleryImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`
                  w-16 h-12 overflow-hidden transition-all
                  ${currentImageIndex === index ? 'ring-2 ring-[#Bfa67a] opacity-100' : 'opacity-40 hover:opacity-70'}
                `}
              >
                <img src={image.url} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Persistent Comparison Bridge */}
      {isStaged && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-8 fade-in duration-500">
           <div className="bg-[#0C1C2E] text-white pl-6 pr-2 py-2 rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse"></div>
                 <span className="text-[10px] uppercase font-black tracking-widest text-[#Bfa67a]">Benchmarking Active</span>
              </div>
              <button className="bg-[#3B82F6] text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-[#3B82F6] transition-all flex items-center gap-2 group">
                 View Portfolio Analysis <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform"/>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
