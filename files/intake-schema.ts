// @platform/database/src/schema/intake.ts
// Marketing Intake System — @platform/intake
// Multi-tenant, role-aware, Google Workspace connector-ready

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const intakeRequestStatusEnum = pgEnum("intake_request_status", [
  "draft",         // Started but not yet submitted
  "submitted",     // Submitted, awaiting assignment
  "assigned",      // Designer assigned
  "in_progress",   // Designer actively working
  "review",        // Pending requester approval
  "revision",      // Changes requested
  "approved",      // Final approved by requester
  "completed",     // Delivered and closed
  "cancelled",
  "on_hold",
]);

export const intakeRequestPriorityEnum = pgEnum("intake_request_priority", [
  "standard",  // 1 week minimum, no fee
  "rush",      // < 1 week, incurs fee
]);

export const intakeRoleEnum = pgEnum("intake_role", [
  "requester",          // Agent / staff submitting requests
  "requester_manager",  // Office manager / team lead
  "designer",           // Creative team member
  "designer_manager",   // Creative director (Lex)
  "cmo",                // David — platform-wide oversight
  "admin",              // Platform admin
]);

export const intakeStepEnum = pgEnum("intake_step", [
  "submitted",
  "assigned",
  "in_progress",
  "review",
  "revision",
  "approved",
  "completed",
]);

export const intakeAssetTypeEnum = pgEnum("intake_asset_type", [
  "reference",     // Uploaded by requester as reference
  "working",       // Current working file from designer
  "revision",      // Previous revision (archived)
  "final",         // Delivered final asset
]);

export const intakeStorageProviderEnum = pgEnum("intake_storage_provider", [
  "s3",            // Platform default
  "google_drive",  // Agent-connected Google Drive
]);

// ─────────────────────────────────────────────
// SLA CONFIGURATION
// Defined by CMO per material type
// Industry standards as defaults
// ─────────────────────────────────────────────

