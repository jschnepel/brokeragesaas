import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, MapPin, ArrowRight, Crown, Shield, GraduationCap, Home, DollarSign, TreePine, Star, Activity } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import { getCommunityById } from '../../data/communities';
import type { ResolvedCommunity } from '../../data/types';
import DeltaCallout from './DeltaCallout';

const COLORS = ['#Bfa67a', '#5B8DEF', '#E07A5F'];
const COLOR_BG = ['rgba(191,166,122,0.08)', 'rgba(91,141,239,0.08)', 'rgba(224,122,95,0.08)'];

/* ─── helpers ─── */

function parsePriceRange(s: string): { low: number; high: number } {
  const nums = s.replace(/[^0-9.MKk$–-]/g, ' ').split(/\s+/).filter(Boolean);
  const parse = (v: string): number => {
    const n = parseFloat(v.replace(/[$,]/g, ''));
    if (v.toUpperCase().includes('M')) return n * 1_000_000;
    if (v.toUpperCase().includes('K')) return n * 1_000;
    return n;
  };
  if (nums.length >= 2) return { low: parse(nums[0]), high: parse(nums[1]) };
  if (nums.length === 1) { const v = parse(nums[0]); return { low: v, high: v }; }
  return { low: 0, high: 0 };
}

function fmtPrice(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function communityUrl(c: ResolvedCommunity): string {
  return `/phoenix/${c.identity.regionId}/${c.id}`;
}

function generateInsights(communities: ResolvedCommunity[]): string[] {
  const insights: string[] = [];
  if (communities.length < 2) return insights;

  // Price range comparison
  const sorted = [...communities].sort((a, b) => parsePriceRange(a.priceRange).low - parsePriceRange(b.priceRange).low);
  const cheapest = sorted[0];
  const priciest = sorted[sorted.length - 1];
  if (cheapest.id !== priciest.id) {
    insights.push(
      `${cheapest.name} starts at ${fmtPrice(parsePriceRange(cheapest.priceRange).low)}, while ${priciest.name} starts at ${fmtPrice(parsePriceRange(priciest.priceRange).low)}.`
    );
  }

  // Amenity count comparison
  const byAmenities = [...communities].sort((a, b) => b.amenities.length - a.amenities.length);
  if (byAmenities[0].amenities.length !== byAmenities[byAmenities.length - 1].amenities.length) {
    insights.push(
      `${byAmenities[0].name} offers the most amenities with ${byAmenities[0].amenities.length} on-site facilities.`
    );
  }

  // HOA comparison
  const withHoa = communities.filter(c => c.residential.hoa.monthlyLow != null);
  if (withHoa.length >= 2) {
    const byHoa = [...withHoa].sort((a, b) => (a.residential.hoa.monthlyLow ?? 0) - (b.residential.hoa.monthlyLow ?? 0));
    insights.push(
      `HOA fees range from $${byHoa[0].residential.hoa.monthlyLow}/mo at ${byHoa[0].name} to $${byHoa[byHoa.length - 1].residential.hoa.monthlyHigh ?? byHoa[byHoa.length - 1].residential.hoa.monthlyLow}/mo at ${byHoa[byHoa.length - 1].name}.`
    );
  }

  // Golf
  const golfComms = communities.filter(c => c.golf);
  if (golfComms.length > 0 && golfComms.length < communities.length) {
    insights.push(
      `${golfComms.map(c => c.name).join(' and ')} ${golfComms.length === 1 ? 'offers' : 'offer'} on-site golf, while ${communities.filter(c => !c.golf).map(c => c.name).join(' and ')} ${communities.filter(c => !c.golf).length === 1 ? 'does' : 'do'} not.`
    );
  }

  return insights;
}

/* ─── Grid helper ─── */

const colsClass = (n: number) => n === 2 ? 'grid-cols-2' : 'grid-cols-3';

/* ─── Winner logic ─── */

function winnerIdx(communities: ResolvedCommunity[], getValue: (c: ResolvedCommunity) => number, lower = false): number {
  let best = lower ? Infinity : -Infinity;
  let idx = 0;
  communities.forEach((c, i) => {
    const v = getValue(c);
    if (lower ? v < best : v > best) { best = v; idx = i; }
  });
  return idx;
}

/* ─────────────── At a Glance Table ─────────────── */

const AtAGlanceSection: React.FC<{ communities: ResolvedCommunity[]; onClose: () => void }> = ({ communities, onClose }) => {
  const fields: { label: string; getValue: (c: ResolvedCommunity) => string }[] = [
    { label: 'Price Range', getValue: c => c.priceRange },
    { label: 'Gating', getValue: c => c.gating },
    { label: 'Section', getValue: c => c.section.label },
    { label: 'School District', getValue: c => c.residential.schoolDistrict.district },
    { label: 'High School', getValue: c => c.residential.schoolDistrict.highSchool },
    { label: 'HOA (Monthly)', getValue: c => c.residential.hoa.monthlyLow != null ? `$${c.residential.hoa.monthlyLow}–$${c.residential.hoa.monthlyHigh}` : c.residential.hoa.details || '—' },
    { label: 'Amenities', getValue: c => `${c.amenities.length} facilities` },
    { label: 'Nearest Trail', getValue: c => c.nearestTrail?.name ?? '—' },
  ];

  return (
    <div className="bg-white shadow-lg shadow-black/5 overflow-hidden">
      <div className="bg-[#0C1C2E] px-6 py-4 flex items-center gap-2">
        <Activity size={16} className="text-[#Bfa67a]" />
        <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold">At a Glance</span>
      </div>

      {/* Header row */}
      <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '160px 1fr' }}>
        <div className="px-6 py-3" />
        <div className={`grid ${colsClass(communities.length)}`}>
          {communities.map((c, i) => (
            <Link key={c.id} to={communityUrl(c)} onClick={onClose} className="px-4 py-3 flex items-center gap-2 text-left hover:bg-[#Bfa67a]/5 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-[10px] font-bold text-[#0C1C2E] uppercase tracking-wider truncate hover:text-[#Bfa67a] transition-colors">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Data rows */}
      {fields.map((f, fi) => (
        <div
          key={f.label}
          className={`grid items-center ${fi % 2 === 0 ? 'bg-[#F9F8F6]/50' : 'bg-white'} ${fi < fields.length - 1 ? 'border-b border-gray-50' : ''}`}
          style={{ gridTemplateColumns: '160px 1fr' }}
        >
          <span className="px-6 py-3.5 text-[10px] uppercase tracking-widest text-gray-400 font-bold">{f.label}</span>
          <div className={`grid ${colsClass(communities.length)}`}>
            {communities.map((c) => (
              <span key={c.id} className="px-4 py-3.5 text-sm font-serif text-[#0C1C2E]">
                {f.getValue(c)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─────────────── HOA Comparison ─────────────── */

const HOASection: React.FC<{ communities: ResolvedCommunity[] }> = ({ communities }) => {
  const anyHoa = communities.some(c => c.residential.hoa.monthlyLow != null);
  if (!anyHoa) return null;

  return (
    <div className={`grid gap-4 ${colsClass(communities.length)}`}>
      {communities.map((c, i) => (
        <div key={c.id} className="bg-white p-6 shadow-lg shadow-black/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-[#Bfa67a]" />
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">HOA Costs</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
          </div>
          <span className="text-sm font-serif text-[#0C1C2E] block mb-3">{c.name}</span>
          {c.residential.hoa.monthlyLow != null ? (
            <div className="space-y-3">
              <div>
                <span className="text-2xl font-serif text-[#0C1C2E]">
                  ${c.residential.hoa.monthlyLow}–${c.residential.hoa.monthlyHigh}
                </span>
                <span className="text-[10px] text-gray-400 ml-1">/month</span>
              </div>
              {c.residential.hoa.hasCapitalFee && (
                <span className="inline-block bg-amber-50 text-amber-700 text-[9px] uppercase tracking-widest font-bold px-3 py-1">
                  Capital Fee Required
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">{c.residential.hoa.details || 'Not available'}</span>
          )}
        </div>
      ))}
    </div>
  );
};

/* ─────────────── School District ─────────────── */

const SchoolDistrictSection: React.FC<{ communities: ResolvedCommunity[] }> = ({ communities }) => (
  <div className={`grid gap-4 ${colsClass(communities.length)}`}>
    {communities.map((c, i) => (
      <div key={c.id} className="bg-white p-6 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-[#Bfa67a]" />
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Schools</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
        </div>
        <span className="text-sm font-serif text-[#0C1C2E] block mb-4">{c.name}</span>
        <div className="space-y-3">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-1">District</span>
            <span className="text-sm text-[#0C1C2E] font-medium">{c.residential.schoolDistrict.district}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-1">High School</span>
            <span className="text-sm text-[#0C1C2E] font-medium">{c.residential.schoolDistrict.highSchool}</span>
          </div>
          {c.residential.schoolDistrict.privateSchools.length > 0 && (
            <div>
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Private Schools</span>
              <div className="flex flex-wrap gap-1.5">
                {c.residential.schoolDistrict.privateSchools.map(s => (
                  <span key={s} className="bg-[#F9F8F6] text-[#0C1C2E]/60 px-2.5 py-1 text-[9px] font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────── Proximity ─────────────── */

const ProximitySection: React.FC<{ communities: ResolvedCommunity[] }> = ({ communities }) => {
  // Build unified labels from airports + keyDistances across all communities
  const labelMap = new Map<string, string>();
  for (const c of communities) {
    for (const ap of c.location.airports) {
      labelMap.set(`airport:${ap.code}`, `${ap.name} (${ap.code})`);
    }
    for (const kd of c.location.keyDistances) {
      labelMap.set(`dist:${kd.label}`, kd.label);
    }
  }

  const labels = Array.from(labelMap.entries());
  if (labels.length === 0) return null;

  const getValue = (c: ResolvedCommunity, key: string): string => {
    if (key.startsWith('airport:')) {
      const code = key.slice(8);
      return c.location.airports.find(a => a.code === code)?.distance ?? '—';
    }
    const label = key.slice(5);
    return c.location.keyDistances.find(d => d.label === label)?.distance ?? '—';
  };

  return (
    <div className="bg-white shadow-lg shadow-black/5 overflow-hidden">
      <div className="bg-[#0C1C2E] px-6 py-4 flex items-center gap-2">
        <MapPin size={16} className="text-[#Bfa67a]" />
        <span className="text-[#Bfa67a] text-[9px] uppercase tracking-[0.3em] font-bold">Proximity Comparison</span>
      </div>

      {/* Header row */}
      <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '200px 1fr' }}>
        <div className="px-6 py-3" />
        <div className={`grid ${colsClass(communities.length)}`}>
          {communities.map((c, i) => (
            <div key={c.id} className="px-4 py-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-[10px] font-bold text-[#0C1C2E] uppercase tracking-wider truncate">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data rows */}
      {labels.map(([key, displayLabel], li) => (
        <div
          key={key}
          className={`grid items-center ${li % 2 === 0 ? 'bg-[#F9F8F6]/50' : 'bg-white'} ${li < labels.length - 1 ? 'border-b border-gray-50' : ''}`}
          style={{ gridTemplateColumns: '200px 1fr' }}
        >
          <span className="px-6 py-3.5 text-[10px] uppercase tracking-widest text-gray-400 font-bold">{displayLabel}</span>
          <div className={`grid ${colsClass(communities.length)}`}>
            {communities.map((c) => (
              <span key={c.id} className="px-4 py-3.5 text-sm font-serif text-[#0C1C2E]">
                {getValue(c, key)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─────────────── Amenities Comparison ─────────────── */

const AmenitiesSection: React.FC<{ communities: ResolvedCommunity[] }> = ({ communities }) => (
  <div className={`grid gap-4 ${colsClass(communities.length)}`}>
    {communities.map((c, i) => {
      const best = winnerIdx(communities, cc => cc.amenities.length);
      const isBest = i === best;
      return (
        <div key={c.id} className="bg-white p-6 shadow-lg shadow-black/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-[#Bfa67a]" />
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Amenities</span>
              {isBest && <Crown size={12} className="text-[#Bfa67a]" />}
            </div>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
          </div>
          <span className="text-sm font-serif text-[#0C1C2E] block mb-1">{c.name}</span>
          <span className="text-3xl font-serif text-[#0C1C2E] block mb-4">{c.amenities.length} <span className="text-sm text-gray-400 font-sans">facilities</span></span>

          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {c.amenities.slice(0, 8).map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 hover:bg-[#Bfa67a]/10 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#0C1C2E] text-[11px] truncate">{a.name}</p>
                  <p className="text-[9px] text-gray-400 truncate">{a.description}</p>
                </div>
                <span className={`text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 shrink-0 ml-2 ${
                  a.access === 'public' ? 'bg-emerald-50 text-emerald-700' :
                  a.access === 'residents' ? 'bg-blue-50 text-blue-700' :
                  'bg-[#Bfa67a]/10 text-[#Bfa67a]'
                }`}>
                  {a.access}
                </span>
              </div>
            ))}
            {c.amenities.length > 8 && (
              <span className="text-[9px] text-gray-400 block text-center pt-1">+{c.amenities.length - 8} more</span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

/* ─────────────── Golf Comparison ─────────────── */

const GolfSection: React.FC<{ communities: ResolvedCommunity[] }> = ({ communities }) => {
  const anyGolf = communities.some(c => c.golf);
  if (!anyGolf) return null;

  return (
    <div>
      <SectionLabel gold="Golf" serif="Courses & _Membership_" />
      <div className={`grid gap-4 ${colsClass(communities.length)}`}>
        {communities.map((c, i) => (
          <div key={c.id} className="bg-white p-6 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TreePine size={16} className="text-[#Bfa67a]" />
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Golf</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            </div>
            <span className="text-sm font-serif text-[#0C1C2E] block mb-3">{c.name}</span>
            {c.golf ? (
              <div className="space-y-3">
                <p className="text-sm text-[#0C1C2E]/70 leading-relaxed">{c.golf.description}</p>
                {c.golf?.membership && (
                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-1">Membership</span>
                    <p className="text-sm text-[#0C1C2E]/70">{c.golf.membership}</p>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">No on-site golf</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────── Gating & Security ─────────────── */

const GatingSection: React.FC<{ communities: ResolvedCommunity[] }> = ({ communities }) => (
  <div className={`grid gap-4 ${colsClass(communities.length)}`}>
    {communities.map((c, i) => (
      <div key={c.id} className="bg-white p-6 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#Bfa67a]" />
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Security</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
        </div>
        <span className="text-sm font-serif text-[#0C1C2E] block mb-3">{c.name}</span>
        <span className={`inline-block px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold ${
          c.gating.toLowerCase().includes('guard') ? 'bg-[#0C1C2E] text-white' :
          c.gating.toLowerCase().includes('gate') ? 'bg-[#Bfa67a]/15 text-[#Bfa67a]' :
          'bg-gray-100 text-gray-500'
        }`}>
          {c.gating}
        </span>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {c.categoryTags.slice(0, 5).map(tag => (
            <span key={tag} className="border border-gray-200 text-[#0C1C2E]/60 px-2.5 py-1 text-[8px] uppercase tracking-widest font-bold">
              {tag}
            </span>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────── Lifestyle: Features & Amenities ─────────────── */

const LifestyleSection: React.FC<{ communities: ResolvedCommunity[] }> = ({ communities }) => (
  <div className={`grid gap-4 ${colsClass(communities.length)}`}>
    {communities.map((c, i) => (
      <div key={c.id} className="bg-white shadow-lg shadow-black/5 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Home size={14} className="text-[#Bfa67a]" />
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Character</span>
            </div>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
          </div>
          <span className="text-sm font-serif text-[#0C1C2E] block mb-3">{c.name}</span>

          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2.5">Features</span>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {c.categoryTags.slice(0, 6).map(f => (
              <span key={f} className="border border-gray-200 text-[#0C1C2E] px-2.5 py-1 text-[8px] uppercase tracking-widest font-bold hover:border-[#Bfa67a] hover:text-[#Bfa67a] transition-colors">
                {f}
              </span>
            ))}
          </div>

          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-2.5">Top Amenities</span>
          <div className="flex flex-wrap gap-1.5">
            {c.amenities.slice(0, 5).map(a => (
              <span key={a.id} className="bg-[#F9F8F6] text-[#0C1C2E]/60 px-2.5 py-1 text-[9px] font-medium">
                {a.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ─── Section Label ─── */

const SectionLabel: React.FC<{ gold: string; serif: string }> = ({ gold, serif }) => (
  <div className="mb-6">
    <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold mb-2 block">{gold}</span>
    <h3 className="text-2xl font-serif text-[#0C1C2E]">
      {serif.split('_').map((part, i) => i % 2 === 1 ? <span key={i} className="italic font-light">{part}</span> : <span key={i}>{part}</span>)}
    </h3>
  </div>
);

/* ─────────────── Main Modal ─────────────── */

const CompareModal: React.FC = () => {
  const { items, isModalOpen, closeModal, remove } = useCompare();

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  const communities = items
    .map(id => getCommunityById(id))
    .filter((c): c is ResolvedCommunity => c !== undefined);

  if (communities.length < 2) return null;

  const insights = generateInsights(communities);

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0C1C2E]/80 backdrop-blur-sm" onClick={closeModal} />

      {/* Full-screen scrollable overlay */}
      <div className="relative w-full h-full overflow-y-auto">
        <div className="min-h-full bg-[#F9F8F6]">

          {/* ── Hero header ── */}
          <div className="bg-[#0C1C2E] relative">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-16 py-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[#Bfa67a] text-[10px] uppercase tracking-[0.4em] font-bold block mb-2">
                    Community Comparison
                  </span>
                  <h2 className="text-3xl md:text-4xl font-serif text-white">
                    {communities.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && <span className="text-white/20 mx-2 text-2xl">vs</span>}
                        <Link to={communityUrl(c)} onClick={closeModal} className="italic font-light hover:text-[#Bfa67a] transition-colors">{c.name}</Link>
                      </span>
                    ))}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="p-3 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Community cards */}
              <div className={`grid gap-4 ${colsClass(communities.length)}`}>
                {communities.map((c, i) => (
                  <div key={c.id} className="group overflow-hidden" style={{ backgroundColor: COLOR_BG[i] }}>
                    <div className="h-28 overflow-hidden relative">
                      <img src={c.heroImage} alt={c.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0C1C2E]/80 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/20" style={{ backgroundColor: COLORS[i] }} />
                            <Link to={communityUrl(c)} onClick={closeModal} className="font-serif text-lg text-white hover:text-[#Bfa67a] transition-colors">{c.name}</Link>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-white/50">
                            <span className="flex items-center gap-1"><MapPin size={9} className="text-[#Bfa67a]" /> {c.city}, AZ {c.zipCode}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => remove(c.id)}
                          className="text-white/30 hover:text-white transition-colors p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="px-4 py-2.5 flex items-center justify-between border-t border-white/5">
                      <div className="text-center">
                        <span className="text-white font-serif text-sm block">{c.priceRange}</span>
                        <span className="text-[7px] uppercase tracking-widest text-white/30 font-bold">Price Range</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="text-center">
                        <span className="text-white font-serif text-sm block">{c.gating}</span>
                        <span className="text-[7px] uppercase tracking-widest text-white/30 font-bold">Gating</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="text-center">
                        <span className="text-white font-serif text-sm block">{c.amenities.length}</span>
                        <span className="text-[7px] uppercase tracking-widest text-white/30 font-bold">Amenities</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bento sections ── */}
          <div className="max-w-[1600px] mx-auto px-6 lg:px-16 py-12 space-y-14">

            <div>
              <SectionLabel gold="Overview" serif="At a _Glance_" />
              <AtAGlanceSection communities={communities} onClose={closeModal} />
            </div>

            <div>
              <SectionLabel gold="Security" serif="Gating & _Access_" />
              <GatingSection communities={communities} />
            </div>

            <div>
              <SectionLabel gold="Costs" serif="HOA & _Fees_" />
              <HOASection communities={communities} />
            </div>

            <div>
              <SectionLabel gold="Education" serif="School _Districts_" />
              <SchoolDistrictSection communities={communities} />
            </div>

            <div>
              <SectionLabel gold="Accessibility" serif="Proximity & _Distances_" />
              <ProximitySection communities={communities} />
            </div>

            <div>
              <SectionLabel gold="On-Site" serif="Amenities & _Facilities_" />
              <AmenitiesSection communities={communities} />
            </div>

            <GolfSection communities={communities} />

            <div>
              <SectionLabel gold="Community Character" serif="Lifestyle & _Features_" />
              <LifestyleSection communities={communities} />
            </div>

            {insights.length > 0 && (
              <div>
                <SectionLabel gold="Analysis" serif="Key _Insights_" />
                <DeltaCallout insights={insights} />
              </div>
            )}
          </div>

          {/* ── Bottom bar ── */}
          <div className="sticky bottom-0" style={{ backgroundColor: '#0C1C2E' }}>
            <div className="border-t-2 border-[#Bfa67a]/30 shadow-2xl">
              <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3 sm:py-4 flex items-center gap-3 sm:gap-6">
                {/* Community chips */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-x-auto">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] font-bold text-[#Bfa67a] shrink-0 hidden sm:block">
                    Comparing
                  </span>
                  {communities.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 bg-white/10 px-3 py-1.5 shrink-0"
                    >
                      <div className="w-6 h-6 overflow-hidden shrink-0">
                        <img src={c.heroImage} alt={c.name} className="w-full h-full object-cover" />
                      </div>
                      <Link to={communityUrl(c)} onClick={closeModal} className="text-white text-[11px] font-medium truncate max-w-[100px] sm:max-w-[140px] hover:text-[#Bfa67a] transition-colors">
                        {c.name}
                      </Link>
                      <button
                        onClick={() => remove(c.id)}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <button
                    onClick={closeModal}
                    className="text-white/40 hover:text-white text-[9px] uppercase tracking-widest font-bold transition-colors px-2 py-2"
                  >
                    Close
                  </button>
                  <a
                    href="https://yongchoi.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all group bg-[#Bfa67a] text-white hover:bg-white hover:text-[#0C1C2E]"
                  >
                    Contact Yong
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CompareModal;
