import {
  StatusBadge,
  RushBadge,
  SLAIndicator,
  SectionHeader,
  KPITile,
  GlassCard,
} from "@/components/primitives";
import {
  BarChart3,
  Clock,
  FileText,
  Users,
} from "lucide-react";

const allStatuses = [
  "draft",
  "submitted",
  "in_review",
  "assigned",
  "in_progress",
  "awaiting_materials",
  "completed",
  "cancelled",
] as const;

const colorSwatches = [
  { label: "--brand-primary", var: "var(--brand-primary)" },
  { label: "--brand-primary-dark", var: "var(--brand-primary-dark)" },
  { label: "--brand-accent", var: "var(--brand-accent)" },
  { label: "--brand-surface", var: "var(--brand-surface)" },
  { label: "--brand-surface-alt", var: "var(--brand-surface-alt)" },
  { label: "--brand-dark", var: "var(--brand-dark)" },
  { label: "--brand-sidebar", var: "var(--brand-sidebar)" },
];

// SLA demo: a deadline 18 hours in the future
const futureDeadline = new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString();
const pastDeadline = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-12 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-16">
        {/* ── Header ─────────────────────────────────────── */}
        <header>
          <h1
            className="text-4xl font-bold tracking-tight text-[var(--foreground)]"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            Design System
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Primitives, tokens, and motion presets for the SaaS platform.
          </p>
        </header>

        {/* ── Typography ─────────────────────────────────── */}
        <section className="space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight text-[var(--foreground)] border-b border-[var(--border)] pb-3"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            Typography
          </h2>
          <div className="space-y-3">
            <h1
              className="text-4xl font-bold"
              style={{ fontFamily: "var(--brand-font-display)" }}
            >
              Heading 1 &mdash; Cormorant Garamond
            </h1>
            <h2
              className="text-3xl font-semibold"
              style={{ fontFamily: "var(--brand-font-display)" }}
            >
              Heading 2 &mdash; Cormorant Garamond
            </h2>
            <h3
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--brand-font-display)" }}
            >
              Heading 3 &mdash; Cormorant Garamond
            </h3>
            <h4
              className="text-xl font-medium"
              style={{ fontFamily: "var(--brand-font-display)" }}
            >
              Heading 4 &mdash; Cormorant Garamond
            </h4>
            <p className="text-base text-[var(--foreground)]">
              Body text in DM Sans. The quick brown fox jumps over the lazy dog.
              This paragraph demonstrates the default body typeface at standard weight
              and size, optimised for long-form reading.
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Muted small text for captions and secondary information.
            </p>
          </div>
        </section>

        {/* ── Color Swatches ─────────────────────────────── */}
        <section className="space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight text-[var(--foreground)] border-b border-[var(--border)] pb-3"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            Color Tokens
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {colorSwatches.map((swatch) => (
              <div key={swatch.label} className="space-y-2 text-center">
                <div
                  className="mx-auto h-16 w-16 rounded-[var(--brand-radius)] border border-[var(--border)] shadow-sm"
                  style={{ backgroundColor: swatch.var }}
                />
                <p className="text-xs font-medium text-[var(--muted-foreground)] break-all leading-tight">
                  {swatch.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── StatusBadge ────────────────────────────────── */}
        <section className="space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight text-[var(--foreground)] border-b border-[var(--border)] pb-3"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            StatusBadge
          </h2>
          <div className="flex flex-wrap gap-2">
            {allStatuses.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </section>

        {/* ── RushBadge ──────────────────────────────────── */}
        <section className="space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight text-[var(--foreground)] border-b border-[var(--border)] pb-3"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            RushBadge
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">isRush=true:</span>
              <RushBadge isRush={true} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">isRush=false:</span>
              <RushBadge isRush={false} />
              <span className="text-xs text-gray-400 italic">(renders nothing)</span>
            </div>
          </div>
        </section>

        {/* ── SLAIndicator ───────────────────────────────── */}
        <section className="space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight text-[var(--foreground)] border-b border-[var(--border)] pb-3"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            SLAIndicator
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <GlassCard className="space-y-1">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Breached</p>
              <SLAIndicator deadline={pastDeadline} breached={true} />
            </GlassCard>
            <GlassCard className="space-y-1">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">On Track</p>
              <SLAIndicator deadline={futureDeadline} breached={false} />
            </GlassCard>
            <GlassCard className="space-y-1">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Overdue</p>
              <SLAIndicator deadline={pastDeadline} breached={false} />
            </GlassCard>
            <GlassCard className="space-y-1">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">No SLA</p>
              <SLAIndicator deadline={null} breached={false} />
            </GlassCard>
          </div>
        </section>

        {/* ── SectionHeader ──────────────────────────────── */}
        <section className="space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight text-[var(--foreground)] border-b border-[var(--border)] pb-3"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            SectionHeader
          </h2>
          <GlassCard>
            <SectionHeader
              title="Active Orders"
              subtitle="All open transaction coordination orders"
            />
          </GlassCard>
          <GlassCard>
            <SectionHeader
              title="Team Members"
              subtitle="Manage your coordination team"
              action={
                <button className="rounded-[var(--brand-radius)] bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-primary-dark)] transition-colors">
                  Add Member
                </button>
              }
            />
          </GlassCard>
        </section>

        {/* ── KPITile ────────────────────────────────────── */}
        <section className="space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight text-[var(--foreground)] border-b border-[var(--border)] pb-3"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            KPITile
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPITile
              label="Active Orders"
              value={42}
              trend="+12%"
              icon={<FileText className="size-5" />}
            />
            <KPITile
              label="Avg. Turnaround"
              value="2.4d"
              trend="-8%"
              icon={<Clock className="size-5" />}
            />
            <KPITile
              label="Team Members"
              value={8}
              icon={<Users className="size-5" />}
            />
            <KPITile
              label="Monthly Revenue"
              value="$18.2k"
              trend="+23%"
              icon={<BarChart3 className="size-5" />}
            />
          </div>
        </section>

        {/* ── GlassCard ──────────────────────────────────── */}
        <section className="space-y-4">
          <h2
            className="text-2xl font-semibold tracking-tight text-[var(--foreground)] border-b border-[var(--border)] pb-3"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            GlassCard
          </h2>
          <GlassCard>
            <h3
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--brand-font-display)" }}
            >
              Sample Card Content
            </h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              This card uses a frosted-glass aesthetic: white background at 80% opacity
              with a backdrop blur derived from the --brand-card-blur token. The border
              radius follows --brand-radius for consistency across the system.
            </p>
          </GlassCard>
        </section>

        {/* ── Footer ─────────────────────────────────────── */}
        <footer className="border-t border-[var(--border)] pt-6 pb-12">
          <p className="text-xs text-[var(--muted-foreground)]">
            Design system v0.1 &middot; Tokens defined in globals.css &middot; Motion presets in lib/motion.ts
          </p>
        </footer>
      </div>
    </div>
  );
}
