# Real-Time Notifications & Queue Updates via SSE

## Overview

Add real-time push notifications and live queue updates across the dashboard using Server-Sent Events (SSE). Toasts appear bottom-right (minimal style via sonner). Clicking a toast navigates to the relevant request. Intake queue items show a NEW badge for recently submitted requests.

## Event Types

### 1. `request:submitted`
- **Trigger:** Agent submits a new request
- **Recipients:** Submitting agent + all users with `marketing_manager` role
- **Toast (agent):** "Request submitted!" (success)
- **Toast (marketing):** "New request from {agentName}: {requestTitle}"
- **Side effect:** Intake Queue table re-fetches, new item shows NEW badge

### 2. `request:assigned`
- **Trigger:** Marketing manager assigns a request OR designer self-claims
- **Recipients:** Assigned designer + requesting agent
- **Toast (designer):** "You've been assigned: {requestTitle}"
- **Toast (agent):** "Your request '{requestTitle}' has been assigned to {designerName}"
- **Side effect:** Designer's queue re-fetches, Intake Queue updates

### 3. `request:resumed`
- **Trigger:** Designer clicks "Resume Work" on an `awaiting_materials` request
- **Action:** Status updates to `in_progress`, toast fires, navigates to `/requests/[id]`
- **Recipients:** Requesting agent
- **Toast (agent):** "Your request '{requestTitle}' is back in progress"

### 4. `request:updated`
- **Trigger:** Any status change on a request
- **Recipients:** Agent who owns the request
- **Toast:** "Your request '{requestTitle}' was updated to {newStatus}"
- **Click action:** Navigate to `/requests/[id]`

## Architecture

### SSE API Route — `/api/events/stream`
- GET endpoint that holds open an HTTP connection
- Sends `text/event-stream` content type
- Authenticates via session (NextAuth)
- Tags connection with user ID and role
- Sends heartbeat every 30s to keep connection alive
- Sends JSON event payloads: `{ type, requestId, title, message, ... }`

### Connection Manager — `/lib/sse/connection-manager.ts`
- Server-side singleton tracking active SSE connections
- Maps: `userId -> WritableStreamController[]` and `role -> userId[]`
- Methods:
  - `addConnection(userId, role, controller)` — register new client
  - `removeConnection(userId, controller)` — cleanup on disconnect
  - `sendToUser(userId, event)` — direct notification
  - `sendToRole(role, event)` — role-based broadcast
- Handles multiple tabs per user (multiple controllers per userId)

### `useSSE` Hook — `/hooks/use-sse.ts`
- Connects to `/api/events/stream` on mount
- Auto-reconnects with exponential backoff on disconnect
- Parses SSE events and calls registered handlers
- Returns `{ isConnected, lastEvent }`

### SSE Provider — in dashboard layout
- Wraps dashboard with SSE connection via `useSSE`
- Registers handlers per event type:
  - Show sonner toast with appropriate message
  - On toast click: `router.push(/requests/[id])`
  - Trigger data re-fetch via router.refresh() or callback

### NEW Badge — on IntakeQueueRow
- Items submitted within the last hour OR with a `new` flag from SSE show a yellow "NEW" badge
- Badge clears after item is viewed or after 1 hour

### Resume Work Button — on designer queue
- Visible on items with `awaiting_materials` status
- Calls server action to update status to `in_progress`
- Server action emits `request:resumed` SSE event
- Client navigates to `/requests/[id]` after success

## Files to Create

| File | Purpose |
|------|---------|
| `/lib/sse/connection-manager.ts` | Server-side SSE connection tracking |
| `/app/api/events/stream/route.ts` | SSE endpoint |
| `/hooks/use-sse.ts` | Client-side SSE hook |
| `/components/features/SSEProvider.tsx` | Dashboard SSE provider with toast handlers |

## Files to Modify

| File | Change |
|------|--------|
| `/app/(dashboard)/layout.tsx` | Wrap with SSEProvider |
| `/actions/intake.ts` | Emit SSE events on submit, assign, status change |
| `/app/(dashboard)/queue/components/IntakeQueueRow.tsx` | Add NEW badge |
| `/app/(dashboard)/queue/components/DesignerTable.tsx` | Add Resume Work button for awaiting_materials items |
| `/services/request.ts` | Emit SSE events from service layer mutations |

## Constraints

- SSE only (no WebSockets) — compatible with serverless/Amplify
- Sonner toasts (existing library) — minimal style, bottom-right
- No changes to chat polling — SSE is for notifications only
- Connection manager is in-memory (single server instance); if horizontal scaling needed later, swap to Redis pub/sub
