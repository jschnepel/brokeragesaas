"use client";

import { motion } from "framer-motion";
import { User, Calendar, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/lib/motion";
import { GlassCard } from "@/components/primitives";
import { StatusBadge, RushBadge, SLAIndicator } from "@/components/primitives";
import type { RequestDTO } from "@/lib/types";

const statusBorderColor: Record<string, string> = {
  draft: "border-l-gray-400",
  submitted: "border-l-blue-500",
  in_review: "border-l-amber-500",
  assigned: "border-l-purple-500",
  in_progress: "border-l-indigo-500",
  awaiting_materials: "border-l-orange-500",
  completed: "border-l-emerald-500",
  cancelled: "border-l-red-500",
};

function formatQueueNumber(n: number): string {
  return `#${String(n).padStart(3, "0")}`;
}

function formatDate(date: string | null): string {
  if (!date) return "No date";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface RequestCardProps {
  request: RequestDTO;
  variant?: "full" | "compact";
  onClick?: () => void;
  className?: string;
}

export function RequestCard({
  request,
  variant = "full",
  onClick,
  className,
}: RequestCardProps) {
  if (variant === "compact") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 rounded-lg bg-white/60 px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-white/90",
          className,
        )}
      >
        <span className="font-mono text-xs text-[var(--muted)]">
          {formatQueueNumber(request.queueNumber)}
        </span>
        <span className="flex-1 truncate font-medium">{request.title}</span>
        <StatusBadge status={request.status} />
        <RushBadge isRush={request.isRush} />
        <span className="text-xs text-[var(--muted)]">{request.materialType}</span>
      </div>
    );
  }

  const borderClass = request.slaBreached
    ? "border-l-red-500"
    : statusBorderColor[request.status] ?? "border-l-gray-400";

  return (
    <motion.div {...fadeIn}>
      <GlassCard
        className={cn(
          "border-l-4 cursor-pointer transition-shadow hover:shadow-md",
          borderClass,
          className,
        )}
      >
        <div onClick={onClick}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-xs text-[var(--muted)]">
              {formatQueueNumber(request.queueNumber)}
            </span>
            <h3 className="flex-1 truncate font-semibold text-[var(--foreground)]">
              {request.title}
            </h3>
            <StatusBadge status={request.status} />
            <RushBadge isRush={request.isRush} />
          </div>

          {/* Body */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="size-3.5" />
              {request.materialType}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="size-3.5" />
              {request.requesterName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {formatDate(request.dueDate)}
            </span>
            <SLAIndicator
              deadline={request.slaDeadline}
              breached={request.slaBreached}
            />
          </div>

          {/* Designer */}
          {request.designerName && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Assigned to{" "}
              <span className="font-medium text-[var(--foreground)]">
                {request.designerName}
              </span>
            </p>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
