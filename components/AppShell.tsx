"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  FileText,
  Inbox,
  LayoutList,
  BarChart3,
  Palette,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

/* ── Nav items ──────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { label: "Requests", href: ROUTES.REQUESTS, icon: FileText },
  { label: "Triage", href: ROUTES.TRIAGE, icon: Inbox },
  { label: "Queue", href: ROUTES.QUEUE, icon: LayoutList },
  { label: "Reports", href: ROUTES.REPORTS, icon: BarChart3 },
  { label: "Component Library", href: ROUTES.COMPONENT_LIBRARY, icon: Palette },
] as const;

/* ── Sidebar ────────────────────────────────────────────────────────────── */

function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = (session?.user as { role?: string } | undefined)?.role ?? "agent";
  const rolePretty = role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex flex-col bg-[var(--brand-sidebar)] text-white"
      style={{ width: "var(--brand-sidebar-width)" }}
    >
      {/* Brand */}
      <div className="px-6 py-6">
        <h1
          className="text-xl font-semibold tracking-tight text-white"
          style={{ fontFamily: "var(--brand-font-display)" }}
        >
          Russ Lyon
        </h1>
        <span className="text-xs font-medium text-[var(--brand-accent)]">
          Marketing Platform
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <a
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-[var(--brand-accent)]"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </a>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate text-sm font-medium text-white">
          {session?.user?.name ?? "User"}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <span className="rounded-full bg-[var(--brand-accent)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-accent)]">
            {rolePretty}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ── TopBar ──────────────────────────────────────────────────────────────── */

function TopBar({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-white/60 backdrop-blur-sm px-8 py-4">
      <h1
        className="text-2xl font-semibold tracking-tight text-[var(--foreground)]"
        style={{ fontFamily: "var(--brand-font-display)" }}
      >
        {title}
      </h1>
      {action && <div>{action}</div>}
    </header>
  );
}

/* ── AppShell ───────────────────────────────────────────────────────────── */

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}

export function AppShell({ children, title, action }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div style={{ marginLeft: "var(--brand-sidebar-width)" }}>
        <TopBar title={title} action={action} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
