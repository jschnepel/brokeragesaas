# IAM Role-Based Permission System — Design Spec

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Full-stack IAM with dynamic roles, granular permissions, and admin UI

## Overview

Replace the hardcoded 5-role system with a fully dynamic IAM system inspired by AWS IAM. Admins create roles, assign permissions to roles, assign roles to users, and grant individual permissions to users. Permissions follow a `resource.action:scope` format. Resolution is additive (union only — no denies).

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Permission granularity | `resource.action:scope` | Fine-grained feature + data-level control |
| Conflict resolution | Union/additive only | Simple, predictable, no deny complexity |
| Role management | Fully dynamic | Admins create/edit/delete roles via UI |
| IAM access control | Fully permissioned | IAM management gated by its own permissions |
| Storage approach | Normalized relational | Aligns with raw SQL patterns, queryable, auditable |
| Admin UI | Full stack | Ship backend + polished admin UI together |
| Service pattern | Object literal (existing pattern) | Matches current `AgentService`, `RequestService`, etc. CLAUDE.md section 1.3 describes a class-based pattern, but the actual codebase uses object literals. Follow the codebase, not the doc. |

## 1. Database Schema

### `permissions`

Master registry of all permission strings.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK DEFAULT gen_random_uuid()` | |
| `resource` | `TEXT NOT NULL` | e.g., `requests`, `analytics`, `users`, `roles` |
| `action` | `TEXT NOT NULL` | e.g., `create`, `view`, `assign`, `manage` |
| `scope` | `TEXT NOT NULL DEFAULT 'all'` | e.g., `own`, `all`, `assigned`, `team` |
| `description` | `TEXT` | Human-readable label for admin UI |
| `created_at` | `TIMESTAMPTZ DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ DEFAULT NOW()` | |

**Unique constraint:** `(resource, action, scope)`

### `roles`

Dynamic roles created by admins.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK DEFAULT gen_random_uuid()` | |
| `name` | `TEXT NOT NULL UNIQUE` | Slug, e.g., `senior_designer` |
| `display_name` | `TEXT NOT NULL` | Human-readable, e.g., `"Senior Designer"` |
| `description` | `TEXT` | |
| `is_system` | `BOOLEAN DEFAULT FALSE` | Protects seed roles from deletion |
| `created_at` | `TIMESTAMPTZ DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ DEFAULT NOW()` | |

### `role_permissions`

Maps permissions to roles (many-to-many).

| Column | Type | Notes |
|--------|------|-------|
| `role_id` | `UUID FK → roles(id) ON DELETE CASCADE` | |
| `permission_id` | `UUID FK → permissions(id) ON DELETE CASCADE` | |
| `granted_at` | `TIMESTAMPTZ DEFAULT NOW()` | |
| `granted_by` | `UUID FK → agents(id)` | Audit trail |

**PK:** `(role_id, permission_id)`

### `user_roles`

Assigns roles to users (many-to-many).

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `UUID FK → agents(id) ON DELETE CASCADE` | |
| `role_id` | `UUID FK → roles(id) ON DELETE CASCADE` | |
| `assigned_at` | `TIMESTAMPTZ DEFAULT NOW()` | |
| `assigned_by` | `UUID FK → agents(id)` | Audit trail |

**PK:** `(user_id, role_id)`

### `user_permissions`

Individual permission grants directly to users.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `UUID FK → agents(id) ON DELETE CASCADE` | |
| `permission_id` | `UUID FK → permissions(id) ON DELETE CASCADE` | |
| `granted_at` | `TIMESTAMPTZ DEFAULT NOW()` | |
| `granted_by` | `UUID FK → agents(id)` | Audit trail |

**PK:** `(user_id, permission_id)`

### Indexes

Beyond PKs and unique constraints, add these for query performance:

```sql
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_permissions_resource ON permissions(resource);
```

### Seed Data

