import { GraduationCap, Star } from 'lucide-react';
import type { School } from '../lib/types';

interface CommunitySchoolsProps {
  schools: School[];
}

export function CommunitySchools({ schools }: CommunitySchoolsProps) {
  if (schools.length === 0) return null;

  return (
    <div className="col-span-12 lg:col-span-6 bg-white p-6 shadow-lg shadow-black/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-gold" />
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
            Top Schools
          </span>
        </div>
        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 text-[9px] uppercase tracking-widest font-bold rounded-full">
          A+ District
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {schools.slice(0, 4).map((school, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-gray-50 rounded group"
          >
            <div className="min-w-0">
              <p className="font-bold text-navy text-sm truncate">{school.name}</p>
              <p className="text-[9px] text-gray-400">
                {school.type} &middot; {school.distance}
              </p>
            </div>
            {school.rating > 0 ? (
              <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                <Star size={10} className="text-emerald-500 fill-emerald-500" />
                <span className="text-emerald-600 font-bold">{school.rating}</span>
                <span className="text-emerald-600 text-[8px]">/10</span>
              </div>
            ) : (
              <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                <span className="text-gray-400 text-[9px] uppercase tracking-wider font-medium">
                  No Rating
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
