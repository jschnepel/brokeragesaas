"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, CheckCircle, Clock, Timer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { KPITile, SectionHeader } from "@/components/primitives";
import { RequestCard, NewRequestModal, CancelModal, RequestDetail } from "@/components/features";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { REQUEST_STATUS } from "@/lib/constants";
import type { RequestDTO, KPIs } from "@/lib/types";

/* ── Tab buttons ─────────────────────────────────────────────────────────── */

const TABS = ["active", "completed", "cancelled"] as const;
type Tab = (typeof TABS)[number];

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex gap-1 rounded-lg bg-[var(--brand-surface-alt)] p-1">
      {TABS.map((t) => (
        <button key={t} onClick={() => onChange(t)} className={t === tab ? "rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-[var(--foreground)] shadow-sm" : "rounded-md px-4 py-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
}

/* ── Staggered card list ─────────────────────────────────────────────────── */

function CardList({
  requests,
  onSelect,
}: {
  requests: RequestDTO[];
  onSelect: (r: RequestDTO) => void;
}) {
  if (requests.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
        No requests here.
      </p>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
    >
      {requests.map((r) => (
        <motion.div key={r.id} variants={staggerItem}>
          <RequestCard request={r} variant="full" onClick={() => onSelect(r)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ── Main client ─────────────────────────────────────────────────────────── */

interface Props {
  requests: RequestDTO[];
  kpis: KPIs;
  currentUserId: string;
}

export function RequestsClient({ requests, kpis, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>("active");
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<RequestDTO | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [list, setList] = useState(requests);

  const filtered = useMemo(() => {
    const { COMPLETED, CANCELLED } = REQUEST_STATUS;
    if (tab === "completed") return list.filter((r) => r.status === COMPLETED);
    if (tab === "cancelled") return list.filter((r) => r.status === CANCELLED);
    return list.filter((r) => r.status !== COMPLETED && r.status !== CANCELLED);
  }, [list, tab]);

  function handleCreated(req: RequestDTO) {
    setList((prev) => [req, ...prev]);
  }

  function handleCancelled() {
    setList((prev) =>
      prev.map((r) =>
        r.id === cancelTarget ? { ...r, status: REQUEST_STATUS.CANCELLED } : r,
      ),
    );
    setCancelTarget(null);
    setSelected(null);
  }

  const hours = kpis.avgTurnaroundHours;
  const turnaround =
    hours >= 24 ? `${(hours / 24).toFixed(1)}d` : `${Math.round(hours)}h`;

  const actionButton = (
    <button
      onClick={() => setShowNew(true)}
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
    >
      <Plus className="size-4" />
      New Request
    </button>
  );

  return (
    <AppShell title="My Requests" action={actionButton}>
      {/* KPI row */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPITile label="Total Requests" value={kpis.totalRequests} icon={<FileText className="size-5" />} />
        <KPITile label="Open" value={kpis.openRequests} icon={<Clock className="size-5" />} />
        <KPITile label="Completed" value={kpis.completedRequests} icon={<CheckCircle className="size-5" />} />
        <KPITile label="Avg Turnaround" value={turnaround} icon={<Timer className="size-5" />} />
      </div>

      {/* Tabs + list */}
      <SectionHeader title="Requests" action={<TabBar tab={tab} onChange={setTab} />} className="mb-4" />
      <CardList requests={filtered} onSelect={setSelected} />

      {/* Modals / panels */}
      <NewRequestModal open={showNew} onClose={() => setShowNew(false)} onCreated={handleCreated} />
      <RequestDetail
        request={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        currentUserId={currentUserId}
      />
      {cancelTarget && (
        <CancelModal
          open
          requestId={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={handleCancelled}
        />
      )}
    </AppShell>
  );
}
