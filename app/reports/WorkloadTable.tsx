"use client";

import { GlassCard } from "@/components/primitives";
import type { DesignerLoad } from "@/lib/types";

interface Props {
  data: DesignerLoad[];
}

export function WorkloadTable({ data }: Props) {
  const maxActive = Math.max(...data.map((d) => d.activeCount), 1);

  return (
    <GlassCard>
      <h3
        className="mb-4 text-base font-semibold text-[var(--foreground)]"
        style={{ fontFamily: "var(--brand-font-display)" }}
      >
        Designer Workload
      </h3>
      <div className="space-y-4">
        {data.map((d) => {
          const pct = Math.round((d.activeCount / maxActive) * 100);
          return (
            <div key={d.designerId}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--foreground)]">
                  {d.designerName}
                </span>
                <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
                  <span>{d.activeCount} active</span>
                  <span>{d.completedCount} completed</span>
                </div>
              </div>
              <div className="flex h-5 items-center gap-2">
                <div className="flex-1 rounded-full bg-[var(--brand-surface-alt)] h-3">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: "linear-gradient(90deg, #0F2B4F, #C9A96E)",
                    }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-medium text-[var(--foreground)]">
                  {d.activeCount + d.completedCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
