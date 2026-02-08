-- =====================================================
-- YONG CHOI AGENT SEED DATA
-- Primary agent for the platform
-- =====================================================

-- Create user for Yong
INSERT INTO users (
    id, cognito_id, email, role, status, email_verified, email_verified_at
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'cognito-yong-placeholder',
    'yong@yongchoirealestate.com',
    'agent_admin',
    'active',
    true,
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create user profile for Yong
INSERT INTO user_profiles (
    user_id, first_name, last_name, display_name, phone, timezone
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Yong',
    'Choi',
    'Yong Choi',
    '(480) 555-0188',
    'America/Phoenix'
) ON CONFLICT (user_id) DO NOTHING;

-- Create agent profile for Yong
INSERT INTO agents (
    id,
    user_id,
    license_number,
    license_state,
    license_expiry,
    brokerage_name,
    brokerage_address,
    brokerage_phone,
    nrds_id,
    mls_ids,
    tier,
    specializations,
    bio,
    social_links,
    active,
    onboarding_completed
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'SA123456789',
    'AZ',
    '2026-12-31',
    'Russ Lyon Sotheby''s International Realty',
    '7135 E Camelback Rd #100, Scottsdale, AZ 85251',
    '(480) 603-3310',
    'NRDS123456',
    '[{"mls": "ARMLS", "member_id": "YC12345"}]',
    'premium',
    '["Luxury Homes", "Paradise Valley", "Scottsdale", "Investment Properties", "Relocation"]',
    'Yong Choi brings a unique blend of financial expertise and real estate acumen to Arizona''s luxury market. With a background in investment banking and over a decade of experience in Phoenix-area real estate, Yong specializes in helping discerning clients find exceptional properties in Paradise Valley, Scottsdale, and the greater Phoenix area.

As a member of Russ Lyon Sotheby''s International Realty, Yong leverages the world''s most prestigious luxury brand to provide unparalleled marketing exposure for sellers and exclusive access to off-market opportunities for buyers. His analytical approach, combined with deep local knowledge, ensures clients make informed decisions in every transaction.

Whether you''re seeking a contemporary estate in Paradise Valley, a golf course home in Silverleaf, or an investment property with strong returns, Yong''s commitment to excellence and client satisfaction makes the journey as rewarding as the destination.',
    '{"linkedin": "https://linkedin.com/in/yongchoi", "instagram": "https://instagram.com/yongchoirealestate", "facebook": "https://facebook.com/yongchoirealestate"}',
    true,
    true
);

-- Create agent site configuration
INSERT INTO agent_sites (
    id,
    agent_id,
    domain,
    subdomain,
    site_name,
    tagline,
    status,
    primary_color,
    secondary_color,
    font_heading,
    font_body,
    seo_title,
    seo_description,
    contact_email,
    contact_phone,
    office_address,
    office_hours,
    social_links,
    ssl_status,
    dns_verified
) VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'yongchoirealestate.com',
    'yong',
    'Yong Choi Real Estate',
    'Luxury Arizona Living, Expertly Curated',
    'active',
    '#1a365d',  -- Deep navy blue
    '#c6a052',  -- Warm gold
    'Playfair Display',
    'Inter',
    'Yong Choi | Luxury Arizona Real Estate | Russ Lyon Sotheby''s',
    'Discover exceptional luxury properties in Paradise Valley, Scottsdale, and Phoenix with Yong Choi of Russ Lyon Sotheby''s International Realty. Expert guidance for discerning buyers and sellers.',
    'yong@yongchoirealestate.com',
    '(480) 555-0188',
    '7135 E Camelback Rd #100, Scottsdale, AZ 85251',
    '{"monday": "9:00 AM - 6:00 PM", "tuesday": "9:00 AM - 6:00 PM", "wednesday": "9:00 AM - 6:00 PM", "thursday": "9:00 AM - 6:00 PM", "friday": "9:00 AM - 6:00 PM", "saturday": "10:00 AM - 4:00 PM", "sunday": "By Appointment"}',
    '{"linkedin": "https://linkedin.com/in/yongchoi", "instagram": "https://instagram.com/yongchoirealestate", "facebook": "https://facebook.com/yongchoirealestate"}',
    'active',
    true
);

