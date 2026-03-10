"use client";

import { useState } from "react";
import { Play, Package, CheckCircle } from "lucide-react";
import { updateRequestStatus } from "@/actions/intake";
import { REQUEST_STATUS } from "@/lib/constants";

interface Props {
  requestId: string;
  currentStatus: string;
  onUpdated: (requestId: string, newStatus: string) => void;
}

const transitions: Record<string, { label: string; next: string; icon: typeof Play }[]> = {
  [REQUEST_STATUS.ASSIGNED]: [
    { label: "Start", next: REQUEST_STATUS.IN_PROGRESS, icon: Play },
  ],
  [REQUEST_STATUS.IN_PROGRESS]: [
    { label: "Need Materials", next: REQUEST_STATUS.AWAITING_MATERIALS, icon: Package },
    { label: "Complete", next: REQUEST_STATUS.COMPLETED, icon: CheckCircle },
  ],
  [REQUEST_STATUS.AWAITING_MATERIALS]: [
    { label: "Resume", next: REQUEST_STATUS.IN_PROGRESS, icon: Play },
    { label: "Complete", next: REQUEST_STATUS.COMPLETED, icon: CheckCircle },
  ],
};

export function StatusActions({ requestId, currentStatus, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const actions = transitions[currentStatus];

  if (!actions) return null;

  async function handleClick(newStatus: string) {
    setLoading(true);
    try {
      await updateRequestStatus(requestId, newStatus);
      onUpdated(requestId, newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {actions.map(({ label, next, icon: Icon }) => (
        <button
          key={next}
          onClick={() => handleClick(next)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--brand-surface-alt)] disabled:opacity-50"
        >
          <Icon className="size-3" />
          {label}
        </button>
      ))}
    </div>
  );
}
