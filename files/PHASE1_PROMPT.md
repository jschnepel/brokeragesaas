# Phase 1 — Working Prototype
# Claude Code — run from monorepo root: real-estate-platform/
# Build exactly what is specified. No alternatives. Flag blockers and continue.

---

## WHAT YOU ARE BUILDING

`apps/platform` — a new Next.js 16 App Router app in the monorepo.
Completely separate from `apps/premium-site` (Yong's public site). Do not touch it.

**Three working users:**
- `yong` / `yong` → role: `agent` → sees My Requests, can submit/track/cancel/chat
- `lex` / `lex`   → role: `marketing_manager` → sees Design Queue, triages, assigns, cancels, chats
- `david` / `david` → role: `executive` → sees Operations Report, read-only

**Two features that must work end-to-end with real DB persistence:**
1. **Marketing workflow** — submit request → triage → assign → status updates → cancel (both sides). Minus Canva integration.
2. **Messaging** — per-request threaded chat. Polling every 3 seconds. No realtime/websockets needed.

**Upgrade path is built in at every layer — nothing needs rewriting later, only swapped.**

---

## READ FIRST

Before writing any code, read:
1. `real-estate-platform/packages/database/src/schema.sql` — existing 9 Neon tables, understand the `pg` pool pattern
2. `real-estate-platform/packages/database/src/` — how pool is exported
3. `real-estate-platform/apps/premium-site/` — match its Next.js config, tsconfig, Tailwind version
4. `real-estate-platform/apps/premium-site/amplify.yml` OR root `amplify.yml` — understand existing Amplify build
5. Search entire repo for `IntakeUI.jsx` or `intake-ui.jsx` — read it if found, note its location

---

## STEP 1 — SCAFFOLD apps/platform

Create `real-estate-platform/apps/platform/` as a new Next.js 16 App Router app.

**`package.json`**
```json
{
  "name": "@real-estate/platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3003",
    "build": "next build",
    "start": "next start --port 3003",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@platform/database": "workspace:*",
    "@platform/shared": "workspace:*",
    "@platform/ui": "workspace:*",
    "next": "16.1.6",
    "next-auth": "beta",
    "@auth/core": "latest",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.13.0",
    "chart.js": "^4.5.1",
    "d3": "^7.9.0",
    "d3-sankey": "^0.12.3",
    "xlsx": "^0.18.5",
    "html2canvas-pro": "^1.6.7",
    "jspdf": "^4.1.0",
    "jszip": "^3.10.1",
    "file-saver": "^2.0.5",
    "zustand": "^5.0.11",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@platform/eslint-config": "workspace:*",
    "@platform/tailwind-config": "workspace:*",
    "@platform/tsconfig": "workspace:*",
    "@types/d3": "^7.4.0",
    "@types/d3-sankey": "^0.12.2",
    "@types/file-saver": "^2.0.7",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5"
  }
}
```

Add `"real-estate-platform/apps/platform"` to `pnpm-workspace.yaml`.

**`next.config.ts`**
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "xlsx"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
    ],
  },
};
export default nextConfig;
```

Copy `tsconfig.json` from `apps/premium-site`, update name to `@real-estate/platform`.
Copy `tailwind.config.ts` from `apps/premium-site`, update content paths.

**`app/globals.css`** — CSS variables used throughout the IntakeUI:
```css
:root {
  --navy:        #0F2B4F;
  --gold:        #C9A96E;
  --cream:       #FAF7F2;
  --border:      #E5E7EB;
  --sidebar-bg:  #0A1F3A;
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body:   'DM Sans', system-ui, sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-body); background: #F5F4F1; }
```

---

## STEP 2 — DATABASE MIGRATION

Create `real-estate-platform/packages/database/src/migrations/004_intake_tables.sql`

Run on **Neon only** using the existing migration script pattern.

```sql
-- 004_intake_tables.sql

-- Extend agents with role
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'agent'
  CHECK (role IN ('agent','designer','marketing_manager','executive','broker','platform_admin'));

-- Seed the three demo users
-- NOTE: Insert if not exists, update role if already present
INSERT INTO agents (name, email, tier, role)
VALUES
  ('Yong Choi',  'yong@platform.local',  'premium', 'agent'),
  ('Lex Baum',   'lex@platform.local',   'premium', 'marketing_manager'),
  ('David Kim',  'david@platform.local', 'premium', 'executive')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Material types
