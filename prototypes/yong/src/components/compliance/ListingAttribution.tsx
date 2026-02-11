/**
 * Broker/agent attribution per ARMLS Section 4.4.
 * Falls back to compliance config defaults.
 */

import { getConfig } from '../../lib/compliance';

interface ListingAttributionProps {
  firmName?: string;
  brokerName?: string;
  contactInfo?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const ListingAttribution: React.FC<ListingAttributionProps> = ({
  firmName,
  brokerName,
  contactInfo,
  size = 'md',
  className = '',
}) => {
  const config = getConfig();

  if (!config.attribution.enabled) return null;

  const firm = firmName ?? config.attribution.firmName;
  const broker = brokerName ?? config.attribution.brokerName;
  const contact = contactInfo ?? config.attribution.contactInfo;

  if (size === 'sm') {
    return (
      <p className={`text-[9px] uppercase tracking-wider text-gray-400 ${className}`}>
        Listed by {firm} &middot; {broker}
      </p>
    );
  }

  return (
    <div className={`text-sm text-gray-500 ${className}`}>
      <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">
        Listing Courtesy Of
      </p>
      <p className="font-serif text-[#0C1C2E]">{firm}</p>
      <p className="text-gray-500">{broker}</p>
      <p className="text-gray-400 text-xs">{contact}</p>
    </div>
  );
};

export default ListingAttribution;
