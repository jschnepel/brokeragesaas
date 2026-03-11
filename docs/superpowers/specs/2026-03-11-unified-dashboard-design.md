# Unified Dashboard Redesign

## Overview

Rebuild the dashboard into a single, role-driven bento grid layout. One `DashboardShell` component renders a configurable grid of widgets based on the user's role and manager subtype. Roles are renamed to generic, industry-standard names with display-friendly job titles (AKAs).

## Role System

### Role Rename (DB Migration)

| Old Value | New Value | Job Title (AKA) |
|-----------|-----------|-----------------|
| `agent` | `member` | Agent |
| `designer` | `specialist` | Designer |
| `marketing_manager` | `manager` | Marketing Manager (default) |
| `executive` | `executive` | Executive |
| `platform_admin` | `admin` | Platform Admin |

### Manager Subtypes

Managers get an additional `manager_type` field:

| `manager_type` | Job Title | Scope |
|----------------|-----------|-------|
| `member_team` | Broker / Team Lead | Oversees agents |
| `specialist_team` | Creative Director | Oversees designers |
| `corporate` | Marketing Manager | Cross-functional |

### Admin Override

`admin` role can access any dashboard view. No restrictions. Admin users see the **Executive** dashboard by default, with a role-switcher dropdown in the header to preview any other role's dashboard.

### Type Definitions

```typescript
// types/roles.ts
type PlatformRole = 'member' | 'specialist' | 'manager' | 'executive' | 'admin'
type ManagerType = 'member_team' | 'specialist_team' | 'corporate'

// Replaces existing ViewerRole type in lib/types.ts
type ViewerRole = PlatformRole

interface KPIConfig {
  label: string
  dataSource: 'live' | 'mock'
  format: 'number' | 'currency' | 'percentage' | 'duration'
  signal?: 'ok' | 'warning' | 'critical'  // optional threshold-based coloring
  fetchKey: string                          // key used by data fetching layer
}

interface RoleConfig {
  role: PlatformRole
  managerType?: ManagerType
  jobTitle: string
  kpis: KPIConfig[]
  widgets: WidgetConfig[]
  gridLayout: GridLayout
}
```

## Architecture

### Component Tree

```
DashboardPage (server component — fetches session + initial data)
└── DashboardShell (client — receives role, roleConfig, and pre-fetched data)
    ├── getRoleConfig(role, managerType?) → RoleConfig  (pure config, no data fetching)
    └── BentoGrid (layout wrapper)
        ├── KPIRow (always row 1, full width)
        ├── [Shared widgets: Calendar, Messages, ActionItems, QuickActions]
        └── [Role-specific widgets based on config]
```

### Data Flow

```
Session (role + managerType)
  → DashboardPage (server) calls getRoleConfig() to determine needed widgets
  → DashboardPage pre-fetches live data via server actions for all live widgets
  → DashboardShell (client) receives roleConfig + pre-fetched data as props
  → BentoGrid renders widgets, each receiving its data as props
  → Mock widgets import directly from lib/mock-data/dashboard.ts
```

Each widget receives its data as props — widgets do NOT independently call server actions. The server component pre-fetches all needed data and passes it down. This avoids waterfall requests and keeps widgets as pure presentational components.

### Widget Instantiation

`BentoGrid` uses a static widget registry (lookup object) to map widget IDs to components:

```typescript
// app/(dashboard)/dashboard/components/widget-registry.ts
import { CalendarWidget } from './widgets/CalendarWidget'
import { MessagesWidget } from './widgets/MessagesWidget'
// ... all widget imports

export const WIDGET_REGISTRY: Record<string, React.ComponentType<any>> = {
  'calendar': CalendarWidget,
  'messages': MessagesWidget,
  'action-items': ActionItemsWidget,
  // ... etc
}
```

`BentoGrid` iterates over `roleConfig.widgets`, looks up each widget ID in the registry, and renders it with the appropriate grid span and data props. No dynamic imports — all widgets are statically imported and tree-shaken by Next.js.

### Layout: Bento Grid

All roles use a 4-column CSS grid. Widgets specify their span via `gridSpan: { cols, rows }`. The grid auto-fills based on the role's widget list.

```typescript
// lib/config/dashboard.ts
interface WidgetConfig {
  id: string                // key into WIDGET_REGISTRY
  gridSpan: { cols: number; rows: number }
  dataSource: 'live' | 'mock'
  priority: number           // render order in grid
}

interface GridLayout {
  columns: number            // always 4
  gap: string                // tailwind gap class
  responsive: {
    mobile: number            // columns at <640px (sm breakpoint)
    tablet: number            // columns at <1024px (lg breakpoint)
  }
}
```

