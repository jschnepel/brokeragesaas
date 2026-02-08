-- =====================================================
-- PHOENIX LUXURY NEIGHBORHOODS SEED DATA
-- Focus: Paradise Valley, Scottsdale, Arcadia, Biltmore
-- =====================================================

-- Create neighborhoods table if not exists
CREATE TABLE IF NOT EXISTS neighborhoods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) DEFAULT 'AZ',
    description TEXT,
    short_description VARCHAR(500),
    hero_image_url VARCHAR(500),
    gallery_images JSONB DEFAULT '[]',

    -- Location data
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    zip_codes JSONB DEFAULT '[]',

    -- Market stats
    median_price DECIMAL(15, 2),
    avg_price_per_sqft DECIMAL(10, 2),
    avg_days_on_market INTEGER,
    total_listings INTEGER DEFAULT 0,
    price_range_low DECIMAL(15, 2),
    price_range_high DECIMAL(15, 2),

    -- Characteristics
    property_types JSONB DEFAULT '[]',
    lifestyle_tags JSONB DEFAULT '[]',
    amenities JSONB DEFAULT '[]',
    school_district VARCHAR(255),

    -- Display
    featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PARADISE VALLEY
-- Arizona's most exclusive enclave
-- =====================================================
INSERT INTO neighborhoods (
    slug, name, city, description, short_description,
    latitude, longitude, zip_codes,
    median_price, avg_price_per_sqft, avg_days_on_market,
    price_range_low, price_range_high,
    property_types, lifestyle_tags, amenities, school_district,
    featured, display_order
) VALUES (
    'paradise-valley',
    'Paradise Valley',
    'Paradise Valley',
    'Paradise Valley is Arizona''s most prestigious residential community, home to exclusive estates nestled against Camelback Mountain and Mummy Mountain. This town of approximately 14,000 residents maintains a rural atmosphere with no commercial development, preserving its character as a sanctuary for those seeking privacy and luxury. World-class resorts like The Phoenician and Sanctuary on Camelback Mountain border the community, offering residents access to championship golf, spa services, and fine dining. Properties here range from elegant mid-century modern homes to sprawling contemporary estates with panoramic mountain and city views.',
    'Arizona''s most exclusive residential enclave featuring mountain estates and world-class resorts',
    33.5310, -111.9426,
    '["85253"]',
    4850000.00, 625.00, 95,
    1500000.00, 35000000.00,
    '["Single Family", "Estate", "Custom Home"]',
    '["Luxury", "Golf", "Mountain Views", "Resort Living", "Privacy", "Equestrian"]',
    '["Private Golf Clubs", "World-Class Resorts", "Hiking Trails", "Tennis", "Spa & Wellness"]',
    'Paradise Valley Unified School District',
    true, 1
),

-- =====================================================
-- ARCADIA
-- Historic luxury at the base of Camelback Mountain
-- =====================================================
(
    'arcadia',
    'Arcadia',
    'Phoenix',
    'Arcadia is Phoenix''s most coveted neighborhood, stretching from the slopes of Camelback Mountain south to the Arizona Canal. Known for its tree-lined streets, citrus groves, and architectural diversity, Arcadia attracts buyers seeking character homes with generous lots. The neighborhood is divided into Arcadia Proper (north of Indian School Road) and Arcadia Lite (south), both offering walkability to boutique shopping, acclaimed restaurants, and top-rated schools. Historic ranches sit alongside contemporary new builds, creating an eclectic mix that defines Phoenix luxury living.',
    'Tree-lined streets and citrus groves at the base of Camelback Mountain',
    33.5090, -111.9830,
    '["85018", "85016", "85008"]',
    2250000.00, 485.00, 45,
    850000.00, 12000000.00,
    '["Single Family", "Ranch", "Contemporary", "Historic"]',
    '["Walkable", "Family-Friendly", "Urban Luxury", "Historic Character", "Foodie Scene"]',
    '["Camelback Mountain Hiking", "La Grande Orange", "Postino", "Top Schools", "Arizona Canal"]',
    'Scottsdale Unified School District',
    true, 2
),

