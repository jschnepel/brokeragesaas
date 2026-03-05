export interface FeaturedListing {
  slug: string;
  price: string;
  priceValue: number;
  address: string;
  area: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: string;
  yearBuilt: number;
  lotSize: string;
  img: string;
  gallery: string[];
  description: string;
  features: string[];
  status: 'Active' | 'Pending' | 'Sold';
}

const FEATURED_LISTINGS: FeaturedListing[] = [
  {
    slug: '10293-n-chiricahua-dr',
    price: '$8,450,000',
    priceValue: 8450000,
    address: '10293 N Chiricahua Dr',
    area: 'Desert Mountain',
    city: 'Scottsdale',
    state: 'AZ',
    zip: '85262',
    beds: 5,
    baths: 6.5,
    sqft: '7,200',
    yearBuilt: 2019,
    lotSize: '2.3 acres',
    img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200',
    ],
    description:
      'This extraordinary Desert Mountain estate commands sweeping views of the McDowell Mountains and city lights from its elevated perch on over two acres. The open floor plan seamlessly blends indoor and outdoor living with walls of glass that retract to reveal expansive covered patios, an infinity-edge pool, and a resort-caliber outdoor kitchen. The chef\'s kitchen features dual islands, Sub-Zero and Wolf appliances, and a temperature-controlled wine room. The primary suite offers a private terrace, spa-like bath with heated floors, and a custom closet system. Additional highlights include a home theater, fitness room, four-car garage with EV charging, and smart home automation throughout.',
    features: [
      'Infinity-edge pool with mountain views',
      'Resort-caliber outdoor kitchen',
      'Temperature-controlled wine room',
      'Home theater & fitness room',
      'Four-car garage with EV charging',
      'Smart home automation',
      'Primary suite with private terrace',
      'Walls of retractable glass',
    ],
    status: 'Active',
  },
  {
    slug: '5521-e-mockingbird-ln',
    price: '$5,200,000',
    priceValue: 5200000,
    address: '5521 E Mockingbird Ln',
    area: 'Paradise Valley',
    city: 'Paradise Valley',
    state: 'AZ',
    zip: '85253',
    beds: 4,
    baths: 5,
    sqft: '5,800',
    yearBuilt: 2021,
    lotSize: '1.1 acres',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&q=80&w=1200',
    ],
    description:
      'Nestled on over an acre in the heart of Paradise Valley with stunning Camelback Mountain views, this contemporary masterpiece redefines luxury living. Designed by a renowned Scottsdale architect, the residence features soaring ceilings, European white oak floors, and floor-to-ceiling windows that flood every room with natural light. The great room opens to a negative-edge pool and spa surrounded by mature desert landscaping. A gourmet kitchen with Gaggenau appliances, custom cabinetry, and waterfall-edge quartzite island anchors the living space. The separate guest casita with full kitchen provides ideal accommodations for extended family or visiting guests.',
    features: [
      'Camelback Mountain views',
      'Negative-edge pool & spa',
      'Gaggenau appliance package',
      'European white oak floors',
      'Separate guest casita with kitchen',
      'Mature desert landscaping',
      'Floor-to-ceiling windows',
      'Waterfall-edge quartzite island',
    ],
    status: 'Active',
  },
  {
    slug: '4421-n-arcadian-way',
    price: '$3,100,000',
    priceValue: 3100000,
    address: '4421 N Arcadian Way',
    area: 'Arcadia',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85018',
    beds: 4,
    baths: 3.5,
    sqft: '3,900',
    yearBuilt: 2023,
    lotSize: '0.45 acres',
    img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200',
    ],
    description:
      'A stunning new-build in the heart of Arcadia Proper, steps from Camelback Mountain hiking and the neighborhood\'s acclaimed restaurant row. This four-bedroom contemporary blends clean architectural lines with warm natural materials — board-formed concrete, rift-cut white oak, and hand-troweled plaster walls. The open-concept main level flows from a designer kitchen with Thermador appliances to a covered outdoor living room with a linear fireplace and built-in BBQ. The primary suite features a freestanding soaking tub, dual rain showers, and a private courtyard. Mature citrus trees and a heated lap pool complete this walkable Arcadia retreat.',
    features: [
      'New construction (2023)',
      'Board-formed concrete & white oak',
      'Thermador appliance package',
      'Heated lap pool',
      'Linear fireplace & built-in BBQ',
      'Primary suite with private courtyard',
      'Mature citrus trees',
      'Walking distance to restaurants & hiking',
    ],
    status: 'Active',
  },
];

export function getAllListings(): FeaturedListing[] {
  return FEATURED_LISTINGS;
}

export function getListingBySlug(slug: string): FeaturedListing | undefined {
  return FEATURED_LISTINGS.find((listing) => listing.slug === slug);
}
