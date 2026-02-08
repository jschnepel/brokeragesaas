-- =====================================================
-- PHOENIX LUXURY PROPERTIES SEED DATA
-- Sample listings across luxury neighborhoods
-- =====================================================

-- Create properties table if not exists (simplified for seed)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID,

    -- MLS Data
    mls_number VARCHAR(20),
    data_source VARCHAR(50) DEFAULT 'manual',

    -- Location
    address VARCHAR(255) NOT NULL,
    unit_number VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) DEFAULT 'AZ',
    zip VARCHAR(10) NOT NULL,
    county VARCHAR(100) DEFAULT 'Maricopa',
    neighborhood_id UUID REFERENCES neighborhoods(id),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),

    -- Pricing
    price DECIMAL(15, 2) NOT NULL,
    original_price DECIMAL(15, 2),
    price_per_sqft DECIMAL(10, 2),

    -- Characteristics
    property_type VARCHAR(50) NOT NULL,
    beds INTEGER,
    baths DECIMAL(3, 1),
    sqft INTEGER,
    lot_sqft INTEGER,
    lot_acres DECIMAL(10, 4),
    year_built INTEGER,
    stories INTEGER,

    -- Features
    description TEXT,
    features JSONB DEFAULT '[]',
    interior_features JSONB DEFAULT '[]',
    exterior_features JSONB DEFAULT '[]',
    appliances JSONB DEFAULT '[]',

    -- Parking & Pool
    has_garage BOOLEAN DEFAULT false,
    garage_spaces INTEGER,
    has_pool BOOLEAN DEFAULT false,
    pool_features JSONB DEFAULT '[]',

    -- HOA
    has_hoa BOOLEAN DEFAULT false,
    hoa_fee DECIMAL(10, 2),
    hoa_frequency VARCHAR(20),

    -- Media
    photos JSONB DEFAULT '[]',
    virtual_tour_url VARCHAR(500),

    -- Status
    status VARCHAR(50) DEFAULT 'Active',
    days_on_market INTEGER DEFAULT 0,
    listed_at DATE,

    -- Attribution (IDX Required)
    listing_office_name VARCHAR(255) DEFAULT 'Russ Lyon Sotheby''s International Realty',
    listing_agent_name VARCHAR(255) DEFAULT 'Yong Choi',
    listing_agent_phone VARCHAR(50),
    listing_agent_email VARCHAR(255),

    -- Flags
    featured BOOLEAN DEFAULT false,
    luxury BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PARADISE VALLEY PROPERTIES
-- =====================================================

