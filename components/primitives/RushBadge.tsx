import { cn } from "@/lib/utils";

interface RushBadgeProps {
  isRush: boolean;
  className?: string;
}

export function RushBadge({ isRush, className }: RushBadgeProps) {
  if (!isRush) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-xs font-bold tracking-wide text-red-700 uppercase",
        className,
      )}
    >
      Rush
    </span>
  );
}