-- =====================================================
-- BILTMORE
-- Resort-style living with championship golf
-- =====================================================
(
    'biltmore',
    'Biltmore',
    'Phoenix',
    'The Biltmore area encompasses the iconic Arizona Biltmore Resort and its surrounding residential communities, representing Phoenix''s original luxury destination since 1929. Guard-gated enclaves like Biltmore Estates and Biltmore Mountain Estates offer security and exclusivity, while the Arizona Biltmore Golf Club provides two championship courses designed by William Bell. The Frank Lloyd Wright-inspired architecture of the resort influences the aesthetic throughout, creating a cohesive sense of timeless elegance. Residents enjoy proximity to the Biltmore Fashion Park, upscale dining, and cultural venues.',
    'Iconic resort community with Frank Lloyd Wright-inspired architecture',
    33.5220, -112.0210,
    '["85016", "85018"]',
    1850000.00, 425.00, 55,
    650000.00, 8500000.00,
    '["Single Family", "Townhome", "Patio Home", "Estate"]',
    '["Golf", "Resort Living", "Guard-Gated", "Historic", "Shopping"]',
    '["Arizona Biltmore Golf Club", "Biltmore Fashion Park", "Guard-Gated Communities", "Spa & Dining"]',
    'Phoenix Union High School District',
    true, 3
),

-- =====================================================
-- DC RANCH
-- Scottsdale's premier master-planned community
-- =====================================================
(
    'dc-ranch',
    'DC Ranch',
    'Scottsdale',
    'DC Ranch is a 4,000-acre master-planned community in North Scottsdale, consistently ranked among America''s best places to live. The community offers diverse neighborhoods from The Village at DC Ranch with its main-street shopping to the ultra-exclusive Silverleaf enclave. Residents enjoy two championship golf courses, the DC Ranch Community Council''s extensive programming, miles of hiking trails, and the Market Street district for dining and shopping. The McDowell Sonoran Preserve borders the community, providing thousands of acres of protected desert landscape.',
    'Premier master-planned community with world-class amenities',
    33.6850, -111.8550,
    '["85255", "85262"]',
    2650000.00, 485.00, 65,
    800000.00, 15000000.00,
    '["Single Family", "Custom Home", "Townhome", "Patio Home"]',
    '["Golf", "Family-Friendly", "Trails", "Community Events", "Shopping Village"]',
    '["Country Club at DC Ranch", "Market Street", "Community Center", "Desert Trails", "McDowell Sonoran Preserve"]',
    'Scottsdale Unified School District',
    true, 4
),

-- =====================================================
-- SILVERLEAF
-- Ultra-luxury within DC Ranch
-- =====================================================
(
    'silverleaf',
    'Silverleaf at DC Ranch',
    'Scottsdale',
    'Silverleaf represents the pinnacle of Arizona luxury living, an ultra-exclusive community within DC Ranch featuring custom estates on premium homesites. The Tom Weiskopf-designed Silverleaf Club offers a private 18-hole golf course, a 50,000-square-foot clubhouse, spa, fitness center, and multiple dining venues. Membership is by invitation only. Homesites range from one to five acres with dramatic views of the McDowell Mountains, Four Peaks, and city lights. Architecture emphasizes integration with the desert landscape, featuring stone, copper, and sustainable design elements.',
    'Ultra-exclusive enclave with private Tom Weiskopf golf course',
    33.7020, -111.8350,
    '["85255"]',
    6500000.00, 750.00, 120,
    3000000.00, 25000000.00,
    '["Estate", "Custom Home"]',
    '["Ultra-Luxury", "Private Golf", "Mountain Views", "Exclusivity", "Desert Contemporary"]',
    '["Silverleaf Club (Private)", "Spa & Wellness", "Fine Dining", "Concierge Services"]',
    'Scottsdale Unified School District',
    true, 5
),

-- =====================================================
-- DESERT MOUNTAIN
-- Six championship golf courses
-- =====================================================
(
    'desert-mountain',
    'Desert Mountain',
    'Scottsdale',
    'Desert Mountain is an 8,300-acre private community in the Sonoran Desert foothills, renowned for having six Jack Nicklaus-designed golf courses. This gated community offers diverse residential options from villas to sprawling estates, all with access to the 55,000-square-foot Sonoran Clubhouse. Beyond golf, amenities include tennis, hiking, fitness, and dining facilities. The community''s elevation provides cooler temperatures and spectacular views of the desert landscape. Desert Mountain is ideal for active adults seeking a resort-caliber lifestyle.',
    'Private community with six Jack Nicklaus golf courses',
    33.8150, -111.7820,
    '["85262"]',
    2150000.00, 435.00, 85,
    600000.00, 12000000.00,
    '["Single Family", "Villa", "Estate", "Custom Home"]',
    '["Golf", "Tennis", "Active Adult", "Gated", "Mountain Views"]',
    '["Six Golf Courses", "Sonoran Clubhouse", "Tennis Center", "Hiking Trails", "Multiple Dining Venues"]',
    'Cave Creek Unified School District',
    true, 6
),

