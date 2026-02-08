interface MarketGaugeProps {
  score: number;
  label: string;
}

const MarketGauge: React.FC<MarketGaugeProps> = ({ score, label }) => {
  return (
    <div className="bg-[#F9F8F6] p-6 border-l-4 border-[#Bfa67a]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-400">Market Conditions Index</span>
        <span className="text-2xl font-serif text-[#0C1C2E]">{score}/100</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gray-400 via-[#Bfa67a] to-[#0C1C2E] rounded-full transition-all duration-1000"
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[8px] uppercase tracking-widest text-gray-400 font-bold">
        <span>Buyer's</span>
        <span>Balanced</span>
        <span>Seller's</span>
      </div>
      <div className="mt-3 text-center">
        <span className="text-sm font-medium text-[#0C1C2E]">{label}</span>
      </div>
    </div>
  );
};

export default MarketGauge;
