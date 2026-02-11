/**
 * VOW Registration Page — implements ARMLS Pillars 1 & 2.
 * 5 mandatory acknowledgments, all fields validated before submit.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import SEOHead from '../../components/shared/SEOHead';
import { useAuth } from '../../context/AuthContext';
import { VOW_ACKNOWLEDGMENTS } from '../../lib/compliance';

interface FormState {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface TouchedState {
  name: boolean;
  email: boolean;
  username: boolean;
  password: boolean;
  confirmPassword: boolean;
}

const initialForm: FormState = {
  name: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
};

const initialTouched: TouchedState = {
  name: false,
  email: false,
  username: false,
  password: false,
  confirmPassword: false,
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw: string): boolean {
  return pw.length >= 8;
}

const VOWRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState<FormState>(initialForm);
  const [touched, setTouched] = useState<TouchedState>(initialTouched);
  const [acknowledgments, setAcknowledgments] = useState<boolean[]>(
    VOW_ACKNOWLEDGMENTS.map(() => false),
  );
  const [submitting, setSubmitting] = useState(false);

  // ── Field handlers ────────────────────────────────
  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleBlur = (field: keyof TouchedState) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const toggleAcknowledgment = (index: number) => {
    setAcknowledgments((prev) =>
      prev.map((v, i) => (i === index ? !v : v)),
    );
  };

  // ── Validation ────────────────────────────────────
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.name.trim()) errors.name = 'Full name is required';
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!validateEmail(form.email)) errors.email = 'Invalid email address';
  if (!form.username.trim()) errors.username = 'Username is required';
  else if (form.username.length < 3) errors.username = 'Username must be at least 3 characters';
  if (!form.password) errors.password = 'Password is required';
  else if (!validatePassword(form.password)) errors.password = 'Password must be at least 8 characters';
  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';

  const allAcknowledged = acknowledgments.every(Boolean);
  const isValid = Object.keys(errors).length === 0 && allAcknowledged;

  // ── Submit ────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    register({
      name: form.name.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      password: form.password,
    });
    navigate('/verify-email');
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans">
      <SEOHead
        title="VOW Registration | Yong Choi Real Estate"
        description="Create your account to access exclusive market data through our Virtual Office Website."
      />
      <Navigation />

      {/* Spacer for fixed nav */}
      <div className="pt-28" />

      <div className="max-w-2xl mx-auto px-6 pb-20">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-px bg-[#Bfa67a]" />
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold">
              VOW Registration
            </span>
            <div className="w-8 h-px bg-[#Bfa67a]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#0C1C2E]">
            Create Your <span className="italic font-light">Account</span>
          </h1>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 md:p-10 shadow-sm border border-gray-100"
        >
          {/* Form Fields */}
          <div className="space-y-5 mb-8">
            {/* Name */}
            <div>
              <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                onBlur={handleBlur('name')}
                className="w-full border border-gray-200 px-4 py-3 text-sm text-[#0C1C2E] focus:outline-none focus:border-[#Bfa67a] transition-colors"
                placeholder="Your full legal name"
              />
              {touched.name && errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                className="w-full border border-gray-200 px-4 py-3 text-sm text-[#0C1C2E] focus:outline-none focus:border-[#Bfa67a] transition-colors"
                placeholder="you@example.com"
              />
              {touched.email && errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={handleChange('username')}
                onBlur={handleBlur('username')}
                className="w-full border border-gray-200 px-4 py-3 text-sm text-[#0C1C2E] focus:outline-none focus:border-[#Bfa67a] transition-colors"
                placeholder="Choose a username"
              />
              {touched.username && errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                className="w-full border border-gray-200 px-4 py-3 text-sm text-[#0C1C2E] focus:outline-none focus:border-[#Bfa67a] transition-colors"
                placeholder="Minimum 8 characters"
              />
              {touched.password && errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold block mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                className="w-full border border-gray-200 px-4 py-3 text-sm text-[#0C1C2E] focus:outline-none focus:border-[#Bfa67a] transition-colors"
                placeholder="Re-enter your password"
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-8" />

          {/* Acknowledgments */}
          <div className="mb-8">
            <h2 className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">
              Mandatory Acknowledgments
            </h2>
            <div className="space-y-4">
              {VOW_ACKNOWLEDGMENTS.map((ack, index) => (
                <label
                  key={ack.id}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={acknowledgments[index]}
                    onChange={() => toggleAcknowledgment(index)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#Bfa67a] focus:ring-[#Bfa67a] shrink-0"
                  />
                  <span className="text-xs text-gray-600 leading-relaxed group-hover:text-[#0C1C2E] transition-colors">
                    {ack.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Restriction Notice */}
          <div className="bg-[#F9F8F6] border border-gray-100 p-4 mb-8">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              These terms do not impose any financial obligation. Your registration establishes a lawful
              broker-consumer relationship required for Virtual Office Website (VOW) data access under
              ARMLS&reg; rules. See our full{' '}
              <Link to="/terms-of-use" className="text-[#Bfa67a] hover:text-[#0C1C2E] underline">
                Terms of Use
              </Link>
              .
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || submitting}
            className={`w-full py-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors ${
              isValid && !submitting
                ? 'bg-[#0C1C2E] text-white hover:bg-[#Bfa67a]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default VOWRegistration;