Responsive breakpoints follow Tailwind defaults: mobile < 640px (1 column), tablet 640-1023px (2 columns), desktop 1024px+ (4 columns).

## KPIs Per Role

### Member (Agent) — Real Estate Focus
| KPI | Format | Data Source |
|-----|--------|-----------|
| Active Listings | number | mock (until listings table) |
| Under Contract | number | mock |
| Closed Volume (YTD) | currency | mock |
| Showings This Week | number | mock |

### Specialist (Designer) — Production Focus
| KPI | Format | Data Source |
|-----|--------|-----------|
| My Queue Size | number | live (requests table) |
| In Progress | number | live |
| Completed This Week | number | live |
| SLA Compliance % | percentage | live |

### Manager — Agent Team (Broker)
| KPI | Format | Data Source |
|-----|--------|-----------|
| Team Listings | number | mock |
| Team Volume (YTD) | currency | mock |
| Agents Active | number | mock |
| Avg Days on Market | duration | mock |

### Manager — Design Team (Creative Director)
| KPI | Format | Data Source |
|-----|--------|-----------|
| Queue Depth | number | live |
| Active Designers | number | live |
| SLA Compliance % | percentage | live |
| Avg Turnaround | duration | live |

### Manager — Corporate (Marketing Manager)
| KPI | Format | Data Source |
|-----|--------|-----------|
| Company Volume (YTD) | currency | mock |
| Active Listings | number | mock |
| Total Agents | number | mock |
| Avg Days on Market | duration | mock |

### Executive
| KPI | Format | Data Source |
|-----|--------|-----------|
| Company Volume (YTD) | currency | mock |
| Closed Transactions | number | mock |
| Market Share | percentage | mock |
| Revenue (YTD) | currency | mock |

## Widget Inventory

### Shared Widgets (all or most roles)

| Widget | Roles | Grid Span | Data |
|--------|-------|-----------|------|
| `KPIRow` | all | 4×1 | varies by role |
| `CalendarWidget` | all | 1×1 | live (existing MiniCalendar) |
| `MessagesWidget` | all | 2×1 | live (existing messages) |
| `ActionItemsWidget` | all | 2×1 | live + mock hybrid |
| `QuickActionsWidget` | member, specialist, manager | 1×1 | static (role-based buttons) |

### Role-Specific Widgets

| Widget | Roles | Grid Span | Data |
|--------|-------|-----------|------|
| `MyListingsWidget` | member | 3×1 | mock |
| `ShowingsWidget` | member, manager (member_team) | 1×1 | mock |
| `LeadsWidget` | member, manager (member_team) | 1×1 | mock |
| `DesignRequestsWidget` | member | 2×1 | live (my requests) |
| `DesignQueueWidget` | specialist | 3×1 | live (SLA queue) |
| `TeamDesignQueueWidget` | manager (specialist_team, corporate) | 3×1 | live |
| `TeamListingsWidget` | manager (member_team, corporate) | 3×1 | mock |
| `TeamCapacityWidget` | manager (specialist_team, corporate), executive | 2×1 | live (designer load) |
| `AnalyticsChartsWidget` | manager (specialist_team, corporate), executive | 2×1 | live (volume/SLA charts) |
| `TransactionPipelineWidget` | manager, executive | 2×1 | mock |
| `ActivityFeedWidget` | executive | 2×1 | live + mock |
| `AllRequestsWidget` | executive | 4×1 | live |

## Grid Layouts Per Role

### Member (Agent)
```
[  KPI  ][  KPI  ][  KPI  ][  KPI  ]    ← row 1: KPIs
[ My Listings (3×1)        ][Calendar]   ← row 2: primary content
[Action Items (2×1)][Messages (2×1) ]    ← row 3: shared
[Design Requests(2)][Showings][Leads ]   ← row 4: secondary
```

### Specialist (Designer)
```
[  KPI  ][  KPI  ][  KPI  ][  KPI  ]    ← row 1: KPIs
[ Design Queue / SLA (3×1) ][Calendar]   ← row 2: primary
[Action Items (2×1)][Messages (2×1) ]    ← row 3: shared
[Quick Actions (1) ][               ]    ← row 4: actions
```

### Manager — Agent Team (Broker / member_team)
```
[  KPI  ][  KPI  ][  KPI  ][  KPI  ]    ← row 1: KPIs (real estate)
[ Team Listings (3×1)      ][Calendar]   ← row 2: agent-focused
[Showings (1)][Leads (1)][Tx Pipeline(2)]← row 3: real estate
[Action Items (2×1)][Messages (2×1) ]    ← row 4: shared
[Quick Actions (1) ][               ]    ← row 5: actions
```

