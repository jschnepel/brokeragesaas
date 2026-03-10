# Real-Time Notifications Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SSE-based real-time push notifications and live queue updates across the dashboard.

**Architecture:** A global SSE connection in the dashboard layout pushes events to all connected clients. The connection manager (server-side singleton via `globalThis`) tracks connections by user ID and role. Service layer methods emit events after DB mutations. Client-side `useSSE` hook handles connection lifecycle, and an `SSEProvider` component routes events to sonner toasts and triggers `router.refresh()` for data updates.

**Tech Stack:** Next.js 16 App Router, SSE (EventSource API), sonner toasts, PostgreSQL (Neon)

**Spec:** `docs/superpowers/specs/2026-03-10-realtime-notifications-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `lib/sse/connection-manager.ts` | Server-side singleton: tracks SSE connections by userId/role, broadcasts events |
| `lib/sse/events.ts` | SSE event type definitions and payload interfaces |
| `app/api/events/stream/route.ts` | SSE GET endpoint: authenticates, registers connection, streams events |
| `hooks/use-sse.ts` | Client-side EventSource hook: connect, reconnect, parse events |
| `components/features/SSEProvider.tsx` | Client component: wires useSSE to sonner toasts + router.refresh |

---

## Chunk 1: SSE Infrastructure

### Task 1: Define SSE Event Types

**Files:**
- Create: `lib/sse/events.ts`

- [ ] **Step 1: Create event type definitions**

```typescript
// lib/sse/events.ts

export type SSEEventType =
  | "request:submitted"
  | "request:assigned"
  | "request:resumed"
  | "request:updated"
  | "heartbeat";

export interface SSEEvent {
  type: SSEEventType;
  requestId: string;
  title: string;
  message: string;
  /** The request URL path for navigation */
  href: string;
}

export interface SSEHeartbeat {
  type: "heartbeat";
  timestamp: number;
}

export type SSEPayload = SSEEvent | SSEHeartbeat;

export function formatSSE(event: SSEPayload): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/sse/events.ts
git commit -m "feat(sse): add SSE event type definitions"
```

---

### Task 2: Build Connection Manager

**Files:**
- Create: `lib/sse/connection-manager.ts`

- [ ] **Step 1: Create the connection manager singleton**

The connection manager uses `globalThis` to survive Next.js HMR reloads in dev. It maps `userId → Set<ReadableStreamDefaultController>` and `role → Set<userId>` for targeted broadcasting.

```typescript
// lib/sse/connection-manager.ts

import { formatSSE, type SSEPayload } from "./events";

interface Connection {
  controller: ReadableStreamDefaultController;
  userId: string;
  role: string;
}

class SSEConnectionManager {
  /** userId → set of active stream controllers (supports multiple tabs) */
  private connections = new Map<string, Set<ReadableStreamDefaultController>>();
  /** role → set of userIds with that role */
  private roleIndex = new Map<string, Set<string>>();

  addConnection(userId: string, role: string, controller: ReadableStreamDefaultController) {
    // Track controller by userId
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(controller);

    // Track userId by role
    if (!this.roleIndex.has(role)) {
      this.roleIndex.set(role, new Set());
    }
    this.roleIndex.get(role)!.add(userId);
  }

  removeConnection(userId: string, controller: ReadableStreamDefaultController) {
    const controllers = this.connections.get(userId);
    if (!controllers) return;
    controllers.delete(controller);
    if (controllers.size === 0) {
      this.connections.delete(userId);
      // Clean up role index
      for (const [, users] of this.roleIndex) {
        users.delete(userId);
      }
    }
  }

  sendToUser(userId: string, event: SSEPayload) {
    const controllers = this.connections.get(userId);
    if (!controllers) return;
    const data = formatSSE(event);
    const encoder = new TextEncoder();
    for (const controller of controllers) {
      try {
        controller.enqueue(encoder.encode(data));
      } catch {
        // Controller closed, will be cleaned up on cancel
      }
    }
  }

  sendToRole(role: string, event: SSEPayload) {
    const userIds = this.roleIndex.get(role);
    if (!userIds) return;
    for (const userId of userIds) {
      this.sendToUser(userId, event);
    }
  }

  get connectionCount(): number {
    let count = 0;
    for (const [, controllers] of this.connections) {
      count += controllers.size;
    }
    return count;
  }
}

// Singleton via globalThis to survive HMR reloads
const globalKey = "__sse_connection_manager__";

