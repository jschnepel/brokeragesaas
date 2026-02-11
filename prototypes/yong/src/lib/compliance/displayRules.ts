/**
 * Pure functions for data tier filtering.
 * Controls which fields are visible based on IDX / VOW / Private access.
 */

import type { MLSProperty, DataTier } from '../../types';
import type { DisplayFieldRule, FieldVisibility } from '../../types';
import { getConfig } from './complianceConfig';

/**
 * Check visibility of a single field for a given tier.
 */
export function isFieldVisible(
  fieldName: string,
  tier: DataTier,
  fieldRules?: DisplayFieldRule[],
): boolean {
  const rules = fieldRules ?? getConfig().fieldRules;
  const rule = rules.find((r) => r.fieldName === fieldName);
  if (!rule) return true; // fields without rules are visible by default
  const visibility: FieldVisibility = rule[tier];
  return visibility === 'visible';
}

/**
 * Get all field names that are prohibited for a given tier.
 */
export function getProhibitedFields(
  tier: DataTier,
  fieldRules?: DisplayFieldRule[],
): string[] {
  const rules = fieldRules ?? getConfig().fieldRules;
  return rules
    .filter((r) => r[tier] !== 'visible')
    .map((r) => r.fieldName);
}

/**
 * Whether a listing should be shown at all for a given tier.
 * Respects seller opt-out and tier eligibility.
 */
export function shouldShowListing(
  property: Pick<MLSProperty, 'sellerOptOut' | 'dataTier' | 'standardStatus'>,
  tier: DataTier,
): boolean {
  // Seller opted out of IDX display
  if (property.sellerOptOut && tier === 'idx') return false;

  // Tier hierarchy: private > vow > idx
  const tierRank: Record<DataTier, number> = { private: 3, vow: 2, idx: 1 };
  const requiredRank = tierRank[property.dataTier];
  const userRank = tierRank[tier];

  return userRank >= requiredRank;
}

/**
 * Return a filtered copy of a property with hidden/redacted fields removed.
 */
export function filterPropertyForTier(
  property: MLSProperty,
  tier: DataTier,
  fieldRules?: DisplayFieldRule[],
): Partial<MLSProperty> {
  const prohibited = new Set(getProhibitedFields(tier, fieldRules));
  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(property)) {
    if (!prohibited.has(key)) {
      filtered[key] = value;
    }
  }

  return filtered as Partial<MLSProperty>;
}
