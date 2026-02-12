import { useSearchParams } from 'react-router-dom';

export type Period = '3m' | '6m' | '1y' | '2y';

const PERIODS: { value: Period; label: string }[] = [
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '2y', label: '2Y' },
];

function isValidPeriod(val: string | null): val is Period {
  return val === '3m' || val === '6m' || val === '1y' || val === '2y';
}

interface PeriodSelectorProps {
  period: Period;
  onChange: (p: Period) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ period, onChange }) => {
  return (
    <div className="flex items-center gap-1">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-1.5 transition-all ${
            period === p.value
              ? 'bg-[#0C1C2E] text-white'
              : 'bg-gray-100 text-gray-400 hover:text-gray-600'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

export function usePeriod(): [Period, (p: Period) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('period');
  const period: Period = isValidPeriod(raw) ? raw : '6m';

  const setPeriod = (p: Period) => {
    if (p === '6m') {
      const next = new URLSearchParams(searchParams);
      next.delete('period');
      setSearchParams(next, { replace: true });
    } else {
      setSearchParams({ period: p }, { replace: true });
    }
  };

  return [period, setPeriod];
}

export default PeriodSelector;
