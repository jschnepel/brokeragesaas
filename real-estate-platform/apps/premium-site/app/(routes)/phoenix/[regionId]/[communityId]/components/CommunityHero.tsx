import Link from 'next/link';
import { MapPin, Compass } from 'lucide-react';

interface CommunityHeroProps {
  name: string;
  city: string;
  zipCode: string;
  elevation: string;
  heroImage: string;
  regionId: string;
  regionName: string;
  tagline: string;
}

export function CommunityHero({
  name,
  city,
  zipCode,
  elevation,
  heroImage,
  regionId,
  regionName,
  tagline: _tagline,
}: CommunityHeroProps) {
  return (
    <section className="relative h-[70vh] min-h-[600px] overflow-hidden">
      {/* Background image */}
      {heroImage && (
        <img
          src={heroImage}
          alt={`${name} community`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-navy/20" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end max-w-[1600px] mx-auto px-4 md:px-8 lg:px-20 pb-16">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/60">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/phoenix" className="hover:text-white transition-colors">Phoenix Metro</Link>
          <span>/</span>
          <Link href={`/phoenix/${regionId}`} className="hover:text-white transition-colors">
            {regionName}
          </Link>
          <span>/</span>
          <span className="text-white">{name}</span>
        </nav>

        {/* Badge */}
        <span className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">
          Community Profile
        </span>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-4 leading-tight">
          {name}
        </h1>

        {/* Location details */}
        <div className="flex flex-wrap gap-3 md:gap-6 text-[10px] uppercase tracking-[0.25em] font-medium text-white/80">
          <span className="flex items-center gap-2">
            <MapPin size={12} /> {city}, AZ {zipCode}
          </span>
          <span className="flex items-center gap-2">
            <Compass size={12} /> {elevation} Elevation
          </span>
        </div>
      </div>
    </section>
  );
}
