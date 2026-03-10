import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  in_review: "bg-amber-50 text-amber-700 border-amber-200",
  assigned: "bg-purple-50 text-purple-700 border-purple-200",
  in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
  awaiting_materials: "bg-orange-50 text-orange-700 border-orange-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

function formatLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = statusStyles[status] ?? statusStyles.draft;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles,
        className,
      )}
    >
      {formatLabel(status)}
    </span>
  );
}