INSERT INTO properties (
    mls_number, address, city, zip,
    latitude, longitude,
    price, original_price, price_per_sqft,
    property_type, beds, baths, sqft, lot_acres, year_built, stories,
    description, features, interior_features, exterior_features,
    has_garage, garage_spaces, has_pool, pool_features,
    has_hoa, hoa_fee, hoa_frequency,
    photos, status, days_on_market, listed_at,
    featured, luxury
) VALUES
(
    'PV-2024-001',
    '5600 E Mockingbird Lane',
    'Paradise Valley', '85253',
    33.5285, -111.9380,
    8750000.00, 8950000.00, 892.00,
    'Estate', 6, 7.5, 9810, 2.15, 2021, 2,
    'Architectural masterpiece by Drewett Works on over 2 acres in the heart of Paradise Valley. This contemporary desert estate seamlessly blends indoor-outdoor living with walls of glass that frame Camelback Mountain views. The great room features 20-foot ceilings, a floating fireplace, and opens to the infinity-edge pool and outdoor entertaining pavilion. Chef''s kitchen with Gaggenau appliances, wine room, home theater, and separate guest casita. Smart home technology throughout.',
    '["Mountain Views", "Guest House", "Smart Home", "Wine Cellar", "Home Theater"]',
    '["Great Room", "Open Floor Plan", "Wet Bar", "Office/Study", "Fireplace", "High Ceilings"]',
    '["Infinity Pool", "Outdoor Kitchen", "Fire Pit", "Desert Landscaping", "Mountain Views"]',
    true, 4, true, '["Infinity Edge", "Heated", "Pebble Finish", "Spa"]',
    false, null, null,
    '[
        {"url": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200", "order": 1, "caption": "Front Exterior"},
        {"url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200", "order": 2, "caption": "Great Room"},
        {"url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200", "order": 3, "caption": "Pool & Mountain View"},
        {"url": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200", "order": 4, "caption": "Kitchen"}
    ]',
    'Active', 45, '2024-12-15',
    true, true
),
(
    'PV-2024-002',
    '7001 N Quartz Mountain Road',
    'Paradise Valley', '85253',
    33.5420, -111.9250,
    12500000.00, null, 1042.00,
    'Estate', 7, 9, 12000, 3.5, 2019, 2,
    'Extraordinary compound on 3.5 gated acres with unobstructed Mummy Mountain views. Main residence features imported Italian marble, custom millwork, and a 2,000-bottle wine cellar. Resort-style grounds include negative-edge pool with swim-up bar, tennis court, putting green, and separate 2-bedroom guest house. Six-car collector''s garage with climate control. Private helipad.',
    '["Tennis Court", "Guest House", "Helipad", "Wine Cellar", "Gated"]',
    '["Imported Marble", "Custom Millwork", "Butler''s Pantry", "Safe Room", "Elevator"]',
    '["Swim-up Bar", "Tennis Court", "Putting Green", "Outdoor Fireplace", "Sport Court"]',
    true, 6, true, '["Negative Edge", "Swim-up Bar", "Heated", "LED Lighting"]',
    false, null, null,
    '[
        {"url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200", "order": 1, "caption": "Estate Exterior"},
        {"url": "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200", "order": 2, "caption": "Living Room"},
        {"url": "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200", "order": 3, "caption": "Pool & Tennis Court"},
        {"url": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200", "order": 4, "caption": "Wine Cellar"}
    ]',
    'Active', 30, '2024-12-30',
    true, true
),
(
    'PV-2024-003',
    '4550 E Camelback Vista Drive',
    'Paradise Valley', '85253',
    33.5150, -111.9520,
    4250000.00, 4500000.00, 708.00,
    'Single Family', 5, 5.5, 6000, 1.02, 2018, 1,
    'Stunning single-level contemporary on over an acre with sweeping Camelback Mountain views. Open floor plan with disappearing glass walls creates seamless indoor-outdoor flow. Primary suite features private patio, spa-like bath with freestanding tub, and custom closet. Separate office, home gym, and temperature-controlled wine storage. Pool and spa with Camelback as your backdrop.',
    '["Single Level", "Mountain Views", "Home Gym", "Wine Storage"]',
    '["Disappearing Glass Walls", "Open Floor Plan", "Spa-Like Primary Bath", "Custom Closets"]',
    '["Covered Patio", "Built-in BBQ", "Fire Feature", "Low-Maintenance Landscaping"]',
    true, 3, true, '["Pebble Tec", "Spa", "Deck Jets", "Sunset Views"]',
    false, null, null,
    '[
        {"url": "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200", "order": 1, "caption": "Front Entry"},
        {"url": "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1200", "order": 2, "caption": "Living Area"},
        {"url": "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200", "order": 3, "caption": "Pool with Mountain View"}
    ]',
    'Active', 60, '2024-11-30',
    false, true
),

