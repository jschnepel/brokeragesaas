"use client";

import { useState, useMemo } from "react";
import { FileText, Clock, CheckCircle, Timer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { KPITile, SectionHeader } from "@/components/primitives";
import { RequestCard, RequestDetail } from "@/components/features";
import { REQUEST_STATUS } from "@/lib/constants";
import type {
  RequestDTO,
  KPIs,
  VolumeWeek,
  MaterialBreakdown,
  DesignerLoad,
  MessageRow,
  AgentRow,
} from "@/lib/types";

import { VolumeChart } from "./VolumeChart";
import { MaterialChart } from "./MaterialChart";
import { TriageQueue } from "./TriageQueue";
import { CapacitySection } from "./CapacitySection";
import { MessagesFeed } from "./MessagesFeed";

interface Props {
  requests: RequestDTO[];
  kpis: KPIs;
  volume: VolumeWeek[];
  materials: MaterialBreakdown[];
  recentMessages: MessageRow[];
  designers: AgentRow[];
  currentUserId: string;
}

export function TriageClient({
  requests: initialRequests,
  kpis,
  volume,
  materials,
  recentMessages,
  designers,
  currentUserId,
}: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [selected, setSelected] = useState<RequestDTO | null>(null);

  const triageQueue = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.status === REQUEST_STATUS.SUBMITTED ||
          r.status === REQUEST_STATUS.IN_REVIEW,
      ),
    [requests],
  );

  const designerLoad: DesignerLoad[] = useMemo(() => {
    const map = new Map<string, DesignerLoad>();
    designers.forEach((d) =>
      map.set(d.id, {
        designerId: d.id,
        designerName: d.name,
        activeCount: 0,
        completedCount: 0,
      }),
    );
    requests.forEach((r) => {
      if (!r.assignedTo) return;
      const entry = map.get(r.assignedTo);
      if (!entry) return;
      if (r.status === REQUEST_STATUS.COMPLETED) entry.completedCount++;
      else entry.activeCount++;
    });
    return Array.from(map.values());
  }, [designers, requests]);

  function handleAssigned(requestId: string, designerId: string) {
    const designer = designers.find((d) => d.id === designerId);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: REQUEST_STATUS.ASSIGNED,
              assignedTo: designerId,
              designerName: designer?.name ?? null,
            }
          : r,
      ),
    );
  }

  const hours = kpis.avgTurnaroundHours;
  const turnaround =
    hours >= 24 ? `${(hours / 24).toFixed(1)}d` : `${Math.round(hours)}h`;

  return (
    <AppShell title="Triage">
      {/* Row 1: Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <VolumeChart data={volume} />
        <MaterialChart data={materials} />
      </div>

      {/* Row 2: KPIs + Capacity + Triage Queue */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPITile label="Total Requests" value={kpis.totalRequests} icon={<FileText className="size-5" />} />
        <KPITile label="Open" value={kpis.openRequests} icon={<Clock className="size-5" />} />
        <KPITile label="Completed" value={kpis.completedRequests} icon={<CheckCircle className="size-5" />} />
        <KPITile label="Avg Turnaround" value={turnaround} icon={<Timer className="size-5" />} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <CapacitySection designers={designerLoad} />
        <TriageQueue
          requests={triageQueue}
          designers={designers}
          onAssigned={handleAssigned}
        />
      </div>

      {/* Row 3: Messages + Full queue */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MessagesFeed messages={recentMessages} />
        <div>
          <SectionHeader title="All Requests" className="mb-4" />
          <div className="space-y-3">
            {requests.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                variant="compact"
                onClick={() => setSelected(r)}
              />
            ))}
          </div>
        </div>
      </div>

      <RequestDetail
        request={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        currentUserId={currentUserId}
      />
    </AppShell>
  );
}