The migration seeds 5 system roles (`is_system = true`) and default permissions:

| Role | Default Permissions |
|------|-------------------|
| `agent` | `requests.create`, `requests.view:own`, `requests.edit:own`, `messages.create`, `files.upload` |
| `designer` | `requests.view:assigned`, `requests.update_status`, `messages.create`, `files.upload` |
| `marketing_manager` | `requests.view:all`, `requests.assign`, `requests.triage`, `requests.cancel`, `analytics.view` |
| `executive` | `analytics.view`, `reports.view` |
| `platform_admin` | `roles.create`, `roles.edit`, `roles.delete`, `permissions.grant`, `permissions.revoke`, `users.manage`, `users.view:all` |

Migration backfills `user_roles` from existing `agents.role` column. Additionally, `lex` (marketing_manager) is assigned the `platform_admin` role as a second role, ensuring at least one user has full IAM access from day one. This demonstrates the multi-role capability and provides a lockout-safe seed state.

## 2. Permission Resolution Engine

### Effective Permissions Query

```sql
SELECT DISTINCT p.resource, p.action, p.scope
FROM permissions p
JOIN role_permissions rp ON rp.permission_id = p.id
JOIN user_roles ur ON ur.role_id = rp.role_id
WHERE ur.user_id = $1

UNION

SELECT DISTINCT p.resource, p.action, p.scope
FROM permissions p
JOIN user_permissions up ON up.permission_id = p.id
WHERE up.user_id = $1
```

Resolution is **additive only**. A user's effective permissions = union of all role-granted permissions + all directly-granted permissions.

### Caching Strategy

Permissions loaded once at login, embedded in JWT as a `string[]` (e.g., `["requests.create", "requests.view:own"]`).

**JWT size management:**
- NextAuth v5 automatically chunks JWT cookies when they exceed browser limits (~4KB per cookie)
- Hard cap: **100 effective permissions per user**. If `getEffectivePermissions()` returns more than 100 entries, log a warning and truncate to 100 (sorted alphabetically for determinism)
- With the default seed data, the most-permissioned user (platform_admin + marketing_manager) has ~12 permissions. Even with dynamic roles, 100 is generous headroom.
- If a future scenario requires 100+ permissions per user, the migration path is to switch to a server-side session store (Redis or DB-backed sessions). This is a Phase 3+ concern, not blocking for this build.

**Trade-off:** Changes don't take effect until session refresh.

**Mitigation:** `refreshSession()` server action re-queries and updates JWT. Note: this uses NextAuth's `unstable_update` API, which may change in future NextAuth releases. If the API is removed, the fallback is to force a re-login via `signIn()` redirect. Monitor NextAuth changelogs.

### PermissionService

`services/permission.ts`:

```
PermissionService = {
  getEffectivePermissions(userId)    → string[]   // Returns formatted "resource.action:scope" strings
  hasPermission(userId, permission)  → boolean     // DB check (used at login, not per-request)
  getUserRoles(userId)               → RoleRow[]
  getRolePermissions(roleId)         → PermissionRow[]
  getAllPermissions()                 → PermissionRow[]  // For admin UI reference page
}
```

### requirePermission() Helper

Replaces `requireAuth()` for permission-gated actions:

```typescript
// Throws AuthError("Unauthorized") if no session
// Throws AuthError("Forbidden") if user lacks permission
// Returns session if OK
const session = await requirePermission("requests.create");
```

Scope-aware: when permission has scope `own` or `assigned`, the helper returns the session and the calling action applies the data filter (e.g., `WHERE requester_id = $userId`). The permission system gates access; the service layer filters data.

### Client-Side Hook

```typescript
const { hasPermission, permissions, roles } = usePermissions();

{hasPermission("requests.assign") && <AssignButton />}
```

Reads permissions from the session — no additional API calls.

## 3. Service Layer & API

### New Services

