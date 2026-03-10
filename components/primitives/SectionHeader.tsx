import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h2
          className="text-xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--brand-font-display)" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