export const intakeSlaConfig = pgTable("intake_sla_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(), // Brokerage scoped
  materialType: text("material_type").notNull(), // e.g. "flyer", "social_post", "video"
  standardHours: integer("standard_hours").notNull().default(168), // 7 days
  rushHours: integer("rush_hours").notNull().default(48),          // 2 days
  rushFeeAmount: decimal("rush_fee_amount", { precision: 10, scale: 2 }),
  rushFeeCurrency: text("rush_fee_currency").default("USD"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: uuid("created_by").notNull(), // CMO user id
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// MATERIAL TYPES
// Configurable per tenant by CMO/admin
// ─────────────────────────────────────────────

export const intakeMaterialType = pgTable("intake_material_type", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: text("name").notNull(),          // e.g. "Just Listed Flyer"
  category: text("category").notNull(), // e.g. "print", "digital", "social", "video"
  description: text("description"),
  estimatedHours: integer("estimated_hours"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// LISTING CACHE
// ARMLS fuzzy search result cache
// Populated on search, refreshed on demand
// ─────────────────────────────────────────────

export const intakeListingCache = pgTable("intake_listing_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  mlsId: text("mls_id").notNull().unique(),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  listPrice: decimal("list_price", { precision: 12, scale: 2 }),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 4, scale: 1 }),
  sqft: integer("sqft"),
  status: text("status"),           // Active, Pending, Closed, etc.
  listingAgent: text("listing_agent"),
  listingAgentId: text("listing_agent_id"),
  photos: jsonb("photos"),          // Array of photo URLs from ARMLS/Spark
  rawData: jsonb("raw_data"),       // Full RESO payload for future use
  cachedAt: timestamp("cached_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Cache TTL
});

// ─────────────────────────────────────────────
// MARKETING REQUESTS
// Core entity
// ─────────────────────────────────────────────

export const intakeRequest = pgTable("intake_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  queueNumber: integer("queue_number").notNull(), // Sequential per tenant
  
  // Requester
  requesterId: uuid("requester_id").notNull(),    // User id
  requesterName: text("requester_name").notNull(), // Denormalized for display
  
  // Designer
  designerId: uuid("designer_id"),               // Assigned designer
  preferredDesignerId: uuid("preferred_designer_id"), // Requested by agent
  
  // Material
  materialTypeId: uuid("material_type_id").notNull(),
  materialTypeName: text("material_type_name").notNull(), // Denormalized
  
  // Listing (optional)
  mlsId: text("mls_id"),
  listingAddress: text("listing_address"),
  listingSnapshot: jsonb("listing_snapshot"),    // Point-in-time listing data at submission
  
  // Brief
  title: text("title").notNull(),               // Short description
  description: text("description"),             // Full creative brief
  dimensions: text("dimensions"),               // e.g. "8.5x11", "1080x1080"
  brandNotes: text("brand_notes"),              // Special branding instructions
  copyText: text("copy_text"),                  // Text to include in design
  externalLinks: jsonb("external_links"),        // Reference URLs
  
  // Scheduling
  priority: intakeRequestPriorityEnum("priority").notNull().default("standard"),
  dueDate: timestamp("due_date").notNull(),      // Required field
  isRush: boolean("is_rush").notNull().default(false),
  rushFeeAmount: decimal("rush_fee_amount", { precision: 10, scale: 2 }),
  rushFeeApproved: boolean("rush_fee_approved").default(false),
  
  // SLA
  slaHours: integer("sla_hours").notNull(),
  slaDeadline: timestamp("sla_deadline").notNull(),
  slaBreached: boolean("sla_breached").notNull().default(false),
  slaBreachedAt: timestamp("sla_breached_at"),
  slaNotifiedAt: timestamp("sla_notified_at"),
  
  // Status & workflow
  status: intakeRequestStatusEnum("status").notNull().default("draft"),
  currentStep: intakeStepEnum("current_step").notNull().default("submitted"),
  
  // Google Workspace
  googleDriveFolderId: text("google_drive_folder_id"),   // Auto-created on assignment
  googleDriveFolderUrl: text("google_drive_folder_url"),
  
  // Timestamps
  submittedAt: timestamp("submitted_at"),
  assignedAt: timestamp("assigned_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("intake_request_tenant_idx").on(table.tenantId),
  requesterIdx: index("intake_request_requester_idx").on(table.requesterId),
  designerIdx: index("intake_request_designer_idx").on(table.designerId),
  statusIdx: index("intake_request_status_idx").on(table.status),
  mlsIdx: index("intake_request_mls_idx").on(table.mlsId),
}));

// ─────────────────────────────────────────────
// REQUEST STEPS (Stepper Timeline)
// One row per step transition
// ─────────────────────────────────────────────

export const intakeRequestStep = pgTable("intake_request_step", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull(),
  step: intakeStepEnum("step").notNull(),
  completedBy: uuid("completed_by"),            // User who advanced the step
  completedByName: text("completed_by_name"),   // Denormalized
  note: text("note"),                           // Optional step note
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

// ─────────────────────────────────────────────
// REQUEST MESSAGES (Chat)
// Thread between requester and designer
// Visible to managers above both
// ─────────────────────────────────────────────

export const intakeRequestMessage = pgTable("intake_request_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull(),
  senderId: uuid("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderRole: intakeRoleEnum("sender_role").notNull(),
  body: text("body").notNull(),
  attachments: jsonb("attachments"),             // Inline message attachments
  isSystemMessage: boolean("is_system_message").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  editedAt: timestamp("edited_at"),
}, (table) => ({
  requestIdx: index("intake_message_request_idx").on(table.requestId),
}));

// ─────────────────────────────────────────────
// REQUEST ASSETS
// Reference uploads, working files, revisions, finals
// Storage-provider agnostic
// ─────────────────────────────────────────────

export const intakeRequestAsset = pgTable("intake_request_asset", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull(),
  uploadedBy: uuid("uploaded_by").notNull(),
  uploadedByName: text("uploaded_by_name").notNull(),
  assetType: intakeAssetTypeEnum("asset_type").notNull(),
  
  // File metadata
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),               // bytes
  mimeType: text("mime_type"),
  thumbnailUrl: text("thumbnail_url"),
  
  // Storage
  storageProvider: intakeStorageProviderEnum("storage_provider").notNull().default("s3"),
  storageKey: text("storage_key"),              // S3 key or Drive file id
  storageUrl: text("storage_url"),              // Presigned or Drive URL
  googleDriveFileId: text("google_drive_file_id"),
  googleDriveWebViewUrl: text("google_drive_web_view_url"),
  
  // Versioning
  revisionNumber: integer("revision_number").default(1),
  isCurrentVersion: boolean("is_current_version").notNull().default(true),
  replacedById: uuid("replaced_by_id"),         // Points to newer asset if archived
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  requestIdx: index("intake_asset_request_idx").on(table.requestId),
}));

// ─────────────────────────────────────────────
// GOOGLE WORKSPACE CONNECTIONS
// Per-agent for now, brokerage-wide later
// ─────────────────────────────────────────────

export const intakeGoogleConnection = pgTable("intake_google_connection", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  tenantId: uuid("tenant_id").notNull(),
  
  // OAuth tokens (encrypted at rest)
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at").notNull(),
  
  // Drive config
  rootFolderId: text("root_folder_id"),         // Marketing Requests root folder
  rootFolderUrl: text("root_folder_url"),
  email: text("email").notNull(),               // Connected Google account
  
  isActive: boolean("is_active").notNull().default(true),
  connectedAt: timestamp("connected_at").notNull().defaultNow(),
  lastSyncedAt: timestamp("last_synced_at"),
});

