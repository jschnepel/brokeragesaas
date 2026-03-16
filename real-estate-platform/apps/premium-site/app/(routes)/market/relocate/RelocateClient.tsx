'use client';

import { useState, useCallback } from 'react';
import { RelocateHero } from './components/RelocateHero';
import { LifestyleGrid } from './components/LifestyleGrid';
import { InlineQuiz } from './components/InlineQuiz';
import { InlineQuizResults } from './components/InlineQuizResults';
import { BottomCTA } from './components/BottomCTA';
import { computeMatches } from './data';
import type { FactorId, ZoneId } from './data';

interface RelocateClientProps {
  agentId: string;
}

export function RelocateClient({ agentId: _agentId }: RelocateClientProps) {
  const [matchedZones, setMatchedZones] = useState<[ZoneId, ZoneId] | null>(null);

  const handleQuizComplete = useCallback((answers: Record<FactorId, number>) => {
    const matches = computeMatches(answers);
    setMatchedZones(matches);
  }, []);

  const handleRetake = useCallback(() => {
    setMatchedZones(null);
    // Scroll back to quiz section
    const quizSection = document.querySelector('[data-testid="inline-quiz"]');
    if (quizSection) {
      quizSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <main className="min-h-screen">
      <RelocateHero />
      <LifestyleGrid />
      <InlineQuiz onComplete={handleQuizComplete} />
      {matchedZones && (
        <InlineQuizResults matchedZones={matchedZones} onRetake={handleRetake} />
      )}
      <BottomCTA />
    </main>
  );
}
