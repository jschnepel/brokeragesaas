import { Mountain, TreePine, Shield, Zap, Camera } from 'lucide-react';
import type { SignatureAmenity } from '../lib/types';

interface CommunitySignatureAmenityProps {
  signatureAmenity: SignatureAmenity;
}

const ICON_MAP: Record<string, typeof Mountain> = {
  Mountain,
  TreePine,
  Shield,
  Zap,
};

export function CommunitySignatureAmenity({ signatureAmenity }: CommunitySignatureAmenityProps) {
  const Icon = ICON_MAP[signatureAmenity.icon] ?? Mountain;

  return (
    <div className="col-span-12 bg-navy shadow-lg shadow-black/5 overflow-hidden">
      <div className="grid grid-cols-12 min-h-[380px]">
        {/* Text content */}
        <div className="col-span-12 lg:col-span-6 p-6 md:p-10 lg:p-14 flex flex-col justify-center order-2 lg:order-1">
          <div className="flex items-center gap-2 mb-4">
            <Icon size={18} className="text-gold" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
              Signature Amenity
            </span>
          </div>
          <h3 className="text-3xl md:text-4xl font-serif text-white mb-5 leading-tight">
            {signatureAmenity.title}
          </h3>
          <p className="text-white/60 text-[15px] leading-relaxed mb-8">
            {signatureAmenity.description}
          </p>
          {signatureAmenity.stats.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-white/10">
              {signatureAmenity.stats.map((stat, i) => (
                <div key={i}>
                  <span className="text-white font-bold text-2xl font-serif block">
                    {stat.value}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold mt-1 block">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image */}
        <div className="col-span-12 lg:col-span-6 h-72 lg:h-auto relative order-1 lg:order-2">
          {signatureAmenity.image ? (
            <img
              src={signatureAmenity.image}
              alt={signatureAmenity.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-navy via-navy-mid to-navy flex items-center justify-center">
              <div className="text-center">
                <Camera size={40} className="text-white/10 mx-auto mb-3" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold block">
                  Photo Coming Soon
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
