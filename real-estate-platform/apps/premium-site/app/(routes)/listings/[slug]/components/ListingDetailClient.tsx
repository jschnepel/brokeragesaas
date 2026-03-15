'use client';

import { useState, type ReactNode } from 'react';
import { GalleryLightbox } from './GalleryLightbox';

interface ListingDetailClientProps {
  gallery: string[];
  address: string;
  children: ReactNode;
}

export function ListingDetailClient({ gallery, address, children }: ListingDetailClientProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  return (
    <>
      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const photoIndex = target.closest('[data-photo-index]')?.getAttribute('data-photo-index');
          if (photoIndex != null) {
            setLightboxIndex(Number(photoIndex));
            setLightboxOpen(true);
          }
          if (target.closest('[data-hero-photo]')) {
            setLightboxIndex(0);
            setLightboxOpen(true);
          }
        }}
      >
        {children}
      </div>
      {lightboxOpen && gallery.length > 0 && (
        <GalleryLightbox
          gallery={gallery}
          address={address}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