CREATE TABLE IF NOT EXISTS intake_material_type (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name             VARCHAR(100) NOT NULL,
  description      TEXT,
  default_sla_hours INTEGER NOT NULL DEFAULT 48,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO intake_material_type (name, description, default_sla_hours) VALUES
  ('Flyer',       'Single property flyer',        48),
  ('Social Pack', 'Social media graphics',        72),
  ('Report',      'Market analytics report',      96),
  ('Video',       'Listing or brand video',      120),
  ('Brochure',    'Multi-page brochure',          96)
ON CONFLICT DO NOTHING;

-- Core request
CREATE TABLE IF NOT EXISTS intake_request (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  queue_number         SERIAL,
  title                VARCHAR(255) NOT NULL,
  material_type_id     UUID NOT NULL REFERENCES intake_material_type(id),
  requester_agent_id   UUID NOT NULL REFERENCES agents(id),
  assigned_designer_id UUID REFERENCES agents(id),
  status               VARCHAR(50) NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','assigned','in_progress','awaiting_materials',
                      'review','approved','completed','cancelled')),
  is_rush              BOOLEAN NOT NULL DEFAULT false,
  due_date             DATE NOT NULL,
  brief                TEXT,
  mls_id               VARCHAR(50),
  listing_address      TEXT,
  target_audience      TEXT,
  brand_guidelines     VARCHAR(100),
  feasibility_flag     VARCHAR(20) CHECK (feasibility_flag IN ('red','amber',NULL)),
  feasibility_note     TEXT,
  cancel_reason        TEXT,
  cancelled_by         VARCHAR(50),
  sla_deadline         TIMESTAMPTZ,
  sla_breached         BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status history
CREATE TABLE IF NOT EXISTS intake_request_step (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id          UUID NOT NULL REFERENCES intake_request(id) ON DELETE CASCADE,
  from_status         VARCHAR(50),
  to_status           VARCHAR(50) NOT NULL,
  changed_by_agent_id UUID REFERENCES agents(id),
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat messages (polled every 3s)
CREATE TABLE IF NOT EXISTS intake_request_message (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id       UUID NOT NULL REFERENCES intake_request(id) ON DELETE CASCADE,
  sender_agent_id  UUID NOT NULL REFERENCES agents(id),
  body             TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- File assets (URL-based for prototype, S3 later)
CREATE TABLE IF NOT EXISTS intake_request_asset (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id             UUID NOT NULL REFERENCES intake_request(id) ON DELETE CASCADE,
  file_name              VARCHAR(255) NOT NULL,
  file_url               TEXT,
  mime_type              VARCHAR(100),
  uploaded_by_agent_id   UUID REFERENCES agents(id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intake_request_requester  ON intake_request(requester_agent_id);
CREATE INDEX IF NOT EXISTS idx_intake_request_designer   ON intake_request(assigned_designer_id);
CREATE INDEX IF NOT EXISTS idx_intake_request_status     ON intake_request(status);
CREATE INDEX IF NOT EXISTS idx_intake_message_request    ON intake_request_message(request_id, created_at);
CREATE INDEX IF NOT EXISTS idx_intake_step_request       ON intake_request_step(request_id, created_at);
```

Run migration with the existing Neon migration script.

---

## STEP 3 — AUTH (NextAuth v5 CredentialsProvider)

Hardcoded demo users. Swap to Cognito later by replacing the provider — zero app changes needed.

**`apps/platform/auth.ts`**
```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { pool } from "@platform/database";

const DEMO_USERS = [
  { username: "yong",  password: "yong",  email: "yong@platform.local" },
  { username: "lex",   password: "lex",   email: "lex@platform.local"  },
  { username: "david", password: "david", email: "david@platform.local"},
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const match = DEMO_USERS.find(
          u => u.username === credentials?.username &&
               u.password === credentials?.password
        );
        if (!match) return null;
        const { rows } = await pool.query(
          `SELECT id, name, role, email FROM agents WHERE email = $1 LIMIT 1`,
          [match.email]
        );
        if (!rows[0]) return null;
        return { id: rows[0].id, name: rows[0].name,
                 email: rows[0].email, role: rows[0].role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.agentId = user.id;
        token.role    = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.agentId = token.agentId as string;
      session.user.role    = token.role    as string;
      return session;
    },
  },
  pages: { signIn: "/login" },
});
```

**`apps/platform/types/next-auth.d.ts`**
```ts
import "next-auth";
declare module "next-auth" {
  interface Session {
    user: { agentId: string; role: string; name?: string|null; email?: string|null; };
  }
}
```

**`apps/platform/app/api/auth/[...nextauth]/route.ts`**
```ts
import { handlers } from "../../../../auth";
export const { GET, POST } = handlers;
```

**`apps/platform/middleware.ts`** — protect everything, redirect unauthenticated to /login:
```ts
import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (pathname === "/login") return NextResponse.next();
  if (!req.auth) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
});