-- =====================================================
-- ARCADIA PROPERTIES
-- =====================================================
(
    'ARC-2024-001',
    '5801 E Calle Del Paisano',
    'Phoenix', '85018',
    33.5120, -111.9780,
    3450000.00, null, 575.00,
    'Single Family', 5, 4.5, 6000, 0.75, 2022, 2,
    'New construction in prime Arcadia Proper on a sprawling 33,000 SF lot. This modern farmhouse design features exposed beams, shiplap accents, and wide-plank oak floors throughout. Gourmet kitchen with Wolf/Sub-Zero appliances and massive island. Primary suite with fireplace, dual closets, and steam shower. Resort backyard with pool, turf, and mature citrus trees. Walk to La Grande Orange and Postino.',
    '["New Construction", "Walk to Dining", "Large Lot", "Modern Farmhouse"]',
    '["Exposed Beams", "Shiplap", "Wide-Plank Oak", "Steam Shower", "Dual Closets"]',
    '["Pool", "Citrus Trees", "Turf Yard", "Covered Patio", "Outdoor Shower"]',
    true, 3, true, '["Heated", "Pebble Finish", "LED Lighting"]',
    false, null, null,
    '[
        {"url": "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200", "order": 1, "caption": "Modern Farmhouse Exterior"},
        {"url": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200", "order": 2, "caption": "Open Kitchen"},
        {"url": "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200", "order": 3, "caption": "Backyard Oasis"}
    ]',
    'Active', 15, '2025-01-15',
    true, true
),
(
    'ARC-2024-002',
    '4620 E Calle Redonda',
    'Phoenix', '85018',
    33.5080, -111.9850,
    2175000.00, 2250000.00, 483.00,
    'Single Family', 4, 3.5, 4500, 0.52, 1958, 1,
    'Thoughtfully renovated 1958 ranch in the heart of Arcadia. Original character preserved with terrazzo floors, exposed brick, and beamed ceilings while adding modern conveniences. Updated kitchen and baths, new HVAC, electrical, and plumbing. Private backyard with vintage diving pool, mature landscaping, and detached casita perfect for guests or home office. Incredible location steps from trails.',
    '["Mid-Century", "Renovated", "Casita", "Character Home"]',
    '["Terrazzo Floors", "Exposed Brick", "Beamed Ceilings", "Updated Kitchen"]',
    '["Vintage Pool", "Diving Board", "Casita", "Mature Trees", "Mountain Views"]',
    true, 2, true, '["Vintage", "Diving Pool", "Original Tile"]',
    false, null, null,
    '[
        {"url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200", "order": 1, "caption": "Ranch Exterior"},
        {"url": "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=1200", "order": 2, "caption": "Living Room with Beams"}
    ]',
    'Active', 22, '2025-01-08',
    false, true
),

-- =====================================================
-- SILVERLEAF PROPERTIES
-- =====================================================
(
    'SL-2024-001',
    '10942 E Wingspan Way',
    'Scottsdale', '85255',
    33.7050, -111.8320,
    9500000.00, null, 950.00,
    'Estate', 5, 6.5, 10000, 1.8, 2020, 2,
    'Silverleaf masterpiece by Calvis Wyant on premium fairway lot with Four Peaks views. Desert contemporary architecture featuring floating planes, water features, and seamless glass walls. The chef''s kitchen rivals professional installations with Miele appliances and butler''s pantry. Outdoor living includes infinity pool, fire features, and built-in BBQ overlooking the 15th fairway. Full Silverleaf Club membership available.',
    '["Golf Course Lot", "Four Peaks Views", "Silverleaf Club", "Designer Home"]',
    '["Floating Planes", "Water Features", "Miele Appliances", "Wine Room", "Office"]',
    '["Infinity Pool", "Golf Course Views", "Fire Features", "Outdoor Living Room"]',
    true, 4, true, '["Infinity Edge", "Spa", "Fire Feature Integration"]',
    true, 4500.00, 'Quarterly',
    '[
        {"url": "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=1200", "order": 1, "caption": "Desert Contemporary Exterior"},
        {"url": "https://images.unsplash.com/photo-1600573472591-ee6981cf81ab?w=1200", "order": 2, "caption": "Great Room"},
        {"url": "https://images.unsplash.com/photo-1600566752229-250ed79470f8?w=1200", "order": 3, "caption": "Golf Course View"}
    ]',
    'Active', 55, '2024-12-05',
    true, true
),

