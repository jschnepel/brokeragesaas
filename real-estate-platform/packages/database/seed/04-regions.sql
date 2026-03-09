-- =====================================================
-- PHOENIX LUXURY REGIONS SEED DATA
-- Groups neighborhoods into geographic market areas
-- Source: prototypes/yong/src/data/regions.ts
-- =====================================================

-- Create regions table if not exists
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hero_image_url VARCHAR(500),
    coordinates JSONB,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regions_slug ON regions(slug);
CREATE INDEX IF NOT EXISTS idx_regions_active ON regions(active);

-- Add region_id to neighborhoods if column does not exist yet
-- (Mirrors migration 009_region_neighborhoods.sql)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'neighborhoods' AND column_name = 'region_id'
    ) THEN
        ALTER TABLE neighborhoods ADD COLUMN region_id UUID REFERENCES regions(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_neighborhoods_region ON neighborhoods(region_id);
    END IF;
END $$;

-- =====================================================
-- REGION: NORTH SCOTTSDALE
-- Neighborhoods: Desert Mountain, Troon North, Silverleaf, DC Ranch, Ancala
-- =====================================================
INSERT INTO regions (slug, name, description, hero_image_url, coordinates, display_order) VALUES
(
    'north-scottsdale',
    'North Scottsdale',
    'North Scottsdale represents the pinnacle of Arizona luxury living, where the high Sonoran Desert meets world-class amenities. This prestigious corridor stretches from the McDowell Mountains to the foothills of Black Mountain, encompassing some of the most exclusive golf communities and custom home enclaves in the American Southwest.',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000',
    '{"lat": 33.71, "lng": -111.84}',
    1
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- REGION: PARADISE VALLEY
-- Neighborhoods: Paradise Valley, Gainey Ranch
-- =====================================================
INSERT INTO regions (slug, name, description, hero_image_url, coordinates, display_order) VALUES
(
    'paradise-valley',
    'Paradise Valley',
    'Paradise Valley stands as Arizona''s wealthiest municipality and most coveted residential enclave. This 16-square-mile town of just 14,000 residents maintains strict zoning that preserves its character of sprawling estates on minimum one-acre lots. Nestled between Camelback Mountain and Mummy Mountain, Paradise Valley offers unmatched privacy, world-class resorts, and easy access to Scottsdale''s finest dining and shopping.',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2000',
    '{"lat": 33.53, "lng": -111.94}',
    2
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- REGION: CENTRAL SCOTTSDALE
-- Neighborhoods: McCormick Ranch
-- =====================================================
INSERT INTO regions (slug, name, description, hero_image_url, coordinates, display_order) VALUES
(
    'central-scottsdale',
    'Central Scottsdale',
    'Central Scottsdale offers the perfect balance of urban convenience and desert beauty. From the vibrant energy of Old Town to the upscale shopping of Kierland and Scottsdale Quarter, this area provides walkable access to world-class dining, entertainment, and culture. Established communities like Gainey Ranch and McCormick Ranch offer mature landscaping and proven value, while newer developments bring contemporary living options.',
    'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=2000',
    '{"lat": 33.50, "lng": -111.92}',
    3
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- REGION: CAREFREE & CAVE CREEK
-- No seeded neighborhoods yet, but region exists in prototype
-- =====================================================
INSERT INTO regions (slug, name, description, hero_image_url, coordinates, display_order) VALUES
(
    'carefree-cave-creek',
    'Carefree & Cave Creek',
    'The twin communities of Carefree and Cave Creek offer a distinct alternative to the manicured golf communities of Scottsdale. Here, the Old West spirit lives on in a landscape of towering saguaros, dramatic boulder formations, and custom homes that celebrate authentic Southwestern architecture. Carefree''s famous sundial and European-inspired town center complement Cave Creek''s rustic saloons and art galleries.',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=2000',
    '{"lat": 33.82, "lng": -111.92}',
    4
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- REGION: ARCADIA & BILTMORE
-- Neighborhoods: Arcadia, Biltmore
-- Phoenix's Camelback Corridor luxury neighborhoods
-- =====================================================
INSERT INTO regions (slug, name, description, hero_image_url, coordinates, display_order) VALUES
(
    'arcadia-biltmore',
    'Arcadia & Biltmore',
    'The Camelback Corridor encompasses Phoenix''s most coveted neighborhoods at the base of Camelback Mountain. Arcadia''s tree-lined streets and citrus groves blend with the Biltmore''s Frank Lloyd Wright-inspired resort elegance to create a corridor of urban luxury unique in the Valley. Walkable to boutique shopping, acclaimed restaurants, and top-rated schools, this area attracts buyers who prize character, convenience, and cachet.',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=2000',
    '{"lat": 33.52, "lng": -112.00}',
    5
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- LINK NEIGHBORHOODS TO REGIONS
-- Maps each seeded neighborhood to its parent region
-- =====================================================

-- North Scottsdale: desert-mountain, troon-north, silverleaf, dc-ranch, ancala, grayhawk
UPDATE neighborhoods SET region_id = (SELECT id FROM regions WHERE slug = 'north-scottsdale')
WHERE slug IN ('desert-mountain', 'troon-north', 'silverleaf', 'dc-ranch', 'ancala', 'grayhawk');

-- Paradise Valley: paradise-valley, gainey-ranch
UPDATE neighborhoods SET region_id = (SELECT id FROM regions WHERE slug = 'paradise-valley')
WHERE slug IN ('paradise-valley', 'gainey-ranch');

-- Central Scottsdale: mccormick-ranch
UPDATE neighborhoods SET region_id = (SELECT id FROM regions WHERE slug = 'central-scottsdale')
WHERE slug = 'mccormick-ranch';

-- Arcadia & Biltmore: arcadia, biltmore
UPDATE neighborhoods SET region_id = (SELECT id FROM regions WHERE slug = 'arcadia-biltmore')
WHERE slug IN ('arcadia', 'biltmore');
