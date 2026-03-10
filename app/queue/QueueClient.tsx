"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Filter } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SectionHeader, StatusBadge, RushBadge, SLAIndicator, GlassCard } from "@/components/primitives";
import { RequestDetail } from "@/components/features";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { REQUEST_STATUS } from "@/lib/constants";
import type { RequestDTO } from "@/lib/types";
import { StatusActions } from "./StatusActions";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: REQUEST_STATUS.ASSIGNED, label: "Assigned" },
  { value: REQUEST_STATUS.IN_PROGRESS, label: "In Progress" },
  { value: REQUEST_STATUS.AWAITING_MATERIALS, label: "Awaiting Materials" },
] as const;

function formatQueueNumber(n: number): string {
  return `#${String(n).padStart(3, "0")}`;
}

function formatDate(date: string | null): string {
  if (!date) return "No date";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Props {
  requests: RequestDTO[];
  currentUserId: string;
}

export function QueueClient({ requests: initial, currentUserId }: Props) {
  const [requests, setRequests] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<RequestDTO | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter],
  );

  function handleStatusUpdate(requestId: string, newStatus: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r)),
    );
  }

  const filterBar = (
    <div className="flex items-center gap-2">
      <Filter className="size-4 text-[var(--muted-foreground)]" />
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setFilter(opt.value)}
          className={
            filter === opt.value
              ? "rounded-md bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-white"
              : "rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--brand-surface-alt)] transition-colors"
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <AppShell title="Design Queue">
      <SectionHeader
        title={`${filtered.length} Request${filtered.length !== 1 ? "s" : ""}`}
        action={filterBar}
        className="mb-6"
      />

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">
          No requests match this filter.
        </p>
      ) : (
        <motion.div
          className="space-y-3"
          variants={staggerContainer()}
          initial="hidden"
          animate="show"
        >
          {filtered.map((r) => (
            <motion.div key={r.id} variants={staggerItem}>
              <GlassCard className="flex items-center gap-4">
                {/* Info — clickable */}
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-[var(--muted-foreground)]">
                      {formatQueueNumber(r.queueNumber)}
                    </span>
                    <span className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {r.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                    <span>{r.materialType}</span>
                    <span>{r.requesterName}</span>
                    <span>Due {formatDate(r.dueDate)}</span>
                    <SLAIndicator deadline={r.slaDeadline} breached={r.slaBreached} />
                  </div>
                </div>

                {/* Badges */}
                <StatusBadge status={r.status} />
                <RushBadge isRush={r.isRush} />

                {/* Actions */}
                <StatusActions
                  requestId={r.id}
                  currentStatus={r.status}
                  onUpdated={handleStatusUpdate}
                />
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      <RequestDetail
        request={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        currentUserId={currentUserId}
      />
    </AppShell>
  );
}
