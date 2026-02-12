import { Printer, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const SnapshotActions: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold text-[#0C1C2E] bg-white border border-gray-200 hover:border-[#Bfa67a] hover:text-[#Bfa67a] transition-colors"
      >
        <Printer size={12} /> Print
      </button>
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold text-[#0C1C2E] bg-white border border-gray-200 hover:border-[#Bfa67a] hover:text-[#Bfa67a] transition-colors"
      >
        <Share2 size={12} /> Share
      </button>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-bold text-white bg-[#0C1C2E] hover:bg-[#Bfa67a] transition-colors"
      >
        {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Link</>}
      </button>
    </div>
  );
};

export default SnapshotActions;