export const config = { matcher: ["/((?!api|_next|favicon|public).*)"] };
```

**`apps/platform/app/login/page.tsx`** — clean login form, navy/gold brand:
```tsx
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", {
      username, password, redirect: false,
    });
    if (res?.ok) { router.push("/"); router.refresh(); }
    else { setError("Invalid username or password."); setLoading(false); }
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
                  justifyContent:"center", background:"#0F2B4F" }}>
      <div style={{ width:340, background:"white", padding:"40px 32px",
                    boxShadow:"0 24px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ marginBottom:28, textAlign:"center" }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.18em",
                        textTransform:"uppercase", color:"#C9A96E", marginBottom:6 }}>
            Russ Lyon Sotheby's
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif",
                        fontSize:24, fontWeight:300, color:"#0F2B4F" }}>
            Marketing Platform
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[
            { label:"Username", value:username, set:setUsername, type:"text",    ph:"yong" },
            { label:"Password", value:password, set:setPassword, type:"password", ph:"••••" },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display:"block", fontSize:8, fontWeight:700,
                              letterSpacing:"0.12em", textTransform:"uppercase",
                              color:"#9CA3AF", marginBottom:5 }}>{f.label}</label>
              <input type={f.type} value={f.value} placeholder={f.ph}
                onChange={e => f.set(e.target.value)} required
                style={{ width:"100%", border:"1px solid #E5E7EB", padding:"9px 11px",
                         fontSize:13, fontFamily:"inherit", outline:"none", color:"#0F2B4F" }}
                onFocus={e => e.target.style.borderColor="#0F2B4F"}
                onBlur={e =>  e.target.style.borderColor="#E5E7EB"} />
            </div>
          ))}

          {error && (
            <div style={{ fontSize:11, color:"#B91C1C", padding:"7px 10px",
                          background:"#FEF2F2", border:"1px solid #FCA5A5" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ background: loading ? "#9CA3AF" : "#0F2B4F", color:"white",
                     border:"none", padding:"11px", fontSize:11, fontWeight:700,
                     letterSpacing:"0.1em", textTransform:"uppercase",
                     cursor: loading ? "default" : "pointer", marginTop:4 }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"/>
    </div>
  );
}
```

**Env vars — `.env.local` and Amplify console:**
```
DATABASE_URL=          # existing Neon connection string (copy from premium-site or backend)
NEXTAUTH_SECRET=       # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3003   # change to Amplify URL on deploy
```

---

## STEP 4 — ROOT LAYOUT & ROLE REDIRECT

**`apps/platform/app/layout.tsx`**
```tsx
import { SessionProvider } from "next-auth/react";
import { auth } from "../auth";
import "./globals.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      </head>
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

**`apps/platform/app/page.tsx`** — role-based redirect:
```tsx
import { auth } from "../auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role === "agent")             redirect("/requests");
  if (role === "marketing_manager") redirect("/triage");
  if (role === "executive")         redirect("/reports");
  redirect("/requests");
}
```

---

## STEP 5 — INTAKE UI WRAPPER

Find `IntakeUI.jsx` (search the repo). Copy or move it to:
`apps/platform/components/IntakeUI.tsx`

Make these surgical edits — do not rewrite anything else:

1. Add `"use client";` as the very first line.

2. Change the root `App` component signature to accept props:
```tsx
export default function App({
  initialRole,
  agentId,
  agentName,
}: {
  initialRole?: string;
  agentId?: string;
  agentName?: string;
} = {}) {
```

3. Wire `initialRole` to `dashboardRole` initial state:
```tsx
const [dashboardRole, setDashboardRole] = useState(
  initialRole === "marketing_manager" ? "designer"
  : initialRole === "executive"       ? "executive"
  : "requester"
);
```

4. Wire `agentId` and `agentName` so the real user appears in the UI header (where it currently shows hardcoded "YC / Yong Choi"):
```tsx
const currentUser = {
  initials: agentName ? agentName.split(" ").map(n=>n[0]).join("") : "YC",
  name:     agentName || "Yong Choi",
  id:       agentId   || "demo",
};
```
Then replace the hardcoded `"YC"`, `"Yong Choi"`, `"LH"`, `"Lex Baum"`, `"DK"`, `"David Kim"` avatar/name in the sidebar footer with `currentUser.initials` and `currentUser.name`.

5. Keep the role picker — useful for demos.

Create `apps/platform/components/IntakeClient.tsx`:
```tsx
"use client";
import dynamic from "next/dynamic";

const IntakeUI = dynamic(() => import("./IntakeUI"), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
                  justifyContent:"center", background:"#0F2B4F" }}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.14em",
                    textTransform:"uppercase", color:"rgba(201,169,110,0.6)" }}>
        Loading…
      </div>
    </div>
  ),
});

export default function IntakeClient({
  role, agentId, agentName
}: { role: string; agentId: string; agentName: string }) {
  return <IntakeUI initialRole={role} agentId={agentId} agentName={agentName} />;
}
```

---

## STEP 6 — ROUTE PAGES

All routes read from session and pass props to `IntakeClient`. Create these files:

**`apps/platform/app/requests/page.tsx`**
**`apps/platform/app/triage/page.tsx`**
**`apps/platform/app/queue/page.tsx`**
**`apps/platform/app/reports/page.tsx`**

All four follow this exact pattern (just change the page name in the comment):
```tsx
import { auth } from "../../auth";
import { redirect } from "next/navigation";
import IntakeClient from "../../components/IntakeClient";

export default async function RequestsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <IntakeClient
      role={session.user.role}
      agentId={session.user.agentId}
      agentName={session.user.name ?? ""}
    />
  );
}
```

---

## STEP 7 — SERVER ACTIONS (marketing workflow)

Create `apps/platform/app/actions/intake.ts`

**Use the exact same `pg` pool import pattern already in `@platform/database`.**
Look at how `apps/premium-site` imports it and match exactly.

```ts
"use server";
import { pool } from "@platform/database";
import { auth } from "../../auth";
import { revalidatePath } from "next/cache";

// ─── Requests ────────────────────────────────────────────────────────────────

export async function getMyRequests() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { rows } = await pool.query(`
    SELECT r.*, mt.name AS material_type_name,
      a.name AS requester_name, d.name AS designer_name,
      CASE
        WHEN r.status IN ('completed','cancelled')       THEN 'resolved'
        WHEN r.sla_deadline < NOW()                      THEN 'breached'
        WHEN r.sla_deadline < NOW() + INTERVAL '4 hours' THEN 'warning'
        ELSE 'on_track'
      END AS sla_state
    FROM intake_request r
    JOIN intake_material_type mt ON mt.id = r.material_type_id
    JOIN agents a ON a.id = r.requester_agent_id
    LEFT JOIN agents d ON d.id = r.assigned_designer_id
    WHERE r.requester_agent_id = $1
    ORDER BY r.created_at DESC
  `, [session.user.agentId]);
  return rows;
}

export async function getAllRequests() {
  const session = await auth();
  if (!session || !["marketing_manager","designer","executive"].includes(session.user.role))
    throw new Error("Unauthorized");
  const { rows } = await pool.query(`
    SELECT r.*, mt.name AS material_type_name,
      a.name AS requester_name, d.name AS designer_name,
      CASE
        WHEN r.status IN ('completed','cancelled')       THEN 'resolved'
        WHEN r.sla_deadline < NOW()                      THEN 'breached'
        WHEN r.sla_deadline < NOW() + INTERVAL '4 hours' THEN 'warning'
        ELSE 'on_track'
      END AS sla_state
    FROM intake_request r
    JOIN intake_material_type mt ON mt.id = r.material_type_id
    JOIN agents a ON a.id = r.requester_agent_id
    LEFT JOIN agents d ON d.id = r.assigned_designer_id
    WHERE r.tenant_id = '00000000-0000-0000-0000-000000000001'
    ORDER BY r.created_at DESC
  `);
  return rows;
}

export async function getRequestDetail(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const [req, messages, steps] = await Promise.all([
    pool.query(`
      SELECT r.*, mt.name AS material_type_name,
        a.name AS requester_name, d.name AS designer_name
      FROM intake_request r
      JOIN intake_material_type mt ON mt.id = r.material_type_id
      JOIN agents a ON a.id = r.requester_agent_id
      LEFT JOIN agents d ON d.id = r.assigned_designer_id
      WHERE r.id = $1
    `, [id]),
    pool.query(`
      SELECT m.*, a.name AS sender_name
      FROM intake_request_message m
      JOIN agents a ON a.id = m.sender_agent_id
      WHERE m.request_id = $1 ORDER BY m.created_at ASC
    `, [id]),
    pool.query(`
      SELECT s.*, a.name AS changed_by_name
      FROM intake_request_step s
      LEFT JOIN agents a ON a.id = s.changed_by_agent_id
      WHERE s.request_id = $1 ORDER BY s.created_at ASC
    `, [id]),
  ]);
  return { request: req.rows[0] ?? null, messages: messages.rows, steps: steps.rows };
}

export async function createRequest(data: {
  title: string; materialTypeId: string; dueDate: string;
  brief?: string; mlsId?: string; listingAddress?: string;
  targetAudience?: string; brandGuidelines?: string; isRush?: boolean;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { rows: [mt] } = await pool.query(
    `SELECT default_sla_hours FROM intake_material_type WHERE id = $1`, [data.materialTypeId]
  );
  const slaHours = data.isRush
    ? Math.floor((mt?.default_sla_hours ?? 48) / 2)
    : (mt?.default_sla_hours ?? 48);
  const slaDeadline = new Date(Date.now() + slaHours * 3_600_000).toISOString();

  const { rows: [req] } = await pool.query(`
    INSERT INTO intake_request
      (title, material_type_id, requester_agent_id, due_date, brief,
       mls_id, listing_address, target_audience, brand_guidelines, is_rush, sla_deadline)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
  `, [data.title, data.materialTypeId, session.user.agentId, data.dueDate,
      data.brief ?? null, data.mlsId ?? null, data.listingAddress ?? null,
      data.targetAudience ?? null, data.brandGuidelines ?? null,
      data.isRush ?? false, slaDeadline]);

  await pool.query(
    `INSERT INTO intake_request_step (request_id, to_status, changed_by_agent_id)
     VALUES ($1,'submitted',$2)`,
    [req.id, session.user.agentId]
  );
  revalidatePath("/requests");
  return req;
}

export async function updateRequestStatus(id: string, toStatus: string, note?: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const { rows: [cur] } = await pool.query(
    `SELECT status FROM intake_request WHERE id = $1`, [id]
  );
  await pool.query(
    `UPDATE intake_request SET status=$1, updated_at=NOW() WHERE id=$2`,
    [toStatus, id]
  );
  await pool.query(
    `INSERT INTO intake_request_step (request_id, from_status, to_status, changed_by_agent_id, note)
     VALUES ($1,$2,$3,$4,$5)`,
    [id, cur?.status ?? null, toStatus, session.user.agentId, note ?? null]
  );
  revalidatePath("/requests");
  revalidatePath("/triage");
  revalidatePath(`/requests/${id}`);
}

export async function assignDesigner(requestId: string, designerAgentId: string) {
  const session = await auth();
  if (!session || session.user.role !== "marketing_manager") throw new Error("Unauthorized");
  await pool.query(
    `UPDATE intake_request
     SET assigned_designer_id=$1, status='assigned', updated_at=NOW()
     WHERE id=$2`,
    [designerAgentId, requestId]
  );
  await pool.query(
    `INSERT INTO intake_request_step (request_id, from_status, to_status, changed_by_agent_id, note)
     VALUES ($1,'submitted','assigned',$2,'Designer assigned')`,
    [requestId, session.user.agentId]
  );
  revalidatePath("/triage");
}

export async function cancelRequest(id: string, reason?: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  await pool.query(
    `UPDATE intake_request
     SET status='cancelled', cancel_reason=$1, cancelled_by=$2, updated_at=NOW()
     WHERE id=$3`,
    [reason ?? null, session.user.role, id]
  );
  await pool.query(
    `INSERT INTO intake_request_step (request_id, to_status, changed_by_agent_id, note)
     VALUES ($1,'cancelled',$2,$3)`,
    [id, session.user.agentId, reason ?? null]
  );
  revalidatePath("/requests");
  revalidatePath("/triage");
}

export async function getMaterialTypes() {
  const { rows } = await pool.query(
    `SELECT * FROM intake_material_type WHERE is_active=true ORDER BY name`
  );
  return rows;
}

export async function getDesigners() {
  const { rows } = await pool.query(
    `SELECT id, name, email FROM agents
     WHERE role IN ('designer','marketing_manager') ORDER BY name`
  );
  return rows;
}

export async function getOperationsKPIs() {
  const session = await auth();
  if (!session || !["marketing_manager","executive"].includes(session.user.role))
    throw new Error("Unauthorized");
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled'))   AS active_count,
      COUNT(*) FILTER (WHERE status = 'completed')                      AS completed_count,
      COUNT(*) FILTER (WHERE sla_breached = true)                       AS breached_count,
      COUNT(*) FILTER (WHERE is_rush AND status NOT IN ('completed','cancelled')) AS rush_count,
      ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)
        FILTER (WHERE status = 'completed'))::int                       AS avg_turnaround_hours,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')  AS last_30d_count,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '60 days'
                         AND created_at <= NOW() - INTERVAL '30 days') AS prev_30d_count
    FROM intake_request
    WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  `);
  return rows[0];
}
```

---

## STEP 8 — POLLING CHAT API

Two API routes. Polling on a 3-second interval from the client.

**`apps/platform/app/api/messages/[requestId]/route.ts`** — GET new messages since timestamp:
```ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@platform/database";
import { auth } from "../../../../auth";