-- Update all properties to belong to Yong
UPDATE properties SET
    agent_id = 'b0000000-0000-0000-0000-000000000001',
    listing_agent_name = 'Yong Choi',
    listing_agent_phone = '(480) 555-0188',
    listing_agent_email = 'yong@yongchoirealestate.com'
WHERE agent_id IS NULL;

-- =====================================================
-- SAMPLE TESTIMONIALS
-- =====================================================

CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_location VARCHAR(255),
    client_photo_url VARCHAR(500),
    testimonial_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    property_type VARCHAR(100),
    transaction_type VARCHAR(50), -- 'buyer', 'seller', 'both'
    transaction_date DATE,
    featured BOOLEAN DEFAULT false,
    approved BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO testimonials (
    agent_id, client_name, client_location, testimonial_text, rating,
    property_type, transaction_type, transaction_date, featured, display_order
) VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'Michael & Jennifer R.',
    'Paradise Valley',
    'Yong''s expertise in the Paradise Valley market was invaluable. He found us our dream home before it even hit the market and negotiated terms that exceeded our expectations. His financial background gave us confidence throughout the process, and his attention to detail ensured a smooth closing. We couldn''t be happier with our new estate.',
    5,
    'Estate',
    'buyer',
    '2024-06-15',
    true, 1
),
(
    'b0000000-0000-0000-0000-000000000001',
    'David L.',
    'Silverleaf at DC Ranch',
    'After interviewing several luxury agents, we chose Yong to sell our Silverleaf home. His marketing strategy, including professional photography, virtual tours, and targeted outreach to qualified buyers, resulted in multiple offers within the first week. He achieved a sale price above our expectations and handled every detail professionally.',
    5,
    'Custom Home',
    'seller',
    '2024-09-20',
    true, 2
),
(
    'b0000000-0000-0000-0000-000000000001',
    'Sarah & Tom W.',
    'Arcadia',
    'Relocating from the Bay Area, we were unfamiliar with the Phoenix market. Yong took the time to educate us on different neighborhoods, school districts, and lifestyle options. He was patient as we refined our search and ultimately found us a beautiful Arcadia home that checked every box. His responsiveness and market knowledge made a stressful process enjoyable.',
    5,
    'Single Family',
    'buyer',
    '2024-11-10',
    true, 3
),
(
    'b0000000-0000-0000-0000-000000000001',
    'Robert M.',
    'Biltmore',
    'I''ve bought and sold multiple properties with Yong over the years. His consistency, integrity, and market expertise keep me coming back. Whether it''s a personal residence or investment property, Yong treats every transaction with the same level of care and professionalism.',
    5,
    'Various',
    'both',
    '2024-08-05',
    false, 4
),
(
    'b0000000-0000-0000-0000-000000000001',
    'The Patterson Family',
    'DC Ranch',
    'As first-time luxury home buyers, we appreciated Yong''s guidance through every step. He explained the nuances of HOA communities, helped us understand the true cost of ownership, and connected us with excellent inspectors and lenders. Our DC Ranch home is everything we wanted and more.',
    5,
    'Single Family',
    'buyer',
    '2024-07-22',
    false, 5
);

-- =====================================================
-- MARKET STATISTICS (for analytics display)
-- =====================================================

