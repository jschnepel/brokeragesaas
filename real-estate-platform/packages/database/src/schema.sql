-- Real Estate Platform Database Schema
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- AGENTS TABLE
-- ============================================
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    brokerage_name VARCHAR(255),
    license_number VARCHAR(100),
    bio TEXT,
    photo_url TEXT,
    logo_url TEXT,
    tier VARCHAR(50) NOT NULL DEFAULT 'template' CHECK (tier IN ('premium', 'template')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AGENT SITES TABLE
-- ============================================
CREATE TABLE agent_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,
    brand_colors JSONB DEFAULT '{"primary": "#0284c7", "secondary": "#71717a"}',
    site_config JSONB DEFAULT '{}',
    template_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_sites_domain ON agent_sites(domain);
CREATE INDEX idx_agent_sites_agent_id ON agent_sites(agent_id);

-- ============================================
-- SITE TEMPLATES TABLE
-- ============================================
CREATE TABLE site_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    config JSONB DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SITE FEATURES TABLE
-- ============================================
CREATE TABLE site_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    default_value JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AGENT FEATURES TABLE
-- ============================================
CREATE TABLE agent_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES site_features(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    feature_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, feature_id)
);

CREATE INDEX idx_agent_features_agent_id ON agent_features(agent_id);

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    data_source VARCHAR(50) NOT NULL CHECK (data_source IN ('armls', 'crmls', 'bridge', 'manual')),

    -- Address
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip VARCHAR(20) NOT NULL,

    -- Property Details
    price DECIMAL(15, 2) NOT NULL,
    beds INTEGER,
    baths DECIMAL(4, 2),
    sqft INTEGER,
    lot_size_sqft INTEGER,
    year_built INTEGER,
    property_type VARCHAR(100),

    -- Listing Details
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Sold', 'Off Market')),
    list_date DATE,
    sold_date DATE,
    sold_price DECIMAL(15, 2),
    days_on_market INTEGER,

    -- Content
    description TEXT,
    features JSONB DEFAULT '{}',
    photos JSONB DEFAULT '[]',
    virtual_tour_url TEXT,

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    neighborhood VARCHAR(255),

    -- Metadata
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(agent_id, external_id, data_source)
);

CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_price ON properties(price);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

    -- Contact Info
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),

    -- Lead Details
    message TEXT,
    source VARCHAR(100) DEFAULT 'website',
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_agent_id ON leads(agent_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- ============================================
-- CONTENT PAGES TABLE
-- ============================================
CREATE TABLE content_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    meta_description TEXT,
    published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, slug)
);

CREATE INDEX idx_content_pages_agent_id ON content_pages(agent_id);
CREATE INDEX idx_content_pages_slug ON content_pages(slug);

-- ============================================
-- ANALYTICS EVENTS TABLE
-- ============================================
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_agent_id ON analytics_events(agent_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_sites_updated_at
    BEFORE UPDATE ON agent_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_features_updated_at
    BEFORE UPDATE ON agent_features
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pages_updated_at
    BEFORE UPDATE ON content_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
