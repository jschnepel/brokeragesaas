import { Link } from 'react-router-dom';
import { Zap, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { useScrollAnimation } from '../shared/useScrollAnimation';
import type { TopCommunities } from '../../models/RegionScope';

interface TopCommunitiesGridProps {
  data: TopCommunities;
}

const TopCommunitiesGrid: React.FC<TopCommunitiesGridProps> = ({ data }) => {
  const anim = useScrollAnimation();

  const sections = [
    { title: 'Fastest Selling', icon: <Zap size={16} className="text-[#Bfa67a]" />, items: data.fastestSelling },
    { title: 'Highest Value', icon: <DollarSign size={16} className="text-[#Bfa67a]" />, items: data.highestValue },
    { title: 'Most Active', icon: <Activity size={16} className="text-[#Bfa67a]" />, items: data.mostActive },
    { title: 'Best Appreciation', icon: <TrendingUp size={16} className="text-[#Bfa67a]" />, items: data.bestAppreciation },
  ];

  return (
    <div
      ref={anim.ref}
      className={`
        bg-[#0C1C2E] p-8 text-white h-full
        transition-all duration-1000
        ${anim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
      `}
    >
      <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.3em] font-bold mb-8 block">Top Communities</span>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {sections.map((section, si) => (
          <div key={si}>
            <div className="flex items-center gap-2 mb-4">
              {section.icon}
              <span className="text-[9px] uppercase tracking-widest font-bold text-white/60">{section.title}</span>
            </div>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <Link
                  key={i}
                  to={item.url}
                  className="flex items-center justify-between group border-b border-white/5 pb-2 hover:border-[#Bfa67a]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#Bfa67a] text-xs font-bold w-5">{i + 1}.</span>
                    <span className="text-sm text-white/80 group-hover:text-[#Bfa67a] transition-colors">{item.name}</span>
                  </div>
                  <span className="text-xs text-white/40 font-mono">{item.value}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopCommunitiesGrid;
