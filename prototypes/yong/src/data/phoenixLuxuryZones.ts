import type { FeatureCollection, Polygon } from 'geojson';

// Phoenix Metro Luxury Zones GeoJSON Data
// Coordinates are approximate boundaries for major luxury enclaves

export interface ZoneProperties {
  id: string;
  name: string;
  description: string;
  avgPrice: string;
  inventory: number;
  dom: number;
  trend: string;
  ppsf: string;
  color: string;
}

export const PHOENIX_CENTER: [number, number] = [33.5722, -111.9280];
export const DEFAULT_ZOOM = 10;

// Main market zones (larger areas)
export const marketZonesGeoJSON: FeatureCollection<Polygon, ZoneProperties> = {
  type: "FeatureCollection",
  features: [
    // North Scottsdale - Desert Mountain / Cave Creek area
    {
      type: "Feature",
      properties: {
        id: "north-scottsdale",
        name: "North Scottsdale",
        description: "High-altitude luxury estates in the McDowell Mountains. Championship golf, equestrian zoning, and cooler temperatures.",
        avgPrice: "$3.2M",
        inventory: 142,
        dom: 45,
        trend: "+12%",
        ppsf: "$795",
        color: "#0C1C2E"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.8200, 33.8500],
          [-111.7000, 33.8500],
          [-111.6800, 33.7800],
          [-111.7200, 33.7200],
          [-111.7800, 33.6800],
          [-111.8500, 33.6900],
          [-111.8800, 33.7400],
          [-111.8600, 33.8000],
          [-111.8200, 33.8500]
        ]]
      }
    },
    // Paradise Valley
    {
      type: "Feature",
      properties: {
        id: "paradise-valley",
        name: "Paradise Valley",
        description: "The Beverly Hills of Arizona. Acre-plus lots, historic luxury, and unmatched views of Camelback Mountain.",
        avgPrice: "$5.4M",
        inventory: 85,
        dom: 62,
        trend: "+8%",
        ppsf: "$1,150",
        color: "#1a365d"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.9600, 33.5600],
          [-111.9100, 33.5600],
          [-111.9000, 33.5300],
          [-111.9200, 33.5000],
          [-111.9700, 33.5000],
          [-111.9800, 33.5300],
          [-111.9600, 33.5600]
        ]]
      }
    },
    // Arcadia & Biltmore
    {
      type: "Feature",
      properties: {
        id: "arcadia-biltmore",
        name: "Arcadia & Biltmore",
        description: "Historic charm meets modern luxury. Lush citrus groves, green lawns, and proximity to high-end dining.",
        avgPrice: "$2.8M",
        inventory: 56,
        dom: 28,
        trend: "+15%",
        ppsf: "$920",
        color: "#2d3748"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0200, 33.5100],
          [-111.9700, 33.5100],
          [-111.9600, 33.4800],
          [-111.9800, 33.4500],
          [-112.0300, 33.4500],
          [-112.0400, 33.4800],
          [-112.0200, 33.5100]
        ]]
      }
    },
    // Central Scottsdale
    {
      type: "Feature",
      properties: {
        id: "central-scottsdale",
        name: "Central Scottsdale",
        description: "The heart of the city. Lakefront properties, equestrian estates, and easy access to Old Town.",
        avgPrice: "$1.8M",
        inventory: 112,
        dom: 35,
        trend: "+5%",
        ppsf: "$640",
        color: "#4a5568"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.9200, 33.5800],
          [-111.8600, 33.5800],
          [-111.8500, 33.5200],
          [-111.8800, 33.4800],
          [-111.9300, 33.4800],
          [-111.9400, 33.5200],
          [-111.9200, 33.5800]
        ]]
      }
    },
    // Urban Core / Downtown Phoenix
    {
      type: "Feature",
      properties: {
        id: "downtown",
        name: "Urban Core",
        description: "Vertical luxury and historic districts. Penthouse living with skyline views, arts district access.",
        avgPrice: "$950K",
        inventory: 205,
        dom: 42,
        trend: "+2%",
        ppsf: "$510",
        color: "#718096"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0900, 33.4700],
          [-112.0400, 33.4700],
          [-112.0300, 33.4300],
          [-112.0600, 33.4100],
          [-112.1000, 33.4100],
          [-112.1100, 33.4400],
          [-112.0900, 33.4700]
        ]]
      }
    },
    // Carefree & Cave Creek
    {
      type: "Feature",
      properties: {
        id: "carefree-cave-creek",
        name: "Carefree & Cave Creek",
        description: "Western charm meets luxury living. Equestrian properties, artistic communities, and rugged Sonoran beauty.",
        avgPrice: "$1.6M",
        inventory: 90,
        dom: 52,
        trend: "+8%",
        ppsf: "$395",
        color: "#5a4a3a"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.9800, 33.8800],
          [-111.8800, 33.8800],
          [-111.8600, 33.8200],
          [-111.8800, 33.7800],
          [-111.9600, 33.7800],
          [-112.0000, 33.8200],
          [-111.9800, 33.8800]
        ]]
      }
    },
    // North Phoenix / Desert Ridge
    {
      type: "Feature",
      properties: {
        id: "phoenix",
        name: "North Phoenix",
        description: "Master-planned luxury in North Phoenix. Resort-style living with top schools and modern amenities.",
        avgPrice: "$850K",
        inventory: 65,
        dom: 32,
        trend: "+9%",
        ppsf: "$325",
        color: "#8b7355"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0500, 33.7200],
          [-111.9600, 33.7200],
          [-111.9400, 33.6600],
          [-111.9700, 33.6200],
          [-112.0300, 33.6200],
          [-112.0600, 33.6600],
          [-112.0500, 33.7200]
        ]]
      }
    }
  ]
};

