/**
 * Audit trail service for VOW compliance.
 * localStorage-backed stub — swap for ApiAuditService when backend exists.
 */

import type { AuditEvent, AuditEventType } from '../../types';
import { getConfig } from './complianceConfig';

// ── Interface ────────────────────────────────────────────
export interface AuditService {
  log(event: Omit<AuditEvent, 'id' | 'createdAt'>): void;
  getEvents(): AuditEvent[];
  getSessionEvents(sessionId: string): AuditEvent[];
  purgeExpired(): number;
  exportForRegistrant(registrantId: string): AuditEvent[];
}

// ── Storage Key ──────────────────────────────────────────
const STORAGE_KEY = 'vow_audit_log';

// ── LocalStorage Implementation ──────────────────────────
class LocalStorageAuditService implements AuditService {
  private readStore(): AuditEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuditEvent[]) : [];
    } catch {
      return [];
    }
  }

  private writeStore(events: AuditEvent[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Storage full or unavailable — silently degrade
    }
  }

  log(event: Omit<AuditEvent, 'id' | 'createdAt'>): void {
    const config = getConfig();
    if (!config.audit.enabled) return;
    if (!config.audit.trackedEvents.includes(event.eventType)) return;

    const fullEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const events = this.readStore();
    events.push(fullEvent);
    this.writeStore(events);
  }

  getEvents(): AuditEvent[] {
    return this.readStore();
  }

  getSessionEvents(sessionId: string): AuditEvent[] {
    return this.readStore().filter((e) => e.sessionId === sessionId);
  }

  purgeExpired(): number {
    const config = getConfig();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - config.audit.retentionDays);
    const cutoffISO = cutoff.toISOString();

    const events = this.readStore();
    const kept = events.filter((e) => e.createdAt >= cutoffISO);
    const purged = events.length - kept.length;
    this.writeStore(kept);
    return purged;
  }

  exportForRegistrant(registrantId: string): AuditEvent[] {
    return this.readStore().filter((e) => e.registrantId === registrantId);
  }
}

// ── Singleton Export ─────────────────────────────────────
export const auditService: AuditService = new LocalStorageAuditService();