export async function GET(req: NextRequest, { params }: { params: { requestId: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = req.nextUrl.searchParams.get("since") ?? "1970-01-01";

  const { rows } = await pool.query(`
    SELECT m.id, m.body, m.created_at, a.name AS sender_name, a.id AS sender_id,
           a.role AS sender_role
    FROM intake_request_message m
    JOIN agents a ON a.id = m.sender_agent_id
    WHERE m.request_id = $1
      AND m.created_at > $2
    ORDER BY m.created_at ASC
  `, [params.requestId, since]);

  return NextResponse.json({ messages: rows });
}

export async function POST(req: NextRequest, { params }: { params: { requestId: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const { rows: [msg] } = await pool.query(`
    INSERT INTO intake_request_message (request_id, sender_agent_id, body)
    VALUES ($1, $2, $3) RETURNING *
  `, [params.requestId, session.user.agentId, body.trim()]);

  return NextResponse.json({ message: msg }, { status: 201 });
}
```

---

## STEP 9 — WIRE REAL DATA INTO INTAKEUI

In `IntakeUI.tsx`, replace mock data with real server action calls.

**Strategy: minimal surgery. Add `useEffect` + `useState` at the top of the `App` component. Replace mock constants used in renders. Leave all UI logic untouched.**

Add these state variables to the `App` component (alongside existing state):
```ts
const [liveRequests,   setLiveRequests]   = useState<any[]>([]);
const [materialTypes,  setMaterialTypes]  = useState<any[]>([]);
const [designerList,   setDesignerList]   = useState<any[]>([]);
const [dataLoaded,     setDataLoaded]     = useState(false);
```

Add this `useEffect` after state declarations:
```ts
useEffect(() => {
  async function loadData() {
    try {
      const [reqs, mts, designers] = await Promise.all([
        dashboardRole === "requester" ? getMyRequests() : getAllRequests(),
        getMaterialTypes(),
        getDesigners(),
      ]);
      setLiveRequests(reqs);
      setMaterialTypes(mts);
      setDesignerList(designers);
    } catch (e) {
      console.error("Data load failed:", e);
    } finally {
      setDataLoaded(true);
    }
  }
  loadData();
}, [dashboardRole]);
```

Wire actions to UI buttons:
- **New Request form submit** → call `createRequest(formData)` → refresh `liveRequests`
- **Status update buttons** (Begin, Approve, Complete, etc.) → call `updateRequestStatus(id, newStatus)` → refresh
- **Assign designer dropdown** → call `assignDesigner(requestId, designerId)` → refresh
- **Cancel buttons** (both agent and manager) → call `cancelRequest(id, reason)` → refresh

**For the request list views**, replace `MOCK_REQUESTS` with `liveRequests` and `DESIGNER_ALL_REQUESTS` with `liveRequests`.

**For material type select in New Request modal**, replace the hardcoded `MATERIAL_FIELDS` keys with `materialTypes.map(mt => mt.name)`.

**For designer assign dropdown in Intake Queue**, replace `INIT_DESIGNERS` with `designerList`.

---

## STEP 10 — WIRE POLLING CHAT INTO REQUESTDETAIL

In the `RequestDetail` component in `IntakeUI.tsx`:

1. Add state: `const [chatMessages, setChatMessages] = useState(req.messages ?? []);`
2. Track last seen timestamp: `const lastSeenRef = useRef(new Date(0).toISOString());`
3. Add polling effect:
```ts
useEffect(() => {
  if (!req?.id) return;
  async function poll() {
    try {
      const res = await fetch(`/api/messages/${req.id}?since=${lastSeenRef.current}`);
      const data = await res.json();
      if (data.messages?.length > 0) {
        lastSeenRef.current = data.messages[data.messages.length - 1].created_at;
        setChatMessages(prev => [...prev, ...data.messages]);
      }
    } catch {}
  }
  poll(); // immediate first fetch
  const interval = setInterval(poll, 3000);
  return () => clearInterval(interval);
}, [req?.id]);
```
4. Replace the chat send action to POST to `/api/messages/${req.id}` with `{ body: messageText }` instead of mutating local state directly. On success, append the new message to `chatMessages`.
5. Replace `req.messages` references in the chat render with `chatMessages`.

---

## STEP 11 — AMPLIFY CONFIG

Create `real-estate-platform/amplify-platform.yml`:
```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm install -g pnpm@8.15.0
            - pnpm install --frozen-lockfile
        build:
          commands:
            - pnpm --filter @real-estate/platform build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
    appRoot: real-estate-platform/apps/platform
```

**To create the Amplify app (separate from existing prototypes/yong app):**
1. AWS Console → Amplify → **New app** → Host web app → connect repo
2. Select branch (`dev` or `main`)
3. App settings → set appRoot to `real-estate-platform/apps/platform`
4. Add env vars in Amplify console:
   - `DATABASE_URL` — Neon connection string
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — the Amplify-generated URL (update after first deploy)
5. **Access control** → enable → set a URL-level password (belt + suspenders on top of app login)
6. Deploy

After first deploy, update `NEXTAUTH_URL` to the actual Amplify URL and redeploy.

---

## DELIVERABLES CHECKLIST

When done, verify each item works:

- [ ] `pnpm --filter @real-estate/platform dev` starts on port 3003 with no errors
- [ ] `pnpm --filter @real-estate/platform build` succeeds with no type errors
- [ ] `http://localhost:3003` redirects to `/login`
- [ ] `yong` / `yong` signs in → redirected to `/requests` → sees agent view
- [ ] `lex` / `lex` signs in → redirected to `/triage` → sees manager view
- [ ] `david` / `david` signs in → redirected to `/reports` → sees executive view
- [ ] Yong submits a new request → appears in DB + Lex's triage queue
- [ ] Lex assigns designer + approves → status updates in DB + Yong sees updated status
- [ ] Yong cancels a request → DB updated, removed from active list
- [ ] Lex cancels a request → DB updated
- [ ] Yong sends a chat message on a request → Lex sees it within 3 seconds (polling)
- [ ] Lex replies → Yong sees it within 3 seconds
- [ ] David sees Operations Report with real counts from DB
- [ ] `apps/premium-site` is completely unmodified — run `git diff apps/premium-site` to confirm

---

## CONSTRAINTS

- Do **not** touch `apps/premium-site` or `apps/backend` or `packages/database` schema files (except adding the migration)
- Match the `pg` pool pattern exactly from `@platform/database` — do not add a second DB client
- Keep all IntakeUI styling pixel-perfect — only data layer and prop wiring changes
- If `IntakeUI.jsx` is not in the repo, add a placeholder page at `/requests` that says "Place IntakeUI.tsx in apps/platform/components/" and continue all other steps
- If any Neon env var is missing, throw a clear error on startup: `throw new Error("Missing DATABASE_URL")`
- No Canva integration — leave the Canva button in the UI but make it a no-op (remove the `window.open` call, replace with a disabled state)

