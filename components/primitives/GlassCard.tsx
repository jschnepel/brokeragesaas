import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--brand-radius)] border border-[var(--border)] bg-white/80 backdrop-blur-[var(--brand-card-blur)] p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