// ─────────────────────────────────────────────
// SLA NOTIFICATIONS LOG
// Tracks breach alerts sent so we don't double-fire
// ─────────────────────────────────────────────

export const intakeSlaNotification = pgTable("intake_sla_notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull(),
  notifiedUserId: uuid("notified_user_id").notNull(),
  notificationType: text("notification_type").notNull(), // "warning_75", "warning_90", "breach"
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  channel: text("channel").notNull(),           // "email", "in_app", "slack"
});

// ─────────────────────────────────────────────
// RUSH FEE APPROVALS
// Audit trail for rush order fee acceptance
// ─────────────────────────────────────────────

export const intakeRushFeeApproval = pgTable("intake_rush_fee_approval", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().unique(),
  approvedBy: uuid("approved_by").notNull(),
  approvedByName: text("approved_by_name").notNull(),
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull(),
  approvedAt: timestamp("approved_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),                // Audit
});

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────

export const intakeRequestRelations = relations(intakeRequest, ({ many, one }) => ({
  steps: many(intakeRequestStep),
  messages: many(intakeRequestMessage),
  assets: many(intakeRequestAsset),
  materialType: one(intakeMaterialType, {
    fields: [intakeRequest.materialTypeId],
    references: [intakeMaterialType.id],
  }),
  rushFeeApproval: one(intakeRushFeeApproval, {
    fields: [intakeRequest.id],
    references: [intakeRushFeeApproval.requestId],
  }),
  slaNotifications: many(intakeSlaNotification),
}));

export const intakeRequestStepRelations = relations(intakeRequestStep, ({ one }) => ({
  request: one(intakeRequest, {
    fields: [intakeRequestStep.requestId],
    references: [intakeRequest.id],
  }),
}));

export const intakeRequestMessageRelations = relations(intakeRequestMessage, ({ one }) => ({
  request: one(intakeRequest, {
    fields: [intakeRequestMessage.requestId],
    references: [intakeRequest.id],
  }),
}));

export const intakeRequestAssetRelations = relations(intakeRequestAsset, ({ one }) => ({
  request: one(intakeRequest, {
    fields: [intakeRequestAsset.requestId],
    references: [intakeRequest.id],
  }),
}));

// ─────────────────────────────────────────────
// TYPES
// Inferred from schema for use across packages
// ─────────────────────────────────────────────

export type IntakeRequest = typeof intakeRequest.$inferSelect;
export type IntakeRequestInsert = typeof intakeRequest.$inferInsert;
export type IntakeRequestStep = typeof intakeRequestStep.$inferSelect;
export type IntakeRequestMessage = typeof intakeRequestMessage.$inferSelect;
export type IntakeRequestAsset = typeof intakeRequestAsset.$inferSelect;
export type IntakeMaterialType = typeof intakeMaterialType.$inferSelect;
export type IntakeSlaConfig = typeof intakeSlaConfig.$inferSelect;
export type IntakeGoogleConnection = typeof intakeGoogleConnection.$inferSelect;
export type IntakeListingCache = typeof intakeListingCache.$inferSelect;

// ─────────────────────────────────────────────
// INDUSTRY STANDARD SLA DEFAULTS
// Seed data — CMO can override per tenant
// ─────────────────────────────────────────────

export const INTAKE_SLA_DEFAULTS = {
  flyer: { standardHours: 168, rushHours: 48 },          // 7 days / 2 days
  social_post: { standardHours: 72, rushHours: 24 },     // 3 days / 1 day
  email_template: { standardHours: 120, rushHours: 48 }, // 5 days / 2 days
  video: { standardHours: 336, rushHours: 120 },         // 14 days / 5 days
  signage: { standardHours: 168, rushHours: 72 },        // 7 days / 3 days
  brochure: { standardHours: 240, rushHours: 96 },       // 10 days / 4 days
  presentation: { standardHours: 120, rushHours: 48 },   // 5 days / 2 days
  general: { standardHours: 168, rushHours: 48 },        // Default fallback
} as const;
