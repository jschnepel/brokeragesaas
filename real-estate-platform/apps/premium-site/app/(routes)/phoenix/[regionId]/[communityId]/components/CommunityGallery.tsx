'use client';

import { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import type { GalleryImage } from '../lib/types';

const ROTATE_INTERVAL_MS = 5000;

interface CommunityGalleryProps {
  gallery: GalleryImage[];
}

export function CommunityGallery({ gallery }: CommunityGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (gallery.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % gallery.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [gallery.length]);

  if (gallery.length === 0) return null;

  return (
    <div className="relative h-[320px] overflow-hidden group">
      {gallery.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ${
            activeIndex === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        >
          <img
            src={image.url}
            alt={image.caption}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Caption overlay */}
      <div className="absolute bottom-4 left-4 text-white z-10">
        <span className="text-[9px] uppercase tracking-widest text-gold font-bold block">
          {gallery[activeIndex]?.category}
        </span>
        <h3 className="text-lg font-serif">{gallery[activeIndex]?.caption}</h3>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 right-4 flex gap-1 z-10">
        {gallery.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`h-2 md:h-1 rounded-full transition-all ${
              activeIndex === index
                ? 'w-6 md:w-4 bg-gold'
                : 'w-2 md:w-1 bg-white/50'
            } min-h-[8px] min-w-[8px]`}
          />
        ))}
      </div>

      {/* Photo count badge */}
      <button className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-2.5 md:py-1.5 text-[10px] md:text-[9px] uppercase tracking-widest font-bold text-navy z-10">
        <Camera size={12} /> {gallery.length} Photos
      </button>
    </div>
  );
}
