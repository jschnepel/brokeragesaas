"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { GlassCard, StatusBadge, RushBadge } from "@/components/primitives";
import { assignRequest } from "@/actions/intake";
import type { RequestDTO, AgentRow } from "@/lib/types";

interface Props {
  requests: RequestDTO[];
  designers: AgentRow[];
  onAssigned: (requestId: string, designerId: string) => void;
}

export function TriageQueue({ requests, designers, onAssigned }: Props) {
  const [assigning, setAssigning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAssign(requestId: string, designerId: string) {
    setLoading(true);
    try {
      await assignRequest(requestId, designerId);
      onAssigned(requestId, designerId);
      setAssigning(null);
    } catch (err) {
      console.error("Failed to assign:", err);
    } finally {
      setLoading(false);
    }
  }

  if (requests.length === 0) {
    return (
      <GlassCard>
        <h3
          className="mb-3 text-base font-semibold"
          style={{ fontFamily: "var(--brand-font-display)" }}
        >
          Triage Queue
        </h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          All requests have been assigned.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <h3
        className="mb-4 text-base font-semibold"
        style={{ fontFamily: "var(--brand-font-display)" }}
      >
        Triage Queue ({requests.length})
      </h3>
      <div className="space-y-2">
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white/60 px-4 py-3"
          >
            <span className="font-mono text-xs text-[var(--muted-foreground)]">
              #{String(r.queueNumber).padStart(3, "0")}
            </span>
            <span className="flex-1 truncate text-sm font-medium">
              {r.title}
            </span>
            <StatusBadge status={r.status} />
            <RushBadge isRush={r.isRush} />

            {assigning === r.id ? (
              <select
                className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-xs"
                defaultValue=""
                disabled={loading}
                onChange={(e) => {
                  if (e.target.value) handleAssign(r.id, e.target.value);
                }}
              >
                <option value="" disabled>
                  Select designer...
                </option>
                {designers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setAssigning(r.id)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--brand-accent)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <UserPlus className="size-3" />
                Assign
              </button>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
