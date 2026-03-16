'use client';

import { useState } from 'react';
import { QUIZ_CONFIG } from '../data';
import type { FactorId } from '../data';

interface InlineQuizProps {
  onComplete: (answers: Record<FactorId, number>) => void;
  className?: string;
}

const MIN_ANSWERS_REQUIRED = 3;

export function InlineQuiz({ onComplete, className = '' }: InlineQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const selectAnswer = (factorId: FactorId, optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [factorId]: optionIdx }));
  };

  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount >= MIN_ANSWERS_REQUIRED;

  return (
    <section className={`bg-navy py-20 lg:py-28 ${className}`} data-testid="inline-quiz">
      <div className="mx-auto max-w-content-lg px-8 lg:px-20">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-label uppercase tracking-xl text-gold font-bold block mb-4">
            Find Your Match
          </span>
          <h2 className="text-3xl lg:text-4xl font-serif text-white tracking-tight max-w-xl mx-auto">
            Which Arizona lifestyle fits you?
          </h2>
          <div className="w-12 h-0.5 bg-gold mt-6 mx-auto mb-6" />
          <p className="text-white/50 leading-relaxed max-w-lg mx-auto" style={{ fontSize: 15 }}>
            Answer at least {MIN_ANSWERS_REQUIRED} of the {QUIZ_CONFIG.factors.length} questions below
            to see your personalized lifestyle match.
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-12 max-w-3xl mx-auto">
          {QUIZ_CONFIG.factors.map((factor, qIdx) => (
            <div key={factor.id} data-testid={`quiz-question-${factor.id}`}>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-gold font-serif text-lg">{qIdx + 1}.</span>
                <p className="text-white font-serif text-lg">
                  {factor.followUp.question}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
                {factor.followUp.options.map((option, optIdx) => {
                  const isSelected = answers[factor.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => selectAnswer(factor.id, optIdx)}
                      data-testid={`option-${factor.id}-${optIdx}`}
                      className={`text-left px-5 py-4 border transition-all text-[13px] leading-relaxed ${
                        isSelected
                          ? 'border-gold bg-gold/5 text-white font-medium'
                          : 'border-white/10 text-white/60 hover:border-white/25 hover:text-white/80'
                      }`}
                      style={{ borderRadius: 4 }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="text-center mt-16">
          <button
            onClick={() => onComplete(answers as Record<FactorId, number>)}
            disabled={!canSubmit}
            data-testid="quiz-submit-btn"
            className="bg-gold text-white px-10 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-navy transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            See My Match
          </button>
          {!canSubmit && (
            <p className="text-white/30 text-[12px] mt-3">
              {answeredCount} of {MIN_ANSWERS_REQUIRED} minimum answered
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