CREATE TABLE IF NOT EXISTS market_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_id UUID REFERENCES neighborhoods(id),
    city VARCHAR(100),
    period_type VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Price metrics
    median_sale_price DECIMAL(15, 2),
    avg_sale_price DECIMAL(15, 2),
    price_per_sqft DECIMAL(10, 2),
    price_change_yoy DECIMAL(5, 2), -- year over year % change

    -- Volume metrics
    homes_sold INTEGER,
    new_listings INTEGER,
    active_listings INTEGER,
    pending_sales INTEGER,

    -- Time metrics
    avg_days_on_market INTEGER,
    median_days_on_market INTEGER,

    -- Ratio metrics
    list_to_sale_ratio DECIMAL(5, 3), -- e.g., 0.985 = 98.5%
    months_of_inventory DECIMAL(4, 2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Phoenix metro market data (recent months)
INSERT INTO market_statistics (
    city, period_type, period_start, period_end,
    median_sale_price, avg_sale_price, price_per_sqft, price_change_yoy,
    homes_sold, new_listings, active_listings, pending_sales,
    avg_days_on_market, median_days_on_market,
    list_to_sale_ratio, months_of_inventory
) VALUES
-- Paradise Valley
('Paradise Valley', 'monthly', '2025-01-01', '2025-01-31', 4250000, 5850000, 615.00, 8.5, 12, 18, 85, 8, 95, 78, 0.965, 7.1),
('Paradise Valley', 'monthly', '2024-12-01', '2024-12-31', 4100000, 5650000, 608.00, 7.2, 10, 15, 78, 6, 88, 72, 0.968, 7.8),
('Paradise Valley', 'monthly', '2024-11-01', '2024-11-30', 4350000, 5920000, 622.00, 9.1, 14, 20, 72, 9, 82, 68, 0.972, 5.1),

-- Scottsdale (aggregate)
('Scottsdale', 'monthly', '2025-01-01', '2025-01-31', 1150000, 1850000, 425.00, 6.8, 245, 380, 1250, 165, 52, 38, 0.978, 5.1),
('Scottsdale', 'monthly', '2024-12-01', '2024-12-31', 1125000, 1780000, 418.00, 5.9, 220, 350, 1180, 150, 48, 35, 0.982, 5.4),
('Scottsdale', 'monthly', '2024-11-01', '2024-11-30', 1180000, 1920000, 432.00, 7.5, 265, 410, 1120, 175, 45, 32, 0.985, 4.2),

-- Phoenix (Arcadia/Biltmore areas)
('Phoenix', 'monthly', '2025-01-01', '2025-01-31', 875000, 1250000, 385.00, 5.2, 85, 120, 420, 55, 42, 32, 0.982, 4.9),
('Phoenix', 'monthly', '2024-12-01', '2024-12-31', 850000, 1180000, 378.00, 4.8, 78, 105, 395, 48, 38, 28, 0.985, 5.1),
('Phoenix', 'monthly', '2024-11-01', '2024-11-30', 895000, 1320000, 392.00, 6.1, 92, 135, 365, 62, 35, 26, 0.988, 4.0);

-- Insert neighborhood-specific data
INSERT INTO market_statistics (
    neighborhood_id, city, period_type, period_start, period_end,
    median_sale_price, avg_sale_price, price_per_sqft, price_change_yoy,
    homes_sold, new_listings, active_listings,
    avg_days_on_market, list_to_sale_ratio, months_of_inventory
)
SELECT
    n.id,
    n.city,
    'monthly',
    '2025-01-01',
    '2025-01-31',
    n.median_price,
    n.median_price * 1.15, -- avg typically higher for luxury
    n.avg_price_per_sqft,
    CASE
        WHEN n.slug = 'paradise-valley' THEN 8.5
        WHEN n.slug = 'silverleaf' THEN 12.2
        WHEN n.slug = 'arcadia' THEN 6.8
        ELSE 5.5
    END,
    FLOOR(RANDOM() * 15 + 5)::INTEGER,
    FLOOR(RANDOM() * 20 + 8)::INTEGER,
    n.total_listings,
    n.avg_days_on_market,
    0.975,
    ROUND((RANDOM() * 4 + 3)::NUMERIC, 1)
FROM neighborhoods n;

CREATE INDEX IF NOT EXISTS idx_market_stats_city ON market_statistics(city, period_start);
CREATE INDEX IF NOT EXISTS idx_market_stats_neighborhood ON market_statistics(neighborhood_id, period_start);
