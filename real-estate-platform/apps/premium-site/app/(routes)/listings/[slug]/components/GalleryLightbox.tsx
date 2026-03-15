'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface GalleryLightboxProps {
  gallery: string[];
  address: string;
  initialIndex?: number;
  onClose: () => void;
}

export function GalleryLightbox({ gallery, address, initialIndex = 0, onClose }: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    overlayRef.current?.focus();
    return () => { previousFocusRef.current?.focus(); };
  }, []);

  const goTo = useCallback((index: number) => {
    const next = (index + gallery.length) % gallery.length;
    setCurrentIndex(next);
  }, [gallery.length]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
      if (e.key === 'ArrowRight') goTo(currentIndex + 1);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, goTo, onClose]);

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 bg-black/95 flex flex-col" tabIndex={-1} role="dialog" aria-modal="true" aria-label="Photo gallery" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex items-center justify-between px-4 py-3 text-white/60">
        <span className="text-sm">{currentIndex + 1} / {gallery.length}</span>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-2" aria-label="Close gallery">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center relative px-4 min-h-0">
        <button onClick={() => goTo(currentIndex - 1)} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center text-white/40 hover:text-white transition-colors" aria-label="Previous photo">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="hidden md:flex items-center justify-center w-full h-full">
          <img src={gallery[currentIndex]} alt={`${address} photo ${currentIndex + 1}`} className="max-w-full max-h-full object-contain transition-opacity duration-200" />
        </div>
        <div className="md:hidden w-full h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory flex">
          {gallery.map((url, i) => (
            <div key={i} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center">
              <img src={url} alt={`${address} photo ${i + 1}`} className="max-w-full max-h-full object-contain" />
            </div>
          ))}
        </div>
        <button onClick={() => goTo(currentIndex + 1)} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center text-white/40 hover:text-white transition-colors" aria-label="Next photo">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="hidden md:flex gap-1 px-4 py-3 overflow-x-auto scrollbar-hide justify-center">
        {gallery.map((url, i) => (
          <button key={i} onClick={() => setCurrentIndex(i)} className={`w-16 h-12 flex-shrink-0 overflow-hidden transition-opacity ${i === currentIndex ? 'opacity-100 ring-1 ring-white' : 'opacity-40 hover:opacity-70'}`} aria-label={`Go to photo ${i + 1}`}>
            <img src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