All services follow the existing object literal pattern (matching `AgentService`, `RequestService`, etc.).

**`services/permission.ts`** — Permission resolution (see section 2)

**`services/role.ts`** — Role CRUD:

```
RoleService = {
  getAll()                                          → RoleRow[]
  getById(id)                                       → RoleRow | null
  create(name, displayName, description)            → RoleRow
  update(id, fields)                                → RoleRow
  delete(id)                                        → void
  getPermissions(roleId)                            → PermissionRow[]
  addPermission(roleId, permissionId, grantedBy)    → void
  removePermission(roleId, permissionId)            → void
  setPermissions(roleId, permissionIds, grantedBy)  → void (bulk replace)
}
```

**`services/user.ts`** — Extends the existing `AgentService` with write operations. `AgentService` is deprecated; all agent/user operations move here:

```
UserService = {
  // Read (migrated from AgentService)
  getAll()                                               → UserRow[]
  getById(id)                                            → UserRow | null
  getDesigners()                                         → UserRow[]
  getByRole(role)                                        → UserRow[]

  // Write (new)
  create(name, email)                                    → UserRow
  update(id, fields)                                     → UserRow
  deactivate(id)                                         → void

  // Role assignment
  getRoles(userId)                                       → RoleRow[]
  assignRole(userId, roleId, assignedBy)                 → void
  removeRole(userId, roleId)                             → void

  // Direct permission grants
  getDirectPermissions(userId)                           → PermissionRow[]
  grantPermission(userId, permissionId, grantedBy)       → void
  revokePermission(userId, permissionId)                 → void
}
```

### Error Handling

All services use typed errors from `lib/errors.ts` (per CLAUDE.md section 6.4):

| Scenario | Error |
|----------|-------|
| Delete a system role (`is_system = true`) | `ValidationError("Cannot delete system roles")` |
| Delete last role with `permissions.grant` | `ValidationError("Cannot delete: this is the last role with permissions.grant capability")` |
| Remove role/permission that would leave 0 users with `permissions.grant` | `ValidationError("Cannot remove: would leave no users with IAM management access")` |
| Role name already exists | `ValidationError("A role with this name already exists")` |
| Role not found | `NotFoundError("Role not found")` |
| User not found | `NotFoundError("User not found")` |
| Unauthorized (no session) | `AuthError("Unauthorized")` |
| Forbidden (missing permission) | `AuthError("Forbidden: requires [permission]")` |

### Server Actions — `actions/iam.ts`

| Action | Permission Required |
|--------|-------------------|
| `createRole(data)` | `roles.create` |
| `updateRole(id, data)` | `roles.edit` |
| `deleteRole(id)` | `roles.delete` |
| `setRolePermissions(roleId, permissionIds)` | `permissions.grant` |
| `createUser(data)` | `users.manage` |
| `updateUser(id, data)` | `users.manage` |
| `deactivateUser(id)` | `users.manage` |
| `assignUserRole(userId, roleId)` | `permissions.grant` |
| `removeUserRole(userId, roleId)` | `permissions.revoke` |
| `grantUserPermission(userId, permissionId)` | `permissions.grant` |
| `revokeUserPermission(userId, permissionId)` | `permissions.revoke` |
| `refreshSession()` | (any authenticated user — refreshes own session) |

All mutations emit SSE events for real-time admin UI updates. All inputs validated with Zod schemas.

### Zod Schemas

All schemas live in `lib/schemas/iam.ts` (per CLAUDE.md section 4.2 — schemas in `lib/`):

```typescript
// lib/schemas/iam.ts
export const CreateRoleSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z_]+$/),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
});

export const UpdateRoleSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export const AssignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const GrantPermissionSchema = z.object({
  userId: z.string().uuid(),
  permissionId: z.string().uuid(),
});

export const SetRolePermissionsSchema = z.object({
  roleId: z.string().uuid(),
  permissionIds: z.array(z.string().uuid()),
});

export const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});
```

