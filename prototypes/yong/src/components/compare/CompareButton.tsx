import { Check, Plus } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';

interface CompareButtonProps {
  communityId: string;
  variant?: 'card' | 'page';
}

const CompareButton: React.FC<CompareButtonProps> = ({ communityId, variant = 'card' }) => {
  const { add, remove, isInCompare, items } = useCompare();
  const selected = isInCompare(communityId);
  const isFull = items.length >= 3 && !selected;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selected) {
      remove(communityId);
    } else {
      add(communityId);
    }
  };

  if (variant === 'page') {
    return (
      <button
        onClick={handleClick}
        disabled={isFull}
        className={`
          flex items-center gap-2 px-6 py-3 text-[10px] uppercase tracking-[0.25em] font-bold
          transition-all shadow-xl
          ${selected
            ? 'bg-[#Bfa67a] text-white'
            : isFull
              ? 'bg-white/20 text-white/40 cursor-not-allowed'
              : 'bg-[#0C1C2E] text-white hover:bg-[#Bfa67a]'
          }
        `}
      >
        {selected ? <Check size={14} /> : <Plus size={14} />}
        {selected ? 'Added to Compare' : isFull ? 'Compare Full (3)' : 'Compare'}
      </button>
    );
  }

  // Card variant — small absolute-positioned button
  return (
    <button
      onClick={handleClick}
      disabled={isFull}
      title={isFull ? 'Compare full (max 3)' : selected ? 'Remove from compare' : 'Add to compare'}
      className={`
        absolute top-3 right-3 z-10 flex items-center gap-1.5
        px-2.5 py-1.5 backdrop-blur-sm
        text-[9px] uppercase tracking-widest font-bold
        transition-all duration-300
        ${selected
          ? 'bg-[#Bfa67a] text-white shadow-lg'
          : isFull
            ? 'bg-black/30 text-white/40 cursor-not-allowed'
            : 'bg-black/40 text-white hover:bg-[#Bfa67a] opacity-0 group-hover:opacity-100'
        }
        ${selected ? 'opacity-100' : ''}
      `}
    >
      {selected ? <Check size={10} /> : <Plus size={10} />}
      {selected ? 'Added' : 'Compare'}
    </button>
  );
};

export default CompareButton;
