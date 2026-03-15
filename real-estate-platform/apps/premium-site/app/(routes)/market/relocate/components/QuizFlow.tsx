'use client';

import { useState, useRef, useEffect } from 'react';
import { QUIZ_CONFIG } from '../data';
import type { FactorId } from '../data';

interface QuizFlowProps {
  onComplete: (answers: Record<FactorId, number>) => void;
  className?: string;
}

export function QuizFlow({ onComplete, className = '' }: QuizFlowProps) {
  const [selectedFactors, setSelectedFactors] = useState<Set<FactorId>>(new Set());
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, [selectedFactors.size]);

  const toggleFactor = (factorId: FactorId) => {
    setSelectedFactors((prev) => {
      const next = new Set(prev);
      if (next.has(factorId)) {
        next.delete(factorId);
        setAnswers((a) => {
          const copy = { ...a };
          delete copy[factorId];
          return copy;
        });
      } else {
        next.add(factorId);
      }
      return next;
    });
  };

  const selectAnswer = (factorId: FactorId, optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [factorId]: optionIdx }));
  };

  const hasAnswers = Object.keys(answers).length > 0;

  return (
    <div className={className}>
      <h2 className="font-serif text-navy text-2xl lg:text-3xl mb-2 text-center">
        What matters most to you?
      </h2>
      <p className="text-navy/60 text-[14px] mb-8 text-center">
        Select the factors that are important — follow-up questions will appear for each.
      </p>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 snap-x"
        data-testid="quiz-flow-scroll"
      >
        {/* Factor selection panel */}
        <div className="snap-start flex-shrink-0 w-[280px] lg:w-[300px]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-navy/40 font-bold mb-3">
            Choose your priorities
          </p>
          <div className="space-y-2">
            {QUIZ_CONFIG.factors.map((factor) => {
              const isSelected = selectedFactors.has(factor.id);
              return (
                <button
                  key={factor.id}
                  onClick={() => toggleFactor(factor.id)}
                  data-testid={`factor-chip-${factor.id}`}
                  className={`w-full text-left px-4 py-3 border transition-all text-[13px] ${
                    isSelected
                      ? 'border-gold bg-gold/5 text-navy font-medium'
                      : 'border-navy/10 text-navy/60 hover:border-navy/20'
                  }`}
                >
                  {factor.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Follow-up questions */}
        {QUIZ_CONFIG.factors
          .filter((f) => selectedFactors.has(f.id))
          .map((factor) => (
            <div
              key={factor.id}
              className="snap-start flex-shrink-0 w-[280px] lg:w-[300px]"
              data-testid={`followup-${factor.id}`}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold mb-3">
                {factor.label}
              </p>
              <p className="text-navy font-serif text-[15px] mb-4">
                {factor.followUp.question}
              </p>
              <div className="space-y-2">
                {factor.followUp.options.map((option, idx) => {
                  const isSelected = answers[factor.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(factor.id, idx)}
                      data-testid={`option-${factor.id}-${idx}`}
                      className={`w-full text-left px-4 py-3 border transition-all text-[13px] ${
                        isSelected
                          ? 'border-gold bg-gold/5 text-navy font-medium'
                          : 'border-navy/10 text-navy/60 hover:border-navy/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      <div className="text-center mt-8">
        <button
          onClick={() => onComplete(answers as Record<FactorId, number>)}
          disabled={!hasAnswers}
          data-testid="quiz-submit-btn"
          className="bg-gold text-white px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-navy transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          See My Results
        </button>
      </div>
    </div>
  );
}