## 4. Auth Integration & Migration Path

### JWT Token Structure

```typescript
token = {
  id: string;
  role: string;          // Legacy — first/primary role for backwards compat
  roles: string[];       // ["designer", "senior_designer"]
  permissions: string[]; // ["requests.view:assigned", "requests.update_status"]
}
```

### auth.ts Changes

The current `auth.ts` uses hardcoded `DEMO_USERS` with no DB interaction. The IAM build changes this:

1. **`authorize` function stays credentials-based** (demo mode) but now validates against the DB via `UserService.getByEmail(email)` instead of the hardcoded map. The `DEMO_USERS` map is removed. Demo users are seeded in the database via migration.

2. **`jwt` callback becomes async** (already supported by NextAuth v5):
   - On initial sign-in (`user` param present): call `PermissionService.getEffectivePermissions(userId)` and `PermissionService.getUserRoles(userId)`, embed `roles[]` and `permissions[]` in token
   - On subsequent requests: token already has permissions, pass through
   - On explicit refresh: re-query from DB

3. **`session` callback**: expose `roles` and `permissions` on `session.user`

4. **Keep legacy `role` field**: populated with the user's first role for backwards compat with existing code that reads `session.user.role`

### Demo Users in Database

The migration inserts the 4 demo users into the `agents` table (if not already present) and assigns roles via `user_roles`:

| User | Roles |
|------|-------|
| Yong Choi (`yong@demo.local`) | `agent` |
| Lex Baum (`lex@demo.local`) | `marketing_manager`, `platform_admin` |
| David Kim (`david@demo.local`) | `executive` |
| Marcus Chen (`marcus@demo.local`) | `designer` |

Demo login continues to work (username = password) but now authenticates against the DB.

### Session Refresh

`refreshSession()` server action:
- Re-queries permissions from DB
- Updates JWT via NextAuth `unstable_update`
- Called automatically after IAM mutations affecting current user
- Other users: changes take effect on next page load or manual refresh

### Phased Migration

**Phase 1 (this build):**
1. Migration creates IAM tables, seeds roles/permissions, backfills `user_roles` from `agents.role`
2. `auth.ts` switches from hardcoded users to DB-backed auth with permissions in JWT
3. `requirePermission()` is the standard for all new IAM code
4. Existing `requireAuth()` calls continue working unchanged
5. `ViewerRole` type updated to include `platform_admin`

**Phase 2 (follow-up):**
1. Retrofit `actions/intake.ts` to use `requirePermission()`
2. Remove hardcoded role checks in route pages
3. Deprecate `agents.role` column
4. Deprecate `AgentService` in favor of `UserService`

### Lockout Prevention

- Seed migration assigns `platform_admin` role to Lex Baum (with all IAM permissions)
- `deleteRole` blocks if it's the last role carrying `permissions.grant`
- `removeUserRole` / `revokePermission` blocks if it would leave zero users with `permissions.grant` system-wide
- Enforced at service layer via `ValidationError`, not just UI

## 5. Admin UI

### Navigation

The existing sidebar navigation uses `lib/config/navigation.ts` with a `getNavForRole()` function that gates visibility by `roles: PlatformRole[]` on each `NavItem`.

**Changes:**
1. Add an optional `permissions?: string[]` field to the `NavItem` type
2. Update the sidebar filter logic: a nav item is visible if the user has any matching role (existing behavior) OR any matching permission (new)
3. The "Administration" group uses `permissions: ["users.view:all", "roles.create", "roles.edit", "permissions.grant"]` — visible if the user has **any** of those permissions
4. Existing nav items continue using `roles` field — no changes needed to them in Phase 1

### `/admin/users` — User Management

**Permission:** `users.view:all`

- **DataTable** (existing `data-table.tsx`): name, email, roles (badge list), status, created date
- **Add User button**: modal with name + email. Requires `users.manage`
- **Row click**: opens user detail slide-over (RightPanel pattern)

