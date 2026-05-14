/**
 * ARMLS IDX display-rule helpers.
 *
 * Section 23 requires the ARMLS IDX badge on every search-result or
 * preview tile that surfaces a listing held by a brokerage OTHER than
 * the host. In-house listings (RLSIR's own representations) don't
 * need the badge — only third-party IDX feed entries do.
 *
 * The check is a permissive substring match on `ListOfficeName`
 * because ARMLS records carry the office name with various suffixes
 * (`Russ Lyon Sotheby's`, `Russ Lyon Sotheby's Intl Realty`, etc.)
 * that exact-match would miss.
 */

/** Substring fingerprint of the host brokerage (case-insensitive). */
export const HOST_BROKERAGE_FINGERPRINT = 'russ lyon';

/**
 * Whether a listing's office is the host brokerage (RLSIR). When false
 * AND `listOfficeName` is present, the listing is third-party and the
 * ARMLS IDX badge is required on the displaying tile.
 *
 * Returns `false` for empty / null office names so the badge gate
 * defaults to "show the IDX mark when uncertain" — over-marking is
 * fine, under-marking is a Section 23 violation.
 */
export function isHostBrokerage(listOfficeName: string | null | undefined): boolean {
  if (!listOfficeName) return false;
  return listOfficeName.toLowerCase().includes(HOST_BROKERAGE_FINGERPRINT);
}

/**
 * Inverse of `isHostBrokerage` — the explicit "needs IDX badge"
 * predicate. When `listOfficeName` is missing we still return `true`
 * (defaulting to display) so a Spark record with a null office field
 * doesn't accidentally pass as in-house.
 */
export function requiresIdxMark(listOfficeName: string | null | undefined): boolean {
  return !isHostBrokerage(listOfficeName);
}