-- =====================================================
-- TROON NORTH
-- High desert luxury
-- =====================================================
(
    'troon-north',
    'Troon North',
    'Scottsdale',
    'Troon North is a collection of luxury communities surrounding the acclaimed Troon North Golf Club in North Scottsdale. Named after the famous Scottish links, this area offers a mix of custom home neighborhoods including Troon Village, Pinnacle Peak Estates, and Candlewood Estates. Two Tom Weiskopf-designed courses, Monument and Pinnacle, provide challenging desert golf. Homes feature dramatic boulder outcroppings, saguaro-studded lots, and views of Pinnacle Peak. The area maintains a natural desert aesthetic with minimal lighting to preserve dark skies.',
    'High desert luxury surrounding world-class Troon North Golf Club',
    33.7450, -111.8520,
    '["85262", "85255"]',
    1950000.00, 410.00, 70,
    700000.00, 8000000.00,
    '["Single Family", "Custom Home", "Estate"]',
    '["Golf", "Desert Views", "Natural Desert", "Dark Skies", "Hiking"]',
    '["Troon North Golf Club", "Pinnacle Peak Hiking", "Desert Landscape", "Boulder Formations"]',
    'Cave Creek Unified School District',
    false, 7
),

-- =====================================================
-- MCCORMICK RANCH
-- Established lakeside community
-- =====================================================
(
    'mccormick-ranch',
    'McCormick Ranch',
    'Scottsdale',
    'McCormick Ranch is one of Scottsdale''s original master-planned communities, developed on the former McCormick family ranch. This established neighborhood features two man-made lakes, miles of paths for biking and jogging, and the McCormick Ranch Golf Club with two courses. The community offers excellent access to Old Town Scottsdale, top schools, and major employers. Housing ranges from condominiums to lakefront estates, making it accessible to various buyers while maintaining high standards.',
    'Established lakeside community with excellent Scottsdale access',
    33.5420, -111.9050,
    '["85258", "85260"]',
    1150000.00, 365.00, 40,
    450000.00, 4500000.00,
    '["Single Family", "Townhome", "Patio Home", "Lakefront"]',
    '["Lakeside", "Biking", "Golf", "Established", "Central Location"]',
    '["McCormick Ranch Golf Club", "Lakeside Paths", "Parks", "Community Events"]',
    'Scottsdale Unified School District',
    false, 8
),

-- =====================================================
-- GAINEY RANCH
-- Guard-gated Scottsdale elegance
-- =====================================================
(
    'gainey-ranch',
    'Gainey Ranch',
    'Scottsdale',
    'Gainey Ranch is a prestigious 640-acre guard-gated community in central Scottsdale, offering privacy and luxury just minutes from shopping, dining, and entertainment. The community centers around the Gainey Ranch Golf Club with 27 holes of championship golf. Architectural styles range from Southwestern to contemporary, all held to strict design standards that maintain community character. The Hyatt Regency Scottsdale resort borders the community, providing residents with additional amenities.',
    'Guard-gated elegance in central Scottsdale',
    33.5380, -111.8980,
    '["85258"]',
    1750000.00, 395.00, 60,
    600000.00, 6000000.00,
    '["Single Family", "Patio Home", "Townhome"]',
    '["Guard-Gated", "Golf", "Central Location", "Privacy", "Resort Adjacent"]',
    '["Gainey Ranch Golf Club", "Guard-Gated Security", "Hyatt Regency Access", "Lakes & Paths"]',
    'Scottsdale Unified School District',
    false, 9
),

-- =====================================================
-- ANCALA
-- Scottsdale foothills retreat
-- =====================================================
(
    'ancala',
    'Ancala',
    'Scottsdale',
    'Ancala is a private, guard-gated community in the Scottsdale foothills offering panoramic views of the McDowell Mountains and city lights. The community includes Ancala Country Club with an 18-hole championship course, tennis facilities, and dining. Homes range from elegant golf villas to custom estates on larger lots. The elevated location provides natural breezes and cooler temperatures, while maintaining proximity to Scottsdale''s attractions.',
    'Private foothills community with country club lifestyle',
    33.6150, -111.8620,
    '["85255", "85260"]',
    1650000.00, 385.00, 75,
    550000.00, 5500000.00,
    '["Single Family", "Custom Home", "Villa"]',
    '["Guard-Gated", "Golf", "Mountain Views", "Country Club", "Foothills"]',
    '["Ancala Country Club", "Tennis", "Fitness Center", "Mountain Views"]',
    'Scottsdale Unified School District',
    false, 10
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city ON neighborhoods(city);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_featured ON neighborhoods(featured);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_slug ON neighborhoods(slug);
