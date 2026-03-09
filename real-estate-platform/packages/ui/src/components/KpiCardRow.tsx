'use client';

/**
 * KPI Card Row — Responsive grid of KPI cards.
 */

import type { KpiCardProps } from './KpiCard';
import { KpiCard } from './KpiCard';

export interface KpiCardRowProps {
  agentId: string;
  className?: string;
  cards: Omit<KpiCardProps, 'agentId'>[];
}

export function KpiCardRow({ agentId, className = '', cards }: KpiCardRowProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${className}`}>
      {cards.map((card) => (
        <KpiCard key={card.label} agentId={agentId} {...card} />
      ))}
    </div>
  );
}
