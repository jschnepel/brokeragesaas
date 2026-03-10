import { cn } from "@/lib/utils";

interface KPITileProps {
  label: string;
  value: string | number;
  trend?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function KPITile({ label, value, trend, icon, className }: KPITileProps) {
  return (
    <div
      className={cn(
        "relative rounded-[var(--brand-radius)] border border-[var(--border)] bg-white/80 backdrop-blur-[var(--brand-card-blur)] p-5",
        className,
      )}
    >
      {icon && (
        <div className="mb-3 text-[var(--brand-accent)]">{icon}</div>
      )}
      <p
        className="text-3xl font-bold tracking-tight text-[var(--foreground)]"
        style={{ fontFamily: "var(--brand-font-display)" }}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{label}</p>
      {trend && (
        <span className="absolute bottom-4 right-4 inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
          {trend}
        </span>
      )}
    </div>
  );
}
