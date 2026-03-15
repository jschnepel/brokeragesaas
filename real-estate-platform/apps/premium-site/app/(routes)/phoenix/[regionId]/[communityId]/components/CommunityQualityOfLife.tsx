import {
  Activity,
  Sun,
  Moon,
  Wind,
  Shield,
  VolumeX,
  Mountain,
  TreePine,
} from 'lucide-react';
import type { QualityMetric } from '../lib/types';

interface CommunityQualityOfLifeProps {
  qualityOfLife: QualityMetric[];
}

const ICON_MAP: Record<string, typeof Activity> = {
  Activity,
  Sun,
  Moon,
  Wind,
  Shield,
  VolumeX,
  Mountain,
  TreePine,
};

export function CommunityQualityOfLife({ qualityOfLife }: CommunityQualityOfLifeProps) {
  if (qualityOfLife.length === 0) return null;

  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white p-6 shadow-lg shadow-black/5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-gold" />
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
          Quality of Life
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {qualityOfLife.map((item, i) => {
          const IconComponent = ICON_MAP[item.icon] ?? Activity;
          return (
            <div key={i} className="flex items-center gap-2">
              <IconComponent size={14} className="text-gray-400" />
              <div>
                <p className="font-bold text-navy text-sm">{item.value}</p>
                <p className="text-[8px] uppercase tracking-widest text-gray-400">
                  {item.metric}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
