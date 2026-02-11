/**
 * Content gating wrapper for VOW-restricted data.
 * Shows children if authenticated (+ optionally verified), otherwise shows CTA.
 */

import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getConfig } from '../../lib/compliance';

interface VOWGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireVerified?: boolean;
}

const VOWGate: React.FC<VOWGateProps> = ({
  children,
  fallback,
  requireVerified = false,
}) => {
  const config = getConfig();
  const { isAuthenticated, isEmailVerified } = useAuth();

  // If VOW is disabled, show content directly
  if (!config.features.vowEnabled) {
    return <>{children}</>;
  }

  // Authenticated (and verified if required)
  const hasAccess = isAuthenticated && (!requireVerified || isEmailVerified);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Fallback or default CTA
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#F9F8F6]/80 backdrop-blur-sm">
        <div className="text-center max-w-md px-6">
          <div className="w-8 h-px bg-[#Bfa67a] mx-auto mb-4" />
          <h3 className="font-serif text-2xl text-[#0C1C2E] mb-2">
            Unlock Full Market Data
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Register for a free account to access sold data, detailed analytics, and exclusive market reports.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="bg-[#0C1C2E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-colors"
            >
              Register
            </Link>
            <span className="text-gray-400 text-xs">or</span>
            <Link
              to="/register"
              className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.2em] font-bold hover:text-[#0C1C2E] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VOWGate;
