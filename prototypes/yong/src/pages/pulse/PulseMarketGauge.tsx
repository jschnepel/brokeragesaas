import type { MarketScope } from '../../models/MarketScope';

interface PulseMarketGaugeProps {
  scope: MarketScope;
}

const PulseMarketGauge: React.FC<PulseMarketGaugeProps> = ({ scope }) => {
  const score = scope.getConditionScore();
  const label = scope.getMarketLabel();

  const indicators = [
    {
      label: 'Buyer Demand',
      value: score >= 65 ? 'High' : score >= 45 ? 'Moderate' : 'Low',
    },
    {
      label: 'Seller Confidence',
      value: score >= 60 ? 'Strong' : score >= 40 ? 'Moderate' : 'Weak',
    },
    {
      label: 'Inventory Pressure',
      value: score >= 65 ? 'Low' : score >= 45 ? 'Moderate' : 'High',
    },
    {
      label: 'Market Momentum',
      value: score >= 70 ? 'Excellent' : score >= 55 ? 'Good' : score >= 40 ? 'Neutral' : 'Declining',
    },
  ];

  const indicatorColor = (val: string) => {
    if (['High', 'Strong', 'Excellent'].includes(val)) return 'text-emerald-400';
    if (['Low'].includes(val)) return 'text-[#Bfa67a]';
    return 'text-white';
  };

  return (
    <div className="bg-[#0C1C2E] p-8 h-full">
      <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold mb-6 block">
        Market Action Index
      </span>

      {/* Circular Gauge */}
      <div className="flex justify-center mb-8">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1a2a3a" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="#Bfa67a"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${score * 2.64} 264`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-serif text-white">{score}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Score</span>
          </div>
        </div>
      </div>

      <h3 className="text-3xl font-serif text-[#Bfa67a] text-center mb-3">
        {label}
      </h3>
      <p className="text-white/60 text-sm text-center mb-8">
        {score >= 70
          ? 'Strong seller conditions. Limited inventory and high demand are driving competitive bidding.'
          : score >= 55
          ? 'Moderate seller advantage. Prices are appreciating steadily and well-priced homes sell quickly.'
          : score >= 40
          ? 'Balanced conditions. Neither buyers nor sellers have a clear advantage.'
          : 'Buyer-favorable conditions. Rising inventory gives buyers more negotiating leverage.'}
      </p>

      {/* Indicators */}
      <div className="space-y-3">
        {indicators.map(ind => (
          <div key={ind.label} className="flex justify-between items-center py-2 border-b border-white/10">
            <span className="text-white/60 text-sm">{ind.label}</span>
            <span className={`text-sm font-medium ${indicatorColor(ind.value)}`}>
              {ind.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PulseMarketGauge;
