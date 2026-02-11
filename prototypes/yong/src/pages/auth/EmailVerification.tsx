/**
 * Email Verification Page — closed-loop verification simulation (Pillar 2).
 * In production, this would wait for an email link click.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import SEOHead from '../../components/shared/SEOHead';
import { useAuth } from '../../context/AuthContext';

const EmailVerification: React.FC = () => {
  const navigate = useNavigate();
  const { registrant, verifyEmail, isEmailVerified } = useAuth();
  const [verified, setVerified] = useState(false);

  // Redirect if no registrant
  if (!registrant) {
    return <Navigate to="/register" replace />;
  }

  // Auto-navigate after verification
  useEffect(() => {
    if (verified) {
      const timer = setTimeout(() => {
        navigate('/listings');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [verified, navigate]);

  const handleSimulateVerify = () => {
    verifyEmail();
    setVerified(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans">
      <SEOHead
        title="Verify Your Email | Yong Choi Real Estate"
        description="Complete your email verification to access VOW data."
      />
      <Navigation />

      {/* Spacer for fixed nav */}
      <div className="pt-28" />

      <div className="max-w-lg mx-auto px-6 pb-20">
        <div className="bg-white p-10 shadow-sm border border-gray-100 text-center">
          {!verified ? (
            <>
              {/* Pending State */}
              <div className="w-16 h-16 rounded-full bg-[#Bfa67a]/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="text-[#Bfa67a]" size={28} />
              </div>

              <h1 className="text-2xl font-serif text-[#0C1C2E] mb-3">
                Verify Your Email
              </h1>

              <p className="text-sm text-gray-500 mb-2">
                We sent a verification link to:
              </p>
              <p className="text-sm font-medium text-[#0C1C2E] mb-8">
                {registrant.email}
              </p>

              <p className="text-xs text-gray-400 mb-6">
                Check your inbox and click the verification link to complete your registration.
              </p>

              {/* Dev simulation */}
              <div className="border-t border-gray-100 pt-6">
                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-3">
                  Development Mode
                </p>
                <button
                  onClick={handleSimulateVerify}
                  className="bg-[#0C1C2E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-colors"
                >
                  Simulate Email Verification
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Verified State */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <CheckCircle2 className="text-emerald-500" size={28} />
              </div>

              <h1 className="text-2xl font-serif text-[#0C1C2E] mb-3">
                Email Verified
              </h1>

              <p className="text-sm text-gray-500">
                Your account is now active. Redirecting to listings...
              </p>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EmailVerification;
