/**
 * Compliance Configuration & Feature Flag Types
 * Defines all config shapes for ARMLS compliance enforcement.
 *
 * Constraints:
 *   - No `enum` (erasableSyntaxOnly: true)
 *   - All type-only imports use `import type` (verbatimModuleSyntax: true)
 */

import type { DataTier, AuditEventType } from './armls';

// ── Field Visibility ─────────────────────────────────────
export type FieldVisibility = 'visible' | 'hidden' | 'redacted';

// ── Display Field Rule ───────────────────────────────────
export interface DisplayFieldRule {
  fieldName: string;
  idx: FieldVisibility;
  vow: FieldVisibility;
  private: FieldVisibility;
}

// ── Disclaimer Config ────────────────────────────────────
export interface DisclaimerConfig {
  enabled: boolean;
  variant: DataTier;
  text: string;
  showLogo: boolean;
}

// ── Attribution Config ───────────────────────────────────
export type ContactType = 'email' | 'phone' | 'website';

export interface AttributionConfig {
  enabled: boolean;
  firmName: string;
  brokerName: string;
  contactInfo: string;
  contactType: ContactType;
}

// ── Password Policy ──────────────────────────────────────
export interface PasswordPolicy {
  expiryDays: number;
  allowRenewal: boolean;
  retentionDaysAfterExpiry: number;
}

// ── Audit Config ─────────────────────────────────────────
export interface AuditConfig {
  enabled: boolean;
  retentionDays: number;
  trackedEvents: AuditEventType[];
}

// ── Registration Config ──────────────────────────────────
export interface RegistrationConfig {
  requireEmailVerification: boolean;
  requireAllAcknowledgments: boolean;
  passwordPolicy: PasswordPolicy;
  touVersion: string;
}

// ── Feature Flags ────────────────────────────────────────
export interface FeatureFlags {
  vowEnabled: boolean;
  idxEnabled: boolean;
  soldDataRequiresVOW: boolean;
  auditTrailEnabled: boolean;
  registrationOpen: boolean;
}

// ── Master Compliance Config ─────────────────────────────
export interface ComplianceConfig {
  disclaimer: DisclaimerConfig;
  attribution: AttributionConfig;
  registration: RegistrationConfig;
  audit: AuditConfig;
  features: FeatureFlags;
  fieldRules: DisplayFieldRule[];
}
