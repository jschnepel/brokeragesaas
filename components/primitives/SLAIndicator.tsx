import { AlertTriangle, CheckCircle, Clock, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SLAIndicatorProps {
  deadline: string | null;
  breached: boolean;
  className?: string;
}

function timeRemaining(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  }
  if (hours > 0) return `${hours}h left`;
  return `${minutes}m left`;
}

export function SLAIndicator({ deadline, breached, className }: SLAIndicatorProps) {
  if (breached) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold text-red-600", className)}>
        <AlertTriangle className="size-3.5" />
        SLA Breached
      </span>
    );
  }

  if (!deadline) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs text-gray-400", className)}>
        <Minus className="size-3.5" />
        No SLA
      </span>
    );
  }

  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();

  if (deadlineMs > now) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600", className)}>
        <CheckCircle className="size-3.5" />
        {timeRemaining(deadline)}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-amber-600", className)}>
      <Clock className="size-3.5" />
      Overdue
    </span>
  );
}
