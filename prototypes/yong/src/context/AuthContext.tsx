/**
 * Auth Context — localStorage-backed VOW registration stub.
 * Provides registrant state + auth actions for VOW compliance.
 * Replace password storage with bcrypt when backend exists.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Registrant } from '../types';
import { getConfig } from '../lib/compliance';
import { auditService } from '../lib/compliance';

// ── Storage Keys ─────────────────────────────────────────
const REGISTRANT_KEY = 'vow_registrant';
const SESSION_KEY = 'vow_session_id';

// ── Registration Form Data ───────────────────────────────
export interface RegistrationFormData {
  name: string;
  email: string;
  username: string;
  password: string;
}

// ── Context Shape ────────────────────────────────────────
interface AuthContextValue {
  registrant: Registrant | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  sessionId: string | null;
  isPasswordExpired: boolean;
  register: (formData: RegistrationFormData) => Registrant;
  verifyEmail: () => void;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  renewPassword: (newPassword: string) => void;
  checkPasswordExpiry: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helper: compute password expiry date ─────────────────
function computePasswordExpiry(): string {
  const config = getConfig();
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + config.registration.passwordPolicy.expiryDays);
  return expiry.toISOString();
}

// ── Helper: read registrant from storage ─────────────────
function readStoredRegistrant(): Registrant | null {
  try {
    const raw = localStorage.getItem(REGISTRANT_KEY);
    return raw ? (JSON.parse(raw) as Registrant) : null;
  } catch {
    return null;
  }
}

function readStoredSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

// ── Provider ─────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [registrant, setRegistrant] = useState<Registrant | null>(readStoredRegistrant);
  const [sessionId, setSessionId] = useState<string | null>(readStoredSession);

  // Persist registrant changes
  useEffect(() => {
    if (registrant) {
      localStorage.setItem(REGISTRANT_KEY, JSON.stringify(registrant));
    } else {
      localStorage.removeItem(REGISTRANT_KEY);
    }
  }, [registrant]);

  // Persist session changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(SESSION_KEY, sessionId);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [sessionId]);

  const isAuthenticated = registrant !== null && sessionId !== null;
  const isEmailVerified = registrant?.emailVerifiedAt !== null && registrant?.emailVerifiedAt !== undefined;
  const isPasswordExpired = registrant
    ? new Date(registrant.passwordExpiresAt) < new Date()
    : false;

  const register = useCallback((formData: RegistrationFormData): Registrant => {
    const config = getConfig();
    const now = new Date().toISOString();
    const newSessionId = crypto.randomUUID();

    const newRegistrant: Registrant = {
      id: crypto.randomUUID(),
      name: formData.name,
      email: formData.email,
      username: formData.username,
      // Plaintext stub — replace with bcrypt when backend exists
      passwordHash: formData.password,
      passwordExpiresAt: computePasswordExpiry(),
      touAcceptedAt: now,
      touVersion: config.registration.touVersion,
      emailVerifiedAt: null,
      status: 'active',
      retentionPurgeAfter: null,
      createdAt: now,
      updatedAt: now,
    };

    setRegistrant(newRegistrant);
    setSessionId(newSessionId);

    auditService.log({
      registrantId: newRegistrant.id,
      eventType: 'registration',
      eventData: { username: formData.username, email: formData.email },
      ipAddress: null,
      userAgent: navigator.userAgent,
      sessionId: newSessionId,
    });

    return newRegistrant;
  }, []);

  const verifyEmail = useCallback(() => {
    if (!registrant) return;
    const updated: Registrant = {
      ...registrant,
      emailVerifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRegistrant(updated);
  }, [registrant]);

  const login = useCallback((username: string, password: string): boolean => {
    // Stub: check against stored registrant
    if (
      !registrant ||
      registrant.username !== username ||
      registrant.passwordHash !== password
    ) {
      return false;
    }

    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);

    auditService.log({
      registrantId: registrant.id,
      eventType: 'login',
      eventData: { username },
      ipAddress: null,
      userAgent: navigator.userAgent,
      sessionId: newSessionId,
    });

    return true;
  }, [registrant]);

  const logout = useCallback(() => {
    if (registrant && sessionId) {
      auditService.log({
        registrantId: registrant.id,
        eventType: 'logout',
        eventData: {},
        ipAddress: null,
        userAgent: navigator.userAgent,
        sessionId,
      });
    }
    setSessionId(null);
  }, [registrant, sessionId]);

  const renewPassword = useCallback((newPassword: string) => {
    if (!registrant) return;
    const updated: Registrant = {
      ...registrant,
      passwordHash: newPassword,
      passwordExpiresAt: computePasswordExpiry(),
      updatedAt: new Date().toISOString(),
    };
    setRegistrant(updated);
  }, [registrant]);

  const checkPasswordExpiry = useCallback((): boolean => {
    return isPasswordExpired;
  }, [isPasswordExpired]);

  const value: AuthContextValue = {
    registrant,
    isAuthenticated,
    isEmailVerified,
    sessionId,
    isPasswordExpired,
    register,
    verifyEmail,
    login,
    logout,
    renewPassword,
    checkPasswordExpiry,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
