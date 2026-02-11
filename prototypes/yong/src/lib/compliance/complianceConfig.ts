/**
 * Default ARMLS-compliant configuration.
 * All values reflect current ARMLS rules (Section 4.4 prohibited data matrix).
 * Swap defaults with server-fetched config when backend exists.
 */

import type { ComplianceConfig, DisplayFieldRule } from '../../types';
import type { VOWAcknowledgment } from '../../types';

// ── Field Display Rules (Section 4.4 Prohibited Data) ────
const DEFAULT_FIELD_RULES: DisplayFieldRule[] = [
  // Seller contact info: never on IDX or VOW
  { fieldName: 'sellerContact', idx: 'hidden', vow: 'hidden', private: 'visible' },
  // Compensation: never on IDX or VOW
  { fieldName: 'compensationAmount', idx: 'hidden', vow: 'hidden', private: 'visible' },
  // Broker remarks: never on IDX or VOW
  { fieldName: 'brokerRemarks', idx: 'hidden', vow: 'hidden', private: 'visible' },
  // Private remarks: private only
  { fieldName: 'privateRemarks', idx: 'hidden', vow: 'hidden', private: 'visible' },
  // Sold/close price: IDX hidden, VOW visible
  { fieldName: 'closePrice', idx: 'hidden', vow: 'visible', private: 'visible' },
  { fieldName: 'closeDate', idx: 'hidden', vow: 'visible', private: 'visible' },
  // Public fields visible everywhere
  { fieldName: 'listPrice', idx: 'visible', vow: 'visible', private: 'visible' },
  { fieldName: 'livingArea', idx: 'visible', vow: 'visible', private: 'visible' },
  { fieldName: 'bedsTotal', idx: 'visible', vow: 'visible', private: 'visible' },
  { fieldName: 'bathsFull', idx: 'visible', vow: 'visible', private: 'visible' },
  { fieldName: 'publicRemarks', idx: 'visible', vow: 'visible', private: 'visible' },
  { fieldName: 'daysOnMarket', idx: 'visible', vow: 'visible', private: 'visible' },
  { fieldName: 'photoUrls', idx: 'visible', vow: 'visible', private: 'visible' },
];

// ── Default Config ───────────────────────────────────────
const DEFAULT_CONFIG: ComplianceConfig = {
  disclaimer: {
    enabled: true,
    variant: 'idx',
    text: 'The data relating to real estate for sale on this website comes in part from the Internet Data Exchange (IDX) program of the Arizona Regional Multiple Listing Service, Inc. (ARMLS\u00AE). Real estate listings held by brokerage firms other than Russ Lyon Sotheby\'s International Realty are marked with the IDX logo.',
    showLogo: true,
  },

  attribution: {
    enabled: true,
    firmName: "Russ Lyon Sotheby's International Realty",
    brokerName: 'Yong Choi',
    contactInfo: 'yong.choi@russlyon.com',
    contactType: 'email',
  },

  registration: {
    requireEmailVerification: true,
    requireAllAcknowledgments: true,
    passwordPolicy: {
      expiryDays: 180,
      allowRenewal: true,
      retentionDaysAfterExpiry: 180,
    },
    touVersion: '1.0',
  },

  audit: {
    enabled: true,
    retentionDays: 365,
    trackedEvents: [
      'login',
      'logout',
      'search',
      'listing_view',
      'report_gen',
      'export',
      'page_view',
      'registration',
    ],
  },

  features: {
    vowEnabled: import.meta.env.PROD,
    idxEnabled: true,
    soldDataRequiresVOW: import.meta.env.PROD,
    auditTrailEnabled: true,
    registrationOpen: true,
  },

  fieldRules: DEFAULT_FIELD_RULES,
};

// ── Accessor ─────────────────────────────────────────────
let _config: ComplianceConfig = DEFAULT_CONFIG;

export function getConfig(): ComplianceConfig {
  return _config;
}

export function setConfig(overrides: Partial<ComplianceConfig>): void {
  _config = { ..._config, ...overrides };
}

// ── VOW Acknowledgments (Section 4.1) ────────────────────
export const VOW_ACKNOWLEDGMENTS: readonly VOWAcknowledgment[] = [
  {
    id: 1,
    text: 'I understand that the data displayed may include listings held by brokerage firms other than Russ Lyon Sotheby\'s International Realty and that I should confirm all information independently.',
    accepted: false,
  },
  {
    id: 2,
    text: 'I acknowledge that the listing information is for my personal, non-commercial use only and that I will not reproduce, redistribute, or retransmit the data.',
    accepted: false,
  },
  {
    id: 3,
    text: 'I understand that the data displayed is obtained from the Arizona Regional Multiple Listing Service (ARMLS\u00AE) and is deemed reliable but not guaranteed.',
    accepted: false,
  },
  {
    id: 4,
    text: 'I acknowledge that my access to VOW data is contingent upon maintaining a valid, lawful broker-consumer relationship with the listing brokerage or an authorized participant.',
    accepted: false,
  },
  {
    id: 5,
    text: 'I agree that my account activity may be monitored for compliance with ARMLS\u00AE rules and that my access may be revoked if terms are violated.',
    accepted: false,
  },
];