-- =====================================================
-- DC RANCH PROPERTIES
-- =====================================================
(
    'DCR-2024-001',
    '9820 E Thompson Peak Parkway Unit 832',
    'Scottsdale', '85255',
    33.6820, -111.8580,
    875000.00, null, 350.00,
    'Townhome', 3, 2.5, 2500, 0, 2019, 2,
    'Lock-and-leave luxury in The Village at DC Ranch. This end-unit townhome offers low-maintenance living with access to all DC Ranch amenities. Open floor plan with 10-foot ceilings, quartz counters, and wood floors. Private courtyard and rooftop deck with mountain views. Walking distance to Market Street shops, restaurants, and community center.',
    '["Lock-and-Leave", "End Unit", "Rooftop Deck", "Walk to Market Street"]',
    '["10-Foot Ceilings", "Quartz Counters", "Wood Floors", "Open Floor Plan"]',
    '["Private Courtyard", "Rooftop Deck", "Mountain Views"]',
    true, 2, false, '[]',
    true, 450.00, 'Monthly',
    '[
        {"url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200", "order": 1, "caption": "Townhome Exterior"},
        {"url": "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1200", "order": 2, "caption": "Open Living Area"}
    ]',
    'Active', 12, '2025-01-18',
    false, false
),
(
    'DCR-2024-002',
    '20084 N 92nd Street',
    'Scottsdale', '85255',
    33.6890, -111.8490,
    2850000.00, 2950000.00, 475.00,
    'Single Family', 5, 4.5, 6000, 0.65, 2016, 2,
    'Spectacular Country Club at DC Ranch home with sweeping McDowell Mountain views. This Camelot-built home features a great room with stacked stone fireplace, gourmet kitchen with Sub-Zero/Wolf, and expansive multi-slide doors to the backyard. Primary suite with sitting area, fireplace, and spa bath. Pool with water feature, built-in BBQ, and multiple covered patios.',
    '["Mountain Views", "Great Room", "Builder Upgrades", "DC Ranch CC"]',
    '["Stacked Stone Fireplace", "Sub-Zero/Wolf", "Multi-Slide Doors", "Sitting Room"]',
    '["Pool", "Water Feature", "Built-in BBQ", "Multiple Patios", "View Fencing"]',
    true, 3, true, '["Heated", "Water Feature", "Travertine Deck"]',
    true, 350.00, 'Monthly',
    '[
        {"url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200", "order": 1, "caption": "Front Exterior"},
        {"url": "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=1200", "order": 2, "caption": "Great Room"},
        {"url": "https://images.unsplash.com/photo-1600573472591-ee6981cf81ab?w=1200", "order": 3, "caption": "Pool & Mountains"}
    ]',
    'Active', 35, '2024-12-25',
    true, true
),

-- =====================================================
-- BILTMORE PROPERTIES
-- =====================================================
(
    'BLT-2024-001',
    '2211 E Colter Street',
    'Phoenix', '85016',
    33.5180, -112.0180,
    1650000.00, null, 412.00,
    'Single Family', 4, 3.5, 4000, 0.35, 2015, 2,
    'Elegant Biltmore Estates home on quiet cul-de-sac with golf course views. Santa Barbara style with arched doorways, wood beams, and travertine floors. Chef''s kitchen opens to family room with fireplace. Primary suite downstairs with private patio access. Three additional bedrooms upstairs plus loft. Backyard features pool, spa, and built-in BBQ with views of Adobe golf course.',
    '["Golf Course Views", "Cul-de-sac", "Santa Barbara Style", "Guard-Gated"]',
    '["Arched Doorways", "Wood Beams", "Travertine", "Downstairs Primary"]',
    '["Pool", "Spa", "Golf Views", "Built-in BBQ", "Mature Landscaping"]',
    true, 3, true, '["Heated", "Spa", "Salt Water"]',
    true, 550.00, 'Monthly',
    '[
        {"url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200", "order": 1, "caption": "Santa Barbara Style Exterior"},
        {"url": "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1200", "order": 2, "caption": "Living Room"}
    ]',
    'Active', 18, '2025-01-12',
    false, true
),

-- =====================================================
-- DESERT MOUNTAIN PROPERTIES
-- =====================================================
(
    'DM-2024-001',
    '41915 N 102nd Place',
    'Scottsdale', '85262',
    33.8120, -111.7850,
    3750000.00, 3900000.00, 535.00,
    'Single Family', 4, 4.5, 7000, 1.25, 2017, 2,
    'Stunning Desert Mountain estate with unobstructed sunset views and Chiricahua golf course frontage. Clean-lined contemporary design by PHX Architecture featuring stone, steel, and glass. Walls of windows frame the ever-changing desert landscape. Gourmet kitchen, wine room, home theater, and fitness room. Outdoor living includes infinity pool, multiple fire features, and outdoor kitchen. Full golf membership available.',
    '["Golf Frontage", "Sunset Views", "Contemporary", "Full Membership"]',
    '["Stone/Steel/Glass", "Home Theater", "Wine Room", "Fitness Room"]',
    '["Infinity Pool", "Fire Features", "Outdoor Kitchen", "Golf Views"]',
    true, 4, true, '["Infinity Edge", "Fire Bowl Integration", "Deck Jets"]',
    true, 1500.00, 'Quarterly',
    '[
        {"url": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200", "order": 1, "caption": "Contemporary Exterior"},
        {"url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200", "order": 2, "caption": "Sunset Views"}
    ]',
    'Active', 48, '2024-12-10',
    false, true
),