### Manager — Design Team (Creative Director / specialist_team)
```
[  KPI  ][  KPI  ][  KPI  ][  KPI  ]    ← row 1: KPIs (production)
[ Team Design Queue (3×1)  ][Calendar]   ← row 2: design-focused
[Team Capacity (2) ][Analytics (2)  ]    ← row 3: oversight
[Action Items (2×1)][Messages (2×1) ]    ← row 4: shared
[Tx Pipeline (2)   ][Quick Actions  ]    ← row 5: secondary
```

### Manager — Corporate (Marketing Manager / corporate)
```
[  KPI  ][  KPI  ][  KPI  ][  KPI  ]    ← row 1: KPIs (company-wide)
[ Team Listings (3×1)      ][Calendar]   ← row 2: real estate overview
[ Team Design Queue (3×1)  ][Quick Act]  ← row 3: design oversight
[Team Capacity (2) ][Analytics (2)  ]    ← row 4: oversight
[Action Items (2×1)][Messages (2×1) ]    ← row 5: shared
[Tx Pipeline (2)   ][               ]    ← row 6: secondary
```
Corporate managers see both real estate (Team Listings) and design (Team Design Queue) since they oversee cross-functional operations.

### Executive
```
[  KPI  ][  KPI  ][  KPI  ][  KPI  ]    ← row 1: KPIs
[ All Requests (4×1)                ]    ← row 2: full view
[Team Capacity (2) ][Analytics (2)  ]    ← row 3: oversight
[Tx Pipeline (2)   ][Activity Feed  ]    ← row 4: secondary
[Action Items (2×1)][Messages (2×1) ]    ← row 5: shared
[     Calendar (1) ][               ]    ← row 6: calendar
```

## Mock Data Strategy

Widgets with `dataSource: 'mock'` import from a centralized mock data file:

```typescript
// lib/mock-data/dashboard.ts
export const mockListings: Listing[] = [...]
export const mockShowings: Showing[] = [...]
export const mockLeads: Lead[] = [...]
export const mockTransactions: Transaction[] = [...]
```

Each mock dataset has a corresponding TypeScript interface. When real tables are built, the service layer implements the same interface and the widget's `dataSource` flips to `'live'`.

```typescript
// Example: widget receives data as props from server component
interface MyListingsWidgetProps {
  listings: Listing[]
}

// DashboardPage (server) determines data source from config:
const roleConfig = getRoleConfig(session.user.role, session.user.managerType)
const widgetData: Record<string, any> = {}

for (const widget of roleConfig.widgets) {
  if (widget.dataSource === 'mock') {
    widgetData[widget.id] = getMockData(widget.id)
  } else {
    widgetData[widget.id] = await fetchWidgetData(widget.id, session.user)
  }
}

// Passed to DashboardShell → BentoGrid → each widget as props
```

## Files to Create

```
types/roles.ts                              ← PlatformRole, ManagerType, RoleConfig, KPIConfig types
lib/config/dashboard.ts                     ← getRoleConfig(), widget configs, grid layouts per role
lib/mock-data/dashboard.ts                  ← mock data for real estate widgets (replaces old mock-data.ts)
app/(dashboard)/dashboard/DashboardShell.tsx ← new unified client component
app/(dashboard)/dashboard/components/
  ├── BentoGrid.tsx                         ← grid layout wrapper
  ├── KPIRow.tsx                            ← replaces DashboardKPI + DashKPI
  ├── widget-registry.ts                    ← static map of widget ID → component
  ├── widgets/
  │   ├── CalendarWidget.tsx                ← wraps existing MiniCalendar
  │   ├── MessagesWidget.tsx                ← wraps existing RecentMessages
  │   ├── ActionItemsWidget.tsx             ← new
  │   ├── QuickActionsWidget.tsx            ← new
  │   ├── MyListingsWidget.tsx              ← new (mock)
  │   ├── ShowingsWidget.tsx                ← new (mock)
  │   ├── LeadsWidget.tsx                   ← new (mock)
  │   ├── DesignRequestsWidget.tsx          ← refactored from AgentDashboard
  │   ├── DesignQueueWidget.tsx             ← refactored from DesignerDashboard
  │   ├── TeamDesignQueueWidget.tsx         ← refactored from ManagerDashboard
  │   ├── TeamListingsWidget.tsx            ← new (mock)
  │   ├── TeamCapacityWidget.tsx            ← refactored from ManagerDashboard
  │   ├── AnalyticsChartsWidget.tsx         ← refactored from ManagerDashboard
  │   ├── TransactionPipelineWidget.tsx     ← new (mock)
  │   ├── ActivityFeedWidget.tsx            ← refactored from ExecutiveDashboard
  │   └── AllRequestsWidget.tsx             ← refactored from ExecutiveDashboard
```