function getConnectionManager(): SSEConnectionManager {
  if (!(globalThis as Record<string, unknown>)[globalKey]) {
    (globalThis as Record<string, unknown>)[globalKey] = new SSEConnectionManager();
  }
  return (globalThis as Record<string, unknown>)[globalKey] as SSEConnectionManager;
}

export const connectionManager = getConnectionManager();
```

- [ ] **Step 2: Commit**

```bash
git add lib/sse/connection-manager.ts
git commit -m "feat(sse): add connection manager singleton"
```

---

### Task 3: Create SSE API Route

**Files:**
- Create: `app/api/events/stream/route.ts`

- [ ] **Step 1: Create the SSE streaming endpoint**

This route authenticates via NextAuth session, registers the connection, sends heartbeats every 30s, and cleans up on disconnect.

```typescript
// app/api/events/stream/route.ts

import { auth } from "@/auth";
import { connectionManager } from "@/lib/sse/connection-manager";
import { formatSSE } from "@/lib/sse/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role ?? "agent";

  let controllerRef: ReadableStreamDefaultController | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      connectionManager.addConnection(userId, role, controller);

      // Send initial connection confirmation
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(formatSSE({ type: "heartbeat", timestamp: Date.now() }))
      );

      // Heartbeat every 30s to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(formatSSE({ type: "heartbeat", timestamp: Date.now() }))
          );
        } catch {
          // Stream closed
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 30_000);
    },
    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (controllerRef) {
        connectionManager.removeConnection(userId, controllerRef);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/events/stream/route.ts
git commit -m "feat(sse): add SSE streaming API route"
```

---

## Chunk 2: Client-Side SSE

### Task 4: Create useSSE Hook

**Files:**
- Create: `hooks/use-sse.ts`

- [ ] **Step 1: Create the client-side SSE hook**

```typescript
// hooks/use-sse.ts
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { SSEPayload } from "@/lib/sse/events";

interface UseSSEOptions {
  onEvent: (event: SSEPayload) => void;
}

export function useSSE({ onEvent }: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/events/stream");
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      retriesRef.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const data: SSEPayload = JSON.parse(event.data);
        if (data.type !== "heartbeat") {
          onEventRef.current(data);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, then 30s
      const delay = Math.min(1000 * 2 ** retriesRef.current, 30_000);
      retriesRef.current++;
      setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-sse.ts
git commit -m "feat(sse): add useSSE client hook with auto-reconnect"
```

---

### Task 5: Create SSEProvider Component

**Files:**
- Create: `components/features/SSEProvider.tsx`
- Modify: `app/(dashboard)/layout.tsx` (wrap children)
- Modify: `app/(dashboard)/layout.tsx` (add Toaster)

- [ ] **Step 1: Create SSEProvider**

This client component uses `useSSE` to listen for events and routes them to sonner toasts. Clicking a toast navigates to the request. It also calls `router.refresh()` to update server-fetched data.

```typescript
// components/features/SSEProvider.tsx
"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSSE } from "@/hooks/use-sse";
import type { SSEPayload, SSEEvent } from "@/lib/sse/events";

interface SSEProviderProps {
  children: React.ReactNode;
}

export function SSEProvider({ children }: SSEProviderProps) {
  const router = useRouter();

  useSSE({
    onEvent: (event: SSEPayload) => {
      if (event.type === "heartbeat") return;

      const sseEvent = event as SSEEvent;

      toast(sseEvent.message, {
        duration: 5000,
        action: {
          label: "View",
          onClick: () => router.push(sseEvent.href),
        },
      });

      // Refresh server data so tables/queues update
      router.refresh();
    },
  });

  return <>{children}</>;
}
```

- [ ] **Step 2: Add Toaster and SSEProvider to dashboard layout**

Modify `app/(dashboard)/layout.tsx`:

```typescript
// app/(dashboard)/layout.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { RightPanel } from "@/components/features/RightPanel"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SSEProvider } from "@/components/features/SSEProvider"
import { Toaster } from "@/components/ui/sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
            <SSEProvider>
              {children}
            </SSEProvider>
          </div>
        </div>
      </SidebarInset>
      <RightPanel />
      <Toaster position="bottom-right" />
    </SidebarProvider>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/features/SSEProvider.tsx app/(dashboard)/layout.tsx
git commit -m "feat(sse): add SSEProvider and Toaster to dashboard layout"
```

---

## Chunk 3: Emit SSE Events from Service Layer

### Task 6: Add SSE Emission to RequestService

**Files:**
- Modify: `services/request.ts`

- [ ] **Step 1: Add SSE event emission to `create`, `assign`, and `updateStatus` methods**

Import the connection manager and emit events after successful DB mutations. The `create` method broadcasts to the submitting agent and all marketing_managers. The `assign` method notifies the assigned designer and the requesting agent. The `updateStatus` method notifies the requesting agent for status changes not covered by specific events.

Add these imports at the top of `services/request.ts`:

```typescript
import { connectionManager } from "@/lib/sse/connection-manager";
import type { SSEEvent } from "@/lib/sse/events";
```

After the `return row;` in the `create` method (line 128), before the closing brace, add:

```typescript
    // Emit SSE: notify submitter + marketing managers
    const submittedEvent: SSEEvent = {
      type: "request:submitted",
      requestId: row.id,
      title: row.title,
      message: `Request submitted: "${row.title}"`,
      href: `/requests/${row.id}`,
    };
    connectionManager.sendToUser(data.requester_id, {
      ...submittedEvent,
      message: "Request submitted!",
    });
    connectionManager.sendToRole("marketing_manager", {
      ...submittedEvent,
      message: `New request: "${row.title}"`,
    });
```

After the `return row;` in the `updateStatus` method (line 149), before the closing brace, add:

```typescript
    // Emit SSE: notify the requesting agent (skip for submitted/assigned/resumed — handled by specific methods)
    const specificStatuses = ["submitted", "assigned"];
    const isResume = current.status === "awaiting_materials" && newStatus === "in_progress";
    if (!specificStatuses.includes(newStatus) && !isResume) {
      connectionManager.sendToUser(current.requester_id as string, {
        type: "request:updated",
        requestId: row.id,
        title: row.title,
        message: `Your request "${row.title}" was updated to ${newStatus.replace(/_/g, " ")}`,
        href: `/requests/${row.id}`,
      });
    }

    // Handle resume specifically
    if (isResume) {
      connectionManager.sendToUser(current.requester_id as string, {
        type: "request:resumed",
        requestId: row.id,
        title: row.title,
        message: `Your request "${row.title}" is back in progress`,
        href: `/requests/${row.id}`,
      });
    }
```

After the `return row;` in the `assign` method (line 170), before the closing brace, add:

```typescript
    // Emit SSE: notify assigned designer + requesting agent
    connectionManager.sendToUser(assigneeId, {
      type: "request:assigned",
      requestId: row.id,
      title: row.title,
      message: `You've been assigned: "${row.title}"`,
      href: `/requests/${row.id}`,
    });
    connectionManager.sendToUser(current.requester_id as string, {
      type: "request:assigned",
      requestId: row.id,
      title: row.title,
      message: `Your request "${row.title}" has been assigned`,
      href: `/requests/${row.id}`,
    });
```

**Important:** In each method, move the `return row;` statement to AFTER the SSE emission block. The emission code must execute before the function returns. For example in `create`, the final lines should be: SSE emission code → `return row;`.

- [ ] **Step 2: Commit**

```bash
git add services/request.ts
git commit -m "feat(sse): emit SSE events from RequestService mutations"
```

---

## Chunk 4: UI Enhancements

### Task 7: Add NEW Badge to IntakeQueueRow

**Files:**
- Modify: `app/(dashboard)/queue/components/IntakeQueueRow.tsx`

- [ ] **Step 1: Add NEW badge logic**

The badge shows for items submitted within the last hour. It uses `localStorage` to track which items have been viewed.

Add a helper and badge to the component. After the `RUSH` badge span (line 121), add:

```tsx
{isNew && (
  <span className="border border-amber-300 bg-amber-50 px-[5px] py-px text-[8px] font-bold tracking-[0.06em] text-amber-700">
    NEW
  </span>
)}
```

Add state/logic at the top of the `IntakeQueueRow` function (after line 68, the `const [expanded, setExpanded]` line):

```typescript
  // NEW badge: show if submitted < 1 hour ago and not yet viewed
  const isNew = (() => {
    const ageMs = Date.now() - new Date(req.submittedAt).getTime()
    if (ageMs > 3_600_000) return false // older than 1 hour
    if (typeof window === "undefined") return true
    try {
      const viewed = JSON.parse(localStorage.getItem("viewedRequests") || "[]") as string[]
      return !viewed.includes(req.id)
    } catch {
      return true
    }
  })()
```

Also, update the brief toggle button's onClick to mark the item as viewed:

Replace the `onClick={() => setExpanded((e) => !e)}` (line 126) with:

```typescript
onClick={() => {
  setExpanded((e) => !e)
  // Mark as viewed to clear NEW badge
  try {
    const viewed = JSON.parse(localStorage.getItem("viewedRequests") || "[]") as string[]
    if (!viewed.includes(req.id)) {
      viewed.push(req.id)
      // Keep only last 200 entries to prevent unbounded growth
      localStorage.setItem("viewedRequests", JSON.stringify(viewed.slice(-200)))
    }
  } catch { /* ignore */ }
}}
```

- [ ] **Step 2: Commit**

```bash
git add app/(dashboard)/queue/components/IntakeQueueRow.tsx
git commit -m "feat: add NEW badge to IntakeQueueRow for recent submissions"
```

---

### Task 8: Add Resume Work Button to DesignerTableRow

**Files:**
- Modify: `app/(dashboard)/queue/components/DesignerTableRow.tsx`

- [ ] **Step 1: Add Resume Work button**

Add a "Resume Work" button that appears for `awaiting_materials` requests. Clicking it calls `updateRequestStatus` to change status to `in_progress` and navigates to the request detail page.

Add import at the top of `app/(dashboard)/queue/components/DesignerTableRow.tsx`:

```typescript
import { useRouter } from "next/navigation"
import { updateRequestStatus } from "@/actions/intake"
import { toast } from "sonner"
```

Add `const router = useRouter()` at the start of the `DesignerTableRow` component function (after line 26, the `const [showTooltip, setShowTooltip]` line).

In the Cancel `<td>` cell (lines 143-160), add the Resume Work button BEFORE the existing cancel button logic. Replace the entire Cancel `<td>` with:

```tsx
<td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
  {request.status === "awaiting_materials" && (
    <button
      onClick={async (e) => {
        e.stopPropagation()
        await updateRequestStatus(request.id, "in_progress")
        toast.success(`Resumed: "${request.title}"`)
        router.push(`/requests/${request.id}`)
      }}
      title="Resume work on this request"
      className="mr-1 whitespace-nowrap border border-green-300 bg-green-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-green-700 transition-opacity duration-150 hover:opacity-70"
      data-testid={`resume-btn-${req.id}`}
    >
      Resume
    </button>
  )}
  {req.isActive && !req.isCancelled && (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onCancel(request)
      }}
      title="Cancel this request"
      className="whitespace-nowrap border border-red-300 bg-red-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-red-700 transition-opacity duration-150 hover:opacity-70"
      data-testid={`cancel-btn-${req.id}`}
    >
      Cancel
    </button>
  )}
  {req.isCancelled && (
    <span className="text-[10px] text-[#D1C9BC]">Cancelled</span>
  )}
</td>
```

- [ ] **Step 2: Commit**

```bash
git add app/(dashboard)/queue/components/DesignerTableRow.tsx
git commit -m "feat: add Resume Work button for awaiting_materials requests"
```

---

## Chunk 5: Manual Verification

### Task 9: End-to-End Verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test SSE connection**

1. Log in as any user (e.g., `yong`/`yong`)
2. Open browser DevTools → Network tab → filter by "EventStream"
3. Verify `/api/events/stream` connection is established
4. Confirm heartbeat messages arrive every 30s

- [ ] **Step 3: Test request submission notification**

1. Open two browser windows: Window A as `yong` (agent), Window B as `lex` (marketing_manager)
2. In Window A, submit a new request
3. Verify: toast appears in Window A ("Request submitted!")
4. Verify: toast appears in Window B ("New request: ...")
5. Verify: Intake Queue in Window B shows the new item with NEW badge

- [ ] **Step 4: Test assignment notification**

1. In Window B (lex), assign the new request to `marcus` (designer)
2. Open Window C as `marcus`
3. Verify: toast appeared for marcus ("You've been assigned: ...")
4. Verify: toast appeared for yong in Window A ("Your request ... has been assigned")

- [ ] **Step 5: Test resume work**

1. In Window C (marcus), navigate to `/queue`
2. Find a request with `awaiting_materials` status
3. Click "Resume" button
4. Verify: status changes to `in_progress`, toast appears, navigates to `/requests/[id]`
5. Verify: agent (Window A) gets toast "Your request ... is back in progress"

- [ ] **Step 6: Test NEW badge clearing**

1. In Window B, navigate to Intake Queue
2. Click "brief" on a NEW item
3. Verify: NEW badge disappears
4. Refresh page — verify badge stays gone (localStorage)

- [ ] **Step 7: Commit all working state**

```bash
git add -A
git commit -m "feat: real-time SSE notifications complete — verified end-to-end"
```
