"use client";

import { GlassCard } from "@/components/primitives";
import type { DesignerLoad } from "@/lib/types";

interface Props {
  designers: DesignerLoad[];
}

export function CapacitySection({ designers }: Props) {
  const maxActive = Math.max(...designers.map((d) => d.activeCount), 1);

  return (
    <GlassCard>
      <h3
        className="mb-4 text-base font-semibold"
        style={{ fontFamily: "var(--brand-font-display)" }}
      >
        Designer Capacity
      </h3>
      <div className="space-y-3">
        {designers.map((d) => {
          const pct = Math.round((d.activeCount / maxActive) * 100);
          return (
            <div key={d.designerId}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--foreground)]">
                  {d.designerName}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {d.activeCount} active / {d.completedCount} done
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--brand-surface-alt)]">
                <div
                  className="h-2 rounded-full bg-[var(--brand-accent)] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
