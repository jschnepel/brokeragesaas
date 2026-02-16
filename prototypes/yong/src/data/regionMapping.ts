// All region/zip/section data sourced from communities-enriched.json (pipeline output)
// This file re-exports from the loader for backward compatibility

export {
  getRegionFromZip,
  getRegionName,
  getRegionDescription,
  getRegions as getRegionOrder,
  getSections as SECTIONS_LIST,
} from './communityLoader';

import { getRegions, getSections } from './communityLoader';

export function getAllRegionIds(): string[] {
  return getRegions().map(r => r.id);
}

export const SECTIONS = getSections();
