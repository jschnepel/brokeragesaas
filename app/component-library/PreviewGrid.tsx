"use client";

import { GlassCard, StatusBadge, RushBadge, KPITile } from "@/components/primitives";
import { RequestCard } from "@/components/features";
import { FileText, CheckCircle } from "lucide-react";
import type { RequestDTO } from "@/lib/types";

const MOCK_REQUEST: RequestDTO = {
  id: "preview-1",
  queueNumber: 42,
  title: "Spring Open House Flyer",
  materialType: "Flyer",
  status: "in_progress",
  isRush: true,
  requesterName: "Yong Choi",
  designerName: "Marcus Chen",
  dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
  submittedAt: new Date().toISOString(),
  slaDeadline: new Date(Date.now() + 2 * 86400000).toISOString(),
  slaBreached: false,
  brief: "Full-page flyer for the spring listing campaign.",
  assignedTo: "designer-1",
  requesterId: "agent-1",
  messages: [],
  files: [],
};

const STATUSES = [
  "submitted",
  "in_review",
  "assigned",
  "in_progress",
  "awaiting_materials",
  "completed",
  "cancelled",
];

export function PreviewGrid() {
  return (
    <div className="space-y-8">
      {/* StatusBadge row */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Status Badges
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </div>

      {/* Rush badge */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Rush Badge
        </p>
        <div className="flex gap-3">
          <RushBadge isRush />
          <span className="text-xs text-[var(--muted-foreground)] self-center">
            (only renders when isRush=true)
          </span>
        </div>
      </div>

      {/* KPI Tiles */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          KPI Tiles
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPITile label="Total Requests" value={128} icon={<FileText className="size-5" />} />
          <KPITile label="Completed" value={94} icon={<CheckCircle className="size-5" />} trend="+12%" />
          <KPITile label="Avg Turnaround" value="1.8d" />
          <KPITile label="SLA Breach" value="4.2%" />
        </div>
      </div>

      {/* RequestCard */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Request Card (Full)
        </p>
        <div className="max-w-xl">
          <RequestCard request={MOCK_REQUEST} variant="full" />
        </div>
      </div>

      {/* Request Card Compact */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Request Card (Compact)
        </p>
        <div className="max-w-xl">
          <RequestCard request={MOCK_REQUEST} variant="compact" />
        </div>
      </div>

      {/* GlassCard */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Glass Card
        </p>
        <div className="max-w-sm">
          <GlassCard>
            <p className="text-sm text-[var(--foreground)]">
              GlassCard is the base container with backdrop blur and subtle border. Used throughout the platform.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