-- =====================================================
-- TROON NORTH PROPERTIES
-- =====================================================
(
    'TN-2024-001',
    '27565 N 103rd Way',
    'Scottsdale', '85262',
    33.7480, -111.8480,
    2450000.00, null, 490.00,
    'Single Family', 4, 4, 5000, 1.1, 2014, 1,
    'Pinnacle Peak views from this single-level Troon North home on over an acre. Soft contemporary desert architecture with natural stone, copper accents, and walls of glass. Great room with fireplace and wet bar opens to expansive covered patio. Chef''s kitchen with professional appliances. Primary suite with mountain views, sitting area, and spa bath. Pool and spa nestled among boulders.',
    '["Pinnacle Peak Views", "Single Level", "Boulder Lot", "Soft Contemporary"]',
    '["Natural Stone", "Copper Accents", "Wet Bar", "Spa Bath"]',
    '["Boulder Integration", "Pool", "Spa", "Covered Patio", "Mountain Views"]',
    true, 3, true, '["Rock Integration", "Heated", "Spa"]',
    true, 275.00, 'Monthly',
    '[
        {"url": "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=1200", "order": 1, "caption": "Desert Contemporary"},
        {"url": "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200", "order": 2, "caption": "Pool with Boulders"}
    ]',
    'Active', 28, '2025-01-02',
    false, true
),

-- =====================================================
-- GAINEY RANCH PROPERTY
-- =====================================================
(
    'GR-2024-001',
    '7760 E Gainey Ranch Road Unit 4',
    'Scottsdale', '85258',
    33.5360, -111.8960,
    1250000.00, 1350000.00, 416.00,
    'Patio Home', 3, 3, 3000, 0, 2008, 1,
    'Single-level patio home in guard-gated Gainey Ranch on premium greenbelt lot. Remodeled throughout with designer finishes including European oak floors, quartz counters, and custom cabinetry. Great room with fireplace opens to private patio with water feature and golf course views. Primary suite with renovated bath featuring freestanding tub and walk-in shower. Community pool and fitness center steps away.',
    '["Guard-Gated", "Golf Views", "Remodeled", "Single Level"]',
    '["European Oak", "Quartz", "Custom Cabinetry", "Freestanding Tub"]',
    '["Private Patio", "Water Feature", "Golf Course Views", "Low Maintenance"]',
    true, 2, false, '[]',
    true, 875.00, 'Monthly',
    '[
        {"url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200", "order": 1, "caption": "Patio Home Exterior"},
        {"url": "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1200", "order": 2, "caption": "Great Room"}
    ]',
    'Active', 40, '2024-12-20',
    false, false
);

-- Update neighborhood references
UPDATE properties SET neighborhood_id = (SELECT id FROM neighborhoods WHERE slug = 'paradise-valley') WHERE city = 'Paradise Valley';
UPDATE properties SET neighborhood_id = (SELECT id FROM neighborhoods WHERE slug = 'arcadia') WHERE address LIKE '%Calle%' AND city = 'Phoenix';
UPDATE properties SET neighborhood_id = (SELECT id FROM neighborhoods WHERE slug = 'silverleaf') WHERE mls_number LIKE 'SL%';
UPDATE properties SET neighborhood_id = (SELECT id FROM neighborhoods WHERE slug = 'dc-ranch') WHERE mls_number LIKE 'DCR%';
UPDATE properties SET neighborhood_id = (SELECT id FROM neighborhoods WHERE slug = 'biltmore') WHERE mls_number LIKE 'BLT%';
UPDATE properties SET neighborhood_id = (SELECT id FROM neighborhoods WHERE slug = 'desert-mountain') WHERE mls_number LIKE 'DM%';
UPDATE properties SET neighborhood_id = (SELECT id FROM neighborhoods WHERE slug = 'troon-north') WHERE mls_number LIKE 'TN%';
UPDATE properties SET neighborhood_id = (SELECT id FROM neighborhoods WHERE slug = 'gainey-ranch') WHERE mls_number LIKE 'GR%';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood_id);
