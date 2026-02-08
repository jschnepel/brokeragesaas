import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface DrilldownCardProps {
  name: string;
  url: string;
  image: string;
  subtitle?: string;
  stats?: { label: string; value: string }[];
  index?: number;
}

const DrilldownCard: React.FC<DrilldownCardProps> = ({ name, url, image, subtitle, stats, index = 0 }) => {
  return (
    <Link
      to={url}
      className="group block bg-white overflow-hidden hover:bg-gray-50 transition-all duration-500"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-serif text-lg mb-1">{name}</h3>
          {subtitle && (
            <span className="text-white/60 text-[10px] uppercase tracking-widest font-bold">{subtitle}</span>
          )}
        </div>
      </div>
      {stats && stats.length > 0 && (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {stats.slice(0, 4).map((stat, i) => (
              <div key={i}>
                <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold block">{stat.label}</span>
                <span className="text-sm font-serif text-[#0C1C2E]">{stat.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-[#Bfa67a] group-hover:text-[#0C1C2E] transition-colors">
            Explore
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      )}
    </Link>
  );
};

export default DrilldownCard;