## Files to Modify

A project-wide search for old role string values (`'agent'`, `'designer'`, `'marketing_manager'`, `'platform_admin'`) must be done to catch any hardcoded references beyond this list. Additionally, all files consuming `ViewerRole` must be checked — the expanded type now includes `'admin'` and `'manager'` (replacing `'marketing_manager'`), so role-specific logic in those files must handle the new values.

```
auth.ts                                     ← update role values, add managerType to session
types/next-auth.d.ts                        ← update Session type with new roles + managerType
lib/types.ts                                ← update ViewerRole to use new PlatformRole values
lib/constants.ts                            ← update ROLES constant object to new values
lib/config/navigation.ts                    ← update role references in nav items
components/app-sidebar.tsx                  ← update role checks, show job title from roleConfig
app/(dashboard)/dashboard/page.tsx          ← pass new session shape, pre-fetch widget data
app/(dashboard)/dashboard/DashboardClient.tsx ← replace switch with DashboardShell
actions/intake.ts                           ← update role checks
services/request.ts                         ← update role references + SSE sendToRole calls
services/agent.ts                           ← update hardcoded role strings in SQL queries
lib/sse/connection-manager.ts              ← update role type
app/(dashboard)/requests/[id]/components/ActionStrip.tsx ← update ViewerRole logic for new roles
app/(dashboard)/requests/[id]/components/ChatPanel.tsx   ← update ViewerRole logic for new roles
app/(dashboard)/requests/[id]/components/DesignPreview.tsx ← update ViewerRole logic for new roles
components/features/QuickActionSheet.tsx    ← update ViewerRole logic for new roles
```

## Files to Delete

After migration is complete:
```
app/(dashboard)/dashboard/components/AgentDashboard.tsx
app/(dashboard)/dashboard/components/DesignerDashboard.tsx
app/(dashboard)/dashboard/components/ManagerDashboard.tsx
app/(dashboard)/dashboard/components/ExecutiveDashboard.tsx
app/(dashboard)/dashboard/components/DashboardKPI.tsx
app/(dashboard)/dashboard/components/DashKPI.tsx
app/(dashboard)/dashboard/mock-data.ts      ← replaced by lib/mock-data/dashboard.ts
```

## DB Migration

```sql
-- Rename role values
UPDATE users SET role = 'member' WHERE role = 'agent';
UPDATE users SET role = 'specialist' WHERE role = 'designer';
UPDATE users SET role = 'manager' WHERE role = 'marketing_manager';
UPDATE users SET role = 'admin' WHERE role = 'platform_admin';
-- 'executive' stays the same

-- Add manager_type column
ALTER TABLE users ADD COLUMN manager_type VARCHAR(20);
UPDATE users SET manager_type = 'corporate' WHERE role = 'manager';

-- Add demo users for other manager subtypes
-- NOTE: The INSERT columns below are simplified. Match to the actual users table schema
-- (include any NOT NULL columns like created_at, password_hash, etc.)
INSERT INTO users (id, name, email, role, manager_type)
VALUES
  ('demo-broker', 'Sarah Chen', 'sarah@demo.local', 'manager', 'member_team'),
  ('demo-creative-dir', 'Jordan Blake', 'jordan@demo.local', 'manager', 'specialist_team'),
  ('demo-admin', 'Admin User', 'admin@demo.local', 'admin', NULL);
-- Also update auth.ts demo users array to include these new users
```

## SSE Migration Strategy

The SSE connection manager stores role strings from the user's session at connection time. The code and DB must be updated together in a single deploy to avoid mismatched role strings.

**Deployment approach:** Since this is a demo/staging app with hardcoded users (not a production system with persistent sessions), a coordinated cutover is safe:
1. Run DB migration
2. Deploy updated code
3. All users re-authenticate (new session picks up new role values)

If this were production, we'd add a temporary compatibility layer that accepts both old and new role values for a transition period.

## Testing Strategy

- Verify each role renders the correct set of widgets
- Verify KPIs show correct data (live vs mock) and correct format (currency, percentage, etc.)
- Verify manager subtypes show correct job title and team-scoped data/widgets
- Verify admin sees executive dashboard by default with role-switcher
- Verify responsive grid collapses: 4 cols → 2 cols → 1 col at breakpoints
- Verify SSE events still trigger refreshes after role rename
- Verify navigation role checks work with new role values
- Verify all old role string references are removed (grep for old values)
- Test all three manager subtype demo users render distinct dashboards
