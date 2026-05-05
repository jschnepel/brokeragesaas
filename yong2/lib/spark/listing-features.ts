/**
 * Map Spark/RESO Property fields to the canonical FeatureGroup[]
 * shape used by KeyFeaturesGrid. The grid renders groups in
 * FEATURE_GROUP_LABELS order; empty groups are filtered out.
 *
 * Centralized here so both /listings/[slug] and (eventually) the
 * /portfolio listing detail can share the same logic for live data.
 */

import type { Listing } from '@/lib/types';
import type { FeatureGroup, FeatureGroupLabel } from '@/lib/listing-narrative';

/** Concat unique items, drop empty strings, dedupe case-insensitively. */
function dedupe(items: ReadonlyArray<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (!item) continue;
    const key = item.toLowerCase().trim();
    if (key.length === 0 || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function nonEmpty(group: FeatureGroup): boolean {
  return group.items.length > 0;
}

function mk(label: FeatureGroupLabel, items: string[]): FeatureGroup {
  return { label, items };
}

export function buildFeatureGroups(l: Listing): FeatureGroup[] {
  const architecture = dedupe([
    ...(l.architecturalStyle ?? []),
    l.storiesTotal ? `${l.storiesTotal} stor${l.storiesTotal === 1 ? 'y' : 'ies'}` : null,
    l.yearBuilt ? `Built ${l.yearBuilt}` : null,
  ]);

  const interior = dedupe([
    ...(l.interiorFeatures ?? []),
    ...(l.flooring ?? []).map((f) => `${f} flooring`),
    ...(l.windowFeatures ?? []),
    ...(l.laundryFeatures ?? []).map((f) => `${f} laundry`),
  ]);

  const kitchen = dedupe([...(l.appliances ?? [])]);

  const exterior = dedupe([
    ...(l.exteriorFeatures ?? []),
    l.hasPool ? 'Pool' : null,
    ...(l.poolFeatures ?? []),
    l.hasSpa ? 'Spa' : null,
    ...(l.spaFeatures ?? []),
    l.hasFireplace
      ? l.fireplacesTotal && l.fireplacesTotal > 1
        ? `${l.fireplacesTotal} fireplaces`
        : 'Fireplace'
      : null,
    ...(l.fireplaceFeatures ?? []),
  ]);

  const views = dedupe([
    ...(l.view ?? []).map((v) => `${v} view`),
    l.hasWaterfront ? 'Waterfront' : null,
  ]);

  const garage = dedupe([
    l.garageSpaces && l.garageSpaces > 0
      ? `${l.garageSpaces} garage space${l.garageSpaces === 1 ? '' : 's'}`
      : null,
    ...(l.parkingFeatures ?? []),
  ]);

  const community = dedupe([
    ...(l.associationAmenities ?? []),
    l.associationName ? `${l.associationName} HOA` : null,
  ]);

  const construction = dedupe([
    ...(l.constructionMaterials ?? []),
    ...(l.fencing ?? []).map((f) => `${f} fencing`),
    ...(l.lotFeatures ?? []),
    ...(l.vegetation ?? []),
  ]);

  const climate = dedupe([
    ...(l.heating ?? []).map((h) => `${h} heating`),
    ...(l.cooling ?? []).map((c) => `${c} cooling`),
  ]);

  return [
    mk('Architecture', architecture),
    mk('Interior', interior),
    mk('Kitchen', kitchen),
    mk('Exterior', exterior),
    mk('Views', views),
    mk('Garage', garage),
    mk('Community', community),
    mk('Construction', construction),
    mk('Climate', climate),
  ].filter(nonEmpty);
}
