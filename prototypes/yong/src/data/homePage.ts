export interface FeaturedListing {
  id: number;
  price: string;
  address: string;
  area: string;
  specs: { beds: number; baths: number; sqft: string };
  img: string;
}

export const FEATURED_LISTINGS: FeaturedListing[] = [
  {
    id: 1,
    price: "$8,450,000",
    address: "10293 N Chiricahua Dr",
    area: "Desert Mountain",
    specs: { beds: 5, baths: 6.5, sqft: "7,200" },
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    price: "$5,200,000",
    address: "5521 E Mockingbird Ln",
    area: "Paradise Valley",
    specs: { beds: 4, baths: 5, sqft: "5,800" },
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 3,
    price: "$3,100,000",
    address: "4421 N Arcadian Way",
    area: "Arcadia",
    specs: { beds: 4, baths: 3.5, sqft: "3,900" },
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800"
  }
];

export interface LifestyleEnclave {
  name: string;
  img: string;
  link: string;
}

export interface LifestyleCollection {
  id: string;
  iconName: 'Mountain' | 'Palmtree' | 'Building2';
  title: string;
  description: string;
  enclaves: LifestyleEnclave[];
}

export const LIFESTYLE_COLLECTIONS: LifestyleCollection[] = [
  {
    id: 'golf',
    iconName: 'Mountain',
    title: "Alpine & Golf",
    description: "Elevated living in the high Sonoran desert. Championship courses and club exclusivity.",
    enclaves: [
      { name: "Desert Mountain", img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600", link: "/north-scottsdale/desert-mountain" },
      { name: "Silverleaf", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600", link: "/north-scottsdale/silverleaf" },
      { name: "Estancia", img: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=600", link: "/north-scottsdale/estancia" },
      { name: "Troon North", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600", link: "/north-scottsdale/troon-north" }
    ]
  },
  {
    id: 'estate',
    iconName: 'Palmtree',
    title: "Historic & Estate",
    description: "Timeless architecture on sprawling irrigated lots in the heart of the valley.",
    enclaves: [
      { name: "Paradise Valley", img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=600", link: "/paradise-valley/paradise-valley" },
      { name: "Arcadia", img: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&q=80&w=600", link: "/central-scottsdale/arcadia" },
      { name: "Biltmore", img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=600", link: "/phoenix/biltmore" }
    ]
  },
  {
    id: 'urban',
    iconName: 'Building2',
    title: "Urban Luxury",
    description: "Vertical living and modern penthouses in the cultural center.",
    enclaves: [
      { name: "Downtown Phoenix", img: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=600", link: "/phoenix/downtown-phoenix" },
      { name: "Old Town Scottsdale", img: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=600", link: "/central-scottsdale/old-town-scottsdale" },
    ]
  }
];