// Luxury Enclaves (specific communities within zones)
export interface EnclaveProperties {
  id: string;
  name: string;
  parentZone: string;
  avgPrice: string;
  dom: number;
  inventory: number;
  zipCode: string;
  type: 'golf' | 'estate' | 'guard-gated' | 'equestrian' | 'urban' | 'master-planned' | 'resort' | 'town' | 'western';
}

export const luxuryEnclavesGeoJSON: FeatureCollection<Polygon, EnclaveProperties> = {
  type: "FeatureCollection",
  features: [
    // NORTH SCOTTSDALE ENCLAVES
    // Desert Mountain
    {
      type: "Feature",
      properties: {
        id: "desert-mountain",
        name: "Desert Mountain",
        parentZone: "north-scottsdale",
        avgPrice: "$4.2M",
        dom: 35,
        inventory: 42,
        zipCode: "85262",
        type: "golf"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.8100, 33.8200],
          [-111.7600, 33.8200],
          [-111.7500, 33.7900],
          [-111.7700, 33.7700],
          [-111.8200, 33.7700],
          [-111.8300, 33.7900],
          [-111.8100, 33.8200]
        ]]
      }
    },
    // Silverleaf at DC Ranch
    {
      type: "Feature",
      properties: {
        id: "silverleaf",
        name: "Silverleaf",
        parentZone: "north-scottsdale",
        avgPrice: "$8.2M",
        dom: 90,
        inventory: 15,
        zipCode: "85255",
        type: "guard-gated"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.8400, 33.7200],
          [-111.8100, 33.7200],
          [-111.8000, 33.7000],
          [-111.8150, 33.6850],
          [-111.8450, 33.6850],
          [-111.8500, 33.7000],
          [-111.8400, 33.7200]
        ]]
      }
    },
    // DC Ranch
    {
      type: "Feature",
      properties: {
        id: "dc-ranch",
        name: "DC Ranch",
        parentZone: "north-scottsdale",
        avgPrice: "$3.5M",
        dom: 40,
        inventory: 25,
        zipCode: "85255",
        type: "golf"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.8550, 33.6850],
          [-111.8200, 33.6850],
          [-111.8100, 33.6600],
          [-111.8300, 33.6450],
          [-111.8600, 33.6450],
          [-111.8700, 33.6650],
          [-111.8550, 33.6850]
        ]]
      }
    },
    // Mirabel
    {
      type: "Feature",
      properties: {
        id: "mirabel",
        name: "Mirabel",
        parentZone: "north-scottsdale",
        avgPrice: "$3.1M",
        dom: 48,
        inventory: 18,
        zipCode: "85262",
        type: "golf"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.7800, 33.7600],
          [-111.7500, 33.7600],
          [-111.7400, 33.7400],
          [-111.7550, 33.7250],
          [-111.7850, 33.7250],
          [-111.7900, 33.7450],
          [-111.7800, 33.7600]
        ]]
      }
    },
    // Estancia
    {
      type: "Feature",
      properties: {
        id: "estancia",
        name: "Estancia",
        parentZone: "north-scottsdale",
        avgPrice: "$5.5M",
        dom: 55,
        inventory: 12,
        zipCode: "85262",
        type: "golf"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.7400, 33.7800],
          [-111.7150, 33.7800],
          [-111.7050, 33.7600],
          [-111.7200, 33.7450],
          [-111.7450, 33.7450],
          [-111.7500, 33.7650],
          [-111.7400, 33.7800]
        ]]
      }
    },
    // Troon North
    {
      type: "Feature",
      properties: {
        id: "troon-north",
        name: "Troon North",
        parentZone: "north-scottsdale",
        avgPrice: "$2.8M",
        dom: 32,
        inventory: 28,
        zipCode: "85262",
        type: "golf"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.8650, 33.7400],
          [-111.8350, 33.7400],
          [-111.8250, 33.7150],
          [-111.8400, 33.7000],
          [-111.8700, 33.7000],
          [-111.8750, 33.7200],
          [-111.8650, 33.7400]
        ]]
      }
    },
    // Grayhawk
    {
      type: "Feature",
      properties: {
        id: "grayhawk",
        name: "Grayhawk",
        parentZone: "north-scottsdale",
        avgPrice: "$1.5M",
        dom: 25,
        inventory: 32,
        zipCode: "85255",
        type: "golf"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.8900, 33.6700],
          [-111.8600, 33.6700],
          [-111.8500, 33.6450],
          [-111.8650, 33.6300],
          [-111.8950, 33.6300],
          [-111.9000, 33.6500],
          [-111.8900, 33.6700]
        ]]
      }
    },

    // PARADISE VALLEY ENCLAVES
    // Cameldale
    {
      type: "Feature",
      properties: {
        id: "cameldale",
        name: "Cameldale",
        parentZone: "paradise-valley",
        avgPrice: "$6.5M",
        dom: 70,
        inventory: 12,
        zipCode: "85253",
        type: "estate"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.9500, 33.5450],
          [-111.9300, 33.5450],
          [-111.9250, 33.5300],
          [-111.9350, 33.5200],
          [-111.9550, 33.5200],
          [-111.9600, 33.5350],
          [-111.9500, 33.5450]
        ]]
      }
    },
    // Mockingbird Lane
    {
      type: "Feature",
      properties: {
        id: "mockingbird",
        name: "Mockingbird Lane",
        parentZone: "paradise-valley",
        avgPrice: "$4.8M",
        dom: 55,
        inventory: 8,
        zipCode: "85253",
        type: "estate"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.9650, 33.5300],
          [-111.9450, 33.5300],
          [-111.9400, 33.5150],
          [-111.9500, 33.5050],
          [-111.9700, 33.5050],
          [-111.9750, 33.5200],
          [-111.9650, 33.5300]
        ]]
      }
    },
    // Mummy Mountain
    {
      type: "Feature",
      properties: {
        id: "mummy-mountain",
        name: "Mummy Mountain",
        parentZone: "paradise-valley",
        avgPrice: "$7.1M",
        dom: 90,
        inventory: 6,
        zipCode: "85253",
        type: "estate"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.9350, 33.5350],
          [-111.9150, 33.5350],
          [-111.9100, 33.5200],
          [-111.9200, 33.5100],
          [-111.9400, 33.5100],
          [-111.9450, 33.5250],
          [-111.9350, 33.5350]
        ]]
      }
    },

    // ARCADIA & BILTMORE ENCLAVES
    // Arcadia Proper
    {
      type: "Feature",
      properties: {
        id: "arcadia-proper",
        name: "Arcadia Proper",
        parentZone: "arcadia-biltmore",
        avgPrice: "$3.5M",
        dom: 30,
        inventory: 15,
        zipCode: "85018",
        type: "estate"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.9900, 33.5000],
          [-111.9700, 33.5000],
          [-111.9650, 33.4850],
          [-111.9750, 33.4700],
          [-111.9950, 33.4700],
          [-112.0000, 33.4850],
          [-111.9900, 33.5000]
        ]]
      }
    },
    // Biltmore Estates
    {
      type: "Feature",
      properties: {
        id: "biltmore-estates",
        name: "Biltmore Estates",
        parentZone: "arcadia-biltmore",
        avgPrice: "$2.8M",
        dom: 40,
        inventory: 10,
        zipCode: "85016",
        type: "estate"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0200, 33.5050],
          [-112.0000, 33.5050],
          [-111.9950, 33.4900],
          [-112.0050, 33.4800],
          [-112.0250, 33.4800],
          [-112.0300, 33.4950],
          [-112.0200, 33.5050]
        ]]
      }
    },
    // Arizona Biltmore
    {
      type: "Feature",
      properties: {
        id: "arizona-biltmore",
        name: "Arizona Biltmore",
        parentZone: "arcadia-biltmore",
        avgPrice: "$2.2M",
        dom: 35,
        inventory: 12,
        zipCode: "85016",
        type: "golf"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0350, 33.4800],
          [-112.0150, 33.4800],
          [-112.0100, 33.4650],
          [-112.0200, 33.4550],
          [-112.0400, 33.4550],
          [-112.0450, 33.4700],
          [-112.0350, 33.4800]
        ]]
      }
    },

    // CENTRAL SCOTTSDALE ENCLAVES
    // McCormick Ranch
    {
      type: "Feature",
      properties: {
        id: "mccormick-ranch",
        name: "McCormick Ranch",
        parentZone: "central-scottsdale",
        avgPrice: "$2.3M",
        dom: 45,
        inventory: 22,
        zipCode: "85258",
        type: "golf"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.9100, 33.5500],
          [-111.8900, 33.5500],
          [-111.8850, 33.5300],
          [-111.8950, 33.5150],
          [-111.9150, 33.5150],
          [-111.9200, 33.5350],
          [-111.9100, 33.5500]
        ]]
      }
    },
    // Gainey Ranch
    {
      type: "Feature",
      properties: {
        id: "gainey-ranch",
        name: "Gainey Ranch",
        parentZone: "central-scottsdale",
        avgPrice: "$1.9M",
        dom: 38,
        inventory: 18,
        zipCode: "85258",
        type: "golf"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.9250, 33.5600],
          [-111.9050, 33.5600],
          [-111.9000, 33.5400],
          [-111.9100, 33.5250],
          [-111.9300, 33.5250],
          [-111.9350, 33.5450],
          [-111.9250, 33.5600]
        ]]
      }
    },
    // Kierland
    {
      type: "Feature",
      properties: {
        id: "kierland",
        name: "Kierland",
        parentZone: "central-scottsdale",
        avgPrice: "$1.6M",
        dom: 30,
        inventory: 25,
        zipCode: "85254",
        type: "urban"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-111.9350, 33.5850],
          [-111.9150, 33.5850],
          [-111.9100, 33.5650],
          [-111.9200, 33.5500],
          [-111.9400, 33.5500],
          [-111.9450, 33.5700],
          [-111.9350, 33.5850]
        ]]
      }
    },

    // URBAN CORE ENCLAVES
    // Roosevelt Row
    {
      type: "Feature",
      properties: {
        id: "roosevelt-row",
        name: "Roosevelt Row",
        parentZone: "downtown",
        avgPrice: "$650K",
        dom: 35,
        inventory: 40,
        zipCode: "85004",
        type: "urban"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0700, 33.4600],
          [-112.0550, 33.4600],
          [-112.0500, 33.4500],
          [-112.0600, 33.4400],
          [-112.0750, 33.4400],
          [-112.0800, 33.4500],
          [-112.0700, 33.4600]
        ]]
      }
    },
    // Willo Historic District
    {
      type: "Feature",
      properties: {
        id: "willo",
        name: "Willo",
        parentZone: "downtown",
        avgPrice: "$1.2M",
        dom: 28,
        inventory: 8,
        zipCode: "85003",
        type: "estate"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0850, 33.4750],
          [-112.0650, 33.4750],
          [-112.0600, 33.4600],
          [-112.0700, 33.4500],
          [-112.0900, 33.4500],
          [-112.0950, 33.4650],
          [-112.0850, 33.4750]
        ]]
      }
    },
    // Encanto
    {
      type: "Feature",
      properties: {
        id: "encanto",
        name: "Encanto",
        parentZone: "downtown",
        avgPrice: "$1.4M",
        dom: 45,
        inventory: 10,
        zipCode: "85003",
        type: "estate"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-112.0950, 33.4850],
          [-112.0750, 33.4850],
          [-112.0700, 33.4700],
          [-112.0800, 33.4600],
          [-112.1000, 33.4600],
          [-112.1050, 33.4750],
          [-112.0950, 33.4850]
        ]]
      }
    }
  ]
};

// Map style configuration
export const MAP_STYLE = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

export const BRAND_COLORS = {
  navy: '#0C1C2E',
  gold: '#Bfa67a',
  goldHover: '#d4b896',
  selected: '#Bfa67a',
  hover: 'rgba(191, 166, 122, 0.4)',
  border: 'rgba(191, 166, 122, 0.6)'
};
