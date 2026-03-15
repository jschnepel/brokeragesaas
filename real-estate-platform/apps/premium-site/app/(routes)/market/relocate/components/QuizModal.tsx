'use client';

import { useState, useCallback, useEffect } from 'react';
import { ZipEntry } from './ZipEntry';
import { QuizFlow } from './QuizFlow';
import { QuizResults } from './QuizResults';
import { computeMatches, getZipProfile } from '../data';
import type { FactorId, ZoneId, ZipProfile } from '../data';

type QuizStep = 'zip' | 'quiz' | 'results';

interface QuizModalProps {
  onClose: () => void;
}

export function QuizModal({ onClose }: QuizModalProps) {
  const [step, setStep] = useState<QuizStep>('zip');
  const [matchedZones, setMatchedZones] = useState<[ZoneId, ZoneId] | null>(null);
  const [zipProfile, setZipProfile] = useState<ZipProfile | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleZipSubmit = useCallback((enteredZip: string) => {
    setZipProfile(getZipProfile(enteredZip));
    setStep('quiz');
  }, []);

  const handleQuizComplete = useCallback((answers: Record<FactorId, number>) => {
    const matches = computeMatches(answers);
    setMatchedZones(matches);
    setStep('results');
  }, []);

  const handleRetake = useCallback(() => {
    setMatchedZones(null);
    setStep('quiz');
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto">
      <div
        className="fixed inset-0 bg-navy/60 backdrop-blur-sm"
        onClick={onClose}
        data-testid="quiz-modal-backdrop"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Relocation quiz"
        className="relative bg-white w-full max-w-[1100px] mx-4 my-8 lg:my-16 shadow-2xl"
        data-testid="quiz-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-navy/40 hover:text-navy transition-colors z-10"
          aria-label="Close quiz"
          data-testid="quiz-modal-close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="p-6 lg:p-10">
          {step === 'zip' && (
            <ZipEntry onSubmit={handleZipSubmit} />
          )}
          {step === 'quiz' && (
            <QuizFlow onComplete={handleQuizComplete} />
          )}
          {step === 'results' && matchedZones && zipProfile && (
            <QuizResults
              matchedZones={matchedZones}
              zipProfile={zipProfile}
              onRetake={handleRetake}
            />
          )}
        </div>
      </div>
    </div>
  );
}