**User detail slide-over:**
- Profile section: name, email (editable inline). Requires `users.manage`
- **Roles tab:** assigned roles with remove button, "Add Role" dropdown. Requires `permissions.grant`/`permissions.revoke`
- **Direct Permissions tab:** individually granted permissions with remove, "Add Permission" searchable dropdown. Requires `permissions.grant`/`permissions.revoke`
- **Effective Permissions tab (read-only):** merged view with source labels ("via Designer role" / "direct grant")
- Deactivate button. Requires `users.manage`

### `/admin/roles` — Role Management

**Permission:** `roles.create` or `roles.edit`

- **GlassCard grid** (existing `GlassCard` primitive): role name, description, user count, permission count
- **Create Role button**: modal with name, display name, description
- **Card click**: opens role editor

**Role editor (`/admin/roles/[id]`):**
- Header: display name, description (editable). System roles show badge, block name editing.
- **Permission matrix:** grouped by resource, checkbox grid (resources as rows, actions as columns, scope as sub-rows)
- **Users with this role:** list with "remove from role" action
- **Delete role button:** hidden for `is_system`. Warns if users assigned.

### `/admin/permissions` — Permission Reference

**Permission:** `permissions.grant`

Read-only reference page showing all permissions grouped by resource. Permissions are code-defined and seeded via migration, not created by admins.

### Shared UI Patterns

- All pages use `requirePermission()` in page server component
- All mutations via server actions from `actions/iam.ts`
- Optimistic updates via `useTransition`
- SSE notifications for real-time admin updates
- All forms Zod-validated (client + server)
- Components follow existing shadcn + Tailwind v4 + Framer Motion patterns

## File Map

### New Files

| File | Purpose |
|------|---------|
| `migrations/006_iam_tables.sql` | Schema + seed data (project root `migrations/` dir) |
| `services/permission.ts` | Permission resolution engine |
| `services/role.ts` | Role CRUD |
| `services/user.ts` | User CRUD + role/permission assignment (replaces `AgentService`) |
| `actions/iam.ts` | Server actions for all IAM mutations |
| `lib/require-permission.ts` | `requirePermission()` helper |
| `lib/schemas/iam.ts` | Zod validation schemas for IAM |
| `hooks/use-permissions.ts` | Client-side `usePermissions()` hook |
| `app/(dashboard)/admin/users/page.tsx` | User management page |
| `app/(dashboard)/admin/roles/page.tsx` | Role list page |
| `app/(dashboard)/admin/roles/[id]/page.tsx` | Role editor page |
| `app/(dashboard)/admin/permissions/page.tsx` | Permission reference page |
| `app/(dashboard)/admin/layout.tsx` | Admin section layout |
| `components/features/iam/UserDetailPanel.tsx` | User detail slide-over |
| `components/features/iam/RoleCard.tsx` | Role card for grid |
| `components/features/iam/PermissionMatrix.tsx` | Checkbox permission matrix |
| `components/features/iam/AddUserModal.tsx` | Add user modal |
| `components/features/iam/CreateRoleModal.tsx` | Create role modal |

### Modified Files

| File | Change |
|------|--------|
| `auth.ts` | Remove `DEMO_USERS`, add DB-backed auth, embed `roles[]` and `permissions[]` in JWT/session |
| `lib/types.ts` | Add `RoleRow`, `PermissionRow`, IAM DTOs. Update `ViewerRole` to include `platform_admin` |
| `lib/constants.ts` | Add `ROUTES.ADMIN_*`, `PERMISSIONS` registry constant |
| `lib/config/navigation.ts` | Add `permissions?` field to `NavItem`, update filter logic |
| `components/app-sidebar.tsx` | Add Administration nav group with permission-based visibility |
| `services/index.ts` | Export new services, deprecate `AgentService` re-export |
