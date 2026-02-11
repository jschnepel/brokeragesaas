/**
 * VOW Terms of Use — full legal document covering all 5 acknowledgments,
 * financial restriction, ARMLS access, password policy, audit, and privacy.
 */

import { Link } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import SEOHead from '../../components/shared/SEOHead';
import { getConfig } from '../../lib/compliance';

const VOWTermsOfUse: React.FC = () => {
  const config = getConfig();

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#111] font-sans">
      <SEOHead
        title="Terms of Use | Yong Choi Real Estate"
        description="Virtual Office Website Terms of Use for accessing ARMLS data."
      />
      <Navigation />

      {/* Spacer for fixed nav */}
      <div className="pt-28" />

      <div className="max-w-4xl mx-auto px-6 pb-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-px bg-[#Bfa67a]" />
            <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold">
              Legal
            </span>
            <div className="w-8 h-px bg-[#Bfa67a]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#0C1C2E] mb-2">
            Terms of <span className="italic font-light">Use</span>
          </h1>
          <p className="text-xs text-gray-400">
            Version {config.registration.touVersion} &middot; Virtual Office Website (VOW) Agreement
          </p>
        </div>

        {/* Prose Content */}
        <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100 prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-[#0C1C2E] prose-a:text-[#Bfa67a]">
          <h2>1. Data Source &amp; Reliability</h2>
          <p>
            The data displayed on this website may include listings held by brokerage firms other
            than Russ Lyon Sotheby&apos;s International Realty. All data is sourced from the Arizona
            Regional Multiple Listing Service, Inc. (ARMLS&reg;) and is deemed reliable but not
            guaranteed. You should confirm all information independently before making any
            real estate decisions.
          </p>

          <h2>2. Personal, Non-Commercial Use</h2>
          <p>
            The listing information provided through this Virtual Office Website is for your
            personal, non-commercial use only. You agree not to reproduce, redistribute,
            retransmit, or make available to any other party the data or information displayed
            on this website, whether by email, fax, internet posting, or any other means.
          </p>

          <h2>3. Data Accuracy &amp; ARMLS&reg; Source</h2>
          <p>
            All real estate data is obtained from ARMLS&reg; and is subject to its accuracy
            limitations. While we strive to provide current and correct information, property
            details including but not limited to pricing, square footage, lot size, and
            availability may change without notice. ARMLS&reg; and its participants disclaim
            any liability for inaccuracies.
          </p>

          <h2>4. Broker-Consumer Relationship</h2>
          <p>
            Access to VOW data is contingent upon maintaining a valid, lawful broker-consumer
            relationship with the listing brokerage or an authorized participant. By registering,
            you acknowledge that this relationship exists and that access may be revoked if
            the relationship terminates or if these terms are violated.
          </p>

          <h2>5. Account Monitoring &amp; Compliance</h2>
          <p>
            Your account activity may be monitored for compliance with ARMLS&reg; rules and
            these Terms of Use. We maintain an audit trail of account activity including
            logins, searches, listing views, and data exports. Access may be suspended or
            revoked at any time if we determine, in our sole discretion, that these terms
            or ARMLS&reg; rules have been violated.
          </p>

          <h2>6. Financial Restriction Notice</h2>
          <p>
            These terms do not impose any financial obligation upon you. Registration is
            provided free of charge and establishes the lawful broker-consumer relationship
            required under ARMLS&reg; rules for Virtual Office Website data access. No
            purchase, payment, or commitment of funds is required at any time.
          </p>

          <h2>7. ARMLS&reg; Data Access Tiers</h2>
          <p>
            Data on this website is provided under two access tiers as defined by ARMLS&reg;:
          </p>
          <ul>
            <li>
              <strong>IDX (Internet Data Exchange):</strong> Active listing data available to
              all website visitors without registration.
            </li>
            <li>
              <strong>VOW (Virtual Office Website):</strong> Enhanced data including sold
              properties and additional analytics, available only to registered users with
              verified email addresses.
            </li>
          </ul>
          <p>
            Certain fields (including seller contact information, compensation details, and
            broker remarks) are restricted from display under all public access tiers per
            ARMLS&reg; Section 4.4 rules.
          </p>

          <h2>8. Password Policy</h2>
          <p>
            Your account password expires every {config.registration.passwordPolicy.expiryDays} days.
            You will be notified before expiration and may renew your password at any time.
            If your password expires, your access to VOW data will be suspended until a new
            password is set. Accounts with expired passwords are retained for{' '}
            {config.registration.passwordPolicy.retentionDaysAfterExpiry} days before data
            purge procedures are initiated.
          </p>

          <h2>9. Audit Trail &amp; Data Retention</h2>
          <p>
            In compliance with ARMLS&reg; rules, we maintain a complete audit trail of all
            registered user activity. Audit records are retained for a minimum of{' '}
            {config.audit.retentionDays} days. Tracked activities include: account registration,
            login/logout events, property searches, listing views, report generation, and data
            exports. You may request an export of your audit data by contacting us.
          </p>

          <h2>10. Privacy &amp; Data Protection</h2>
          <p>
            We collect only the information necessary to establish and maintain your VOW account:
            name, email address, username, and activity logs. We do not sell or share your
            personal information with third parties except as required by ARMLS&reg; compliance
            audits. Your email address is verified through a closed-loop confirmation process
            and is used solely for account-related communications. You may request deletion
            of your account and associated data at any time.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <p className="text-sm text-gray-500 mb-4">Ready to get started?</p>
          <Link
            to="/register"
            className="inline-block bg-[#0C1C2E] text-white px-8 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#Bfa67a] transition-colors"
          >
            Create Your Account
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default VOWTermsOfUse;
