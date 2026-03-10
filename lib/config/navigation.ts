/**
 * Navigation configuration — single source of truth for sidebar nav items.
 * Add/remove/reorder items here, not in components.
 */

import {
  FileText,
  Inbox,
  LayoutList,
  BarChart3,
  Palette,
  Settings2,
  CircleHelpIcon,
  Home,
  Users,
  Network,
  Mail,
  MessageSquare,
  LayoutDashboard,
  Contact,
  Building2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import type { PlatformRole } from "@/lib/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Roles that can see this item. Empty = visible to all. */
  roles: PlatformRole[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [
      { title: "Lyon's Den", href: ROUTES.LYONSDEN, icon: Home, roles: [] },
      { title: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard, roles: [] },
    ],
  },
  {
    label: "CRM",
    items: [
      { title: "Contacts", href: ROUTES.CONTACTS, icon: Contact, roles: [] },
      { title: "Listings", href: ROUTES.LISTINGS, icon: Building2, roles: [] },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "My Requests", href: ROUTES.REQUESTS, icon: FileText, roles: [] },
      { title: "Triage", href: ROUTES.TRIAGE, icon: Inbox, roles: ["marketing_manager", "platform_admin"] },
      { title: "Design Queue", href: ROUTES.QUEUE, icon: LayoutList, roles: ["designer", "marketing_manager", "platform_admin"] },
      { title: "Reports", href: ROUTES.REPORTS, icon: BarChart3, roles: ["executive", "marketing_manager", "platform_admin"] },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Email", href: ROUTES.EMAIL, icon: Mail, roles: [] },
      { title: "Messaging", href: ROUTES.MESSAGING, icon: MessageSquare, roles: [] },
      { title: "Prides", href: ROUTES.PRIDES, icon: Users, roles: [] },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Analytics", href: ROUTES.ANALYTICS, icon: TrendingUp, roles: [] },
      { title: "Org Chart", href: ROUTES.ORGCHART, icon: Network, roles: [] },
      { title: "Design System", href: ROUTES.COMPONENT_LIBRARY, icon: Palette, roles: [] },
    ],
  },
];

/** Flat list of all primary nav items (for backward compat) */
export const PRIMARY_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const SECONDARY_NAV: NavItem[] = [
  {
    title: "Settings",
    href: ROUTES.SETTINGS,
    icon: Settings2,
    roles: [],
  },
  {
    title: "Help",
    href: "#",
    icon: CircleHelpIcon,
    roles: [],
  },
];

/**
 * Filter nav items by role.
 * Items with empty roles array are visible to all.
 */
export function getNavForRole(items: NavItem[], role: PlatformRole): NavItem[] {
  return items.filter(
    (item) => item.roles.length === 0 || item.roles.includes(role),
  );
}
