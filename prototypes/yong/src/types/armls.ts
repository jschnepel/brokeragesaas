/**
 * ARMLS (Arizona Regional Multiple Listing Service) Entity Types
 * Based on ARMLS-CMA-Platform-Architecture.docx.md
 *
 * Constraints:
 *   - No `enum` (erasableSyntaxOnly: true)
 *   - All type-only imports use `import type` (verbatimModuleSyntax: true)
 */

// ── Data Access Tiers ────────────────────────────────────
export type DataTier = 'idx' | 'vow' | 'private';

// ── Listing Statuses ─────────────────────────────────────
export type StandardStatus =
  | 'Active'
  | 'Pending'
  | 'Closed'
  | 'Expired'
  | 'Withdrawn'
  | 'Cancelled';

// ── Registrant Account Status ────────────────────────────
export type RegistrantStatus = 'active' | 'expired' | 'suspended';

// ── Audit Event Types ────────────────────────────────────
export type AuditEventType =
  | 'login'
  | 'logout'
  | 'search'
  | 'listing_view'
  | 'report_gen'
  | 'export'
  | 'page_view'
  | 'registration';

// ── Layer 1: MLS Property (Section 3.3) ──────────────────
export interface MLSProperty {
  listingKey: string;
  listingId: string;
  standardStatus: StandardStatus;
  listPrice: number;
  closePrice: number | null;
  originalListPrice: number | null;
  livingArea: number | null;
  lotSizeArea: number | null;
  bedsTotal: number | null;
  bathsFull: number | null;
  bathsHalf: number | null;
  yearBuilt: number | null;
  propertyType: string;
  propertySubType: string | null;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  countyOrParish: string | null;
  subdivisionName: string | null;
  unparsedAddress: string;
  latitude: number | null;
  longitude: number | null;
  daysOnMarket: number | null;
  cumulativeDaysOnMarket: number | null;
  listDate: string | null;
  closeDate: string | null;
  modificationTimestamp: string;
  photosCount: number;
  photoUrls: string[];
  publicRemarks: string | null;
  privateRemarks: string | null;
  listAgentKey: string | null;
  listAgentName: string | null;
  listOfficeKey: string | null;
  listOfficeName: string | null;
  buyerAgentKey: string | null;
  buyerAgentName: string | null;
  buyerOfficeKey: string | null;
  buyerOfficeName: string | null;
  sellerContact: string | null;
  compensationAmount: string | null;
  brokerRemarks: string | null;
  dataTier: DataTier;
  sellerOptOut: boolean;
  customFields: Record<string, unknown>;
}

// ── MLS Member ───────────────────────────────────────────
export interface MLSMember {
  memberKey: string;
  name: string;
  email: string | null;
  phone: string | null;
  officeKey: string | null;
}

// ── MLS Office ───────────────────────────────────────────
export interface MLSOffice {
  officeKey: string;
  officeName: string;
  phone: string | null;
  email: string | null;
  brokerKey: string | null;
}

// ── VOW Registrant (Section 4.2) ─────────────────────────
export interface Registrant {
  id: string;
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  passwordExpiresAt: string;
  touAcceptedAt: string | null;
  touVersion: string | null;
  emailVerifiedAt: string | null;
  status: RegistrantStatus;
  retentionPurgeAfter: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Audit Event (Section 4.3) ────────────────────────────
export interface AuditEvent {
  id: string;
  registrantId: string | null;
  eventType: AuditEventType;
  eventData: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  createdAt: string;
}

// ── VOW Acknowledgment ──────────────────────────────────
export interface VOWAcknowledgment {
  id: number;
  text: string;
  accepted: boolean;
}

// ── Layer 2: Enriched Property ───────────────────────────
export interface EnrichedProperty extends MLSProperty {
  pricePerSqFt: number | null;
  priceChangePercent: number | null;
  neighborhoodName: string | null;
  schoolDistrict: string | null;
  walkScore: number | null;
  transitScore: number | null;
}

// ── Layer 3: Aggregated Stats ────────────────────────────
export interface AggregatedStats {
  region: string;
  zipcode: string | null;
  community: string | null;
  period: string;
  medianListPrice: number;
  medianClosePrice: number | null;
  medianDaysOnMarket: number;
  medianPricePerSqFt: number;
  activeCount: number;
  closedCount: number;
  newListingsCount: number;
  absorptionRate: number | null;
  monthsOfSupply: number | null;
  listToCloseRatio: number | null;
}

// ── Layer 4: SEO Content Snapshot ────────────────────────
export interface SEOContentSnapshot {
  slug: string;
  title: string;
  description: string;
  h1: string;
  body: string;
  stats: AggregatedStats;
  generatedAt: string;
}
