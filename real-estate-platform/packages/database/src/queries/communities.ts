/**
 * Community Query Layer
 * All queries run against RDS community tables.
 * Provides slug lookup, amenities, region listings, and listing filter resolution.
 */

import type { QueryResultRow } from 'pg';
import { rdsQuery, rdsQueryOne } from '../rds-client';

// ============================================
// TYPES
// ============================================

export interface CommunityRow extends QueryResultRow {
  id: string;
  region_id: string;
  section_id: string | null;
  name: string;
  city: string | null;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  price_range: string | null;
  gating: string | null;
  hero_image: string | null;
  website: string | null;
  elevation: string | null;
  display_order: number | null;
  armls_subdivision_names: string[] | null;
  parent_community_id: string | null;
  listing_filter_mode: string | null;
  listing_filter_city: string | null;
  narrative: Record<string, unknown> | null;
  location_data: Record<string, unknown> | null;
  residential: Record<string, unknown> | null;
  golf_info: Record<string, unknown> | null;
  recognition: string | null;
  gallery: Record<string, unknown> | null;
  quality_of_life: Record<string, unknown> | null;
  economy: Record<string, unknown> | null;
  tags: string[] | null;
  demographics: Record<string, unknown> | null;
  pois: Record<string, unknown> | null;
  boundary_geojson: Record<string, unknown> | null;
  region_name: string;
  region_tagline: string | null;
  section_label: string | null;
}

export interface CommunityAmenityRow extends QueryResultRow {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  tags: string[] | null;
  access_level: string | null;
  website: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  image: string | null;
  stats: Record<string, unknown> | null;
  is_signature: boolean;
  is_nearest_trail: boolean;
}

export interface CommunitySummaryRow extends QueryResultRow {
  id: string;
  name: string;
  city: string | null;
  price_range: string | null;
  gating: string | null;
  hero_image: string | null;
  tags: string[] | null;
  section_label: string | null;
}

export interface CommunityIdRow extends QueryResultRow {
  id: string;
  region_id: string;
}

export interface RegionWithCountRow extends QueryResultRow {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  hero_image: string | null;
  latitude: number | null;
  longitude: number | null;
  display_order: number | null;
  demographics: Record<string, unknown> | null;
  climate: Record<string, unknown> | null;
  community_count: string;
}

export interface CommunityListingFilter {
  city?: string;
  subdivisionNames?: string[];
}

// ============================================
// QUERIES
// ============================================

/**
 * Get full community row by URL slug (lowercased, hyphenated name).
 * JOINs region name/tagline and section label.
 * Returns null if not found.
 */
export async function getCommunityBySlug(slug: string): Promise<CommunityRow | null> {
  return rdsQueryOne<CommunityRow>(
    `SELECT c.*,
            cr.name AS region_name,
            cr.tagline AS region_tagline,
            cs.label AS section_label
     FROM communities c
     JOIN community_regions cr ON cr.id = c.region_id
     LEFT JOIN community_sections cs ON cs.id = c.section_id
     WHERE LOWER(REPLACE(c.name, ' ', '-')) = $1`,
    [slug]
  );
}

/**
 * Get amenities for a community, joined via the link table.
 * Includes is_signature and is_nearest_trail flags.
 * Ordered by signature first, then name alphabetically.
 */
export async function getCommunityAmenities(communityId: string): Promise<CommunityAmenityRow[]> {
  const result = await rdsQuery<CommunityAmenityRow>(
    `SELECT ca.id, ca.name, ca.type, ca.description, ca.tags,
            ca.access_level, ca.website, ca.address,
            ca.latitude::float8 AS latitude, ca.longitude::float8 AS longitude,
            ca.image, ca.stats,
            cal.is_signature, cal.is_nearest_trail
     FROM community_amenity_links cal
     JOIN community_amenities ca ON ca.id = cal.amenity_id
     WHERE cal.community_id = $1
     ORDER BY cal.is_signature DESC, ca.name ASC`,
    [communityId]
  );
  return result.rows;
}

/**
 * Get summary rows for communities in a region.
 * Optional excludeId for "similar communities" use case.
 */
export async function getCommunitiesByRegion(
  regionId: string,
  excludeId?: string
): Promise<CommunitySummaryRow[]> {
  const params: unknown[] = [regionId];
  let excludeClause = '';

  if (excludeId) {
    excludeClause = ' AND c.id != $2';
    params.push(excludeId);
  }

  const result = await rdsQuery<CommunitySummaryRow>(
    `SELECT c.id, c.name, c.city, c.price_range, c.gating,
            c.hero_image, c.tags,
            cs.label AS section_label
     FROM communities c
     LEFT JOIN community_sections cs ON cs.id = c.section_id
     WHERE c.region_id = $1${excludeClause}
     ORDER BY c.display_order ASC NULLS LAST, c.name ASC`,
    params
  );
  return result.rows;
}

/**
 * Get all community id/region_id pairs for generateStaticParams.
 */
export async function getAllCommunities(): Promise<CommunityIdRow[]> {
  const result = await rdsQuery<CommunityIdRow>(
    `SELECT id, region_id FROM communities ORDER BY name ASC`
  );
  return result.rows;
}

/**
 * Get all regions with community counts for directory page.
 */
export async function getAllRegionsWithCounts(): Promise<RegionWithCountRow[]> {
  const result = await rdsQuery<RegionWithCountRow>(
    `SELECT cr.*,
            COUNT(c.id)::text AS community_count
     FROM community_regions cr
     LEFT JOIN communities c ON c.region_id = cr.id
     GROUP BY cr.id
     ORDER BY cr.display_order ASC NULLS LAST, cr.name ASC`
  );
  return result.rows;
}

/**
 * Resolve the correct listing filters for a community based on listing_filter_mode.
 * - 'none' -> return null
 * - 'city' -> return { city: listing_filter_city }
 * - 'subdivision' -> return { subdivisionNames: armls_subdivision_names },
 *   or if empty/null, check parent_community_id and recursively resolve via parent
 */
export async function getCommunityListingFilters(
  community: {
    listing_filter_mode: string | null;
    listing_filter_city: string | null;
    armls_subdivision_names: string[] | null;
    parent_community_id: string | null;
  }
): Promise<CommunityListingFilter | null> {
  const mode = community.listing_filter_mode;

  if (!mode || mode === 'none') {
    return null;
  }

  if (mode === 'city') {
    if (!community.listing_filter_city) return null;
    return { city: community.listing_filter_city };
  }

  if (mode === 'subdivision') {
    // Use this community's subdivision names if available
    if (community.armls_subdivision_names && community.armls_subdivision_names.length > 0) {
      return { subdivisionNames: community.armls_subdivision_names };
    }

    // Fall back to parent community's subdivision names
    if (community.parent_community_id) {
      const parent = await rdsQueryOne<{
        armls_subdivision_names: string[] | null;
        parent_community_id: string | null;
        listing_filter_mode: string | null;
        listing_filter_city: string | null;
      } & QueryResultRow>(
        `SELECT armls_subdivision_names, parent_community_id,
                listing_filter_mode, listing_filter_city
         FROM communities
         WHERE id = $1`,
        [community.parent_community_id]
      );

      if (parent) {
        return getCommunityListingFilters(parent);
      }
    }

    return null;
  }

  return null;
}
