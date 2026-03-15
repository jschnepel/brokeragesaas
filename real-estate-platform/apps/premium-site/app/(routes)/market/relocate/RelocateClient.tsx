'use client';

import { useState } from 'react';
import { RelocateHero } from './components/RelocateHero';
import { LifestyleGrid } from './components/LifestyleGrid';
import { BottomCTA } from './components/BottomCTA';
import { QuizModal } from './components/QuizModal';

interface RelocateClientProps {
  agentId: string;
}

export function RelocateClient({ agentId: _agentId }: RelocateClientProps) {
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <main className="bg-white min-h-screen pt-28 lg:pt-32">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-20">
        <RelocateHero onOpenQuiz={() => setQuizOpen(true)} />
        <LifestyleGrid className="pb-16" />
        <BottomCTA onOpenQuiz={() => setQuizOpen(true)} />
      </div>

      {quizOpen && (
        <QuizModal onClose={() => setQuizOpen(false)} />
      )}
    </main>
  );
}
