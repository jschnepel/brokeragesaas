import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingShellProps {
  icon: ReactNode;
  label: string;
  title: string;
  colSpan?: string;
  bg?: 'white' | 'navy';
  height?: string;
  message?: string;
}

const LoadingShell: React.FC<LoadingShellProps> = ({
  icon,
  label,
  title,
  colSpan = 'col-span-12',
  bg = 'white',
  height = 'h-64',
  message = 'Data loading with enrichment integration',
}) => {
  const isNavy = bg === 'navy';

  return (
    <div className={`${colSpan} ${height} ${isNavy ? 'bg-[#0C1C2E]' : 'bg-white shadow-lg shadow-black/5'} relative overflow-hidden border border-dashed ${isNavy ? 'border-white/20' : 'border-gray-200'}`}>
      <div className={`absolute inset-0 flex flex-col items-center justify-center text-center px-6`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isNavy ? 'bg-white/10' : 'bg-gray-100'}`}>
          <Loader2 size={20} className={`${isNavy ? 'text-[#Bfa67a]' : 'text-gray-400'} animate-spin`} />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#Bfa67a]">{icon}</span>
          <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold">{label}</span>
        </div>

        <h3 className={`text-xl font-serif mb-3 ${isNavy ? 'text-white' : 'text-[#0C1C2E]'}`}>{title}</h3>

        <p className={`text-[10px] uppercase tracking-widest font-bold ${isNavy ? 'text-white/40' : 'text-gray-400'}`}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingShell;
