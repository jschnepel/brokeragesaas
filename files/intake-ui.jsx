import React, { useState, useEffect, useRef, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid, ReferenceLine } from "recharts";

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
const TOAST_CONFIGS = {
  success: { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#4ADE80", border: "#16A34A", bg: "rgba(74,222,128,0.10)" },
  error:   { icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#F87171", border: "#DC2626", bg: "rgba(248,113,113,0.10)" },
  warning: { icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "#FBBF24", border: "#D97706", bg: "rgba(251,191,36,0.10)" },
  info:    { icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "#60A5FA", border: "#2563EB", bg: "rgba(96,165,250,0.10)" },
};

function ToastStack({ toasts, onDismiss }) {
  return (
    <div style={{ position: "fixed", top: 56, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, width: 340, pointerEvents: "none" }}>
      {toasts.map(t => {
        const cfg = TOAST_CONFIGS[t.type] || TOAST_CONFIGS.info;
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
            background: "#0A1F3A", border: `1px solid ${cfg.border}40`, borderLeft: `3px solid ${cfg.border}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)", pointerEvents: "all" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
              {t.type === "warning" || t.type === "info" ? <><circle cx="12" cy="12" r="10"/><path d={cfg.icon}/></> : <path d={cfg.icon}/>}
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "white", fontFamily: "'Outfit',system-ui,sans-serif", marginBottom: 2 }}>{t.title}</div>
              {t.sub && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontFamily: "'Outfit',system-ui,sans-serif", lineHeight: 1.5 }}>{t.sub}</div>}
            </div>
            <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── NOTIFICATION BELL PANEL ──────────────────────────────────────────────────
const SEED_NOTIFICATIONS = [
  { id: 1, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",  color: "#4ADE80", title: "Request #47 approved",       sub: "Approved by Lex Baum",               time: "2m ago",  unread: true  },
  { id: 2, icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "#F87171", title: "SLA breached — #31",       sub: "Past 48h window, escalation sent",  time: "18m ago", unread: true  },
  { id: 3, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "#FBBF24", title: "Token refresh complete",      sub: "ARMLS OAuth token renewed",         time: "1h ago",  unread: true  },
  { id: 4, icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "#60A5FA", title: "New message from Yong",      sub: "Can we add the mountain view callout…", time: "3h ago",  unread: true  },
  { id: 5, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2", color: "rgba(255,255,255,0.25)", title: "Q1 Report published",        sub: "Visible to all brokerage staff",    time: "Yesterday", unread: false },
];

function NotificationPanel({ notifications, onMarkAllRead, onClose }) {
  const unreadCount = notifications.filter(n => n.unread).length;
  return (
    <div style={{ position: "absolute", top: 46, right: 0, width: 340, background: "#0A1F3A",
      border: "1px solid rgba(201,169,110,0.2)", boxShadow: "0 16px 48px rgba(0,0,0,0.5)", zIndex: 1000, overflow: "hidden" }}>
      <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(201,169,110,0.5),transparent)" }} />
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "white", fontFamily: "'Outfit',system-ui,sans-serif" }}>Notifications</span>
          {unreadCount > 0 && <div style={{ padding: "1px 7px", background: "linear-gradient(135deg,#991B1B,#B91C1C)", fontSize: 8, fontWeight: 700, color: "white", fontFamily: "'Outfit',system-ui,sans-serif" }}>{unreadCount}</div>}
        </div>
        <span onClick={onMarkAllRead} style={{ fontSize: 9, color: "#C9A96E", cursor: "pointer", fontFamily: "'Outfit',system-ui,sans-serif", fontWeight: 600 }}>Mark all read</span>
      </div>
      {notifications.map((n, i) => (
        <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", cursor: "pointer",
          background: n.unread ? "rgba(201,169,110,0.04)" : "transparent",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          borderLeft: `2px solid ${n.unread ? "#C9A96E" : "transparent"}` }}>
          <div style={{ width: 28, height: 28, flexShrink: 0, background: `${n.color}15`, border: `1px solid ${n.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={n.color} strokeWidth="2" strokeLinecap="round"><path d={n.icon}/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 10, fontWeight: n.unread ? 700 : 500, color: n.unread ? "white" : "rgba(255,255,255,0.45)", fontFamily: "'Outfit',system-ui,sans-serif" }}>{n.title}</span>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", fontFamily: "'Geist Mono',monospace", flexShrink: 0, marginLeft: 8 }}>{n.time}</span>
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'Outfit',system-ui,sans-serif", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.sub}</div>
          </div>
          {n.unread && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A96E", flexShrink: 0, marginTop: 4 }} />}
        </div>
      ))}
      <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "center" }}>
        <span style={{ fontSize: 9, color: "#C9A96E", cursor: "pointer", fontFamily: "'Outfit',system-ui,sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>View all notifications →</span>
      </div>
    </div>
  );
}

// ─── ALERT BANNER ─────────────────────────────────────────────────────────────
function AlertBanner({ type = "warning", message, action, onAction, onDismiss }) {
  const cfg = TOAST_CONFIGS[type] || TOAST_CONFIGS.warning;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 16px",
      background: cfg.bg, borderLeft: `3px solid ${cfg.border}`, borderBottom: `1px solid ${cfg.border}20` }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
        {type === "warning" || type === "info" ? <><circle cx="12" cy="12" r="10"/><path d={cfg.icon}/></> : <path d={cfg.icon}/>}
      </svg>
      <span style={{ flex: 1, fontSize: 11, color: "var(--navy)", fontFamily: "'Outfit',system-ui,sans-serif" }}>{message}</span>
      {action && <span onClick={onAction} style={{ fontSize: 9, fontWeight: 700, color: cfg.border, letterSpacing: "0.06em", cursor: "pointer", fontFamily: "'Outfit',system-ui,sans-serif", flexShrink: 0 }}>{action} →</span>}
      {onDismiss && <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.2)", fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0, marginLeft: 4 }}>×</button>}
    </div>
  );
}

// ─── ACTIVITY TIMELINE ────────────────────────────────────────────────────────
const ACTIVITY_ICONS = {
  status:  "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  comment: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  file:    "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13",
  assign:  "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  created: "M12 4v16m8-8H4",
  rush:    "M13 10V3L4 14h7v7l9-11h-7z",
};
const ACTIVITY_COLORS = {
  status:  { color: "#4ADE80", border: "#16A34A" },
  comment: { color: "#60A5FA", border: "#2563EB" },
  file:    { color: "#C9A96E", border: "#B8935A" },
  assign:  { color: "#818CF8", border: "#6366F1" },
  created: { color: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.1)" },
  rush:    { color: "#FBBF24", border: "#D97706" },
};

function ActivityTimeline({ req }) {
  // Build activity feed from steps + messages
  const items = [];
  req.steps.forEach(s => {
    items.push({ type: "status", label: `Status → ${s.step.replace(/_/g," ")}`, sub: `by ${s.completedByName}`, time: s.completedAt, initials: s.completedByName?.split(" ").map(w=>w[0]).join("").slice(0,2) });
  });
  req.messages.forEach(m => {
    if (m.senderRole === "designer" || m.senderRole === "requester") {
      items.push({ type: "comment", label: "Comment added", sub: `"${m.body.slice(0,60)}${m.body.length > 60 ? "…" : ""}"`, time: m.createdAt, initials: m.senderName?.split(" ").map(w=>w[0]).join("").slice(0,2) });
    }
  });
  req.referenceFiles?.forEach(f => {
    items.push({ type: "file", label: `File uploaded`, sub: f.fileName, time: f.uploadedAt, initials: f.uploadedBy?.split(" ").map(w=>w[0]).join("").slice(0,2) });
  });
  items.push({ type: "created", label: "Request created", sub: `${req.materialType} · ${req.isRush ? "Rush" : "Standard"}`, time: req.submittedAt, initials: req.requesterName?.split(" ").map(w=>w[0]).join("").slice(0,2) });
  items.sort((a,b) => new Date(b.time) - new Date(a.time));

  function fmt(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US",{month:"short",day:"numeric"}) + " · " + d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 0 }}>
      {items.map((item, i) => {
        const { color, border } = ACTIVITY_COLORS[item.type] || ACTIVITY_COLORS.created;
        const icon = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.status;
        const isLast = i === items.length - 1;
        return (
          <div key={i} style={{ display: "flex", gap: 12, position: "relative" }}>
            {!isLast && <div style={{ position: "absolute", left: 13, top: 28, bottom: -2, width: 1, background: "rgba(0,0,0,0.06)" }} />}
            <div style={{ width: 28, height: 28, flexShrink: 0, background: `${color}18`, border: `1px solid ${border}40`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, marginTop: 2 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d={icon}/></svg>
            </div>
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 18, height: 18, background: "rgba(15,43,79,0.1)", border: "1px solid #E8E2D9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: "#0F2B4F", fontFamily: "'Outfit',system-ui,sans-serif" }}>{item.initials}</div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#374151", fontFamily: "'Outfit',system-ui,sans-serif" }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 8, color: "#9CA3AF", fontFamily: "'Geist Mono',monospace", flexShrink: 0 }}>{fmt(item.time)}</span>
              </div>
              <div style={{ fontSize: 9, color: "#6B7280", fontFamily: "'Outfit',system-ui,sans-serif", marginTop: 3, paddingLeft: 26, fontStyle: item.type === "comment" ? "italic" : "normal" }}>{item.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const MOCK_REQUESTS = [
  {
    id: "req-001", queueNumber: 42, title: "Just Listed — 8920 E Pinnacle Peak Rd",
    materialType: "Flyer", status: "in_progress", priority: "standard",
    isRush: false, listingAddress: "8920 E Pinnacle Peak Rd, Scottsdale AZ 85255",
    mlsId: "6812340", requesterName: "Yong Choi", designerName: "Lex Baum",
    dueDate: "2026-03-14", submittedAt: "2026-03-08T09:12:00Z",
    slaDeadline: "2026-03-15T09:12:00Z", slaBreached: false,
    currentStep: "in_progress",
    thumbnailUrl: null,
    steps: [
      { step: "submitted", completedAt: "2026-03-08T09:12:00Z", completedByName: "Yong Choi" },
      { step: "assigned", completedAt: "2026-03-08T11:00:00Z", completedByName: "Lex Baum" },
      { step: "in_progress", completedAt: "2026-03-09T08:30:00Z", completedByName: "Lex Baum" },
    ],
    messages: [
      { id: "m1", senderName: "Yong Choi", senderRole: "requester", body: "Please use the twilight photo for the hero image. Client loves that shot.", createdAt: "2026-03-08T09:15:00Z" },
      { id: "m2", senderName: "Lex Baum", senderRole: "designer", body: "Got it — pulling the MLS photos now. I'll have a first draft to you by EOD tomorrow.", createdAt: "2026-03-08T11:05:00Z" },
      { id: "m3", senderName: "Yong Choi", senderRole: "requester", body: "Perfect. Also can we add the mountain views callout in the copy?", createdAt: "2026-03-09T07:45:00Z" },
    ],
    brief: "Twilight hero photo for the front page — client specifically requested this. Highlight the mountain views in the copy. Keep it clean and editorial, consistent with Russ Lyon brand standards. Print-ready for 8.5×11.",
    targetAudience: null, brandGuidelines: null,
    referenceFiles: [
      { id: "rf1", fileName: "pinnacle-peak-twilight.jpg",  fileType: "image", url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80", uploadedBy: "Yong Choi", uploadedAt: "2026-03-08T09:12:00Z" },
      { id: "rf2", fileName: "pinnacle-peak-pool.jpg",      fileType: "image", url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80", uploadedBy: "Yong Choi", uploadedAt: "2026-03-08T09:12:00Z" },
      { id: "rf3", fileName: "pinnacle-peak-interior.jpg",  fileType: "image", url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&q=80", uploadedBy: "Yong Choi", uploadedAt: "2026-03-08T09:12:00Z" },
      { id: "rf4", fileName: "brand-guidelines-2026.pdf",   fileType: "pdf",   url: null, uploadedBy: "Yong Choi", uploadedAt: "2026-03-08T09:12:00Z" },
    ],
    materialsLog: [],
    assets: [
      { id: "a1", fileName: "pinnacle-peak-draft-v1.pdf", assetType: "working", revisionNumber: 1, isCurrentVersion: true, createdAt: "2026-03-09T16:00:00Z" }
    ]
  },
  {
    id: "req-002", queueNumber: 38, title: "Agent Branding — Spring Social Kit",
    materialType: "Social Pack", status: "review", priority: "standard",
    isRush: false, listingAddress: null, mlsId: null,
    requesterName: "Yong Choi", designerName: "Lex Baum",
    dueDate: "2026-03-12", submittedAt: "2026-03-05T14:00:00Z",
    slaDeadline: "2026-03-12T14:00:00Z", slaBreached: false,
    currentStep: "review",
    thumbnailUrl: null,
    steps: [
      { step: "submitted", completedAt: "2026-03-05T14:00:00Z", completedByName: "Yong Choi" },
      { step: "assigned", completedAt: "2026-03-05T15:30:00Z", completedByName: "Lex Baum" },
      { step: "in_progress", completedAt: "2026-03-06T09:00:00Z", completedByName: "Lex Baum" },
      { step: "review", completedAt: "2026-03-08T14:00:00Z", completedByName: "Lex Baum" },
    ],
    messages: [
      { id: "m4", senderName: "Lex Baum", senderRole: "designer", body: "First draft is ready for your review. Let me know what you think!", createdAt: "2026-03-08T14:01:00Z" },
    ],
    brief: "Spring 2026 social content kit — 4 Instagram posts, 2 stories, 1 LinkedIn banner. Tone should be warm and aspirational. Use the new headshot from the brand folder. Gold and navy palette, keep it consistent with the Russ Lyon brand kit.",
    targetAudience: "Luxury buyers and sellers in Scottsdale / Paradise Valley corridor",
    brandGuidelines: "Russ Lyon brand kit v4 — see uploaded PDF",
    referenceFiles: [
      { id: "rf5", fileName: "yong-headshot-2026.jpg", fileType: "image", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80", uploadedBy: "Yong Choi", uploadedAt: "2026-03-05T14:00:00Z" },
      { id: "rf6", fileName: "russ-lyon-brand-kit-v4.pdf", fileType: "pdf", url: null, uploadedBy: "Yong Choi", uploadedAt: "2026-03-05T14:00:00Z" },
    ],
    materialsLog: [
      { id: "ml1", requestedAt: "2026-03-06T10:00:00Z", requestedBy: "Lex Baum", items: ["Brand Assets", "Output Specifications"], note: "Need the exact Instagram crop sizes and whether we're doing square or portrait." },
    ],
    assets: [
      { id: "a2", fileName: "spring-social-kit-v1.zip", assetType: "working", revisionNumber: 1, isCurrentVersion: true, createdAt: "2026-03-08T13:55:00Z" }
    ]
  },
  {
    id: "req-003", queueNumber: 51, title: "Open House — 4821 N 74th St",
    materialType: "Flyer", status: "submitted", priority: "rush",
    isRush: true, listingAddress: "4821 N 74th St, Scottsdale AZ 85251",
    mlsId: "6819002", requesterName: "Yong Choi", designerName: null,
    dueDate: "2026-03-10", submittedAt: "2026-03-08T15:30:00Z",
    slaDeadline: "2026-03-10T15:30:00Z", slaBreached: false,
    currentStep: "submitted",
    thumbnailUrl: null,
    brief: "Open house this Saturday 10am–2pm. Need a clean flyer, address prominent, open house time large. Pull MLS photos. Standard Russ Lyon flyer template.",
    targetAudience: null, brandGuidelines: null,
    referenceFiles: [],
    materialsLog: [],
    steps: [
      { step: "submitted", completedAt: "2026-03-08T15:30:00Z", completedByName: "Yong Choi" },
    ],
    messages: [],
    assets: [],
  },
];

const DESIGNER_ALL_REQUESTS = [
  ...MOCK_REQUESTS,
  {
    id: "req-004", queueNumber: 44, title: "Market Report — Paradise Valley Q1",
    materialType: "Report", status: "in_progress", priority: "standard",
    isRush: false, listingAddress: null, mlsId: null,
    requesterName: "Sarah Mitchell", designerName: "Lex Baum",
    dueDate: "2026-03-18", submittedAt: "2026-03-07T10:00:00Z",
    slaDeadline: "2026-03-14T10:00:00Z", slaBreached: true,
    currentStep: "in_progress", thumbnailUrl: null, steps: [], messages: [], assets: []
  },
  {
    id: "req-005", queueNumber: 39, title: "Listing Video — Desert Mountain",
    materialType: "Video", status: "assigned", priority: "standard",
    isRush: false, listingAddress: "10801 E Happy Valley Rd, Scottsdale AZ",
    mlsId: "6800123", requesterName: "Chris Barlow", designerName: "Marcus Webb",
    dueDate: "2026-03-20", submittedAt: "2026-03-06T08:00:00Z",
    slaDeadline: "2026-03-20T08:00:00Z", slaBreached: false,
    currentStep: "assigned", thumbnailUrl: null, steps: [], messages: [], assets: []
  },
  {
    id: "req-006", queueNumber: 51, title: "Just Listed — Arcadia Modern",
    materialType: "Flyer", status: "new", priority: "rush",
    isRush: true, listingAddress: "4201 E Camelback Rd, Phoenix AZ",
    mlsId: "6801234", requesterName: "Sarah Patel", designerName: "",
    dueDate: "2026-03-10", submittedAt: "2026-03-08T07:00:00Z",
    slaDeadline: "2026-03-10T17:00:00Z", slaBreached: false,
    feasibilityFlag: false, currentStep: "new", thumbnailUrl: null, steps: [], messages: [], assets: []
  },
  {
    id: "req-007", queueNumber: 48, title: "Spring Social Pack — Troon North",
    materialType: "Social Pack", status: "new", priority: "standard",
    isRush: false, listingAddress: "25555 N Windy Walk Dr, Scottsdale AZ",
    mlsId: "6801356", requesterName: "Marcus Chen", designerName: "",
    dueDate: "2026-03-11", submittedAt: "2026-03-07T09:00:00Z",
    slaDeadline: "2026-03-09T17:00:00Z", slaBreached: true,
    feasibilityFlag: false, currentStep: "new", thumbnailUrl: null, steps: [], messages: [], assets: []
  },
  {
    id: "req-008", queueNumber: 46, title: "Broker Preview Video — McCormick Ranch",
    materialType: "Video", status: "assigned", priority: "standard",
    isRush: false, listingAddress: "8901 E Pinnacle Peak Rd, Scottsdale AZ",
    mlsId: "6801489", requesterName: "Lonnie Lopez", designerName: "Marcus Webb",
    dueDate: "2026-03-09", submittedAt: "2026-03-06T11:00:00Z",
    slaDeadline: "2026-03-08T09:00:00Z", slaBreached: true,
    feasibilityFlag: true, currentStep: "assigned", thumbnailUrl: null, steps: [], messages: [], assets: []
  },
  {
    id: "req-009", queueNumber: 43, title: "Q1 Market Report — Scottsdale",
    materialType: "Report", status: "new", priority: "standard",
    isRush: false, listingAddress: null,
    mlsId: null, requesterName: "Yong Choi", designerName: "",
    dueDate: "2026-03-12", submittedAt: "2026-03-07T15:00:00Z",
    slaDeadline: "2026-03-12T17:00:00Z", slaBreached: false,
    feasibilityFlag: false, currentStep: "new", thumbnailUrl: null, steps: [], messages: [], assets: []
  },
  {
    id: "req-010", queueNumber: 41, title: "Open House Signage — Gainey Ranch",
    materialType: "Print", status: "in_progress", priority: "rush",
    isRush: true, listingAddress: "7700 E Gainey Ranch Rd, Scottsdale AZ",
    mlsId: "6801590", requesterName: "David Park", designerName: "Lex Baum",
    dueDate: "2026-03-09", submittedAt: "2026-03-06T14:00:00Z",
    slaDeadline: "2026-03-09T12:00:00Z", slaBreached: true,
    feasibilityFlag: false, currentStep: "in_progress", thumbnailUrl: null, steps: [], messages: [], assets: []
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft:       { label: "Draft",       color: "#6B7280" },
  submitted:   { label: "Submitted",   color: "#B45309" },
  assigned:    { label: "Assigned",    color: "#1D4ED8" },
  in_progress: { label: "In Progress", color: "#0369A1" },
  review:      { label: "In Review",   color: "#7C3AED" },
  revision:    { label: "Revision",    color: "#C2410C" },
  approved:    { label: "Approved",    color: "#15803D" },
  completed:   { label: "Completed",   color: "#166534" },
  cancelled:   { label: "Cancelled",   color: "#6B7280" },
  on_hold:          { label: "On Hold",           color: "#92400E" },
  awaiting_materials: { label: "Awaiting Materials", color: "#0891B2" },
};

const STEPS = ["submitted", "assigned", "in_progress", "review", "approved", "completed"];
const STEP_LABELS = { submitted: "Submitted", assigned: "Assigned", in_progress: "In Progress", review: "Review", approved: "Approved", completed: "Completed" };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function slaCountdown(deadlineStr, paused = false) {
  if (paused) return { label: "SLA PAUSED", urgent: false, paused: true };
  const diff = new Date(deadlineStr).getTime() - Date.now();
  if (diff <= 0) return { label: "BREACHED", urgent: true };
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return { label: `${hrs}h left`, urgent: hrs < 8 };
  const days = Math.floor(hrs / 24);
  return { label: `${days}d left`, urgent: days <= 1 };
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 2, fontSize: 11,
      fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
      background: cfg.color + "18", color: cfg.color, border: `1px solid ${cfg.color}30`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function RushBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 2, fontSize: 10,
      fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
      background: "#FEF3C7", color: "#92400E", border: "1px solid #F59E0B40",
    }}>⚡ RUSH</span>
  );
}

function Stepper({ steps, currentStep }) {
  const currentIdx = STEPS.indexOf(currentStep);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
      {STEPS.map((step, i) => {
        const completed = i < currentIdx;
        const active = i === currentIdx;
        const stepData = steps.find(s => s.step === step);
        return (
          <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            {i < STEPS.length - 1 && (
              <div style={{
                position: "absolute", top: 14, left: "50%", width: "100%", height: 2,
                background: completed ? "var(--gold)" : "#E5E0D8", zIndex: 0,
              }} />
            )}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", zIndex: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
              background: completed ? "var(--gold)" : active ? "var(--navy)" : "#E5E0D8",
              color: completed ? "var(--navy)" : active ? "var(--cream)" : "#9CA3AF",
              border: active ? "2px solid var(--gold)" : "none",
              boxShadow: active ? "0 0 0 3px var(--gold)20" : "none",
              transition: "all 0.2s",
            }}>
              {completed ? "✓" : i + 1}
            </div>
            <div style={{ marginTop: 6, fontSize: 10, fontWeight: active ? 700 : 500, color: active ? "var(--navy)" : "#9CA3AF", letterSpacing: "0.05em", textAlign: "center", whiteSpace: "nowrap" }}>
              {STEP_LABELS[step]}
            </div>
            {stepData && (
              <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 2 }}>{timeAgo(stepData.completedAt)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ── Cancel Request Modal ──────────────────────────────────────────────────────
function CancelRequestModal({ req, role, onConfirm, onClose }) {
  const [reason, setReason] = React.useState("");
  const canCancel = role === "manager" || ["submitted", "assigned"].includes(req.status);
  const blockedMsg = "This request is already in progress. Contact the designer directly to discuss changes.";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,43,79,0.45)", zIndex:9300, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div style={{ background:"white", width:420, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", display:"flex", flexDirection:"column", overflow:"hidden" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background:"var(--navy)", padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)", marginBottom:2 }}>
              {role === "manager" ? "Manager · Cancel Request" : "Cancel Request"}
            </div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:300, color:"white", lineHeight:1.3 }}>{req.title}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"rgba(255,255,255,0.6)", width:28, height:28, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>

        <div style={{ padding:"20px" }}>
          {!canCancel ? (
            <>
              <div style={{ display:"flex", gap:10, padding:"12px 14px", background:"#FFFBEB", border:"1px solid #FDE68A", marginBottom:16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0, marginTop:1 }}><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                <span style={{ fontSize:12, color:"#92400E" }}>{blockedMsg}</span>
              </div>
              <button onClick={onClose} style={{ width:"100%", padding:"10px", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", background:"white", border:"1px solid var(--border)", color:"#9CA3AF", cursor:"pointer" }}>Close</button>
            </>
          ) : (
            <>
              {/* Request summary strip */}
              <div style={{ display:"flex", gap:10, padding:"10px 12px", background:"#F9F7F4", border:"1px solid var(--border)", marginBottom:16 }}>
                <div style={{ width:40, height:40, background:"linear-gradient(135deg, var(--navy) 0%, #2A4A7A 100%)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>
                  {(MATERIAL_ICONS[req.materialType] || "⬜")}
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:"var(--navy)", marginBottom:2 }}>#{req.queueNumber} · {req.materialType}</div>
                  <div style={{ fontSize:10, color:"#9CA3AF" }}>Submitted {timeAgo(req.submittedAt)} · Due {req.dueDate}</div>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:8, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:6 }}>
                  Reason for cancellation {role === "manager" ? "" : "(optional)"}
                </label>
                <textarea
                  value={reason} onChange={e => setReason(e.target.value)}
                  placeholder={role === "manager"
                    ? "Explain why this request is being cancelled (agent will be notified)…"
                    : "Let the team know why you're cancelling this request…"}
                  rows={3}
                  style={{ width:"100%", border:"1px solid var(--border)", padding:"8px 10px", fontSize:11, fontFamily:"var(--font-body)", resize:"none", outline:"none", boxSizing:"border-box", color:"var(--navy)" }}
                  onFocus={e => e.target.style.borderColor = "var(--navy)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={onClose} style={{ flex:1, padding:"10px", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", background:"white", border:"1px solid var(--border)", color:"#9CA3AF", cursor:"pointer" }}>Keep Request</button>
                <button
                  onClick={() => onConfirm(req.id, reason)}
                  style={{ flex:1, padding:"10px", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", background:"#EF4444", border:"none", color:"white", cursor:"pointer", transition:"opacity 0.12s" }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >Cancel Request</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Request Card (grid layout) ────────────────────────────────────────────────
function RequestCard({ req, onClick, onCancel, role = "requester" }) {
  const sla = slaCountdown(req.slaDeadline, req.status === "awaiting_materials");
  const isCancelled = req.status === "cancelled";
  const isCompleted = req.status === "completed";

  // Pull first image ref as thumbnail if available
  const imgRef = req.referenceFiles?.find(f => f.fileType === "image" && f.url);

  const slaColor  = req.slaBreached ? "#B91C1C" : sla.urgency === "critical" ? "#B91C1C" : sla.urgency === "warning" ? "#92400E" : "#6B7280";
  const slaBg     = req.slaBreached ? "#FEF2F2" : sla.urgency === "critical" ? "#FEF2F2" : sla.urgency === "warning" ? "#FFFBEB" : "#F9F7F4";
  const slaBorder = req.slaBreached ? "#FCA5A5" : sla.urgency === "critical" ? "#FCA5A5" : sla.urgency === "warning" ? "#FDE68A" : "var(--border)";

  const canCancelRole = role === "manager" || ["submitted", "assigned"].includes(req.status);

  return (
    <div style={{
      background: "white", border: "1px solid var(--border)",
      display:"flex", flexDirection:"column", overflow:"hidden",
      opacity: isCancelled ? 0.55 : 1,
      transition:"all 0.15s",
      position:"relative",
    }}
      onMouseEnter={e => { if (!isCancelled) e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Thumbnail band */}
      <div
        onClick={() => !isCancelled && onClick(req)}
        style={{
          height:120, flexShrink:0, cursor: isCancelled ? "default" : "pointer",
          background: imgRef
            ? `url(${imgRef.url}) center/cover no-repeat`
            : "linear-gradient(135deg, var(--navy) 0%, #1E3D6B 100%)",
          position:"relative", display:"flex", alignItems:"flex-end",
        }}
      >
        {/* Gradient overlay for text legibility */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(10,20,40,0.85) 0%, rgba(10,20,40,0.1) 60%, transparent 100%)" }} />

        {/* Material type pill */}
        <div style={{ position:"absolute", top:10, left:10, display:"flex", gap:5 }}>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.07em", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(4px)", color:"white", padding:"3px 8px", border:"1px solid rgba(255,255,255,0.2)" }}>
            {req.materialType}
          </span>
          {req.isRush && <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.07em", background:"#EF4444", color:"white", padding:"3px 7px" }}>RUSH</span>}
          {isCancelled && <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.07em", background:"rgba(100,100,100,0.7)", color:"white", padding:"3px 7px" }}>CANCELLED</span>}
        </div>

        {/* Queue # bottom right */}
        <div style={{ position:"absolute", bottom:8, right:10, fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.5)" }}>#{req.queueNumber}</div>

        {/* Title over gradient */}
        <div style={{ position:"relative", padding:"0 12px 10px", width:"100%", boxSizing:"border-box" }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:400, color:"white", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{req.title}</div>
        </div>
      </div>

      {/* Details grid */}
      <div onClick={() => !isCancelled && onClick(req)} style={{ padding:"12px 14px", cursor: isCancelled ? "default" : "pointer", flex:1 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 12px", marginBottom:10 }}>
          {/* Status */}
          <div>
            <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#C4B9AA", marginBottom:3 }}>Status</div>
            <Badge status={req.status} />
          </div>
          {/* Due date */}
          <div>
            <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#C4B9AA", marginBottom:3 }}>Due</div>
            <div style={{ fontSize:11, fontWeight:600, color:"var(--navy)" }}>{req.dueDate}</div>
          </div>
          {/* Designer */}
          <div>
            <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#C4B9AA", marginBottom:3 }}>Designer</div>
            <div style={{ fontSize:11, color: req.designerName ? "var(--navy)" : "#9CA3AF" }}>{req.designerName || "Unassigned"}</div>
          </div>
          {/* SLA */}
          <div>
            <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#C4B9AA", marginBottom:3 }}>SLA</div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 7px", background:slaBg, border:`1px solid ${slaBorder}` }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background: req.slaBreached ? "#EF4444" : sla.urgency === "critical" ? "#EF4444" : sla.urgency === "warning" ? "#F59E0B" : "#22C55E" }} />
              <span style={{ fontSize:9, fontWeight:700, color:slaColor }}>{req.slaBreached ? "BREACHED" : sla.label}</span>
            </div>
          </div>
        </div>

        {/* Last message preview */}
        {req.messages?.length > 0 && (
          <div style={{ padding:"6px 8px", background:"#F9F7F4", border:"1px solid var(--border)", borderLeft:"2px solid var(--gold)" }}>
            <div style={{ fontSize:9, color:"#9CA3AF", marginBottom:2 }}>{req.messages[req.messages.length-1].senderName}</div>
            <div style={{ fontSize:10, color:"#6B7280", lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{req.messages[req.messages.length-1].body}</div>
          </div>
        )}
      </div>

      {/* Footer action bar */}
      {!isCompleted && (
        <div style={{ padding:"8px 14px", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#FDFAF5" }}>
          <div style={{ fontSize:9, color:"#C4B9AA" }}>
            {req.messages?.length > 0 ? `${req.messages.length} message${req.messages.length !== 1 ? "s" : ""}` : "No messages"}
          </div>
          {!isCancelled && (
            <button
              onClick={e => { e.stopPropagation(); onCancel(req); }}
              title={canCancelRole ? "Cancel this request" : "In progress — cannot cancel"}
              style={{
                fontSize:9, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase",
                padding:"4px 10px", border:`1px solid ${canCancelRole ? "#FCA5A5" : "var(--border)"}`,
                background: canCancelRole ? "#FEF2F2" : "#F9F7F4",
                color: canCancelRole ? "#B91C1C" : "#C4B9AA",
                cursor: canCancelRole ? "pointer" : "not-allowed",
                transition:"opacity 0.12s",
              }}
              onMouseEnter={e => { if (canCancelRole) e.currentTarget.style.opacity = "0.75"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >Cancel</button>
          )}
        </div>
      )}
    </div>
  );
}




// ─── REQUESTER DASHBOARD ─────────────────────────────────────────────────────

// ─── NEW REQUEST MODAL ───────────────────────────────────────────────────────

const MATERIAL_ICONS = { "Flyer": "📄", "Social Pack": "◈", "Report": "📊", "Video": "▶", "Brochure": "📰" };

const FIELD_DEFS = {
  "Title":               { type: "text",     label: "Project Title",         placeholder: "e.g. 16020 N Horseshoe — Open House Flyer" },
  "MLS ID":              { type: "text",     label: "MLS ID",                placeholder: "e.g. 6812340" },
  "Listing Address":     { type: "text",     label: "Listing Address",        placeholder: "e.g. 16020 N Horseshoe Dr, Scottsdale, AZ" },
  "Due Date":            { type: "date",     label: "Requested Due Date" },
  "Brief / Notes":       { type: "textarea", label: "Brief / Notes",          placeholder: "Describe what you need, key messages, any references..." },
  "Reference Files":     { type: "upload",   label: "Reference Files" },
  "Preferred Designer":  { type: "select",   label: "Preferred Designer",     options: ["No preference", "Lex Baum", "Marcus Webb"] },
  "Target Audience":     { type: "text",     label: "Target Audience",        placeholder: "e.g. Luxury buyers 55+, Golf enthusiasts" },
  "Brand Guidelines":    { type: "select",   label: "Brand Guidelines",       options: ["Russ Lyon Sotheby's Standard", "Custom — see brief"] },
};

const MATERIAL_FIELDS = {
  "Flyer":       ["Title","MLS ID","Listing Address","Due Date","Brief / Notes","Reference Files","Preferred Designer"],
  "Social Pack": ["Title","Due Date","Brief / Notes","Target Audience","Brand Guidelines","Reference Files","Preferred Designer"],
  "Report":      ["Title","MLS ID","Listing Address","Due Date","Brief / Notes","Reference Files","Preferred Designer"],
  "Video":       ["Title","MLS ID","Listing Address","Due Date","Brief / Notes","Target Audience","Brand Guidelines","Reference Files","Preferred Designer"],
  "Brochure":    ["Title","MLS ID","Listing Address","Due Date","Brief / Notes","Reference Files","Preferred Designer"],
};

const REQUIRED_FIELDS = {
  "Flyer":       ["Title","Due Date","Brief / Notes"],
  "Social Pack": ["Title","Due Date","Brief / Notes","Target Audience","Brand Guidelines"],
  "Report":      ["Title","Due Date","Brief / Notes"],
  "Video":       ["Title","Due Date","Brief / Notes","Target Audience","Brand Guidelines","Preferred Designer"],
  "Brochure":    ["Title","Due Date","Brief / Notes"],
};

function FileUploadBox({ files, onChange }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = React.useRef();

  function handleFiles(incoming) {
    const arr = Array.from(incoming);
    onChange(prev => [...(prev || []), ...arr.map(f => ({ name: f.name, size: f.size, type: f.type, file: f }))]);
  }
  function removeFile(idx) { onChange(prev => prev.filter((_, i) => i !== idx)); }

  return (
    <div>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragging ? "var(--navy)" : "var(--border)"}`,
          borderRadius: 4, padding: "20px 16px", textAlign: "center",
          cursor: "pointer", background: dragging ? "#F0F4FF" : "#F9FAFB",
          transition: "all 0.15s",
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)" }}>Click to upload or drag & drop</div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>Images, PDFs, Word docs — any reference material</div>
        <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
      </div>
      {(files || []).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {(files || []).map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: "white", border: "1px solid var(--border)", borderRadius: 3 }}>
              <span style={{ fontSize: 14 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF" }}>{(f.size / 1024).toFixed(0)} KB</div>
              </div>
              <button onClick={() => removeFile(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 14, padding: 2, lineHeight: 1, flexShrink: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,43,79,0.6)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: 6, width: 640, maxHeight: "88vh",
        display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

function NewRequestModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [material, setMaterial] = useState(null);
  const [isRush, setIsRush] = useState(false);
  const [form, setForm] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorFields, setErrorFields] = useState({});

  const AGENT_OFFICE = "Scottsdale"; // Pre-assigned from agent profile
  const MATERIALS = Object.keys(MATERIAL_FIELDS);
  const fields = material ? MATERIAL_FIELDS[material].filter(f => f !== "Rush Flag") : [];
  const required = material ? REQUIRED_FIELDS[material] || [] : [];

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errorFields[key]) setErrorFields(e => ({ ...e, [key]: false }));
  }

  function tryAdvance() {
    if (step === 1) { if (material) setStep(2); return; }
    if (step === 2) {
      const missing = {};
      required.forEach(f => {
        const val = form[f];
        if (!val || String(val).trim() === "") missing[f] = true;
      });
      if (Object.keys(missing).length > 0) {
        setErrorFields(missing);
        return;
      }
      setStep(3);
      return;
    }
    setStep(s => s + 1);
  }

  function handleSubmit() {
    setSubmitting(true);
    setTimeout(() => {
      onSubmit({ material, isRush, office: AGENT_OFFICE, files: uploadedFiles, ...form });
      setSubmitting(false);
    }, 900);
  }

  // Step 1 — Material selection
  const Step1 = (
    <div style={{ padding: "28px 32px", flex: 1, overflowY: "auto" }}>
      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>What type of material do you need?</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {MATERIALS.map(m => (
          <div key={m} onClick={() => setMaterial(m)} style={{
            border: `2px solid ${material === m ? "var(--navy)" : "var(--border)"}`,
            borderRadius: 4, padding: "16px 18px", cursor: "pointer",
            background: material === m ? "var(--navy)" : "white",
            transition: "all 0.15s", display: "flex", alignItems: "center", gap: 12,
          }}
            onMouseEnter={e => { if (material !== m) e.currentTarget.style.borderColor = "var(--gold)"; }}
            onMouseLeave={e => { if (material !== m) e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            <span style={{ fontSize: 24 }}>{MATERIAL_ICONS[m] || "📋"}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: material === m ? "white" : "var(--navy)" }}>{m}</div>
              <div style={{ fontSize: 10, color: material === m ? "rgba(255,255,255,0.6)" : "#9CA3AF", marginTop: 2 }}>
                {material === m ? "Selected" : `${(REQUIRED_FIELDS[m]||[]).length} required fields`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Step 2 — Fields form
  const Step2 = (
    <div style={{ padding: "28px 32px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Rush toggle */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: isRush ? "#FEF3C7" : "#F9FAFB",
        border: `1px solid ${isRush ? "#FDE68A" : "var(--border)"}`, borderRadius: 4,
        transition: "all 0.2s",
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: isRush ? "#92400E" : "var(--navy)" }}>⚡ Rush Order</div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1 }}>Rush fees apply — expedited SLA</div>
        </div>
        <div onClick={() => setIsRush(v => !v)} style={{
          width: 40, height: 22, borderRadius: 11, cursor: "pointer",
          background: isRush ? "#D97706" : "#D1D5DB", transition: "background 0.2s",
          position: "relative", flexShrink: 0,
        }}>
          <div style={{
            position: "absolute", top: 3, left: isRush ? 20 : 3,
            width: 16, height: 16, borderRadius: "50%", background: "white",
            transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }} />
        </div>
      </div>

      {/* Office — pre-assigned, read-only */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>Office</div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", background: "#F9FAFB", border: "1px solid var(--border)",
          borderRadius: 3, fontSize: 12, color: "#6B7280",
        }}>
          <span style={{ fontSize: 12 }}>🏢</span>
          <span style={{ fontWeight: 600, color: "var(--navy)" }}>{AGENT_OFFICE}</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#9CA3AF", letterSpacing: "0.06em" }}>FROM YOUR PROFILE</span>
        </div>
      </div>

      {fields.map(fieldKey => {
        const def = FIELD_DEFS[fieldKey];
        if (!def) return null;
        const isReq = required.includes(fieldKey);
        const val = form[fieldKey] || "";
        const hasError = !!errorFields[fieldKey];
        const errorStyle = hasError ? {
          borderColor: "#DC2626",
          animation: "shake 0.35s ease",
        } : {};

        if (def.type === "upload") {
          return (
            <div key={fieldKey}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>{def.label}</div>
              <FileUploadBox files={uploadedFiles} onChange={setUploadedFiles} />
            </div>
          );
        }

        return (
          <div key={fieldKey}>
            <div style={{ fontSize: 11, fontWeight: 700, color: hasError ? "#DC2626" : "var(--navy)", marginBottom: 6, display: "flex", gap: 4, transition: "color 0.2s" }}>
              {def.label}
              {isReq && <span style={{ color: "#DC2626", fontSize: 10 }}>*</span>}
              {hasError && <span style={{ fontSize: 10, color: "#DC2626", fontWeight: 600, marginLeft: 4 }}>Required</span>}
            </div>
            {def.type === "textarea" ? (
              <textarea
                value={val} onChange={e => setField(fieldKey, e.target.value)}
                placeholder={def.placeholder} rows={3}
                style={{
                  width: "100%", borderRadius: 3, padding: "8px 10px",
                  fontSize: 12, fontFamily: "var(--font-body)", outline: "none",
                  resize: "vertical", color: "var(--navy)", boxSizing: "border-box",
                  border: `1px solid ${hasError ? "#DC2626" : "var(--border)"}`,
                  transition: "border-color 0.2s",
                }}
                onFocus={e => { if (!hasError) e.target.style.borderColor = "var(--gold)"; }}
                onBlur={e => { if (!hasError) e.target.style.borderColor = "var(--border)"; }}
              />
            ) : def.type === "select" ? (
              <select value={val} onChange={e => setField(fieldKey, e.target.value)}
                style={{
                  width: "100%", borderRadius: 3, padding: "8px 10px",
                  fontSize: 12, fontFamily: "var(--font-body)", outline: "none",
                  color: val ? "var(--navy)" : "#9CA3AF", background: "white", boxSizing: "border-box",
                  border: `1px solid ${hasError ? "#DC2626" : "var(--border)"}`,
                  transition: "border-color 0.2s",
                }}>
                <option value="">— Select —</option>
                {(def.options || []).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={def.type === "date" ? "date" : "text"}
                value={val} onChange={e => setField(fieldKey, e.target.value)}
                placeholder={def.placeholder}
                style={{
                  width: "100%", borderRadius: 3, padding: "8px 10px",
                  fontSize: 12, fontFamily: "var(--font-body)", outline: "none",
                  color: "var(--navy)", boxSizing: "border-box",
                  border: `1px solid ${hasError ? "#DC2626" : "var(--border)"}`,
                  transition: "border-color 0.2s",
                }}
                onFocus={e => { if (!hasError) e.target.style.borderColor = "var(--gold)"; }}
                onBlur={e => { if (!hasError) e.target.style.borderColor = "var(--border)"; }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Step 3 — Confirm
  const reviewFields = fields.filter(f => f !== "Reference Files" && form[f]);
  const Step3 = (
    <div style={{ padding: "28px 32px", flex: 1, overflowY: "auto" }}>
      <div style={{ background: "#F9FAFB", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--navy)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{MATERIAL_ICONS[material]}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{material}</div>
            {isRush && <span style={{ fontSize: 10, color: "#FDE68A", fontWeight: 700 }}>⚡ RUSH</span>}
          </div>
        </div>
        <div style={{ padding: "16px" }}>
          <div style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", width: 130, flexShrink: 0 }}>Office</div>
            <div style={{ fontSize: 11, color: "var(--navy)" }}>{AGENT_OFFICE}</div>
          </div>
          {reviewFields.map(f => (
            <div key={f} style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", width: 130, flexShrink: 0 }}>{FIELD_DEFS[f]?.label || f}</div>
              <div style={{ fontSize: 11, color: "var(--navy)" }}>{form[f]}</div>
            </div>
          ))}
          {uploadedFiles.length > 0 && (
            <div style={{ display: "flex", gap: 12, padding: "7px 0" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", width: 130, flexShrink: 0 }}>Reference Files</div>
              <div style={{ fontSize: 11, color: "var(--navy)" }}>{uploadedFiles.map(f => f.name).join(", ")}</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>
        Your request will be added to the queue and assigned to a designer. You'll be notified when it's picked up and when the first draft is ready.
      </div>
    </div>
  );

  const STEP_LABELS = ["Material Type", "Details", "Review & Submit"];
  const stepContent = [Step1, Step2, Step3][step - 1];

  return (
    <ModalOverlay onClose={onClose}>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} } @keyframes fadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
      {/* Header */}
      <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 2 }}>New Marketing Request</div>
          <div style={{ fontSize: 18, fontFamily: "var(--font-display)", color: "var(--navy)", fontWeight: 400 }}>{material || "Select a material type"}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#9CA3AF", cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
      </div>

      {/* Step indicators */}
      <div style={{ display: "flex", padding: "0 28px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {STEP_LABELS.map((lbl, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", paddingRight: 24, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", borderBottom: active ? "2px solid var(--navy)" : "2px solid transparent" }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? "#15803D" : active ? "var(--navy)" : "#E5E7EB",
                  color: done || active ? "white" : "#9CA3AF", flexShrink: 0,
                }}>{done ? "✓" : n}</div>
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? "var(--navy)" : done ? "#15803D" : "#9CA3AF", whiteSpace: "nowrap" }}>{lbl}</span>
              </div>
              {i < 2 && <div style={{ position: "absolute", right: 10, top: "50%", width: 10, height: 1, background: "var(--border)" }} />}
            </div>
          );
        })}
      </div>

      {/* Content */}
      {stepContent}

      {/* Footer */}
      <div style={{ padding: "14px 28px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
          style={{ background: "none", border: "1px solid var(--border)", borderRadius: 3, padding: "8px 18px", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}
        >{step === 1 ? "Cancel" : "← Back"}</button>
        {step < 3 ? (
          <button onClick={tryAdvance} style={{
            background: (step === 1 && !material) ? "#E5E7EB" : "var(--navy)",
            color: (step === 1 && !material) ? "#9CA3AF" : "white",
            border: "none", borderRadius: 3, padding: "8px 22px",
            fontSize: 12, fontWeight: 700, cursor: (step === 1 && !material) ? "default" : "pointer",
            transition: "all 0.15s",
          }}>Continue →</button>
        ) : (
          <button onClick={handleSubmit} style={{
            background: submitting ? "#6B7280" : "#15803D",
            color: "white", border: "none", borderRadius: 3, padding: "8px 22px",
            fontSize: 12, fontWeight: 700, cursor: submitting ? "default" : "pointer",
            transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8,
          }}>{submitting ? "Submitting…" : "✓ Submit Request"}</button>
        )}
      </div>
    </ModalOverlay>
  );
}


function RequesterDashboard({ onSelectRequest }) {
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [requests, setRequests]   = useState(MOCK_REQUESTS);
  const [cancelTarget, setCancelTarget] = useState(null);

  const active    = requests.filter(r => !["completed","cancelled"].includes(r.status));
  const cancelled = requests.filter(r => r.status === "cancelled");
  const completed = requests.filter(r => r.status === "completed");

  function handleSubmit(data) { setSubmitted(data); setShowModal(false); }
  function handleCancel(id, reason) {
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status: "cancelled", cancelReason: reason, cancelledBy: "requester" } : r));
    setCancelTarget(null);
  }

  return (
    <div style={{ padding: "32px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Marketing</div>
          <h2 style={{ fontSize: 28, fontFamily: "var(--font-display)", color: "var(--navy)", fontWeight: 300, margin: 0, letterSpacing: "-0.02em" }}>My Requests</h2>
        </div>
        <button style={{
          background: "var(--navy)", color: "var(--cream)", border: "none",
          padding: "10px 22px", fontSize: 12, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
        }} onClick={() => setShowModal(true)}>+ New Request</button>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Active",      value: active.length,                                              accent: "var(--navy)" },
          { label: "In Review",   value: active.filter(r => r.status === "review").length,           accent: "#7C3AED"     },
          { label: "Rush Orders", value: active.filter(r => r.isRush).length,                        accent: "#92400E"     },
          { label: "Cancelled",   value: cancelled.length,                                           accent: "#6B7280"     },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: "white", border: "1px solid var(--border)", padding: "14px 18px", borderTop: `3px solid ${kpi.accent}` }}>
            <div style={{ fontSize: 26, fontWeight: 300, fontFamily: "var(--font-display)", color: kpi.accent }}>{kpi.value}</div>
            <div style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", fontWeight: 600, marginTop: 2 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Active Requests — 3-col grid */}
      {active.length > 0 && (
        <>
          <div style={{ marginBottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF" }}>Active — {active.length}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 32 }}>
            {active.map(req => (
              <RequestCard key={req.id} req={req} onClick={onSelectRequest} onCancel={setCancelTarget} role="requester" />
            ))}
          </div>
        </>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <div style={{ marginBottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF" }}>Completed</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 24, opacity: 0.65 }}>
            {completed.map(req => (
              <RequestCard key={req.id} req={req} onClick={onSelectRequest} onCancel={setCancelTarget} role="requester" />
            ))}
          </div>
        </>
      )}

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <>
          <div style={{ marginBottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF" }}>Cancelled</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, opacity: 0.45 }}>
            {cancelled.map(req => (
              <RequestCard key={req.id} req={req} onClick={() => {}} onCancel={() => {}} role="requester" />
            ))}
          </div>
        </>
      )}

      {showModal && <NewRequestModal onClose={() => setShowModal(false)} onSubmit={handleSubmit} />}
      {cancelTarget && <CancelRequestModal req={cancelTarget} role="requester" onConfirm={handleCancel} onClose={() => setCancelTarget(null)} />}
      {submitted && (
        <div style={{
          position: "fixed", bottom: 32, right: 32, background: "#15803D", color: "white",
          padding: "14px 20px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          fontSize: 13, fontWeight: 600, zIndex: 2000, display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <div>
            <div>Request submitted!</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{submitted.material} · {submitted.Title || "No title"}</div>
          </div>
          <button onClick={() => setSubmitted(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 16, marginLeft: 8, padding: 0 }}>×</button>
        </div>
      )}
    </div>
  );
}

// ─── REQUEST MATERIALS MODAL ─────────────────────────────────────────────────

const MATERIAL_ITEMS = [
  { key: "description", label: "Project Description", detail: "Written brief or copy for the design" },
  { key: "images",      label: "Photography",         detail: "Listing photos, headshots, or lifestyle imagery" },
  { key: "address",     label: "Property Address",    detail: "Full street address for the listing" },
  { key: "logo",        label: "Brand Assets",        detail: "Agent or office logo and brand files" },
  { key: "dimensions",  label: "Output Specifications", detail: "Required dimensions, format, or print specs" },
];

function RequestMaterialsModal({ reqTitle, onClose, onSubmit }) {
  const [selected, setSelected] = useState({});
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggle(key) { setSelected(s => ({ ...s, [key]: !s[key] })); }
  const hasSelection = Object.values(selected).some(Boolean) || custom.trim();

  function handleSubmit() {
    setSubmitting(true);
    const items = [
      ...MATERIAL_ITEMS.filter(m => selected[m.key]).map(m => m.label),
      ...(custom.trim() ? [custom.trim()] : []),
    ];
    setTimeout(() => { onSubmit({ items, note }); setSubmitting(false); }, 600);
  }

  return (
    <ModalOverlay onClose={onClose}>
      {/* Header */}
      <div style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>Materials Request</div>
          <div style={{ fontSize: 20, fontFamily: "var(--font-display)", color: "var(--navy)", fontWeight: 300, letterSpacing: "-0.01em" }}>{reqTitle}</div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>SLA timer will pause until the agent responds.</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: "#C4C4C4", cursor: "pointer", padding: "2px 4px", lineHeight: 1, marginTop: 2 }}>×</button>
      </div>

      <div style={{ padding: "24px 32px", flex: 1, overflowY: "auto" }}>
        {/* Item list */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 12 }}>Select what you need</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {MATERIAL_ITEMS.map((item, i) => {
              const on = !!selected[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggle(item.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "13px 0",
                    borderBottom: i < MATERIAL_ITEMS.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: "pointer",
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 16, height: 16, borderRadius: 2, flexShrink: 0,
                    background: on ? "var(--navy)" : "white",
                    border: `1.5px solid ${on ? "var(--navy)" : "#D1D5DB"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.12s",
                  }}>
                    {on && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: on ? 600 : 500, color: on ? "var(--navy)" : "#374151", transition: "all 0.12s" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{item.detail}</div>
                  </div>
                  {on && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />}
                </div>
              );
            })}

            {/* Custom row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 13 }}>
              <div style={{
                width: 16, height: 16, borderRadius: 2, flexShrink: 0,
                border: "1.5px dashed #D1D5DB",
              }} />
              <input
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="Other — specify…"
                style={{
                  flex: 1, border: "none", borderBottom: "1px solid transparent", outline: "none",
                  fontSize: 13, fontFamily: "var(--font-body)", color: "var(--navy)",
                  background: "transparent", padding: "2px 0",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => e.target.style.borderBottomColor = "var(--gold)"}
                onBlur={e => e.target.style.borderBottomColor = "transparent"}
              />
            </div>
          </div>
        </div>

        {/* Note */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 10 }}>Note to agent</div>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Provide context on what you need and why…" rows={3}
            style={{
              width: "100%", border: "none", borderBottom: "1px solid var(--border)",
              padding: "4px 0 10px", fontSize: 12, fontFamily: "var(--font-body)",
              outline: "none", resize: "none", color: "var(--navy)", boxSizing: "border-box",
              background: "transparent", lineHeight: 1.6,
            }}
            onFocus={e => e.target.style.borderBottomColor = "var(--gold)"}
            onBlur={e => e.target.style.borderBottomColor = "var(--border)"}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "18px 32px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 600, color: "#9CA3AF", cursor: "pointer", padding: 0, letterSpacing: "0.02em" }}>Cancel</button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.06em", color: "#9CA3AF" }}>SLA pauses on send</div>
          <button onClick={handleSubmit} disabled={!hasSelection} style={{
            background: hasSelection ? "var(--navy)" : "#E5E7EB",
            color: hasSelection ? "white" : "#B0B0B0",
            border: "none", borderRadius: 2, padding: "9px 24px",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            cursor: hasSelection ? "pointer" : "default", transition: "all 0.15s",
          }}>{submitting ? "Sending…" : "Send"}</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── REVISION MODAL (canvas annotation) ────────────────────────────────────

const REVISION_REASONS = [
  "Wrong dimensions / crop",
  "Text error or typo",
  "Wrong colors / branding",
  "Image quality issue",
  "Layout / spacing problem",
  "Wrong or missing content",
  "Font issue",
  "Other — see comment",
];

function RevisionModal({ asset, reqTitle, onClose, onSubmit }) {
  const canvasRef = React.useRef(null);
  const [tool, setTool] = useState("arrow"); // "arrow" | "box"
  const [shapes, setShapes] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [previewShape, setPreviewShape] = useState(null);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const W = 680, H = 420;

  // Draw everything onto canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Background — navy placeholder (real: draw img)
    ctx.fillStyle = "#0F2B4F";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(201,169,110,0.15)";
    ctx.fillRect(0, 0, W, H);

    // Placeholder content
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let x = 0; x < W; x += 40) {
      ctx.fillRect(x, 0, 1, H);
    }
    for (let y = 0; y < H; y += 40) {
      ctx.fillRect(0, y, W, 1);
    }
    ctx.fillStyle = "rgba(201,169,110,0.4)";
    ctx.font = "bold 14px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(asset ? asset.fileName : "Design Preview", W / 2, H / 2 - 10);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "11px 'DM Sans', sans-serif";
    ctx.fillText("Annotate below — arrows and boxes will overlay on the real asset", W / 2, H / 2 + 14);

    // Draw all finalized shapes
    [...shapes, previewShape].filter(Boolean).forEach(s => drawShape(ctx, s, false));
  }, [shapes, previewShape, asset]);

  function drawShape(ctx, s, isPreview) {
    ctx.save();
    ctx.globalAlpha = isPreview ? 0.6 : 1;

    if (s.type === "arrow") {
      const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 5) { ctx.restore(); return; }
      const angle = Math.atan2(dy, dx);
      const headLen = Math.min(22, len * 0.4);
      const headAngle = Math.PI / 6;

      ctx.strokeStyle = "#FF3B30";
      ctx.fillStyle = "#FF3B30";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 4;

      // Shaft
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2 - (headLen * 0.6) * Math.cos(angle), s.y2 - (headLen * 0.6) * Math.sin(angle));
      ctx.stroke();

      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(s.x2, s.y2);
      ctx.lineTo(s.x2 - headLen * Math.cos(angle - headAngle), s.y2 - headLen * Math.sin(angle - headAngle));
      ctx.lineTo(s.x2 - headLen * Math.cos(angle + headAngle), s.y2 - headLen * Math.sin(angle + headAngle));
      ctx.closePath();
      ctx.fill();

    } else if (s.type === "box") {
      const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2);
      const w = Math.abs(s.x2 - s.x1), h = Math.abs(s.y2 - s.y1);
      if (w < 4 || h < 4) { ctx.restore(); return; }

      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 6;

      // Fill
      ctx.fillStyle = "rgba(255,59,48,0.12)";
      ctx.fillRect(x, y, w, h);

      // Dashed border
      ctx.strokeStyle = "#FF3B30";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      // Corner handles
      ctx.fillStyle = "#FF3B30";
      [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function onMouseDown(e) {
    const pos = getPos(e);
    setDrawing(true);
    setStartPos(pos);
    setPreviewShape({ type: tool, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
  }

  function onMouseMove(e) {
    if (!drawing || !startPos) return;
    const pos = getPos(e);
    setPreviewShape({ type: tool, x1: startPos.x, y1: startPos.y, x2: pos.x, y2: pos.y });
  }

  function onMouseUp(e) {
    if (!drawing || !startPos) return;
    const pos = getPos(e);
    const shape = { type: tool, x1: startPos.x, y1: startPos.y, x2: pos.x, y2: pos.y };
    const dx = shape.x2 - shape.x1, dy = shape.y2 - shape.y1;
    if (Math.sqrt(dx*dx + dy*dy) > 8) {
      setShapes(prev => [...prev, shape]);
    }
    setDrawing(false);
    setPreviewShape(null);
    setStartPos(null);
  }

  function handleSubmit() {
    if (!reason) return;
    // Composite canvas → dataURL (annotations baked in)
    const annotatedUrl = canvasRef.current.toDataURL("image/png");
    setSubmitted(true);
    setTimeout(() => {
      onSubmit({
        annotatedImageUrl: annotatedUrl,
        reason,
        comment,
        shapesCount: shapes.length,
      });
    }, 700);
  }

  const canSubmit = reason.trim() !== "";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,43,79,0.75)",
        zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(3px)",
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1A1A2E", borderRadius: 6, width: 780, maxHeight: "94vh",
        display: "flex", flexDirection: "column", boxShadow: "0 32px 100px rgba(0,0,0,0.6)",
        overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FF3B30", marginBottom: 2 }}>Request Revision</div>
            <div style={{ fontSize: 16, color: "white", fontFamily: "var(--font-display)", fontWeight: 400 }}>{reqTitle}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}>×</button>
        </div>

        {/* Annotation toolbar */}
        <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginRight: 4 }}>Tool</span>
          {[
            { id: "arrow", label: "↗ Arrow", tip: "Draw an arrow pointing to a specific area" },
            { id: "box",   label: "⬜ Box",   tip: "Drag to highlight a region" },
          ].map(t => (
            <button key={t.id} title={t.tip} onClick={() => setTool(t.id)} style={{
              background: tool === t.id ? "#FF3B30" : "rgba(255,255,255,0.08)",
              color: tool === t.id ? "white" : "rgba(255,255,255,0.6)",
              border: `1px solid ${tool === t.id ? "#FF3B30" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 3, padding: "5px 14px", fontSize: 11, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
          <button onClick={() => setShapes(s => s.slice(0, -1))} disabled={shapes.length === 0}
            title="Undo last shape"
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
              color: shapes.length ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
              borderRadius: 3, padding: "5px 12px", fontSize: 11, fontWeight: 700,
              cursor: shapes.length ? "pointer" : "default",
            }}>↩ Undo</button>
          <button onClick={() => setShapes([])} disabled={shapes.length === 0}
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
              color: shapes.length ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
              borderRadius: 3, padding: "5px 12px", fontSize: 11, fontWeight: 700,
              cursor: shapes.length ? "pointer" : "default",
            }}>Clear</button>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
            {shapes.length > 0 ? `${shapes.length} annotation${shapes.length > 1 ? "s" : ""}` : "Click and drag on the canvas to annotate"}
          </span>
        </div>

        {/* Canvas */}
        <div style={{ padding: "0 20px", paddingTop: 16, flexShrink: 0, position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={W} height={H}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={() => { if (drawing) { setDrawing(false); setPreviewShape(null); setStartPos(null); } }}
            style={{
              width: "100%", height: "auto", borderRadius: 4, display: "block",
              cursor: tool === "arrow" ? "crosshair" : "crosshair",
              border: "1px solid rgba(255,255,255,0.1)",
              userSelect: "none",
            }}
          />
        </div>

        {/* Reason + Comment */}
        <div style={{ padding: "16px 20px", display: "flex", gap: 12, flexShrink: 0 }}>
          <div style={{ flex: "0 0 220px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
              Reason <span style={{ color: "#FF3B30" }}>*</span>
            </div>
            <select value={reason} onChange={e => setReason(e.target.value)}
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)", border: `1px solid ${!reason && submitted ? "#FF3B30" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 3, padding: "8px 10px", fontSize: 11, color: reason ? "white" : "rgba(255,255,255,0.3)",
                fontFamily: "var(--font-body)", outline: "none",
              }}>
              <option value="">— Select reason —</option>
              {REVISION_REASONS.map(r => <option key={r} value={r} style={{ background: "#1A1A2E", color: "white" }}>{r}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Additional Notes</div>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Describe the change in detail…"
              rows={2}
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 3, padding: "8px 10px", fontSize: 11, color: "white",
                fontFamily: "var(--font-body)", outline: "none", resize: "none", boxSizing: "border-box",
              }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 3, padding: "8px 18px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Cancel</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {shapes.length === 0 && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>No annotations added yet</span>}
            <button
              onClick={() => { setSubmitted(true); handleSubmit(); }}
              disabled={!canSubmit}
              style={{
                background: canSubmit ? "#FF3B30" : "rgba(255,255,255,0.1)",
                color: canSubmit ? "white" : "rgba(255,255,255,0.3)",
                border: "none", borderRadius: 3, padding: "8px 22px",
                fontSize: 11, fontWeight: 700, cursor: canSubmit ? "pointer" : "default",
                transition: "all 0.15s",
              }}>
              {submitted ? "Submitting…" : `Submit Revision${shapes.length > 0 ? ` (${shapes.length} annotation${shapes.length > 1 ? "s" : ""})` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REQUEST DETAIL VIEW ─────────────────────────────────────────────────────

function RequestDetail({ req, onBack, viewerRole = "requester" }) {
  const [message, setMessage] = useState("");
  const [reqStatus, setReqStatus] = useState(req.status);
  const [chatMessages, setChatMessages] = useState(req.messages);
  const [currentAsset, setCurrentAsset] = useState(req.assets[0] || null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [slaPaused, setSlaPaused] = useState(false);
  const [chatTab, setChatTab] = useState("thread"); // "thread" | "activity"
  const [uploadedFiles, setUploadedFiles] = useState(req.referenceFiles || []);
  const [materialsLog, setMaterialsLog] = useState(req.materialsLog || []);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef(null);
  const chatEndRef = React.useRef(null);
  const isDesigner = viewerRole === "designer";

  function scrollToBottom() {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function addSystemMessage(body, type = "system") {
    setChatMessages(prev => [...prev, {
      id: Date.now(), senderName: "System", senderRole: type,
      body, createdAt: new Date().toISOString(),
    }]);
    scrollToBottom();
  }

  function sendMessage() {
    if (!message.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      senderName: isDesigner ? "Lex Baum" : "Yong Choi",
      senderRole: isDesigner ? "designer" : "requester",
      body: message.trim(),
      createdAt: new Date().toISOString(),
    }]);
    setMessage("");
    scrollToBottom();
  }

  function handleMarkComplete() {
    setReqStatus("completed");
    addSystemMessage("✓ Request marked complete by designer.", "complete");
  }

  function handleStartWork() {
    setReqStatus("in_progress");
    addSystemMessage("▶ Work started — request is now in progress.", "progress");
  }

  function handleSendToReview() {
    setReqStatus("review");
    addSystemMessage("→ Sent to review — awaiting agent approval.", "review");
  }

  function handleResumeWork() {
    setReqStatus("in_progress");
    addSystemMessage("▶ Revision acknowledged — work resumed.", "progress");
  }

  function handleRevisionSubmit({ annotatedImageUrl, reason, comment, shapesCount }) {
    // Replace asset with annotated version
    const newAsset = {
      id: Date.now(),
      fileName: currentAsset ? `${currentAsset.fileName.replace(/\.[^.]+$/, "")}_revision_annotated.png` : "revision_annotated.png",
      revisionNumber: (currentAsset?.revisionNumber || 1) + 1,
      createdAt: new Date().toISOString(),
      annotatedUrl: annotatedImageUrl,
      isAnnotated: true,
    };
    setCurrentAsset(newAsset);
    setReqStatus("revision");
    setShowRevisionModal(false);
    const noteText = [
      `↩ Revision requested — ${reason}.`,
      shapesCount > 0 ? `${shapesCount} annotation${shapesCount > 1 ? "s" : ""} marked on the design.` : null,
      comment ? `Note: "${comment}"` : null,
    ].filter(Boolean).join(" ");
    addSystemMessage(noteText, "revision");
  }

  function handleMaterialsRequest({ items, note }) {
    setReqStatus("awaiting_materials");
    setSlaPaused(true);
    setShowMaterialsModal(false);
    setMaterialsLog(prev => [...prev, {
      id: Date.now(), requestedAt: new Date().toISOString(),
      requestedBy: "Lex Baum", items, note,
    }]);
    const itemList = items.map(i => `• ${i}`).join("\n");
    const msg = [
      `⏸ SLA paused — designer is requesting additional materials:\n${itemList}`,
      note ? `Note: "${note}"` : null,
    ].filter(Boolean).join("\n");
    addSystemMessage(msg, "awaiting");
  }

  // Contextual actions by status + role
  const CHAT_ACTIONS = {
    designer: {
      submitted:          [{ label: "▶ Start Work",   action: handleStartWork,    color: "var(--navy)" }],
      in_progress:        [{ label: "→ Send to Review", action: handleSendToReview, color: "#7C3AED" }],
      revision:           [{ label: "▶ Resume Work",   action: handleResumeWork,   color: "var(--navy)" }],
      awaiting_materials: [{ label: "▶ Resume Work",   action: handleResumeWork,   color: "var(--navy)" }],
    },
    agent: {
      review:             [
        { label: "✓ Mark Complete",    action: handleMarkComplete,                    color: "#15803D" },
        { label: "↩ Request Revision", action: () => setShowRevisionModal(true),      color: "#C2410C", outline: true },
      ],
      awaiting_materials: [{ label: "✓ Materials Sent", action: () => { setReqStatus("in_progress"); setSlaPaused(false); addSystemMessage("▶ Agent confirmed materials sent — SLA resumed.", "progress"); }, color: "#0891B2" }],
    },
  };
  const actions = isDesigner
    ? (CHAT_ACTIONS.designer[reqStatus] || [])
    : (CHAT_ACTIONS.agent[reqStatus] || []);
  const showActions = actions.length > 0;

  function handleFileDrop(e) {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
    const newFiles = files.map(f => ({
      id: Date.now() + Math.random(), fileName: f.name,
      fileType: f.type.startsWith("image/") ? "image" : f.name.endsWith(".pdf") ? "pdf" : "file",
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      uploadedBy: isDesigner ? "Lex Baum" : "Yong Choi",
      uploadedAt: new Date().toISOString(),
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }

  // Build brief field rows from request data
  const briefFields = [
    req.materialType     && { label: "Material Type",     value: req.materialType },
    req.dueDate          && { label: "Due Date",          value: new Date(req.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
    req.listingAddress   && { label: "Property Address",  value: req.listingAddress },
    req.mlsId            && { label: "MLS ID",            value: req.mlsId },
    req.targetAudience   && { label: "Target Audience",   value: req.targetAudience },
    req.brandGuidelines  && { label: "Brand Guidelines",  value: req.brandGuidelines },
  ].filter(Boolean);

  const images = uploadedFiles.filter(f => f.fileType === "image");
  const otherFiles = uploadedFiles.filter(f => f.fileType !== "image");

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 14px", fontSize: 12, color: "#6B7280", cursor: "pointer", fontWeight: 600 }}>← Back</button>
        <div style={{ height: 20, width: 1, background: "var(--border)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Request #{req.queueNumber}</div>
          <div style={{ fontSize: 18, fontFamily: "var(--font-display)", color: "var(--navy)", fontWeight: 400 }}>{req.title}</div>
        </div>
        <Badge status={reqStatus} />
        {req.isRush && <RushBadge />}
        {isDesigner && (
          <button onClick={() => window.open("https://www.canva.com", "_blank")} style={{
            background: "#7B2FBE", border: "none", borderRadius: 3,
            padding: "7px 14px", fontSize: 11, fontWeight: 700, color: "white",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}>⬡ Canva</button>
        )}
      </div>

      {/* SLA breach alert */}
      {req.slaBreached && (
        <AlertBanner type="error" message={`SLA breached on Request #${req.queueNumber} — past the ${req.materialType} deadline window.`} action="Escalate" />
      )}
      {!req.slaBreached && req.isRush && (
        <AlertBanner type="warning" message={`Rush request — SLA window is 24h. Due ${req.dueDate}.`} />
      )}

      {/* Stepper */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, padding: "24px 28px", marginBottom: 16 }}>
        <Stepper steps={req.steps} currentStep={req.currentStep} />
      </div>

      {/* Main layout: Image + Chat */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, minHeight: 480 }}>
        {/* Design Preview */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}>
              Current Design {currentAsset ? `— v${currentAsset.revisionNumber}` : ""}
              {currentAsset?.isAnnotated && (
                <span style={{ marginLeft: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", padding: "1px 6px", borderRadius: 2 }}>ANNOTATED</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Designer: Request Materials when in_progress or review */}
              {isDesigner && ["in_progress","review"].includes(reqStatus) && (
                <button onClick={() => setShowMaterialsModal(true)} style={{
                  fontSize: 11, color: "#0891B2", background: "none",
                  border: "1px solid #0891B2", padding: "4px 12px", borderRadius: 2,
                  cursor: "pointer", fontWeight: 600,
                }}>Request Materials</button>
              )}
              {currentAsset && (
                <button style={{ fontSize: 11, color: "var(--gold)", background: "none", border: "1px solid var(--gold)", padding: "4px 12px", borderRadius: 2, cursor: "pointer", fontWeight: 600 }}>↓ Download</button>
              )}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFB", padding: 16 }}>
            {currentAsset?.isAnnotated ? (
              <img src={currentAsset.annotatedUrl} alt="Annotated design" style={{ maxWidth: "100%", maxHeight: 340, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
            ) : currentAsset ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 600 }}>{currentAsset.fileName}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Uploaded {timeAgo(currentAsset.createdAt)}</div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#D1C9BC" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>⬜</div>
                <div style={{ fontSize: 12, letterSpacing: "0.05em" }}>Awaiting first draft</div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tab bar: Thread | Activity */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            {[["thread","Thread"],["activity","Activity"]].map(([tab, label]) => (
              <button key={tab} onClick={() => setChatTab(tab)} style={{ padding: "10px 16px", fontSize: 10, fontWeight: chatTab === tab ? 700 : 500, color: chatTab === tab ? "var(--navy)" : "#9CA3AF", background: "none", border: "none", borderBottom: `2px solid ${chatTab === tab ? "var(--gold)" : "transparent"}`, marginBottom: -1, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em" }}>{label}</button>
            ))}
            {slaPaused && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#ECFEFF", border: "1px solid #A5F3FC", borderRadius: 3, padding: "3px 10px", marginLeft: "auto", marginRight: 12, alignSelf: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#0891B2", letterSpacing: "0.06em" }}>⏸ SLA PAUSED</span>
              </div>
            )}
          </div>
          {/* Activity tab */}
          {chatTab === "activity" && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <ActivityTimeline req={req} />
            </div>
          )}

          {/* Messages — Thread tab */}
          {chatTab === "thread" && <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {chatMessages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 40 }}>
                <div style={{ width: 44, height: 44, border: "1px solid #E8E2D9", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F2" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1C9BC" strokeWidth="1.5" strokeLinecap="round"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#C4B9AA", fontFamily: "var(--font-display)", marginBottom: 4 }}>No messages yet</div>
                  <div style={{ fontSize: 10, color: "#D1C9BC" }}>Start the conversation below</div>
                </div>
              </div>
            )}
            {chatMessages.map(msg => {
              const isSystem = msg.senderRole === "system" || msg.senderRole === "complete" || msg.senderRole === "revision" || msg.senderRole === "progress" || msg.senderRole === "review" || msg.senderRole === "awaiting";
              const isMe = msg.senderRole === (isDesigner ? "designer" : "requester");

              if (isSystem) {
                const bgColor = msg.senderRole === "complete" ? "#F0FDF4" : msg.senderRole === "revision" ? "#FFF7ED" : msg.senderRole === "awaiting" ? "#ECFEFF" : "#F8FAFF";
                const borderColor = msg.senderRole === "complete" ? "#BBF7D0" : msg.senderRole === "revision" ? "#FED7AA" : msg.senderRole === "awaiting" ? "#A5F3FC" : "#E0E7FF";
                const textColor = msg.senderRole === "complete" ? "#15803D" : msg.senderRole === "revision" ? "#C2410C" : msg.senderRole === "awaiting" ? "#0891B2" : "#4338CA";
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
                    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 3, padding: "6px 12px", fontSize: 11, color: textColor, fontWeight: 600, maxWidth: "90%", textAlign: "center", lineHeight: 1.5 }}>
                      {msg.body}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 3 }}>
                    {msg.senderName} · {timeAgo(msg.createdAt)}
                  </div>
                  <div style={{
                    maxWidth: "85%", padding: "8px 12px", borderRadius: 3, fontSize: 12, lineHeight: 1.5,
                    background: isMe ? "var(--navy)" : "#F3F4F6",
                    color: isMe ? "var(--cream)" : "var(--navy)",
                    borderBottomRightRadius: isMe ? 0 : 3,
                    borderBottomLeftRadius: isMe ? 3 : 0,
                  }}>{msg.body}</div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Action strip — lives in chat, contextual */}
          {showActions && (
            <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 6, flexWrap: "wrap", background: "#FAFAFA", flexShrink: 0 }}>
              {actions.map(a => (
                <button key={a.label} onClick={a.action} style={{
                  background: a.outline ? "white" : a.color,
                  color: a.outline ? a.color : "white",
                  border: `1px solid ${a.color}`,
                  borderRadius: 3, padding: "6px 14px", fontSize: 11, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s", flex: 1, whiteSpace: "nowrap",
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >{a.label}</button>
              ))}
            </div>
          )}
          </div>}

          {/* Message input — thread tab only */}
          {chatTab === "thread" && (
          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, flexShrink: 0 }}>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={isDesigner ? "Reply to agent…" : "Message designer…"}
              style={{
                flex: 1, border: "1px solid var(--border)", borderRadius: 3, padding: "7px 10px",
                fontSize: 12, outline: "none", background: "#F9FAFB", color: "var(--navy)",
                fontFamily: "var(--font-body)",
              }}
            />
            <button onClick={sendMessage} style={{ background: "var(--gold)", border: "none", borderRadius: 3, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "var(--navy)", cursor: "pointer" }}>→</button>
          </div>
          )}
        </div>
      </div>

      {/* ── Materials Panel ─────────────────────────────────────────── */}
      <div style={{ marginTop: 16, background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>

        {/* Panel header */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>Brief &amp; Materials</div>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>Submitted by {req.requesterName} · {timeAgo(req.submittedAt)}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 0 }}>

          {/* LEFT — Brief fields */}
          <div style={{ borderRight: "1px solid var(--border)", padding: "20px 24px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 14 }}>Request Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {briefFields.map((f, i) => (
                <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < briefFields.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: "var(--navy)", fontWeight: 500, lineHeight: 1.4 }}>{f.value}</div>
                </div>
              ))}
              {req.brief && (
                <div>
                  <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Brief</div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{req.brief}</div>
                </div>
              )}
              {!req.brief && briefFields.length === 0 && (
                <div style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>No brief submitted.</div>
              )}
            </div>
          </div>

          {/* RIGHT — Files + Upload */}
          <div style={{ padding: "20px 24px" }}>

            {/* Image thumbnails */}
            {images.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 12 }}>Photography</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {images.map(img => (
                    <div key={img.id} style={{ position: "relative" }}>
                      <img
                        src={img.url} alt={img.fileName}
                        style={{ width: 100, height: 72, objectFit: "cover", borderRadius: 3, border: "1px solid var(--border)", display: "block", cursor: "pointer" }}
                        onClick={() => window.open(img.url, "_blank")}
                      />
                      <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 3, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.uploadedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other files */}
            {otherFiles.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 10 }}>Files</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {otherFiles.map(f => (
                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 3, background: "#FAFAFA" }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{f.fileType === "pdf" ? "📄" : "📎"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.fileName}</div>
                        <div style={{ fontSize: 10, color: "#9CA3AF" }}>Uploaded by {f.uploadedBy} · {timeAgo(f.uploadedAt)}</div>
                      </div>
                      <button style={{ fontSize: 10, color: "var(--gold)", background: "none", border: "1px solid var(--gold)", borderRadius: 2, padding: "3px 10px", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>↓</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 10 }}>
                {isDesigner ? "Add Files" : "Upload Materials"}
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `1.5px dashed ${dragOver ? "var(--navy)" : "var(--border)"}`,
                  borderRadius: 4, padding: "18px 24px",
                  background: dragOver ? "#F0F4FF" : "#FAFAFA",
                  cursor: "pointer", textAlign: "center",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 11, color: dragOver ? "var(--navy)" : "#9CA3AF", fontWeight: 600 }}>
                  {dragOver ? "Drop to upload" : "Drag files here or click to browse"}
                </div>
                <div style={{ fontSize: 10, color: "#C4C4C4", marginTop: 4 }}>Images, PDFs, or any reference files</div>
                <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileDrop} />
              </div>
            </div>

            {/* Materials request log */}
            {materialsLog.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 10 }}>Materials Requested</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {materialsLog.map(entry => (
                    <div key={entry.id} style={{ background: "#ECFEFF", border: "1px solid #A5F3FC", borderRadius: 3, padding: "10px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#0891B2" }}>Requested by {entry.requestedBy}</span>
                        <span style={{ fontSize: 10, color: "#9CA3AF" }}>{timeAgo(entry.requestedAt)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: entry.note ? 6 : 0 }}>
                        {entry.items.map(item => (
                          <span key={item} style={{ fontSize: 10, fontWeight: 600, background: "white", border: "1px solid #A5F3FC", borderRadius: 2, padding: "2px 8px", color: "#0891B2" }}>{item}</span>
                        ))}
                      </div>
                      {entry.note && <div style={{ fontSize: 11, color: "#374151", fontStyle: "italic" }}>"{entry.note}"</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {showRevisionModal && (
        <RevisionModal
          asset={currentAsset}
          reqTitle={req.title}
          onClose={() => setShowRevisionModal(false)}
          onSubmit={handleRevisionSubmit}
        />
      )}
      {showMaterialsModal && (
        <RequestMaterialsModal
          reqTitle={req.title}
          onClose={() => setShowMaterialsModal(false)}
          onSubmit={handleMaterialsRequest}
        />
      )}
    </div>
  );
}


// ─── DESIGNER TABLE ROW ──────────────────────────────────────────────────────

function DesignerTableRow({ req, sla, lastComment, onSelectRequest, onCancel }) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <tr
      onClick={() => onSelectRequest(req)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowTooltip(false); }}
      style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", background: req.slaBreached ? "#FFF5F5" : hovered ? "#F9FAFB" : "transparent", transition: "background 0.1s" }}
    >
      <td style={{ padding: "11px 16px", color: "var(--gold)", fontWeight: 700, fontFamily: "var(--font-display)" }}>#{req.queueNumber}</td>
      <td style={{ padding: "11px 16px", fontWeight: 600, color: "var(--navy)" }}>{req.requesterName}</td>
      <td style={{ padding: "11px 16px", color: req.designerName ? "var(--navy)" : "#D1C9BC" }}>{req.designerName || "Unassigned"}</td>
      <td style={{ padding: "11px 16px", color: "#6B7280" }}>{req.materialType}</td>
      <td style={{ padding: "11px 16px", color: "#6B7280" }}>{req.dueDate}</td>
      <td style={{ padding: "11px 16px" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: sla.paused ? "#0891B2" : sla.urgent ? "#DC2626" : "#15803D" }}>{sla.label}</span>
      </td>
      <td style={{ padding: "11px 16px" }}><Badge status={req.status} /></td>
      <td style={{ padding: "8px 12px" }}>
        <button
          onClick={e => { e.stopPropagation(); window.open("https://www.canva.com", "_blank"); }}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#7B2FBE08", border: "1px solid #7B2FBE30",
            borderRadius: 3, padding: "4px 10px", fontSize: 10,
            fontWeight: 700, color: "#7B2FBE", cursor: "pointer",
            letterSpacing: "0.04em", whiteSpace: "nowrap",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background="#7B2FBE18"; e.currentTarget.style.borderColor="#7B2FBE60"; }}
          onMouseLeave={e => { e.currentTarget.style.background="#7B2FBE08"; e.currentTarget.style.borderColor="#7B2FBE30"; }}
        >⬡ Canva</button>
      </td>
      <td style={{ padding: "11px 16px", position: "relative" }}>
        {lastComment ? (
          <div style={{ position: "relative", display: "inline-block" }}>
            <button
              onClick={e => { e.stopPropagation(); setShowTooltip(v => !v); }}
              style={{
  
                transition: "opacity 0.15s",
                background: showTooltip ? "var(--navy)" : "#F3F4F6",
                color: showTooltip ? "white" : "#6B7280",
                border: `1px solid ${showTooltip ? "var(--navy)" : "#E5E7EB"}`,
                borderRadius: 3, padding: "4px 10px", fontSize: 11,
                fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <span>💬</span>
              <span>{req.messages.length}</span>
            </button>

            {showTooltip && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: "absolute", bottom: "calc(100% + 8px)", right: 0,
                  width: 280, background: "white", border: "1px solid var(--border)",
                  borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  zIndex: 100, overflow: "hidden",
                }}
              >
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "#F9FAFB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}>Latest Comment</span>
                  <span style={{ fontSize: 10, color: "#9CA3AF" }}>{req.messages.length} total</span>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
                    {lastComment.senderName}
                    <span style={{ fontWeight: 400, color: "#9CA3AF", marginLeft: 6 }}>{timeAgo(lastComment.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{lastComment.body}</div>
                </div>
                <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", background: "#F9FAFB" }}>
                  <span style={{ fontSize: 10, color: "var(--gold)", fontWeight: 600, cursor: "pointer" }}>View full thread →</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: "#D1C9BC" }}>N/A</span>
        )}
      </td>
      {/* Cancel */}
      <td style={{ padding: "8px 12px" }} onClick={e => e.stopPropagation()}>
        {!["completed","cancelled"].includes(req.status) && (
          <button
            onClick={e => { e.stopPropagation(); onCancel(req); }}
            title="Cancel this request"
            style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "4px 8px", border: "1px solid #FCA5A5", background: "#FEF2F2",
              color: "#B91C1C", cursor: "pointer", transition: "opacity 0.12s", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >Cancel</button>
        )}
        {req.status === "cancelled" && <span style={{ fontSize: 10, color: "#D1C9BC" }}>Cancelled</span>}
      </td>
    </tr>
  );
}

// ─── BAR CHART PANEL ─────────────────────────────────────────────────────────

const TIME_PERIODS = ["1M", "3M", "6M", "YTD", "1Y"];

// Each point: { label, ty: this-year team, ly: last-year team, tyP: this-year personal, lyP: last-year personal }
const PERIOD_DATA = {
  // 1M = rolling: this30 (last 30d), prev30 (days 31-60 ago), ly30 (same window Mar 2025)
  "1M": [
    { label:"Feb 8",  this30:5,  prev30:4,  ly30:4,  this30P:2, prev30P:2, ly30P:1 },
    { label:"Feb 12", this30:7,  prev30:5,  ly30:6,  this30P:3, prev30P:2, ly30P:2 },
    { label:"Feb 16", this30:6,  prev30:6,  ly30:5,  this30P:2, prev30P:2, ly30P:2 },
    { label:"Feb 20", this30:8,  prev30:5,  ly30:7,  this30P:3, prev30P:2, ly30P:3 },
    { label:"Feb 24", this30:7,  prev30:7,  ly30:6,  this30P:3, prev30P:3, ly30P:2 },
    { label:"Feb 28", this30:9,  prev30:6,  ly30:8,  this30P:4, prev30P:2, ly30P:3 },
    { label:"Mar 4",  this30:6,  prev30:8,  ly30:9,  this30P:2, prev30P:3, ly30P:3 },
    { label:"Mar 8",  this30:4,  prev30:7,  ly30:7,  this30P:1, prev30P:3, ly30P:3 },
  ],
  // 3M: ty=Jan-Mar 2026, ly=Jan-Mar 2025, prev=Oct-Dec 2025 (prev 3M window)
  "3M": [
    { label:"W1 Jan", ty:8,  ly:7,  prev:10, tyP:3, lyP:3, prevP:4 }, { label:"W2 Jan", ty:9,  ly:8,  prev:11, tyP:4, lyP:3, prevP:4 },
    { label:"W3 Jan", ty:10, ly:8,  prev:9,  tyP:4, lyP:3, prevP:3 }, { label:"W4 Jan", ty:11, ly:9,  prev:10, tyP:3, lyP:3, prevP:4 },
    { label:"W1 Feb", ty:9,  ly:10, prev:8,  tyP:3, lyP:4, prevP:3 }, { label:"W2 Feb", ty:10, ly:9,  prev:9,  tyP:4, lyP:3, prevP:3 },
    { label:"W3 Feb", ty:12, ly:10, prev:11, tyP:5, lyP:4, prevP:4 }, { label:"W4 Feb", ty:11, ly:11, prev:10, tyP:4, lyP:4, prevP:4 },
    { label:"W1 Mar", ty:11, ly:12, prev:12, tyP:4, lyP:4, prevP:5 }, { label:"W2 Mar", ty:10, ly:11, prev:11, tyP:4, lyP:5, prevP:4 },
  ],
  // 6M: ty=Oct 2025-Mar 2026, ly=Oct 2024-Mar 2025, prev=Apr-Sep 2025 (prev 6M window)
  "6M": [
    { label:"Oct", ty:31, ly:27, prev:28, tyP:11, lyP:9,  prevP:10 },
    { label:"Nov", ty:35, ly:30, prev:31, tyP:13, lyP:10, prevP:11 },
    { label:"Dec", ty:28, ly:25, prev:33, tyP:10, lyP:9,  prevP:12 },
    { label:"Jan", ty:38, ly:32, prev:26, tyP:14, lyP:11, prevP:9  },
    { label:"Feb", ty:42, ly:36, prev:30, tyP:16, lyP:13, prevP:11 },
    { label:"Mar", ty:21, ly:38, prev:34, tyP:8,  lyP:14, prevP:12 },
  ],
  "YTD": [
    { label:"Jan", ty:38, ly:32, tyP:14, lyP:11 },
    { label:"Feb", ty:42, ly:36, tyP:16, lyP:13 },
    { label:"Mar", ty:21, ly:38, tyP:8,  lyP:14 },
  ],
  "1Y": [
    { label:"Apr", ty:29, ly:24, tyP:10, lyP:8  },
    { label:"May", ty:33, ly:28, tyP:12, lyP:10 },
    { label:"Jun", ty:36, ly:31, tyP:14, lyP:11 },
    { label:"Jul", ty:30, ly:27, tyP:11, lyP:9  },
    { label:"Aug", ty:34, ly:29, tyP:13, lyP:10 },
    { label:"Sep", ty:27, ly:24, tyP:9,  lyP:8  },
    { label:"Oct", ty:31, ly:27, tyP:11, lyP:9  },
    { label:"Nov", ty:35, ly:30, tyP:13, lyP:10 },
    { label:"Dec", ty:28, ly:25, tyP:10, lyP:9  },
    { label:"Jan", ty:38, ly:32, tyP:14, lyP:11 },
    { label:"Feb", ty:42, ly:36, tyP:16, lyP:13 },
    { label:"Mar", ty:21, ly:38, tyP:8,  lyP:14 },
  ],
};

function RequestsLineChart({ data, teamMode, period }) {
  const C_THIS = "var(--navy)";  // current period — solid
  const C_PREV = "#C9A96E";      // previous window — dashed gold
  const C_LY   = "#94A3B8";      // same window last year — dotted slate

  const is1M = period === "1M";
  const is3line = is1M || period === "3M" || period === "6M";

  // Key mapping
  const k1 = is1M ? (teamMode ? "this30" : "this30P") : (teamMode ? "ty"   : "tyP");
  const k2 = is1M ? (teamMode ? "prev30" : "prev30P") : (is3line  ? (teamMode ? "prev"  : "prevP") : (teamMode ? "ly"  : "lyP"));
  const k3 = is3line ? (is1M ? (teamMode ? "ly30" : "ly30P") : (teamMode ? "ly" : "lyP")) : null;

  const n1 = is1M ? "Last 30d" : "2026";
  const n2 = is1M ? "Prev 30d" : is3line ? "Prev Window" : "2025";
  const n3 = is1M ? "Mar '25"  : is3line ? "2025" : null;
  const diffLabel = is3line && !is1M ? "vs Prev" : is1M ? "vs Prev" : "YoY";

  const isPartial = (pt) => !is1M && period !== "1Y" && (pt.label === "Mar" || pt.label === "W1 Mar" || pt.label === "W2 Mar") && (pt.ty ?? 0) < (pt.ly ?? 0);

  const CustomDot = ({ cx, cy, payload, dataKey }) => {
    if (!cx || !cy) return null;
    const partial = isPartial(payload) && dataKey === k1;
    const color = dataKey === k1 ? C_THIS : dataKey === k2 ? C_PREV : C_LY;
    return <circle cx={cx} cy={cy} r={partial ? 4 : 2.5}
      fill={partial ? "white" : color} stroke={color} strokeWidth={partial ? 2 : 0} />;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const v1 = payload.find(p => p.dataKey === k1);
    const v2 = payload.find(p => p.dataKey === k2);
    const v3 = k3 ? payload.find(p => p.dataKey === k3) : null;
    const diff = v1 && v2 ? v1.value - v2.value : null;
    const diffColor = diff > 0 ? "#15803D" : diff < 0 ? "#B91C1C" : "#9CA3AF";
    return (
      <div style={{ background:"white", border:"1px solid var(--border)", padding:"8px 12px", fontSize:11, boxShadow:"0 4px 12px rgba(0,0,0,0.1)", minWidth:140 }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:6 }}>{label}</div>
        {v1 && <div style={{ display:"flex", justifyContent:"space-between", gap:16, marginBottom:3 }}>
          <span style={{ color:C_THIS, fontWeight:700 }}>{n1}</span>
          <span style={{ color:C_THIS, fontWeight:700 }}>{v1.value}</span>
        </div>}
        {v2 && <div style={{ display:"flex", justifyContent:"space-between", gap:16, marginBottom: v3 ? 3 : (diff !== null ? 6 : 0) }}>
          <span style={{ color:C_PREV }}>{n2}</span>
          <span style={{ color:C_PREV }}>{v2.value}</span>
        </div>}
        {v3 && <div style={{ display:"flex", justifyContent:"space-between", gap:16, marginBottom: diff !== null ? 6 : 0 }}>
          <span style={{ color:C_LY }}>{n3}</span>
          <span style={{ color:C_LY }}>{v3.value}</span>
        </div>}
        {diff !== null && (
          <div style={{ borderTop:"1px solid #F0EDE8", paddingTop:5, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:9, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em" }}>{diffLabel}</span>
            <span style={{ fontSize:11, fontWeight:700, color:diffColor }}>{diff >= 0 ? "+" : ""}{diff}</span>
          </div>
        )}
      </div>
    );
  };

  const legendItems = is3line
    ? [
        { color:C_THIS, dash:null,  label:n1 },
        { color:C_PREV, dash:"4 3", label:n2 },
        { color:C_LY,   dash:"2 3", label:n3 },
      ]
    : [
        { color:C_THIS, dash:null,  label:"2026" },
        { color:C_PREV, dash:"4 3", label:"2025" },
      ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top:8, right:8, left:0, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: data.length > 8 ? 8 : 10, fill:"#9CA3AF" }} axisLine={false} tickLine={false} interval={0} />
        <YAxis hide domain={[0, dataMax => Math.ceil(dataMax * 1.2)]} />
        <Tooltip content={<CustomTooltip />} />
        {k3 && <Line type="monotone" dataKey={k3} stroke={C_LY} strokeWidth={1.5} strokeDasharray="2 3"
          dot={false} activeDot={{ r:3, fill:C_LY, stroke:"white", strokeWidth:2 }} />}
        <Line type="monotone" dataKey={k2} stroke={C_PREV} strokeWidth={1.5} strokeDasharray="4 3"
          dot={false} activeDot={{ r:4, fill:C_PREV, stroke:"white", strokeWidth:2 }} />
        <Line type="monotone" dataKey={k1} stroke={C_THIS} strokeWidth={2.5}
          dot={<CustomDot />} activeDot={{ r:5, fill:C_THIS, stroke:"white", strokeWidth:2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarChartPanel({ teamYearTotal, personalYearTotal, personalDailyAvg }) {
  const [period, setPeriod]   = useState("YTD");
  const [teamMode, setTeamMode] = useState(true);   // locked state
  const [hovered, setHovered]   = useState(false);  // hover preview

  const effectiveTeam = hovered ? !teamMode : teamMode;
  const data = PERIOD_DATA[period];

  // ── Left column stats (Year Total / Month Total / Daily Avg) ──────────────
  // Use YTD for year total, 1M for month, divide by days elapsed for daily avg
  const ytdData    = PERIOD_DATA["YTD"];
  const oneMonData = PERIOD_DATA["1M"];
  const tyKey      = effectiveTeam ? "ty"      : "tyP";
  const k1M        = effectiveTeam ? "this30"  : "this30P";

  const yearTotal  = ytdData.reduce((s, d) => s + (d[tyKey] || 0), 0);
  const monthTotal = oneMonData.reduce((s, d) => s + (d[k1M] || 0), 0);
  // 67 days elapsed in 2026 through Mar 8
  const dailyAvg   = (yearTotal / 67).toFixed(1);

  const modeLabel  = effectiveTeam ? "Team" : "Mine";
  const modeColor  = effectiveTeam ? "var(--navy)" : "var(--gold)";

  // ── Legend for chart area ──────────────────────────────────────────────────
  const is3line = period === "1M" || period === "3M" || period === "6M";
  const legendItems = period === "1M"
    ? [ { color:"var(--navy)", dash:null,  label:"Last 30d" },
        { color:"#C9A96E",     dash:"4 3", label:"Prev 30d" },
        { color:"#94A3B8",     dash:"2 3", label:"Mar '25"  } ]
    : period === "3M"
    ? [ { color:"var(--navy)", dash:null,  label:"Jan–Mar '26" },
        { color:"#C9A96E",     dash:"4 3", label:"Oct–Dec '25" },
        { color:"#94A3B8",     dash:"2 3", label:"Jan–Mar '25" } ]
    : period === "6M"
    ? [ { color:"var(--navy)", dash:null,  label:"Oct '25–Mar '26" },
        { color:"#C9A96E",     dash:"4 3", label:"Apr–Sep '25"    },
        { color:"#94A3B8",     dash:"2 3", label:"Oct '24–Mar '25" } ]
    : [ { color:"var(--navy)", dash:null,  label:"2026" },
        { color:"#C9A96E",     dash:"4 3", label:"2025" } ];

  return (
    <div style={{ background:"white", border:"1px solid var(--border)", borderRadius:4, display:"flex", overflow:"hidden" }}>

      {/* ── Left KPI column — hover previews other mode, click locks ── */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setTeamMode(m => !m)}
        style={{
          width:120, flexShrink:0, borderRight:"1px solid var(--border)",
          display:"flex", flexDirection:"column",
          cursor:"pointer", userSelect:"none",
          background: hovered ? "#FDFAF5" : "white",
          transition:"background 0.15s", position:"relative",
        }}
      >
        {/* Mode label */}
        <div style={{ padding:"10px 14px", borderBottom:"1px solid var(--border)", textAlign:"center" }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:modeColor, transition:"color 0.15s" }}>{modeLabel}</div>
          <div style={{ fontSize:8, color:"#C4B9AA", marginTop:2 }}>{hovered ? "click to lock" : "hover to preview"}</div>
        </div>

        {/* Year Total */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 14px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:22, fontWeight:300, fontFamily:"var(--font-display)", color:modeColor, lineHeight:1, transition:"color 0.15s" }}>{yearTotal}</div>
          <div style={{ fontSize:9, color:"#9CA3AF", marginTop:5, letterSpacing:"0.06em", textAlign:"center", textTransform:"uppercase", fontWeight:600 }}>Year Total</div>
        </div>

        {/* Month Total */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 14px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:22, fontWeight:300, fontFamily:"var(--font-display)", color:modeColor, lineHeight:1, transition:"color 0.15s" }}>{monthTotal}</div>
          <div style={{ fontSize:9, color:"#9CA3AF", marginTop:5, letterSpacing:"0.06em", textAlign:"center", textTransform:"uppercase", fontWeight:600 }}>Month Total</div>
        </div>

        {/* Daily Avg */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 14px" }}>
          <div style={{ fontSize:22, fontWeight:300, fontFamily:"var(--font-display)", color:modeColor, lineHeight:1, transition:"color 0.15s" }}>{dailyAvg}</div>
          <div style={{ fontSize:9, color:"#9CA3AF", marginTop:5, letterSpacing:"0.06em", textAlign:"center", textTransform:"uppercase", fontWeight:600 }}>Daily Avg</div>
        </div>

        {/* Hover glow */}
        {hovered && <div style={{ position:"absolute", inset:0, border:"1px solid var(--gold)", opacity:0.25, pointerEvents:"none" }} />}
      </div>

      {/* ── Chart area ── */}
      <div style={{ flex:1, padding:"12px 14px", display:"flex", flexDirection:"column", minHeight:0 }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexShrink:0 }}>
          {/* Dynamic legend */}
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            {legendItems.map(li => (
              <div key={li.label} style={{ display:"flex", alignItems:"center", gap:4 }}>
                {li.dash
                  ? <svg width="14" height="4" viewBox="0 0 14 4"><line x1="0" y1="2" x2="14" y2="2" stroke={li.color} strokeWidth="1.5" strokeDasharray={li.dash}/></svg>
                  : <div style={{ width:14, height:2.5, background:li.color, borderRadius:2 }} />}
                <span style={{ fontSize:9, color:li.color, fontWeight: li.dash ? 500 : 700, whiteSpace:"nowrap" }}>{li.label}</span>
              </div>
            ))}
          </div>
          {/* Period stepper */}
          <div style={{ display:"flex", background:"#F3F4F6", borderRadius:3, padding:2, gap:1, flexShrink:0 }}>
            {TIME_PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                background: period === p ? "white" : "transparent",
                color: period === p ? "var(--navy)" : "#9CA3AF",
                border:"none", borderRadius:2, padding:"3px 7px",
                fontSize:9, fontWeight: period === p ? 700 : 500,
                cursor:"pointer", letterSpacing:"0.04em",
                boxShadow: period === p ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition:"all 0.15s",
              }}>{p === "1M" ? "30D" : p}</button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ flex:1, minHeight:0 }}>
          <RequestsLineChart data={data} teamMode={effectiveTeam} period={period} />
        </div>
      </div>
    </div>
  );
}



// ─── TEAM HEALTH GRID ────────────────────────────────────────────────────────

function HealthTile({ label, value, color, barPct, signal, target }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#FAFAFA" : "white",
        border: `1px solid ${hovered ? color + "60" : "var(--border)"}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 4, padding: "12px 14px",
        cursor: "default", transition: "border 0.15s, background 0.15s",
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 300, fontFamily: "var(--font-display)", color, lineHeight: 1, marginBottom: 10 }}>{value}</div>
      <div style={{ height: 3, background: "#F3F4F6", borderRadius: 2, marginBottom: 5 }}>
        <div style={{ width: `${barPct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 500 }}>{signal}</span>
        <span style={{ fontSize: 9, color: "#D1D5DB" }}>{target}</span>
      </div>
    </div>
  );
}

function TeamHealthGrid({ revisionRate, slaCompliance, reqPerDesigner, avgCompletionDays }) {
  const tiles = [
    { label: "Revision Rate",  value: `${revisionRate}%`,     barPct: revisionRate,                              color: revisionRate > 25 ? "#DC2626" : revisionRate > 15 ? "#F59E0B" : "#15803D",       signal: revisionRate <= 15 ? "✓ Healthy" : revisionRate <= 25 ? "⚠ Monitor" : "✗ High",           target: "Target <15%" },
    { label: "SLA Compliance", value: `${slaCompliance}%`,    barPct: slaCompliance,                             color: slaCompliance >= 95 ? "#15803D" : slaCompliance >= 85 ? "#F59E0B" : "#DC2626",    signal: slaCompliance >= 95 ? "✓ Excellent" : slaCompliance >= 85 ? "⚠ Slipping" : "✗ Critical", target: "Target ≥95%" },
    { label: "Req / Designer", value: reqPerDesigner,          barPct: Math.min((reqPerDesigner / 8) * 100, 100), color: reqPerDesigner <= 5 ? "#15803D" : reqPerDesigner <= 7 ? "#F59E0B" : "#DC2626",    signal: reqPerDesigner <= 5 ? "✓ Balanced" : reqPerDesigner <= 7 ? "⚠ Heavy" : "✗ Overloaded",   target: "Target ≤5" },
    { label: "Avg Completion", value: `${avgCompletionDays}d`, barPct: Math.min((avgCompletionDays / 14) * 100, 100), color: avgCompletionDays <= 5 ? "#15803D" : avgCompletionDays <= 9 ? "#F59E0B" : "#DC2626", signal: avgCompletionDays <= 5 ? "✓ Fast" : avgCompletionDays <= 9 ? "⚠ Average" : "✗ Slow", target: "Target ≤5d" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100%" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 8 }}>Team Health</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8 }}>
        {tiles.map(t => <HealthTile key={t.label} {...t} />)}
      </div>
    </div>
  );
}


// ─── PIE PANEL ───────────────────────────────────────────────────────────────

const PIE_TABS = ["Requests", "Materials", "Offices"];

const MATERIAL_DATA = [
  { name: "Flyer",       value: 18, color: "#0F2B4F" },
  { name: "Social Pack", value: 12, color: "#C9A96E" },
  { name: "Video",       value:  6, color: "#7C3AED" },
  { name: "Report",      value:  9, color: "#0369A1" },
  { name: "Brochure",    value:  4, color: "#15803D" },
];

const OFFICE_DATA = [
  { name: "Scottsdale",      value: 21, color: "#0F2B4F" },
  { name: "Paradise Valley", value: 14, color: "#C9A96E" },
  { name: "Sedona",          value:  8, color: "#7C3AED" },
  { name: "Tucson",          value:  6, color: "#0369A1" },
];

function PiePanel({ allRequests, unassigned, inReview, totalOpen }) {
  const [tab, setTab] = useState("Requests");
  const [hovered, setHovered] = useState(false);

  const slaBreached = DESIGNER_ALL_REQUESTS.filter(r => r.slaBreached).length;
  const rushActive  = DESIGNER_ALL_REQUESTS.filter(r => r.isRush).length;

  const requestsData = [
    { name: "Active",       value: totalOpen - unassigned.length - inReview.length, color: "#0F2B4F" },
    { name: "Unassigned",   value: unassigned.length, color: "#C9A96E" },
    { name: "In Review",    value: inReview.length,   color: "#7C3AED" },
    { name: "SLA Breached", value: slaBreached,       color: "#DC2626" },
    { name: "Rush",         value: rushActive,        color: "#92400E" },
  ];

  const allData = tab === "Requests" ? requestsData : tab === "Materials" ? MATERIAL_DATA : OFFICE_DATA;
  const top3 = [...allData].sort((a, b) => b.value - a.value).slice(0, 3);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, padding: "12px 14px", display: "flex", flexDirection: "column", position: "relative" }}
    >
      <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 3, padding: 2, gap: 1, marginBottom: 10 }}>
        {PIE_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, background: tab === t ? "white" : "transparent",
            color: tab === t ? "var(--navy)" : "#9CA3AF",
            border: "none", borderRadius: 2, padding: "4px 6px",
            fontSize: 9, fontWeight: tab === t ? 700 : 500,
            letterSpacing: "0.05em", textTransform: "uppercase",
            cursor: "pointer", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.15s",
          }}>{t}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <PieChart width={130} height={120}>
          <Pie data={allData} cx={60} cy={55} innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={2} stroke="white">
            {allData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 11, border: "1px solid var(--border)", borderRadius: 3 }} />
        </PieChart>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
        {top3.map(d => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: d.color, flexShrink: 0 }}>{d.value}</span>
          </div>
        ))}
        {allData.length > 3 && (
          <div style={{ fontSize: 9, color: "#D1D5DB", letterSpacing: "0.05em", marginTop: 2 }}>+{allData.length - 3} more — hover to see all</div>
        )}
      </div>
      {hovered && allData.length > 3 && (
        <div style={{
          position: "absolute", top: 0, left: "calc(100% + 8px)",
          background: "white", border: "1px solid var(--border)",
          borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 50, width: 180, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 10 }}>{tab} — All</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {allData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#374151" }}>{d.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COLUMN HEADER ────────────────────────────────────────────────────────────

function ColumnHeader({ label, colKey, sortConfig, onSort, allRows, colFilters, onFilterChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isActive = sortConfig.key === colKey;
  const dir = isActive ? sortConfig.dir : null;
  const hasFilter = colFilters[colKey] && colFilters[colKey] !== "all";

  // Unique values for this column
  const allValues = [...new Set(allRows.map(r => {
    if (colKey === "queueNumber") return "#" + r.queueNumber;
    if (colKey === "designerName") return r.designerName || "Unassigned";
    if (colKey === "sla") return slaCountdown(r.slaDeadline).label;
    if (colKey === "comments") return r.messages.length > 0 ? "Has comments" : "No comments";
    return String(r[colKey] ?? "");
  }))].sort();

  const selected = colFilters[colKey] instanceof Set ? colFilters[colKey] : new Set(allValues);
  const filteredVals = search ? allValues.filter(v => v.toLowerCase().includes(search.toLowerCase())) : allValues;
  const allSelected = allValues.every(v => selected.has(v));

  function toggle(val) {
    const next = new Set(selected);
    if (next.has(val)) next.delete(val); else next.add(val);
    onFilterChange(colKey, next.size === allValues.length ? "all" : next);
  }
  function toggleAll() {
    onFilterChange(colKey, allSelected ? new Set() : "all");
  }

  return (
    <th style={{ padding: "10px 16px", textAlign: "left", position: "relative", userSelect: "none" }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          color: (isActive || hasFilter) ? "var(--navy)" : "#9CA3AF",
        }}
      >
        {label}
        <span style={{ fontSize: 9, opacity: 0.7 }}>
          {isActive && dir === "asc" ? "▲" : isActive && dir === "desc" ? "▼" : "⌄"}
        </span>
        {hasFilter && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", display: "inline-block" }} />}
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 2px)", left: 0,
            background: "white", border: "1px solid var(--border)",
            borderRadius: 4, boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
            zIndex: 200, width: 200, overflow: "hidden",
          }}>
            {/* Sort buttons */}
            <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", display: "flex", gap: 6 }}>
              {[["asc","▲ A → Z"], ["desc","▼ Z → A"]].map(([d, lbl]) => (
                <button key={d} onClick={() => { onSort(colKey, d); }} style={{
                  flex: 1, padding: "5px 6px", fontSize: 10, fontWeight: 600,
                  border: "1px solid var(--border)", borderRadius: 3, cursor: "pointer",
                  background: isActive && dir === d ? "var(--navy)" : "white",
                  color: isActive && dir === d ? "white" : "var(--navy)",
                  letterSpacing: "0.04em",
                }}>{lbl}</button>
              ))}
            </div>

            {/* Value search */}
            <div style={{ padding: "8px 12px 4px", borderBottom: "1px solid var(--border)" }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search values..."
                onClick={e => e.stopPropagation()}
                style={{
                  width: "100%", padding: "5px 8px", fontSize: 11,
                  border: "1px solid var(--border)", borderRadius: 3,
                  outline: "none", fontFamily: "var(--font-body)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Select All */}
            <div
              onClick={e => { e.stopPropagation(); toggleAll(); }}
              style={{ padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", borderBottom: "1px solid var(--border)", background: "#F9FAFB" }}
            >
              <div style={{
                width: 13, height: 13, border: "1px solid var(--border)", borderRadius: 2,
                background: allSelected ? "var(--navy)" : "white",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {allSelected && <span style={{ fontSize: 9, color: "white", lineHeight: 1 }}>✓</span>}
                {!allSelected && selected.size > 0 && <span style={{ fontSize: 9, color: "var(--navy)", lineHeight: 1 }}>—</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)" }}>Select All</span>
            </div>

            {/* Value list */}
            <div style={{ maxHeight: 180, overflowY: "auto" }}>
              {filteredVals.map(val => {
                const checked = selected.has(val);
                return (
                  <div
                    key={val}
                    onClick={e => { e.stopPropagation(); toggle(val); }}
                    style={{ padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: 13, height: 13, border: `1px solid ${checked ? "var(--navy)" : "var(--border)"}`,
                      borderRadius: 2, background: checked ? "var(--navy)" : "white",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {checked && <span style={{ fontSize: 9, color: "white", lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 11, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: "7px 12px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 6 }}>
              <button onClick={() => { onFilterChange(colKey, "all"); onSort(null, null); }} style={{ fontSize: 10, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear</button>
              <button onClick={() => setOpen(false)} style={{ fontSize: 10, color: "white", background: "var(--navy)", border: "none", borderRadius: 2, padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}>Done</button>
            </div>
          </div>
        </>
      )}
    </th>
  );
}

// ─── DESIGNER DASHBOARD ──────────────────────────────────────────────────────


// ── Intake Queue Data ─────────────────────────────────────────────────────────
const INTAKE_QUEUE = [
  {
    id: "iq-001", queueNumber: 55,
    title: "Just Listed — 7200 E Gainey Ranch Rd #210",
    requesterName: "Sandra Moore", office: "Scottsdale",
    materialType: "Flyer", isRush: false,
    submittedAt: "2026-03-08T07:45:00Z",
    dueDate: "2026-03-13",
    estimatedPages: 2,
    brief: "Standard just-listed flyer for a condo in Gainey Ranch. Pull MLS photos. Standard template.",
    attachments: 3,
  },
  {
    id: "iq-002", queueNumber: 56,
    title: "Agent Bio + Brand Package — Full Rebrand",
    requesterName: "Tom Alvarez", office: "Phoenix",
    materialType: "Brand Package", isRush: false,
    submittedAt: "2026-03-08T08:10:00Z",
    dueDate: "2026-03-11",
    estimatedPages: 14,
    brief: "Full rebrand: new logo, business card, bio page, email signature, 3 social templates, letterhead, and 8-page buyer presentation. Need all delivered by Thursday.",
    attachments: 1,
  },
  {
    id: "iq-003", queueNumber: 57,
    title: "Luxury Market Report — Q1 2026 Full Report",
    requesterName: "Patricia Westfield", office: "Scottsdale",
    materialType: "Report", isRush: true,
    submittedAt: "2026-03-08T09:00:00Z",
    dueDate: "2026-03-10",
    estimatedPages: 47,
    brief: "47-page luxury market report covering all 14 Scottsdale submarkets. Rush — needed for board meeting Monday morning. Full data visualization, executive summary, and infographics.",
    attachments: 0,
  },
  {
    id: "iq-004", queueNumber: 58,
    title: "Open House — 3901 E Camelback Rd #180",
    requesterName: "Yong Choi", office: "Scottsdale",
    materialType: "Flyer", isRush: true,
    submittedAt: "2026-03-08T11:30:00Z",
    dueDate: "2026-03-09",
    estimatedPages: 1,
    brief: "Open house tomorrow 11am–3pm. Simple flyer, address + time prominent. Pull MLS photos.",
    attachments: 2,
  },
  {
    id: "iq-005", queueNumber: 59,
    title: "Social Media Kit — Spring Campaign",
    requesterName: "Chris Barlow", office: "Paradise Valley",
    materialType: "Social Pack", isRush: false,
    submittedAt: "2026-03-07T16:00:00Z",
    dueDate: "2026-03-16",
    estimatedPages: 6,
    brief: "4 Instagram posts, 2 stories, 1 LinkedIn banner. Spring 2026 listings campaign. Warm and aspirational.",
    attachments: 4,
  },
];

// Feasibility flag: returns null or { level, reason }
function getFeasibilityFlag(req) {
  const submitted = new Date(req.submittedAt);
  const due = new Date(req.dueDate + "T23:59:00Z");
  const calDays = Math.max(0, (due - submitted) / 86400000);
  // Rough business days (exclude weekends, no holidays)
  let bizDays = 0, d = new Date(submitted);
  while (d < due) { d.setDate(d.getDate() + 1); const dow = d.getDay(); if (dow !== 0 && dow !== 6) bizDays++; }

  const complexity = req.estimatedPages;

  if (req.isRush && complexity >= 20) {
    return { level: "hard", reason: `${complexity}pp rush in ${bizDays} business day${bizDays !== 1 ? "s" : ""} — timeline not feasible` };
  }
  if (!req.isRush && complexity >= 12 && bizDays < 4) {
    return { level: "hard", reason: `${complexity}pp in ${bizDays} business days — needs more lead time` };
  }
  if (req.attachments === 0 && !["Flyer"].includes(req.materialType)) {
    return { level: "warn", reason: "No reference files attached — materials may be insufficient" };
  }
  if (req.isRush && bizDays < 2) {
    return { level: "warn", reason: `Due in ${bizDays} business day${bizDays !== 1 ? "s" : ""} — very tight even for rush` };
  }
  return null;
}

const FLAG_STYLE = {
  hard: { bg: "#FEF2F2", border: "#FCA5A5", dot: "#EF4444", txt: "#B91C1C" },
  warn: { bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B", txt: "#92400E" },
};

// Per-row action state machine
// idle → (approve needs designer) | need_info → info_sent | rejected
const ACTION_STATES = {
  idle:      null,
  approved:  { label: "Approved",   bg: "#F0FDF4", border: "#86EFAC", txt: "#15803D" },
  rejected:  { label: "Rejected",   bg: "#FEF2F2", border: "#FCA5A5", txt: "#B91C1C" },
  info_sent: { label: "Info Requested", bg: "#FFFBEB", border: "#FDE68A", txt: "#92400E" },
};

function IntakeQueueRow({ req, designers, onDecision }) {
  const [designer, setDesigner]     = React.useState("");
  const [action, setAction]         = React.useState("idle");   // idle|approved|rejected|info_sent|confirming_reject|confirming_info
  const [rejectNote, setRejectNote] = React.useState("");
  const [infoNote, setInfoNote]     = React.useState("");
  const [expanded, setExpanded]     = React.useState(false);
  const { openProfile } = useProfile();

  const flag = getFeasibilityFlag(req);
  const submitted = new Date(req.submittedAt);
  const due = new Date(req.dueDate + "T23:59:00Z");
  let bizDays = 0, d = new Date(submitted);
  while (d < due) { d.setDate(d.getDate() + 1); const dow = d.getDay(); if (dow !== 0 && dow !== 6) bizDays++; }

  const isDone = ["approved","rejected","info_sent"].includes(action);
  const rowBg  = flag?.level === "hard" ? "#FFFAF9" : flag?.level === "warn" ? "#FFFDF5" : "white";

  return (
    <>
      <tr style={{ background: rowBg, borderBottom: "1px solid #F0EDE8", opacity: isDone ? 0.6 : 1, transition: "opacity 0.2s" }}>
        {/* # */}
        <td style={{ padding: "11px 12px", width: 36, verticalAlign: "middle" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF" }}>#{req.queueNumber}</span>
        </td>

        {/* Flag indicator */}
        <td style={{ padding: "11px 8px", width: 20, verticalAlign: "middle" }}>
          {flag && (
            <div title={flag.reason} style={{ width: 8, height: 8, borderRadius: "50%", background: FLAG_STYLE[flag.level].dot, flexShrink: 0, cursor: "help" }} />
          )}
        </td>

        {/* Request title + brief toggle */}
        <td style={{ padding: "11px 12px", verticalAlign: "middle", maxWidth: 220 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", lineHeight: 1.3, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 210 }}>{req.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>{req.materialType}</span>
            {req.isRush && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", background: "#FEF2F2", color: "#B91C1C", padding: "1px 5px", border: "1px solid #FCA5A5" }}>RUSH</span>}
            <button onClick={() => setExpanded(e => !e)} style={{ fontSize: 9, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
              {expanded ? "less" : "brief"}
            </button>
          </div>
        </td>

        {/* Requester */}
        <td style={{ padding: "11px 12px", verticalAlign: "middle", width: 130 }}>
          <ProfileLink name={req.requesterName} style={{ fontSize: 11, fontWeight: 500, color: "var(--navy)" }} />
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>{req.office}</div>
        </td>

        {/* Pages + days */}
        <td style={{ padding: "11px 12px", verticalAlign: "middle", width: 80, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: flag?.level === "hard" ? "#B91C1C" : "var(--navy)" }}>{req.estimatedPages}pp</div>
          <div style={{ fontSize: 9, color: bizDays <= 1 ? "#B91C1C" : bizDays <= 3 ? "#92400E" : "#9CA3AF" }}>{bizDays} biz day{bizDays !== 1 ? "s" : ""}</div>
        </td>

        {/* Due */}
        <td style={{ padding: "11px 12px", verticalAlign: "middle", width: 80 }}>
          <div style={{ fontSize: 11, color: "var(--navy)", fontWeight: 500 }}>{req.dueDate.slice(5).replace("-", "/")}</div>
          <div style={{ fontSize: 9, color: "#9CA3AF" }}>{req.attachments} file{req.attachments !== 1 ? "s" : ""}</div>
        </td>

        {/* Designer assign dropdown */}
        <td style={{ padding: "11px 12px", verticalAlign: "middle", width: 148 }}>
          {isDone ? (
            <span style={{ fontSize: 10, color: designer ? "var(--navy)" : "#9CA3AF" }}>{designer || "—"}</span>
          ) : (
            <select
              value={designer}
              onChange={e => setDesigner(e.target.value)}
              style={{
                width: "100%", border: "1px solid var(--border)", padding: "5px 7px",
                fontSize: 11, fontFamily: "var(--font-body)", color: designer ? "var(--navy)" : "#9CA3AF",
                background: "white", outline: "none", cursor: "pointer",
              }}
              onFocus={e => e.target.style.borderColor = "var(--navy)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            >
              <option value="">— Assign to —</option>
              {designers.map(d => <option key={d.id} value={d.name}>{d.name} · {d.role}</option>)}
            </select>
          )}
        </td>

        {/* Action buttons */}
        <td style={{ padding: "11px 12px", verticalAlign: "middle", width: 200 }}>
          {isDone ? (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
              padding: "4px 10px", border: `1px solid ${ACTION_STATES[action].border}`,
              background: ACTION_STATES[action].bg, color: ACTION_STATES[action].txt,
            }}>{ACTION_STATES[action].label}</span>
          ) : action === "confirming_reject" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <textarea
                value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                placeholder="Reason for rejection…"
                rows={2}
                style={{ fontSize: 10, border: "1px solid #FCA5A5", padding: "4px 6px", fontFamily: "var(--font-body)", resize: "none", outline: "none", width: "100%", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => { setAction("rejected"); onDecision(req.id, "rejected", designer, rejectNote); }} style={{ flex: 1, fontSize: 9, fontWeight: 700, padding: "5px", border: "none", background: "#EF4444", color: "white", cursor: "pointer" }}>Confirm Reject</button>
                <button onClick={() => setAction("idle")} style={{ fontSize: 9, padding: "5px 8px", border: "1px solid var(--border)", background: "white", color: "#9CA3AF", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          ) : action === "confirming_info" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <textarea
                value={infoNote} onChange={e => setInfoNote(e.target.value)}
                placeholder="What information is needed?"
                rows={2}
                style={{ fontSize: 10, border: "1px solid #FDE68A", padding: "4px 6px", fontFamily: "var(--font-body)", resize: "none", outline: "none", width: "100%", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => { setAction("info_sent"); onDecision(req.id, "info_sent", designer, infoNote); }} style={{ flex: 1, fontSize: 9, fontWeight: 700, padding: "5px", border: "none", background: "#F59E0B", color: "white", cursor: "pointer" }}>Send Request</button>
                <button onClick={() => setAction("idle")} style={{ fontSize: 9, padding: "5px 8px", border: "1px solid var(--border)", background: "white", color: "#9CA3AF", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {/* Approve — primary CTA, requires designer */}
              <button
                onClick={() => { if (designer) { setAction("approved"); onDecision(req.id, "approved", designer, ""); } }}
                title={!designer ? "Select a designer first" : "Approve and send to queue"}
                style={{
                  padding: "6px 10px", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                  border: "none", cursor: designer ? "pointer" : "not-allowed",
                  background: designer ? "var(--navy)" : "#E5E1D8",
                  color: designer ? "white" : "#C4B9AA",
                  transition: "all 0.12s", display: "flex", alignItems: "center", gap: 5,
                }}
                onMouseEnter={e => { if (designer) e.currentTarget.style.background = "#1A3D6B"; }}
                onMouseLeave={e => { if (designer) e.currentTarget.style.background = "var(--navy)"; }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                Begin
              </button>
              {/* Need info */}
              <button
                onClick={() => setAction("confirming_info")}
                title="Request more information from agent"
                style={{ padding: "6px 7px", fontSize: 9, fontWeight: 700, border: "1px solid #FDE68A", background: "#FFFBEB", color: "#92400E", cursor: "pointer", transition: "opacity 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >?</button>
              {/* Reject */}
              <button
                onClick={() => setAction("confirming_reject")}
                title="Reject this request"
                style={{ padding: "6px 7px", fontSize: 9, fontWeight: 700, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#B91C1C", cursor: "pointer", transition: "opacity 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >✕</button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded brief row */}
      {expanded && (
        <tr style={{ background: flag?.level === "hard" ? "#FEF9F9" : flag?.level === "warn" ? "#FFFEF5" : "#FAFAF9", borderBottom: "1px solid #F0EDE8" }}>
          <td colSpan={8} style={{ padding: "0 12px 12px 52px" }}>
            {flag && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", marginBottom: 8, background: FLAG_STYLE[flag.level].bg, border: `1px solid ${FLAG_STYLE[flag.level].border}` }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={FLAG_STYLE[flag.level].dot} strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0, marginTop:1 }}><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                <span style={{ fontSize: 11, color: FLAG_STYLE[flag.level].txt, fontWeight: 600 }}>{flag.reason}</span>
              </div>
            )}
            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{req.brief}</div>
          </td>
        </tr>
      )}
    </>
  );
}

function IntakeQueueTable({ designers }) {
  const [rows, setRows]   = React.useState(INTAKE_QUEUE);
  const [log, setLog]     = React.useState([]);
  const [iqPageSize, setIqPageSize] = React.useState(10);
  const [iqPage, setIqPage]         = React.useState(1);
  const hardFlags  = rows.filter(r => getFeasibilityFlag(r)?.level === "hard").length;
  const warnFlags  = rows.filter(r => getFeasibilityFlag(r)?.level === "warn").length;
  const pending    = rows.length;

  function handleDecision(id, decision, designerName, note) {
    setLog(l => [{ id, decision, designerName, note, at: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) }, ...l]);
  }

  return (
    <div style={{ background: "white", border: "1px solid var(--border)", marginBottom: 32, overflow: "visible" }}>

      {/* Header */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "#FDFAF5" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--navy)" }}>Intake Queue</span>
            <span style={{ fontSize: 10, fontWeight: 700, background: "var(--navy)", color: "var(--gold)", padding: "2px 7px", letterSpacing: "0.04em" }}>{pending}</span>
            {hardFlags > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF2F2", color: "#B91C1C", padding: "2px 7px", border: "1px solid #FCA5A5", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display:"inline-block" }} />
                {hardFlags} flagged
              </span>
            )}
            {warnFlags > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, background: "#FFFBEB", color: "#92400E", padding: "2px 7px", border: "1px solid #FDE68A", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display:"inline-block" }} />
                {warnFlags} need review
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 3 }}>New submissions awaiting executive review — assign a designer and approve, request more info, or reject before entering the active queue</div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
          {[["#EF4444","Timeline not feasible"],["#F59E0B","Needs attention"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
              <span style={{ fontSize: 9, color: "#9CA3AF" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 48 }} />
            <col style={{ width: 20 }} />
            <col style={{ width: 220 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 148 }} />
            <col style={{ width: 210 }} />
          </colgroup>
          <thead>
            <tr style={{ background: "#F9F7F4", borderBottom: "2px solid var(--border)" }}>
              {["#","","Request","Requester","Scope","Due","Assign To","Decision"].map((h, i) => (
                <th key={i} style={{ padding: "8px 12px", fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9CA3AF", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice((iqPage - 1) * iqPageSize, iqPage * iqPageSize).map(req => (
              <IntakeQueueRow key={req.id} req={req} designers={designers} onDecision={handleDecision} />
            ))}
          </tbody>
        </table>
        <PaginationBar total={rows.length} pageSize={iqPageSize} page={iqPage} onPageSize={setIqPageSize} onPage={p => setIqPage(Math.max(1, Math.min(p, Math.ceil(rows.length / iqPageSize))))} />
      </div>

      {/* Activity log */}
      {log.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 20px", background: "#FAFAF9" }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C4B9AA", marginBottom: 6 }}>Recent Decisions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {log.slice(0, 4).map((entry, i) => {
              const req = rows.find(r => r.id === entry.id);
              const col = entry.decision === "approved" ? "#15803D" : entry.decision === "rejected" ? "#B91C1C" : "#92400E";
              const lbl = entry.decision === "approved" ? "Approved" : entry.decision === "rejected" ? "Rejected" : "Info Requested";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "#6B7280" }}>
                  <span style={{ fontWeight: 700, color: col, minWidth: 110 }}>{lbl}</span>
                  <span style={{ color: "var(--navy)", fontWeight: 500 }}>#{req?.queueNumber} {req?.title?.slice(0,40)}{req?.title?.length > 40 ? "…" : ""}</span>
                  {entry.designerName && <span>→ {entry.designerName}</span>}
                  <span style={{ marginLeft: "auto", color: "#C4B9AA" }}>{entry.at}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


// ── Shared Pagination Footer ──────────────────────────────────────────────────
function PaginationBar({ total, pageSize, page, onPageSize, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btnBase = { minWidth: 26, height: 26, border: "1px solid var(--border)", background: "white", fontSize: 10, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.1s", fontFamily: "var(--font-body)" };
  const activeBtn = { ...btnBase, background: "var(--navy)", color: "white", border: "1px solid var(--navy)", fontWeight: 700 };
  const disabledBtn = { ...btnBase, opacity: 0.35, cursor: "default" };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--border)", background: "#FAFAF9" }}>
      {/* Left: count */}
      <span style={{ fontSize: 10, color: "#9CA3AF" }}>
        {total === 0 ? "No results" : `${start}–${end} of ${total}`}
      </span>

      {/* Center: page buttons */}
      <div style={{ display: "flex", gap: 3 }}>
        <button onClick={() => onPage(page - 1)} disabled={page === 1} style={page === 1 ? disabledBtn : btnBase}
          onMouseEnter={e => { if (page > 1) e.currentTarget.style.borderColor = "var(--navy)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >‹</button>
        {pages.map((p, i) => p === "…"
          ? <span key={"ellipsis-"+i} style={{ minWidth: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#9CA3AF" }}>…</span>
          : <button key={p} onClick={() => onPage(p)} style={p === page ? activeBtn : btnBase}
              onMouseEnter={e => { if (p !== page) e.currentTarget.style.borderColor = "var(--navy)"; }}
              onMouseLeave={e => { if (p !== page) e.currentTarget.style.borderColor = "var(--border)"; }}
            >{p}</button>
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} style={page === totalPages ? disabledBtn : btnBase}
          onMouseEnter={e => { if (page < totalPages) e.currentTarget.style.borderColor = "var(--navy)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >›</button>
      </div>

      {/* Right: rows per page */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>Rows</span>
        <select value={pageSize} onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          style={{ border: "1px solid var(--border)", padding: "3px 6px", fontSize: 10, fontFamily: "var(--font-body)", color: "var(--navy)", background: "white", cursor: "pointer", outline: "none" }}
          onFocus={e => e.target.style.borderColor = "var(--navy)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        >
          {[10,15,25,30].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
}


function DesignerDashboard({ onSelectRequest, viewerRole }) {
  // ── Role gate ────────────────────────────────────────────────────────────────
  const allowedRoles = ["designer", "marketing_manager", "executive"];
  if (viewerRole && !allowedRoles.includes(viewerRole)) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:12 }}>
        <div style={{ fontSize:48, fontFamily:"var(--font-display)", fontWeight:300, color:"var(--border)" }}>403</div>
        <div style={{ fontSize:14, fontWeight:700, color:"var(--navy)", letterSpacing:"0.04em" }}>Access Restricted</div>
        <div style={{ fontSize:11, color:"#9CA3AF", textAlign:"center", maxWidth:280, lineHeight:1.6 }}>
          The Design Queue is only available to designers and marketing managers.
          If you need access, contact your office administrator.
        </div>
        <div style={{ marginTop:8, fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", padding:"6px 16px", background:"#F3F4F6", color:"#9CA3AF" }}>
          Role: {viewerRole}
        </div>
      </div>
    );
  }

  // ── State — declared before any derived values ────────────────────────────
  const [allRequests, setAllRequestsState] = useState(DESIGNER_ALL_REQUESTS);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });
  const [colFilters, setColFilters] = useState({});
  const [queueMode, setQueueMode] = useState("mine");
  const [reqPageSize, setReqPageSize] = useState(10);
  const [reqPage, setReqPage]         = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null);

  // ── Derived values — safe now that allRequests is declared above ──────────
  const myRequests   = allRequests.filter(r => r.designerName === "Lex Baum");
  const totalOpen    = allRequests.filter(r => !["completed","cancelled"].includes(r.status)).length;
  const unassigned   = allRequests.filter(r => r.status === "submitted");
  const inReview     = allRequests.filter(r => r.status === "review");

  const monthlyData = [
    { month: "Jan", team: 38, personal: 14 },
    { month: "Feb", team: 42, personal: 16 },
    { month: "Mar", team: 21, personal: 8 },
  ];
  const personalYearTotal  = monthlyData.reduce((s, m) => s + m.personal, 0);
  const teamYearTotal      = monthlyData.reduce((s, m) => s + m.team, 0);
  const personalDailyAvg   = (personalYearTotal / 67).toFixed(1);

  const revisionRate      = 18;
  const slaCompliance     = 94;
  const reqPerDesigner    = 6;
  const avgCompletionDays = 4;

  function handleManagerCancel(id, reason) {
    setAllRequestsState(rs => rs.map(r => r.id === id ? { ...r, status: "cancelled", cancelReason: reason, cancelledBy: "manager" } : r));
    setCancelTarget(null);
  }

  function handleSort(key, dir) {
    setSortConfig(key ? { key, dir } : { key: null, dir: "asc" });
  }
  function handleFilterChange(colKey, val) {
    setColFilters(prev => ({ ...prev, [colKey]: val }));
  }

  // 1. Queue mode filter
  const queueSource = queueMode === "mine" ? myRequests : allRequests;

  // 2. Fuzzy search
  const searchFiltered = search.trim() === "" ? queueSource : (() => {
    const q = search.trim().toLowerCase();
    const isIdSearch = q.startsWith("#");
    const idQuery = isIdSearch ? q.slice(1) : null;
    return queueSource.filter(req => {
      if (isIdSearch) return String(req.queueNumber).startsWith(idQuery);
      return (
        req.requesterName?.toLowerCase().includes(q) ||
        req.designerName?.toLowerCase().includes(q) ||
        req.materialType?.toLowerCase().includes(q) ||
        req.status?.toLowerCase().includes(q) ||
        req.title?.toLowerCase().includes(q) ||
        String(req.queueNumber).includes(q)
      );
    });
  })();

  // 2. Column filters
  const colFilteredRequests = searchFiltered.filter(req => {
    for (const [colKey, sel] of Object.entries(colFilters)) {
      if (!sel || sel === "all") continue;
      let val;
      if (colKey === "queueNumber") val = "#" + req.queueNumber;
      else if (colKey === "designerName") val = req.designerName || "Unassigned";
      else if (colKey === "sla") val = slaCountdown(req.slaDeadline).label;
      else if (colKey === "comments") val = req.messages.length > 0 ? "Has comments" : "No comments";
      else val = String(req[colKey] ?? "");
      if (!sel.has(val)) return false;
    }
    return true;
  });

  // 3. Sort
  const filteredRequests = [...colFilteredRequests].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const k = sortConfig.key;
    let av, bv;
    if (k === "queueNumber" || k === "comments") {
      av = k === "queueNumber" ? a.queueNumber : a.messages.length;
      bv = k === "queueNumber" ? b.queueNumber : b.messages.length;
      return sortConfig.dir === "asc" ? av - bv : bv - av;
    }
    if (k === "sla") {
      av = new Date(a.slaDeadline).getTime();
      bv = new Date(b.slaDeadline).getTime();
      return sortConfig.dir === "asc" ? av - bv : bv - av;
    }
    av = String(k === "designerName" ? (a.designerName || "Unassigned") : (a[k] ?? "")).toLowerCase();
    bv = String(k === "designerName" ? (b.designerName || "Unassigned") : (b[k] ?? "")).toLowerCase();
    return sortConfig.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  // Reset to page 1 when filters/sort change (effect-free: slice is enough)
  const pagedRequests = filteredRequests.slice((reqPage - 1) * reqPageSize, reqPage * reqPageSize);

  const COL_DEFS = [
    { label: "#",          colKey: "queueNumber"  },
    { label: "Requester",  colKey: "requesterName" },
    { label: "Designer",   colKey: "designerName"  },
    { label: "Material",   colKey: "materialType"  },
    { label: "Due",        colKey: "dueDate"       },
    { label: "SLA",        colKey: "sla"           },
    { label: "Status",     colKey: "status"        },
    { label: "Canva",      colKey: "canva"         },
    { label: "Comments",   colKey: "comments"      },
    { label: "",           colKey: "cancel"        },
  ];



  return (
    <div style={{ padding: "32px 0" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Marketing · Creative Director</div>
        <h2 style={{ fontSize: 28, fontFamily: "var(--font-display)", color: "var(--navy)", fontWeight: 300, margin: 0, letterSpacing: "-0.02em" }}>Operations Overview</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 260px", gap: 12, marginBottom: 32, alignItems: "stretch", height: 280 }}>
        <PiePanel allRequests={allRequests} unassigned={unassigned} inReview={inReview} totalOpen={totalOpen} />
        <BarChartPanel teamYearTotal={teamYearTotal} personalYearTotal={personalYearTotal} personalDailyAvg={personalDailyAvg} monthlyData={monthlyData} />
        <TeamHealthGrid revisionRate={revisionRate} slaCompliance={slaCompliance} reqPerDesigner={reqPerDesigner} avgCompletionDays={avgCompletionDays} />
      </div>

      {/* All Requests Table */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "visible", marginBottom: 32 }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--navy)", flexShrink: 0 }}>Requests</div>
            <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 3, padding: 2, gap: 1 }}>
              {[["mine","My Queue"],["all","All"]].map(([m,lbl]) => (
                <button key={m} onClick={() => setQueueMode(m)} style={{
                  background: queueMode === m ? "white" : "transparent",
                  color: queueMode === m ? "var(--navy)" : "#9CA3AF",
                  border: "none", borderRadius: 2, padding: "3px 10px",
                  fontSize: 10, fontWeight: queueMode === m ? 700 : 500,
                  cursor: "pointer", boxShadow: queueMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}>{lbl}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 320 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9CA3AF", pointerEvents: "none" }}>⌕</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, #id, material, status…"
                style={{
                  width: "100%", paddingLeft: 26, paddingRight: search ? 28 : 10,
                  paddingTop: 6, paddingBottom: 6,
                  border: "1px solid var(--border)", borderRadius: 3,
                  fontSize: 11, color: "var(--navy)", outline: "none",
                  background: search ? "white" : "#F9FAFB",
                  fontFamily: "var(--font-body)",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "var(--gold)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "#9CA3AF", padding: 0, lineHeight: 1,
                }}>✕</button>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>
              {filteredRequests.length === allRequests.length
                ? `${allRequests.length} total`
                : `${filteredRequests.length} of ${allRequests.length}`}
            </div>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {COL_DEFS.map(c => (
                <ColumnHeader
                  key={c.colKey}
                  label={c.label}
                  colKey={c.colKey}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  allRows={queueSource}
                  colFilters={colFilters}
                  onFilterChange={handleFilterChange}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 0 }}>
                <div style={{ padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, background: "white" }}>
                  <div style={{ width: 48, height: 48, border: "1px solid #E8E2D9", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F2" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4B9AA" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "var(--font-display)", marginBottom: 4 }}>No results found</div>
                    <div style={{ fontSize: 10, color: "#C4B9AA" }}>Try adjusting your filters or search term</div>
                  </div>
                </div>
              </td></tr>
            ) : pagedRequests.map((req) => {
              const sla = slaCountdown(req.slaDeadline);
              const lastComment = req.messages.length > 0 ? req.messages[req.messages.length - 1] : null;
              return (
                <DesignerTableRow key={req.id} req={req} sla={sla} lastComment={lastComment} onSelectRequest={onSelectRequest} onCancel={setCancelTarget} />
              );
            })}
          </tbody>
        </table>
        <PaginationBar total={filteredRequests.length} pageSize={reqPageSize} page={reqPage} onPageSize={setReqPageSize} onPage={p => setReqPage(Math.max(1, Math.min(p, Math.ceil(filteredRequests.length / reqPageSize))))} />
      </div>

      {cancelTarget && <CancelRequestModal req={cancelTarget} role="manager" onConfirm={handleManagerCancel} onClose={() => setCancelTarget(null)} />}

      {/* Intake Queue */}
      <IntakeQueueTable designers={INIT_DESIGNERS.filter(d => d.active)} />

      {/* My Queue */}
      <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF" }}>My Queue — {myRequests.length}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {myRequests.map(req => (
          <div key={req.id} onClick={() => onSelectRequest(req)} style={{
            background: "white", border: "1px solid var(--border)", borderRadius: 4,
            overflow: "hidden", cursor: "pointer", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
          >
            <div style={{
              height: 100, background: "linear-gradient(135deg, var(--navy) 0%, #2A4A7A 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, color: "var(--gold)",
            }}>
              {req.materialType.includes("Video") ? "▶" : req.materialType.includes("Social") ? "◈" : "⬜"}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", marginBottom: 4, lineHeight: 1.3 }}>{req.title}</div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 8 }}>{req.materialType}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Badge status={req.status} />
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>#{req.queueNumber}</span>
              </div>
              {(() => {
                const sla = slaCountdown(req.slaDeadline, req.status === "awaiting_materials");
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", marginBottom: 10, background: req.slaBreached ? "#FEF2F2" : sla.urgency === "critical" ? "#FEF2F2" : sla.urgency === "warning" ? "#FFFBEB" : "#F9F7F4", border: `1px solid ${req.slaBreached || sla.urgency === "critical" ? "#FCA5A5" : sla.urgency === "warning" ? "#FDE68A" : "var(--border)"}` }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={req.slaBreached || sla.urgency === "critical" ? "#EF4444" : sla.urgency === "warning" ? "#F59E0B" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    <span style={{ fontSize: 9, fontWeight: 700, color: req.slaBreached || sla.urgency === "critical" ? "#B91C1C" : sla.urgency === "warning" ? "#92400E" : "#6B7280", letterSpacing: "0.03em" }}>
                      {req.slaBreached ? "SLA BREACHED" : sla.label}
                    </span>
                  </div>
                );
              })()}
              <button
                onClick={e => { e.stopPropagation(); window.open("https://www.canva.com", "_blank"); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "#7B2FBE", border: "none", borderRadius: 3,
                  padding: "7px 10px", fontSize: 11, fontWeight: 700, color: "white",
                  cursor: "pointer", letterSpacing: "0.04em", transition: "opacity 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >⬡ Open in Canva</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EXECUTIVE VIEW ──────────────────────────────────────────────────────────

// Mock enriched data for exec view
const BACKLOG_TREND = [
  { week: "Oct W1", intake: 8,  completed: 9,  depth: 12 },
  { week: "Oct W2", intake: 9,  completed: 8,  depth: 13 },
  { week: "Oct W3", intake: 11, completed: 9,  depth: 15 },
  { week: "Oct W4", intake: 10, completed: 8,  depth: 17 },
  { week: "Nov W1", intake: 12, completed: 9,  depth: 20 },
  { week: "Nov W2", intake: 13, completed: 10, depth: 23 },
  { week: "Nov W3", intake: 11, completed: 9,  depth: 25 },
  { week: "Nov W4", intake: 14, completed: 10, depth: 29 },
  { week: "Dec W1", intake: 10, completed: 11, depth: 28 },
  { week: "Dec W2", intake: 9,  completed: 10, depth: 27 },
  { week: "Dec W3", intake: 7,  completed: 9,  depth: 25 },
  { week: "Dec W4", intake: 6,  completed: 8,  depth: 23 },
  { week: "Jan W1", intake: 13, completed: 9,  depth: 27 },
  { week: "Jan W2", intake: 14, completed: 10, depth: 31 },
  { week: "Jan W3", intake: 15, completed: 10, depth: 36 },
  { week: "Jan W4", intake: 16, completed: 11, depth: 41 },
  { week: "Feb W1", intake: 14, completed: 10, depth: 45 },
  { week: "Feb W2", intake: 15, completed: 11, depth: 49 },
  { week: "Feb W3", intake: 17, completed: 11, depth: 55 },
  { week: "Feb W4", intake: 16, completed: 10, depth: 61 },
  { week: "Mar W1", intake: 12, completed: 8,  depth: 65 },
];

const DEMAND_BY_OFFICE = [
  { office: "Scottsdale",      ytd: 89, mom: 21 },
  { office: "Paradise Valley", ytd: 61, mom: 14 },
  { office: "Sedona",          ytd: 34, mom: 8  },
  { office: "Tucson",          ytd: 27, mom: 6  },
  { office: "Flagstaff",       ytd: 14, mom: 3  },
];

const CYCLE_TIME_BY_MATERIAL = [
  { material: "Video",    waitDays: 3.2, prodDays: 7.1, reviewDays: 1.8, total: 12.1 },
  { material: "Report",   waitDays: 2.1, prodDays: 4.8, reviewDays: 1.4, total: 8.3  },
  { material: "Brochure", waitDays: 1.9, prodDays: 3.6, reviewDays: 1.2, total: 6.7  },
  { material: "Social",   waitDays: 1.4, prodDays: 2.3, reviewDays: 0.9, total: 4.6  },
  { material: "Flyer",    waitDays: 1.1, prodDays: 1.8, reviewDays: 0.7, total: 3.6  },
];

const STAFFING_MODEL = [
  { material: "Flyer",      avgHrs: 3,  monthlyVol: 18, totalHrs: 54,  designerSlots: 1.4 },
  { material: "Social Pack",avgHrs: 6,  monthlyVol: 12, totalHrs: 72,  designerSlots: 1.8 },
  { material: "Report",     avgHrs: 12, monthlyVol: 9,  totalHrs: 108, designerSlots: 2.7 },
  { material: "Video",      avgHrs: 20, monthlyVol: 6,  totalHrs: 120, designerSlots: 3.0 },
  { material: "Brochure",   avgHrs: 8,  monthlyVol: 4,  totalHrs: 32,  designerSlots: 0.8 },
];

const REVISION_DATA = [
  { material: "Video",    revRate: 42, avgRounds: 2.8, hrsLost: 18.4 },
  { material: "Report",   revRate: 31, avgRounds: 2.1, hrsLost: 9.6  },
  { material: "Social",   revRate: 22, avgRounds: 1.6, hrsLost: 4.2  },
  { material: "Brochure", revRate: 18, avgRounds: 1.4, hrsLost: 3.8  },
  { material: "Flyer",    revRate: 11, avgRounds: 1.2, hrsLost: 1.4  },
];

const TREND_PERIODS = ["3M", "6M", "1Y"];

function ExecKPICard({ label, value, sub, accent, delta, deltaDir }) {
  return (
    <div style={{
      background: "white", border: "1px solid var(--border)", borderRadius: 4,
      padding: "18px 20px", borderTop: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 300, fontFamily: "var(--font-display)", color: accent, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</div>}
      {delta !== undefined && (
        <div style={{ fontSize: 11, fontWeight: 600, color: deltaDir === "bad" ? "#DC2626" : "#15803D", marginTop: 4 }}>
          {deltaDir === "bad" ? "▲" : "▼"} {delta} vs last period
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 18, fontFamily: "var(--font-display)", color: "var(--navy)", fontWeight: 400, letterSpacing: "-0.01em" }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ExportBar({ onExport, generating }) {
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-03-08");
  return (
    <div style={{
      background: "white", border: "1px solid var(--border)", borderRadius: 4,
      padding: "12px 20px", display: "flex", alignItems: "center", gap: 16,
      marginBottom: 28, flexWrap: "wrap",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF" }}>Report Period</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "5px 8px", fontSize: 11, color: "var(--navy)", fontFamily: "var(--font-body)", outline: "none" }} />
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "5px 8px", fontSize: 11, color: "var(--navy)", fontFamily: "var(--font-body)", outline: "none" }} />
      </div>
      <div style={{ flex: 1 }} />
      {generating ? (
        <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>⏳ Generating report…</div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onExport("excel")} style={{
            background: "white", border: "1px solid var(--border)", borderRadius: 3,
            padding: "7px 16px", fontSize: 11, fontWeight: 700, color: "var(--navy)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>📊 Export Excel</button>
          <button onClick={() => onExport("pdf")} style={{
            background: "var(--navy)", border: "none", borderRadius: 3,
            padding: "7px 16px", fontSize: 11, fontWeight: 700, color: "white",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>📄 Export PDF</button>
        </div>
      )}
    </div>
  );
}

function BacklogTrendPanel({ period }) {
  const data = period === "3M" ? BACKLOG_TREND.slice(-12)
    : period === "6M" ? BACKLOG_TREND.slice(-18)
    : BACKLOG_TREND;

  const latestDepth = data[data.length - 1].depth;
  const earliestDepth = data[0].depth;
  const depthGrowth = latestDepth - earliestDepth;

  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <SectionHeader
            title="Backlog Trend — Demand vs. Capacity"
            sub="Weekly intake rate, completion rate, and running queue depth"
          />
          {depthGrowth > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 3, padding: "4px 10px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>▲ Queue grew +{depthGrowth} requests this period — team is understaffed</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
          {[["#0F2B4F","Intake"],["#15803D","Completed"],["#DC2626","Queue Depth"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 20, height: 2, background: c, borderRadius: 1 }} />
              <span style={{ color: "#6B7280" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={Math.floor(data.length / 8)} />
          <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={{ fontSize: 11, border: "1px solid var(--border)", borderRadius: 3 }} />
          <Line type="monotone" dataKey="intake" stroke="#0F2B4F" strokeWidth={2} dot={false} name="Intake" />
          <Line type="monotone" dataKey="completed" stroke="#15803D" strokeWidth={2} dot={false} name="Completed" strokeDasharray="4 2" />
          <Line type="monotone" dataKey="depth" stroke="#DC2626" strokeWidth={2.5} dot={false} name="Queue Depth" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DemandByOfficePanel() {
  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, padding: "20px 24px" }}>
      <SectionHeader title="Demand by Office" sub="Requests submitted YTD and this month — shows demand is brokerage-wide, not one team" />
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Office", "YTD Requests", "This Month", "MoM Trend", "% of Total"].map(h => (
              <th key={h} style={{ padding: "8px 14px", textAlign: h === "Office" ? "left" : "right", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "1px solid var(--border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DEMAND_BY_OFFICE.map((row, i) => {
            const total = DEMAND_BY_OFFICE.reduce((s, r) => s + r.ytd, 0);
            const pct = ((row.ytd / total) * 100).toFixed(0);
            return (
              <tr key={row.office} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--navy)" }}>{row.office}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-display)", fontSize: 15, color: "var(--navy)" }}>{row.ytd}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: "#6B7280" }}>{row.mom}</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 60, height: 4, background: "#F3F4F6", borderRadius: 2 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--navy)", borderRadius: 2 }} />
                    </div>
                  </div>
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "var(--gold)" }}>{pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CycleTimePanel() {
  const maxTotal = Math.max(...CYCLE_TIME_BY_MATERIAL.map(r => r.total));
  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, padding: "20px 24px" }}>
      <SectionHeader title="Cycle Time by Material Type" sub="Average days per stage, derived from stepper timestamps — basis for FTE calculation" />
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {[["#0F2B4F","Queue Wait"],["#C9A96E","Production"],["#7C3AED","Review"]].map(([c,l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B7280" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
          </div>
        ))}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Material", "Queue Wait", "Production", "Review", "Total Days", "vs. SLA"].map(h => (
              <th key={h} style={{ padding: "8px 14px", textAlign: h === "Material" ? "left" : "right", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "1px solid var(--border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CYCLE_TIME_BY_MATERIAL.map((row, i) => {
            const slaThreshold = row.material === "Video" ? 10 : row.material === "Report" ? 7 : 5;
            const overSLA = row.total > slaThreshold;
            return (
              <tr key={row.material} style={{ borderBottom: "1px solid var(--border)", background: overSLA ? "#FFF5F5" : i % 2 === 0 ? "white" : "#FAFAFA" }}>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--navy)" }}>{row.material}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: "#6B7280" }}>{row.waitDays}d</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: "#6B7280" }}>{row.prodDays}d</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: "#6B7280" }}>{row.reviewDays}d</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: "#F3F4F6", borderRadius: 3 }}>
                      <div style={{ width: `${(row.total / maxTotal) * 100}%`, height: "100%", background: overSLA ? "#DC2626" : "var(--navy)", borderRadius: 3 }} />
                    </div>
                    <span style={{ fontWeight: 700, color: overSLA ? "#DC2626" : "var(--navy)", minWidth: 32, textAlign: "right" }}>{row.total}d</span>
                  </div>
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: overSLA ? "#DC2626" : "#15803D" }}>
                    {overSLA ? `+${(row.total - slaThreshold).toFixed(1)}d over` : "Within SLA"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RevisionCostPanel() {
  const totalHrsLost = REVISION_DATA.reduce((s, r) => s + r.hrsLost, 0).toFixed(1);
  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <SectionHeader title="Revision Cost Analysis" sub="Revision cycles are a hidden capacity drain — not a quality failure" />
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 3, padding: "8px 14px", textAlign: "right" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#DC2626", marginBottom: 2 }}>Total Hours Lost / Month</div>
          <div style={{ fontSize: 24, fontWeight: 300, fontFamily: "var(--font-display)", color: "#DC2626" }}>{totalHrsLost}h</div>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Material", "Revision Rate", "Avg Rounds", "Est. Hrs Lost/Mo", "Impact"].map(h => (
              <th key={h} style={{ padding: "8px 14px", textAlign: h === "Material" ? "left" : "right", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "1px solid var(--border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {REVISION_DATA.map((row, i) => {
            const impact = row.revRate > 35 ? "Critical" : row.revRate > 20 ? "High" : "Moderate";
            const impactColor = row.revRate > 35 ? "#DC2626" : row.revRate > 20 ? "#D97706" : "#9CA3AF";
            return (
              <tr key={row.material} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--navy)" }}>{row.material}</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 5, background: "#F3F4F6", borderRadius: 2 }}>
                      <div style={{ width: `${row.revRate}%`, height: "100%", background: impactColor, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontWeight: 700, color: impactColor }}>{row.revRate}%</span>
                  </div>
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: "#6B7280" }}>{row.avgRounds}x</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "var(--navy)", fontFamily: "var(--font-display)", fontSize: 14 }}>{row.hrsLost}h</td>
                <td style={{ padding: "10px 14px", textAlign: "right" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: impactColor, background: impactColor + "15", border: `1px solid ${impactColor}30`, padding: "2px 8px", borderRadius: 2 }}>{impact}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StaffingModelPanel() {
  const DESIGNER_HOURS_PER_MONTH = 120; // 30hrs/wk * ~4wks - meetings/admin
  const DESIGNER_COUNT = 2;
  const totalHrsRequired = STAFFING_MODEL.reduce((s, r) => s + r.totalHrs, 0);
  const totalSlotsRequired = (totalHrsRequired / DESIGNER_HOURS_PER_MONTH).toFixed(1);
  const gap = (totalSlotsRequired - DESIGNER_COUNT).toFixed(1);
  const utilizationPct = Math.round((totalHrsRequired / (DESIGNER_COUNT * DESIGNER_HOURS_PER_MONTH)) * 100);

  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <SectionHeader title="Staffing Model — The Hiring Case" sub={`Current team: ${DESIGNER_COUNT} designers × ${DESIGNER_HOURS_PER_MONTH}h available/mo = ${DESIGNER_COUNT * DESIGNER_HOURS_PER_MONTH}h capacity`} />
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 3, padding: "10px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#DC2626", marginBottom: 2 }}>Team Utilization</div>
            <div style={{ fontSize: 28, fontWeight: 300, fontFamily: "var(--font-display)", color: "#DC2626" }}>{utilizationPct}%</div>
          </div>
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 3, padding: "10px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#DC2626", marginBottom: 2 }}>FTE Gap</div>
            <div style={{ fontSize: 28, fontWeight: 300, fontFamily: "var(--font-display)", color: "#DC2626" }}>+{gap}</div>
          </div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Material Type", "Avg Hrs / Request", "Monthly Volume", "Hrs Required", "FTE Equivalent"].map(h => (
              <th key={h} style={{ padding: "8px 14px", textAlign: h === "Material Type" ? "left" : "right", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "1px solid var(--border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STAFFING_MODEL.map((row, i) => (
            <tr key={row.material} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
              <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--navy)" }}>{row.material}</td>
              <td style={{ padding: "10px 14px", textAlign: "right", color: "#6B7280" }}>{row.avgHrs}h</td>
              <td style={{ padding: "10px 14px", textAlign: "right", color: "#6B7280" }}>{row.monthlyVol}</td>
              <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "var(--navy)" }}>{row.totalHrs}h</td>
              <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "var(--gold)", fontFamily: "var(--font-display)", fontSize: 14 }}>{row.designerSlots}</td>
            </tr>
          ))}
          <tr style={{ background: "#F9FAFB", borderTop: "2px solid var(--border)" }}>
            <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--navy)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>Total Required</td>
            <td />
            <td />
            <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#DC2626", fontSize: 14 }}>{totalHrsRequired}h</td>
            <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#DC2626", fontFamily: "var(--font-display)", fontSize: 16 }}>{totalSlotsRequired}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ background: "#F9FAFB", border: "1px solid var(--border)", borderRadius: 3, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          <strong>Bottom line:</strong> The marketing team requires <strong style={{ color: "#DC2626" }}>{totalSlotsRequired} FTE designers</strong> to handle current demand at standard SLA. 
          Current headcount is <strong>{DESIGNER_COUNT}</strong>, creating a <strong style={{ color: "#DC2626" }}>{gap} FTE gap</strong> and {utilizationPct}% utilization — 
          explaining SLA breaches, rush escalations, and the {BACKLOG_TREND[BACKLOG_TREND.length-1].depth}-request queue backlog.
          <span style={{ color: "#9CA3AF" }}> Monday.com does not surface this data.</span>
        </div>
      </div>
    </div>
  );
}

function ExecutiveView() {
  const [trendPeriod, setTrendPeriod] = useState("6M");
  const [generating, setGenerating] = useState(false);

  function handleExport(type) {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2200);
  }

  const queueDepth = BACKLOG_TREND[BACKLOG_TREND.length - 1].depth;
  const mtdIntake = BACKLOG_TREND.slice(-4).reduce((s, w) => s + w.intake, 0);
  const mtdComplete = BACKLOG_TREND.slice(-4).reduce((s, w) => s + w.completed, 0);
  const avgWaitDays = (CYCLE_TIME_BY_MATERIAL.reduce((s, r) => s + r.waitDays, 0) / CYCLE_TIME_BY_MATERIAL.length).toFixed(1);

  return (
    <div style={{ padding: "32px 0" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Marketing · Executive Overview</div>
        <h2 style={{ fontSize: 28, fontFamily: "var(--font-display)", color: "var(--navy)", fontWeight: 300, margin: 0, letterSpacing: "-0.02em" }}>Operations Report</h2>
      </div>

      <ExportBar onExport={handleExport} generating={generating} />

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        <ExecKPICard label="Current Queue Depth" value={queueDepth} sub="open requests in backlog" accent="#DC2626" delta="12 vs last month" deltaDir="bad" />
        <ExecKPICard label="MTD Intake" value={mtdIntake} sub={`vs ${mtdComplete} completed`} accent="var(--navy)" delta="8% vs last month" deltaDir="bad" />
        <ExecKPICard label="Avg Queue Wait" value={`${avgWaitDays}d`} sub="submission → first assigned" accent="#D97706" delta="0.4d vs last month" deltaDir="bad" />
        <ExecKPICard label="Team Utilization" value="186%" sub="2 designers, 3.7 FTE needed" accent="#DC2626" />
      </div>

      {/* Backlog Trend */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 3, padding: 2, gap: 1 }}>
            {TREND_PERIODS.map(p => (
              <button key={p} onClick={() => setTrendPeriod(p)} style={{
                background: trendPeriod === p ? "white" : "transparent",
                color: trendPeriod === p ? "var(--navy)" : "#9CA3AF",
                border: "none", borderRadius: 2, padding: "3px 12px",
                fontSize: 10, fontWeight: trendPeriod === p ? 700 : 500,
                cursor: "pointer", boxShadow: trendPeriod === p ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s",
              }}>{p}</button>
            ))}
          </div>
        </div>
        <BacklogTrendPanel period={trendPeriod} />
      </div>

      {/* Demand + Cycle Time side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <DemandByOfficePanel />
        <CycleTimePanel />
      </div>

      {/* Revision Cost */}
      <div style={{ marginBottom: 20 }}>
        <RevisionCostPanel />
      </div>

      {/* Staffing Model */}
      <StaffingModelPanel />
    </div>
  );
}


// ─── EXECUTIVE SETTINGS ───────────────────────────────────────────────────────

const SETTINGS_TABS = [
  { key: "materials",    label: "Materials & SLAs",   icon: "📋" },
  { key: "rush",         label: "Rush Fees",           icon: "⚡" },
  { key: "fields",       label: "Field Config",        icon: "🔧" },
  { key: "designers",    label: "Designer Roster",     icon: "👥" },
  { key: "offices",      label: "Offices",             icon: "🏢" },
  { key: "notifications",label: "Notifications",       icon: "🔔" },
  { key: "assign",       label: "Quick Assign",        icon: "↗" },
];

const INIT_MATERIALS = [
  { id: 1, name: "Flyer",        standardDays: 5,  rushDays: 2, active: true  },
  { id: 2, name: "Social Pack",  standardDays: 7,  rushDays: 3, active: true  },
  { id: 3, name: "Report",       standardDays: 10, rushDays: 5, active: true  },
  { id: 4, name: "Video",        standardDays: 14, rushDays: 7, active: true  },
  { id: 5, name: "Brochure",     standardDays: 10, rushDays: 4, active: true  },
  { id: 6, name: "Email Blast",  standardDays: 3,  rushDays: 1, active: false },
];

const INIT_RUSH_FEES = [
  { materialId: 1, fee: 75,  requiresApproval: false, approver: "Designer Manager" },
  { materialId: 2, fee: 100, requiresApproval: true,  approver: "CMO"              },
  { materialId: 3, fee: 150, requiresApproval: true,  approver: "CMO"              },
  { materialId: 4, fee: 250, requiresApproval: true,  approver: "CMO"              },
  { materialId: 5, fee: 125, requiresApproval: true,  approver: "CMO"              },
];

const ALL_FIELDS = ["Title","MLS ID","Listing Address","Due Date","Brief / Notes","Reference Files","Preferred Designer","Office","Rush Flag","Target Audience","Brand Guidelines","Color Preferences"];

const INIT_FIELD_CONFIG = {
  1: { "Title":"required","MLS ID":"optional","Listing Address":"optional","Due Date":"required","Brief / Notes":"required","Reference Files":"optional","Preferred Designer":"optional","Office":"required","Rush Flag":"optional","Target Audience":"hidden","Brand Guidelines":"hidden","Color Preferences":"optional" },
  2: { "Title":"required","MLS ID":"hidden","Listing Address":"hidden","Due Date":"required","Brief / Notes":"required","Reference Files":"optional","Preferred Designer":"optional","Office":"required","Rush Flag":"optional","Target Audience":"required","Brand Guidelines":"required","Color Preferences":"required" },
  3: { "Title":"required","MLS ID":"optional","Listing Address":"optional","Due Date":"required","Brief / Notes":"required","Reference Files":"required","Preferred Designer":"optional","Office":"required","Rush Flag":"optional","Target Audience":"required","Brand Guidelines":"optional","Color Preferences":"hidden" },
  4: { "Title":"required","MLS ID":"optional","Listing Address":"optional","Due Date":"required","Brief / Notes":"required","Reference Files":"required","Preferred Designer":"required","Office":"required","Rush Flag":"optional","Target Audience":"required","Brand Guidelines":"required","Color Preferences":"optional" },
  5: { "Title":"required","MLS ID":"optional","Listing Address":"optional","Due Date":"required","Brief / Notes":"required","Reference Files":"optional","Preferred Designer":"optional","Office":"required","Rush Flag":"optional","Target Audience":"optional","Brand Guidelines":"optional","Color Preferences":"required" },
};

const INIT_DESIGNERS = [
  { id: 1, name: "Lex Baum",   role: "Creative Director", hoursPerWeek: 30, active: true  },
  { id: 2, name: "Marcus Webb",  role: "Designer",          hoursPerWeek: 40, active: true  },
  { id: 3, name: "Priya Sharma", role: "Designer",          hoursPerWeek: 20, active: false },
];

const INIT_OFFICES = [
  { id: 1, name: "Scottsdale",      region: "Metro Phoenix", active: true  },
  { id: 2, name: "Paradise Valley", region: "Metro Phoenix", active: true  },
  { id: 3, name: "Sedona",          region: "Northern AZ",   active: true  },
  { id: 4, name: "Tucson",          region: "Southern AZ",   active: true  },
  { id: 5, name: "Flagstaff",       region: "Northern AZ",   active: true  },
  { id: 6, name: "Cave Creek",      region: "Metro Phoenix", active: false },
];

const NOTIF_RULES = [
  { event: "SLA Breach",       designer: true,  designerMgr: true,  cmo: false, email: true  },
  { event: "SLA Warning (2h)", designer: true,  designerMgr: false, cmo: false, email: false },
  { event: "Rush Submitted",   designer: false, designerMgr: true,  cmo: true,  email: true  },
  { event: "Rush Approved",    designer: true,  designerMgr: true,  cmo: false, email: true  },
  { event: "Revision Cycle",   designer: true,  designerMgr: false, cmo: false, email: false },
  { event: "Weekly Digest",    designer: false, designerMgr: true,  cmo: true,  email: true  },
  { event: "New Unassigned",   designer: false, designerMgr: true,  cmo: false, email: false },
];

function SettingsToggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 36, height: 20, borderRadius: 10, cursor: "pointer", flexShrink: 0,
      background: value ? "var(--navy)" : "#D1D5DB", transition: "background 0.2s",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 2, left: value ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%", background: "white",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

function SaveBar({ onSave }) {
  const [saved, setSaved] = useState(false);
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000); onSave && onSave(); }
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 20, borderTop: "1px solid var(--border)", marginTop: 24 }}>
      <button style={{ background: "none", border: "1px solid var(--border)", borderRadius: 3, padding: "8px 18px", fontSize: 11, fontWeight: 700, color: "#6B7280", cursor: "pointer" }}>Discard</button>
      <button onClick={handleSave} style={{ background: saved ? "#15803D" : "var(--navy)", border: "none", borderRadius: 3, padding: "8px 20px", fontSize: 11, fontWeight: 700, color: "white", cursor: "pointer", transition: "background 0.2s" }}>
        {saved ? "✓ Saved" : "Save Changes"}
      </button>
    </div>
  );
}

function MaterialsPanel() {
  const [rows, setRows] = useState(INIT_MATERIALS);
  function update(id, field, val) { setRows(r => r.map(row => row.id === id ? { ...row, [field]: val } : row)); }
  function addRow() { setRows(r => [...r, { id: Date.now(), name: "", standardDays: 7, rushDays: 3, active: true }]); }
  function removeRow(id) { setRows(r => r.filter(row => row.id !== id)); }
  return (
    <div>
      <p style={{ fontSize: 12, color: "#6B7280", marginTop: 0, marginBottom: 20 }}>Define available material types and their SLA windows. Standard SLA = minimum days for normal orders. Rush SLA = minimum days for rush orders.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Material Name","Standard SLA (days)","Rush SLA (days)","Active",""].map(h => (
              <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "1px solid var(--border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} style={{ borderBottom: "1px solid var(--border)", opacity: row.active ? 1 : 0.5 }}>
              <td style={{ padding: "10px 14px" }}>
                <input value={row.name} onChange={e => update(row.id, "name", e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "6px 10px", fontSize: 12, width: 160, fontFamily: "var(--font-body)", outline: "none", color: "var(--navy)" }} />
              </td>
              <td style={{ padding: "10px 14px" }}>
                <input type="number" min={1} max={60} value={row.standardDays} onChange={e => update(row.id, "standardDays", +e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "6px 10px", fontSize: 12, width: 70, fontFamily: "var(--font-body)", outline: "none", color: "var(--navy)" }} />
              </td>
              <td style={{ padding: "10px 14px" }}>
                <input type="number" min={1} max={30} value={row.rushDays} onChange={e => update(row.id, "rushDays", +e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "6px 10px", fontSize: 12, width: 70, fontFamily: "var(--font-body)", outline: "none", color: "var(--navy)" }} />
              </td>
              <td style={{ padding: "10px 14px" }}><SettingsToggle value={row.active} onChange={v => update(row.id, "active", v)} /></td>
              <td style={{ padding: "10px 14px" }}>
                <button onClick={() => removeRow(row.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} style={{ marginTop: 12, background: "none", border: "1px dashed var(--border)", borderRadius: 3, padding: "8px 16px", fontSize: 11, fontWeight: 600, color: "#9CA3AF", cursor: "pointer", width: "100%" }}>+ Add Material Type</button>
      <SaveBar />
    </div>
  );
}

function RushFeesPanel() {
  const [fees, setFees] = useState(INIT_RUSH_FEES);
  function update(matId, field, val) { setFees(f => f.map(r => r.materialId === matId ? { ...r, [field]: val } : r)); }
  const matMap = Object.fromEntries(INIT_MATERIALS.map(m => [m.id, m.name]));
  return (
    <div>
      <p style={{ fontSize: 12, color: "#6B7280", marginTop: 0, marginBottom: 20 }}>Set rush fee amounts per material type. Fees are charged to the requesting agent's office. Approval requirement locks the request until a manager signs off.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Material","Rush Fee ($)","Requires Approval","Approver"].map(h => (
              <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "1px solid var(--border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fees.map(row => (
            <tr key={row.materialId} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--navy)" }}>{matMap[row.materialId]}</td>
              <td style={{ padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "#9CA3AF" }}>$</span>
                  <input type="number" min={0} value={row.fee} onChange={e => update(row.materialId, "fee", +e.target.value)}
                    style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "6px 10px", fontSize: 12, width: 80, fontFamily: "var(--font-body)", outline: "none", color: "var(--navy)" }} />
                </div>
              </td>
              <td style={{ padding: "10px 14px" }}><SettingsToggle value={row.requiresApproval} onChange={v => update(row.materialId, "requiresApproval", v)} /></td>
              <td style={{ padding: "10px 14px" }}>
                <select value={row.approver} onChange={e => update(row.materialId, "approver", e.target.value)}
                  disabled={!row.requiresApproval}
                  style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "6px 10px", fontSize: 12, fontFamily: "var(--font-body)", outline: "none", color: row.requiresApproval ? "var(--navy)" : "#9CA3AF", background: "white", opacity: row.requiresApproval ? 1 : 0.4 }}>
                  <option>CMO</option><option>Designer Manager</option><option>Office Manager</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <SaveBar />
    </div>
  );
}

function FieldConfigPanel() {
  const [activeMat, setActiveMat] = useState(1);
  const [config, setConfig] = useState(INIT_FIELD_CONFIG);
  const STATES = ["required","optional","hidden"];
  const STATE_COLORS = { required: "#0F2B4F", optional: "#C9A96E", hidden: "#D1D5DB" };
  function cycleField(field) {
    setConfig(prev => {
      const cur = prev[activeMat]?.[field] || "hidden";
      const next = STATES[(STATES.indexOf(cur) + 1) % STATES.length];
      return { ...prev, [activeMat]: { ...prev[activeMat], [field]: next } };
    });
  }
  const matConfig = config[activeMat] || {};
  return (
    <div>
      <p style={{ fontSize: 12, color: "#6B7280", marginTop: 0, marginBottom: 16 }}>Configure which fields appear on the submission form for each material type. Click a field badge to cycle: Required → Optional → Hidden.</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {INIT_MATERIALS.filter(m => m.active).map(m => (
          <button key={m.id} onClick={() => setActiveMat(m.id)} style={{
            padding: "6px 14px", borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
            background: activeMat === m.id ? "var(--navy)" : "white",
            color: activeMat === m.id ? "white" : "var(--navy)",
            border: `1px solid ${activeMat === m.id ? "var(--navy)" : "var(--border)"}`,
          }}>{m.name}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {ALL_FIELDS.map(field => {
          const state = matConfig[field] || "hidden";
          const color = STATE_COLORS[state];
          return (
            <div key={field} onClick={() => cycleField(field)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", border: `1px solid ${color}40`, borderRadius: 3,
              cursor: "pointer", background: color + "08", transition: "all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = color}
              onMouseLeave={e => e.currentTarget.style.borderColor = color + "40"}
            >
              <span style={{ fontSize: 12, color: "var(--navy)", fontWeight: 500 }}>{field}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color, padding: "2px 8px", borderRadius: 2, background: color + "18", border: `1px solid ${color}30` }}>{state}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 16, fontSize: 11 }}>
        {Object.entries(STATE_COLORS).map(([s, c]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, color: "#6B7280" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            <span style={{ textTransform: "capitalize" }}>{s}</span>
          </div>
        ))}
      </div>
      <SaveBar />
    </div>
  );
}

function DesignerRosterPanel() {
  const [designers, setDesigners] = useState(INIT_DESIGNERS);
  function update(id, field, val) { setDesigners(d => d.map(r => r.id === id ? { ...r, [field]: val } : r)); }
  function addDesigner() { setDesigners(d => [...d, { id: Date.now(), name: "", role: "Designer", hoursPerWeek: 40, active: true }]); }
  const totalCapacity = designers.filter(d => d.active).reduce((s, d) => s + d.hoursPerWeek, 0);
  return (
    <div>
      <p style={{ fontSize: 12, color: "#6B7280", marginTop: 0, marginBottom: 8 }}>Designer capacity feeds directly into the staffing model on the Executive Report. Hours/week = billable creative hours after meetings and admin.</p>
      <div style={{ display: "inline-flex", gap: 8, alignItems: "center", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 3, padding: "6px 14px", marginBottom: 20, fontSize: 12 }}>
        <span style={{ color: "#15803D", fontWeight: 700 }}>Total active capacity: {totalCapacity}h/week</span>
        <span style={{ color: "#9CA3AF" }}>·</span>
        <span style={{ color: "#6B7280" }}>{Math.round(totalCapacity * 4.3)}h/month</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Name","Role","Hrs/Week","Active",""].map(h => (
              <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "1px solid var(--border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {designers.map(d => (
            <tr key={d.id} style={{ borderBottom: "1px solid var(--border)", opacity: d.active ? 1 : 0.5 }}>
              <td style={{ padding: "10px 14px" }}>
                <input value={d.name} onChange={e => update(d.id, "name", e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "6px 10px", fontSize: 12, width: 160, fontFamily: "var(--font-body)", outline: "none", color: "var(--navy)" }} />
              </td>
              <td style={{ padding: "10px 14px" }}>
                <select value={d.role} onChange={e => update(d.id, "role", e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "6px 10px", fontSize: 12, fontFamily: "var(--font-body)", outline: "none", color: "var(--navy)", background: "white" }}>
                  <option>Creative Director</option><option>Designer</option><option>Senior Designer</option><option>Intern</option>
                </select>
              </td>
              <td style={{ padding: "10px 14px" }}>
                <input type="number" min={1} max={60} value={d.hoursPerWeek} onChange={e => update(d.id, "hoursPerWeek", +e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "6px 10px", fontSize: 12, width: 70, fontFamily: "var(--font-body)", outline: "none", color: "var(--navy)" }} />
              </td>
              <td style={{ padding: "10px 14px" }}><SettingsToggle value={d.active} onChange={v => update(d.id, "active", v)} /></td>
              <td style={{ padding: "10px 14px" }}>
                <button onClick={() => setDesigners(ds => ds.filter(r => r.id !== d.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16, padding: 0 }}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addDesigner} style={{ marginTop: 12, background: "none", border: "1px dashed var(--border)", borderRadius: 3, padding: "8px 16px", fontSize: 11, fontWeight: 600, color: "#9CA3AF", cursor: "pointer", width: "100%" }}>+ Add Designer</button>
      <SaveBar />
    </div>
  );
}

function OfficesPanel() {
  const [offices, setOffices] = useState(INIT_OFFICES);
  function update(id, field, val) { setOffices(o => o.map(r => r.id === id ? { ...r, [field]: val } : r)); }
  function addOffice() { setOffices(o => [...o, { id: Date.now(), name: "", region: "", active: true }]); }
  return (
    <div>
      <p style={{ fontSize: 12, color: "#6B7280", marginTop: 0, marginBottom: 20 }}>Offices appear in the demand breakdown on the Executive Report and as a field option on request forms.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Office Name","Region","Active",""].map(h => (
              <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "1px solid var(--border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {offices.map(o => (
            <tr key={o.id} style={{ borderBottom: "1px solid var(--border)", opacity: o.active ? 1 : 0.5 }}>
              <td style={{ padding: "10px 14px" }}>
                <input value={o.name} onChange={e => update(o.id, "name", e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "6px 10px", fontSize: 12, width: 180, fontFamily: "var(--font-body)", outline: "none", color: "var(--navy)" }} />
              </td>
              <td style={{ padding: "10px 14px" }}>
                <input value={o.region} onChange={e => update(o.id, "region", e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "6px 10px", fontSize: 12, width: 160, fontFamily: "var(--font-body)", outline: "none", color: "var(--navy)" }} />
              </td>
              <td style={{ padding: "10px 14px" }}><SettingsToggle value={o.active} onChange={v => update(o.id, "active", v)} /></td>
              <td style={{ padding: "10px 14px" }}>
                <button onClick={() => setOffices(os => os.filter(r => r.id !== o.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16, padding: 0 }}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addOffice} style={{ marginTop: 12, background: "none", border: "1px dashed var(--border)", borderRadius: 3, padding: "8px 16px", fontSize: 11, fontWeight: 600, color: "#9CA3AF", cursor: "pointer", width: "100%" }}>+ Add Office</button>
      <SaveBar />
    </div>
  );
}

function NotificationsPanel() {
  const [rules, setRules] = useState(NOTIF_RULES);
  function toggle(idx, field) { setRules(r => r.map((row, i) => i === idx ? { ...row, [field]: !row[field] } : row)); }
  return (
    <div>
      <p style={{ fontSize: 12, color: "#6B7280", marginTop: 0, marginBottom: 20 }}>Control who receives alerts for each event. Email column sends an external email in addition to in-app notifications.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#F9FAFB" }}>
            {["Event","Designer","Designer Mgr","CMO","Email"].map(h => (
              <th key={h} style={{ padding: "9px 14px", textAlign: h === "Event" ? "left" : "center", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "1px solid var(--border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map((row, i) => (
            <tr key={row.event} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--navy)" }}>{row.event}</td>
              {[["designer","#0F2B4F"],["designerMgr","#C9A96E"],["cmo","#7C3AED"],["email","#15803D"]].map(([field, color]) => (
                <td key={field} style={{ padding: "10px 14px", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div onClick={() => toggle(i, field)} style={{
                      width: 20, height: 20, borderRadius: 3, cursor: "pointer",
                      background: row[field] ? color : "white",
                      border: `2px solid ${row[field] ? color : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {row[field] && <span style={{ fontSize: 11, color: "white", lineHeight: 1, fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <SaveBar />
    </div>
  );
}

function QuickAssignPanel({ onSelectRequest }) {
  const unassigned = DESIGNER_ALL_REQUESTS.filter(r => !r.designerName && !["completed","cancelled"].includes(r.status));
  const [assignments, setAssignments] = useState({});
  const [saved, setSaved] = useState({});
  function assign(reqId, designerName) { setAssignments(a => ({ ...a, [reqId]: designerName })); }
  function confirmAssign(req) {
    setSaved(s => ({ ...s, [req.id]: true }));
    setTimeout(() => setSaved(s => ({ ...s, [req.id]: false })), 2000);
  }
  return (
    <div>
      <p style={{ fontSize: 12, color: "#6B7280", marginTop: 0, marginBottom: 20 }}>
        {unassigned.length === 0 ? "No unassigned requests — queue is clear." : `${unassigned.length} unassigned request${unassigned.length > 1 ? "s" : ""} waiting for assignment.`}
      </p>
      {unassigned.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#F9FAFB" }}>
              {["#","Title","Material","Submitted","Rush","Assign To",""].map(h => (
                <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {unassigned.map(req => {
              const isSaved = saved[req.id];
              return (
                <tr key={req.id} style={{ borderBottom: "1px solid var(--border)", background: isSaved ? "#F0FDF4" : "white", transition: "background 0.3s" }}>
                  <td style={{ padding: "10px 14px", color: "var(--gold)", fontWeight: 700, fontFamily: "var(--font-display)" }}>#{req.queueNumber}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: 12 }}>{req.title}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{req.requesterName}</div>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#6B7280" }}>{req.materialType}</td>
                  <td style={{ padding: "10px 14px", color: "#9CA3AF", fontSize: 11 }}>{timeAgo(req.submittedAt)}</td>
                  <td style={{ padding: "10px 14px" }}>{req.isRush && <RushBadge />}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <select value={assignments[req.id] || ""} onChange={e => assign(req.id, e.target.value)}
                      style={{ border: "1px solid var(--border)", borderRadius: 3, padding: "6px 10px", fontSize: 11, fontFamily: "var(--font-body)", outline: "none", color: "var(--navy)", background: "white", minWidth: 140 }}>
                      <option value="">— Select Designer —</option>
                      {INIT_DESIGNERS.filter(d => d.active).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <button
                      onClick={() => assignments[req.id] && confirmAssign(req)}
                      disabled={!assignments[req.id]}
                      style={{
                        background: isSaved ? "#15803D" : assignments[req.id] ? "var(--navy)" : "#F3F4F6",
                        color: isSaved ? "white" : assignments[req.id] ? "white" : "#9CA3AF",
                        border: "none", borderRadius: 3, padding: "6px 14px",
                        fontSize: 11, fontWeight: 700, cursor: assignments[req.id] ? "pointer" : "default",
                        transition: "all 0.2s", whiteSpace: "nowrap",
                      }}>
                      {isSaved ? "✓ Assigned" : "Assign"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ExecutiveSettings({ onSelectRequest }) {
  const [activeTab, setActiveTab] = useState("materials");
  const PANELS = {
    materials:     <MaterialsPanel />,
    rush:          <RushFeesPanel />,
    fields:        <FieldConfigPanel />,
    designers:     <DesignerRosterPanel />,
    offices:       <OfficesPanel />,
    notifications: <NotificationsPanel />,
    assign:        <QuickAssignPanel onSelectRequest={onSelectRequest} />,
  };
  return (
    <div style={{ padding: "32px 0" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Marketing · Administration</div>
        <h2 style={{ fontSize: 28, fontFamily: "var(--font-display)", color: "var(--navy)", fontWeight: 300, margin: 0, letterSpacing: "-0.02em" }}>Settings</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>
        {/* Sidebar */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
          {SETTINGS_TABS.map(tab => (
            <div key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "11px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              background: activeTab === tab.key ? "var(--navy)" : "white",
              color: activeTab === tab.key ? "white" : "#374151",
              borderBottom: "1px solid var(--border)",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 14 }}>{tab.icon}</span>
              <span style={{ fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500 }}>{tab.label}</span>
            </div>
          ))}
        </div>
        {/* Content */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, padding: "24px 28px", minHeight: 400 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
            {SETTINGS_TABS.find(t => t.key === activeTab)?.label}
          </div>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 20 }} />
          {PANELS[activeTab]}
        </div>
      </div>
    </div>
  );
}


// ─── ROOT APP ─────────────────────────────────────────────────────────────────


// ─── DASHBOARD ───────────────────────────────────────────────────────────────

const AGENT_TASKS = [
  { id: 1, text: "Approve Spring Social Kit draft", priority: "high",   type: "approval",  req: "req-002", due: "Today" },
  { id: 2, text: "Upload MLS photos for Open House flyer", priority: "high",  type: "upload",   req: "req-003", due: "Today" },
  { id: 3, text: "Review Pinnacle Peak first draft", priority: "medium", type: "review",    req: "req-001", due: "Mar 14" },
];


const WEEK_TREND_DATA = [
  { day: "Mon", thisWeek: 3, lastWeek: 2 },
  { day: "Tue", thisWeek: 5, lastWeek: 1 },
  { day: "Wed", thisWeek: 2, lastWeek: 3 },
  { day: "Thu", thisWeek: 4, lastWeek: 2 },
  { day: "Fri", thisWeek: 3, lastWeek: 4 },
  { day: "Sat", thisWeek: 1, lastWeek: 0 },
];

const TURNAROUND_BY_TYPE = [
  { type: "Flyer",       days: 2.1 },
  { type: "Social Pack", days: 3.4 },
  { type: "Report",      days: 5.2 },
  { type: "Video",       days: 6.8 },
  { type: "Brochure",    days: 4.1 },
];

const DESIGNER_TASKS = [
  { id: 1, text: "Finish Pinnacle Peak flyer — due Mar 14", priority: "high",   type: "work",    req: "req-001", due: "Mar 14" },
  { id: 2, text: "Pick up Open House flyer — rush order",   priority: "high",   type: "work",    req: "req-003", due: "Mar 10" },
  { id: 3, text: "Send Spring Social Kit back to review",   priority: "medium", type: "review",  req: "req-002", due: "Mar 12" },
];

const ACTIVITY_FEED = [
  { id: 1, actor: "Yong Choi",    action: "submitted",       target: "Open House — 4821 N 74th St",        time: "2h ago",  type: "submit" },
  { id: 2, actor: "Lex Baum",   action: "sent to review",  target: "Agent Branding — Spring Social Kit", time: "4h ago",  type: "review" },
  { id: 3, actor: "Yong Choi",    action: "commented on",    target: "Just Listed — Pinnacle Peak",        time: "6h ago",  type: "message" },
  { id: 4, actor: "Lex Baum",   action: "started work on", target: "Just Listed — Pinnacle Peak",        time: "1d ago",  type: "work" },
  { id: 5, actor: "System",       action: "assigned",        target: "Just Listed — Pinnacle Peak",        time: "1d ago",  type: "assign" },
  { id: 6, actor: "Yong Choi",    action: "submitted",       target: "Just Listed — Pinnacle Peak",        time: "1d ago",  type: "submit" },
];

function ActivityDot({ type }) {
  const cfg = {
    submit:  { color: "#1D4ED8", label: "↑" },
    review:  { color: "#7C3AED", label: "⊙" },
    message: { color: "#0891B2", label: "·" },
    work:    { color: "#0369A1", label: "▶" },
    assign:  { color: "#C9A96E", label: "→" },
    approve: { color: "#15803D", label: "✓" },
  }[type] || { color: "#9CA3AF", label: "·" };
  return (
    <div style={{
      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
      background: cfg.color + "18", border: `1px solid ${cfg.color}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, color: cfg.color, fontWeight: 700,
    }}>{cfg.label}</div>
  );
}

function TaskPill({ priority }) {
  const cfg = { high: ["#FEF2F2","#DC2626"], medium: ["#FFFBEB","#D97706"], low: ["#F0FDF4","#15803D"] }[priority] || ["#F9FAFB","#9CA3AF"];
  return <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: cfg[0], color: cfg[1], padding: "2px 7px", borderRadius: 2 }}>{priority}</span>;
}

function DashKPI({ label, value, sub, accent, trend }) {
  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 96 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF" }}>{label}</div>
      <div>
        <div style={{ fontSize: 30, fontFamily: "var(--font-display)", fontWeight: 300, color: accent || "var(--navy)", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 4 }}>{value}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {sub && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</div>}
          {trend && <span style={{ fontSize: 10, fontWeight: 700, color: trend > 0 ? "#15803D" : "#DC2626", background: trend > 0 ? "#F0FDF4" : "#FEF2F2", padding: "1px 6px", borderRadius: 2 }}>{trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%</span>}
        </div>
      </div>
    </div>
  );
}

function RequestStatusChip({ status }) {
  const cfg = {
    in_progress: { label: "In Progress", color: "#0369A1" },
    review:      { label: "In Review",   color: "#7C3AED" },
    submitted:   { label: "Submitted",   color: "#B45309" },
    revision:    { label: "Revision",    color: "#C2410C" },
    completed:   { label: "Completed",   color: "#15803D" },
    awaiting_materials: { label: "Awaiting Materials", color: "#0891B2" },
  }[status] || { label: status, color: "#6B7280" };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.color + "15", border: `1px solid ${cfg.color}30`, borderRadius: 2, padding: "2px 8px", letterSpacing: "0.04em" }}>
      {cfg.label}
    </span>
  );
}


// ─── SALES MOCK DATA ─────────────────────────────────────────────────────────

const QUARTERLY_SALES = [
  { quarter: "Q1 2024", volume: 4_200_000, units: 3, label: "Q1 '24" },
  { quarter: "Q2 2024", volume: 6_800_000, units: 5, label: "Q2 '24" },
  { quarter: "Q3 2024", volume: 5_100_000, units: 4, label: "Q3 '24" },
  { quarter: "Q4 2024", volume: 7_400_000, units: 6, label: "Q4 '24" },
  { quarter: "Q1 2025", volume: 5_600_000, units: 4, label: "Q1 '25" },
];

const MONTHLY_VOLUME = [
  { month: "Jan", y2023: 1_100_000, y2024: 1_400_000, y2025: 1_800_000 },
  { month: "Feb", y2023: 900_000,   y2024: 1_200_000, y2025: 1_600_000 },
  { month: "Mar", y2023: 1_400_000, y2024: 1_800_000, y2025: 2_100_000 },
  { month: "Apr", y2023: 1_200_000, y2024: 2_100_000, y2025: 1_900_000 },
  { month: "May", y2023: 1_800_000, y2024: 2_400_000, y2025: 2_600_000 },
  { month: "Jun", y2023: 2_100_000, y2024: 2_300_000, y2025: 2_200_000 },
  { month: "Jul", y2023: 1_600_000, y2024: 1_900_000, y2025: null },
  { month: "Aug", y2023: 1_900_000, y2024: 2_200_000, y2025: null },
  { month: "Sep", y2023: 1_300_000, y2024: 1_000_000, y2025: null },
  { month: "Oct", y2023: 1_700_000, y2024: 1_800_000, y2025: null },
  { month: "Nov", y2023: 2_200_000, y2024: 2_600_000, y2025: null },
  { month: "Dec", y2023: 2_500_000, y2024: 3_100_000, y2025: null },
];

function fmtM(v) {
  if (v == null) return "—";
  return v >= 1_000_000 ? `$${(v/1_000_000).toFixed(1)}M` : `$${(v/1_000).toFixed(0)}K`;
}

// ─── CALENDAR DATA ────────────────────────────────────────────────────────────

const CAL_EVENTS = [
  { id: 1, date: 9,  time: "9:00 AM",  title: "Buyer Consultation",          sub: "Pinnacle Peak buyers",              type: "meeting",  color: "#0369A1" },
  { id: 2, date: 10, time: "1:00 PM",  title: "Open House",                  sub: "4821 N 74th St",                    type: "listing",  color: "#7C3AED" },
  { id: 3, date: 11, time: "3:00 PM",  title: "Listing Presentation",        sub: "Scottsdale — new lead",             type: "listing",  color: "#7C3AED" },
  { id: 4, date: 12, time: "All day",  title: "Flyer Proof Due",             sub: "Pinnacle Peak marketing",           type: "deadline", color: "#C2410C" },
  { id: 5, date: 14, time: "10:00 AM", title: "Broker Caravan",              sub: "Desert Mountain — 3 stops",        type: "meeting",  color: "#0369A1" },
  { id: 6, date: 15, time: "9:00 AM",  title: "Russ Lyon Team Meeting",      sub: "Phoenix HQ",                       type: "meeting",  color: "#0369A1" },
  { id: 7, date: 17, time: "2:00 PM",  title: "Closing — Pinnacle Peak",     sub: "Escrow sign-off, $2.1M",           type: "closing",  color: "#15803D" },
  { id: 8, date: 20, time: "11:00 AM", title: "Photography Session",         sub: "74th St listing",                  type: "deadline", color: "#C2410C" },
  { id: 9, date: 22, time: "1:00 PM",  title: "Open House",                  sub: "4821 N 74th St (2nd showing)",     type: "listing",  color: "#7C3AED" },
  { id: 10, date: 25, time: "3:30 PM", title: "Offer Review",                sub: "Spring Social Kit listing",        type: "closing",  color: "#15803D" },
];

// March 2026: starts on Sunday (0), 31 days
const CAL_YEAR = 2026;
const CAL_MONTH = 2; // 0-indexed = March
const CAL_TODAY = 8;

const TYPE_LABEL = { meeting: "Meeting", showing: "Showing", listing: "Listing", closing: "Closing", deadline: "Deadline" };
const TYPE_BG    = { meeting: "#EFF6FF", showing: "#F5F3FF", listing: "#F5F3FF", closing: "#F0FDF4", deadline: "#FFF7ED" };
const TYPE_COLORS = [
  { label: "Meeting",  value: "meeting",  color: "#0369A1" },
  { label: "Listing",  value: "listing",  color: "#7C3AED" },
  { label: "Closing",  value: "closing",  color: "#15803D" },
  { label: "Deadline", value: "deadline", color: "#C2410C" },
  { label: "Showing",  value: "showing",  color: "#9333EA" },
];

// ── Hover Popover ──────────────────────────────────────────────────────────
function DayHoverPopover({ day, rect, events }) {
  if (!rect) return null;
  const DOW_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dow = DOW_SHORT[new Date(CAL_YEAR, CAL_MONTH, day).getDay()];

  // Position: prefer below+right of cell, clamp to viewport
  const GAP = 6;
  let left = rect.right + GAP;
  let top  = rect.top;
  if (left + 200 > window.innerWidth - 12) left = rect.left - 208;
  if (top  + 160 > window.innerHeight - 12) top = window.innerHeight - 172;

  return (
    <div style={{
      position: "fixed", left, top, zIndex: 7500,
      background: "white", border: "1px solid var(--border)",
      borderRadius: 6, width: 200, boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
      pointerEvents: "none", animation: "fadeSlideUp 0.1s ease",
    }}>
      {/* Header */}
      <div style={{ padding: "8px 12px 6px", borderBottom: events.length ? "1px solid #F3F4F6" : "none" }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF" }}>{dow} · </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)" }}>March {day}</span>
      </div>
      {events.length === 0 ? (
        <div style={{ padding: "10px 12px", fontSize: 11, color: "#9CA3AF", fontStyle: "italic" }}>No events</div>
      ) : events.map((ev, i) => (
        <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 7, padding: "7px 12px", borderBottom: i < events.length - 1 ? "1px solid #F9FAFB" : "none" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: ev.color, flexShrink: 0, marginTop: 3 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
            <div style={{ fontSize: 10, color: "#9CA3AF" }}>{ev.time}</div>
          </div>
        </div>
      ))}
      {events.length > 0 && (
        <div style={{ padding: "5px 12px 8px", fontSize: 10, color: "#9CA3AF", fontStyle: "italic" }}>Click to edit</div>
      )}
    </div>
  );
}

// ── Single Event Editor Row (Google Calendar style) ────────────────────────
function EventEditorRow({ ev, onChange, onDelete }) {
  const [open, setOpen] = React.useState(true);
  const inputStyle = {
    width: "100%", border: "none", borderBottom: "1px solid #E5E7EB",
    padding: "4px 0", fontSize: 13, color: "var(--navy)", background: "transparent",
    outline: "none", fontFamily: "var(--font-body)",
  };
  const labelStyle = { fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 4, display: "block" };
  const fieldRow = { display: "flex", gap: 12, marginBottom: 14 };

  return (
    <div style={{ border: `1.5px solid ${ev.color}`, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
      {/* Event color bar + title header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ background: ev.color + "12", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: ev.color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", flex: 1 }}>{ev.title || "Untitled event"}</span>
        <span style={{ fontSize: 10, color: "#9CA3AF" }}>{ev.time}</span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 14, padding: "0 2px", lineHeight: 1 }}
          title="Delete event"
        >×</button>
        <span style={{ fontSize: 10, color: "#9CA3AF" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ padding: "16px 16px 6px", background: "white" }}>
          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Title</label>
            <input style={{ ...inputStyle, fontSize: 15, fontWeight: 600 }} value={ev.title} onChange={e => onChange({ ...ev, title: e.target.value })} placeholder="Add title" />
          </div>

          {/* Date + All Day */}
          <div style={{ ...fieldRow, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Date</label>
              <input style={inputStyle} type="text" value={`March ${ev.date}, 2026`} onChange={e => {}} readOnly />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 18 }}>
              <input type="checkbox" id={`allday-${ev.id}`} checked={ev.allDay || false} onChange={e => onChange({ ...ev, allDay: e.target.checked })} style={{ cursor: "pointer" }} />
              <label htmlFor={`allday-${ev.id}`} style={{ fontSize: 11, color: "#6B7280", cursor: "pointer" }}>All day</label>
            </div>
          </div>

          {/* Start / End time */}
          {!ev.allDay && (
            <div style={fieldRow}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Start time</label>
                <input style={inputStyle} value={ev.time} onChange={e => onChange({ ...ev, time: e.target.value })} placeholder="e.g. 9:00 AM" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>End time</label>
                <input style={inputStyle} value={ev.endTime || ""} onChange={e => onChange({ ...ev, endTime: e.target.value })} placeholder="e.g. 10:00 AM" />
              </div>
            </div>
          )}

          {/* Location */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" style={{ marginRight: 4, verticalAlign: "middle" }}><path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.75 4.5 8.5 4.5 8.5s4.5-4.75 4.5-8.5c0-2.49-2.01-4.5-4.5-4.5z" stroke="#9CA3AF" strokeWidth="1.2"/><circle cx="8" cy="6" r="1.5" stroke="#9CA3AF" strokeWidth="1.2"/></svg>
              Location
            </label>
            <input style={inputStyle} value={ev.location || ""} onChange={e => onChange({ ...ev, location: e.target.value })} placeholder="Add location" />
          </div>

          {/* Video call */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" style={{ marginRight: 4, verticalAlign: "middle" }}><rect x="1" y="4" width="9" height="8" rx="1" stroke="#9CA3AF" strokeWidth="1.2"/><path d="M10 6.5l5-2.5v8l-5-2.5V6.5z" stroke="#9CA3AF" strokeWidth="1.2"/></svg>
              Video call
            </label>
            <input style={inputStyle} value={ev.zoomLink || ""} onChange={e => onChange({ ...ev, zoomLink: e.target.value })} placeholder="Add Zoom / Meet link" />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" style={{ marginRight: 4, verticalAlign: "middle" }}><path d="M2 4h12M2 8h8M2 12h6" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Description
            </label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 48, borderBottom: "none", border: "1px solid #E5E7EB", borderRadius: 4, padding: "6px 8px", fontSize: 12 }}
              value={ev.description || ""}
              onChange={e => onChange({ ...ev, description: e.target.value })}
              placeholder="Add notes or description"
            />
          </div>

          {/* Guests */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" style={{ marginRight: 4, verticalAlign: "middle" }}><circle cx="6" cy="5" r="2.5" stroke="#9CA3AF" strokeWidth="1.2"/><path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#9CA3AF" strokeWidth="1.2"/><circle cx="12" cy="5" r="2" stroke="#9CA3AF" strokeWidth="1.2"/><path d="M14 14c0-2.21-1.34-4.1-3.25-4.75" stroke="#9CA3AF" strokeWidth="1.2"/></svg>
              Guests
            </label>
            <input style={inputStyle} value={ev.guests || ""} onChange={e => onChange({ ...ev, guests: e.target.value })} placeholder="Add guest emails" />
          </div>

          {/* Type + Notification row */}
          <div style={fieldRow}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Event type</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={ev.type}
                onChange={e => {
                  const found = TYPE_COLORS.find(t => t.value === e.target.value);
                  onChange({ ...ev, type: e.target.value, color: found ? found.color : ev.color });
                }}
              >
                {TYPE_COLORS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Notification</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={ev.notification || "30"} onChange={e => onChange({ ...ev, notification: e.target.value })}>
                <option value="0">At time of event</option>
                <option value="10">10 min before</option>
                <option value="30">30 min before</option>
                <option value="60">1 hr before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>
          </div>

          {/* Status + Visibility row */}
          <div style={fieldRow}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={ev.status || "busy"} onChange={e => onChange({ ...ev, status: e.target.value })}>
                <option value="busy">Busy</option>
                <option value="free">Free</option>
                <option value="tentative">Tentative</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Visibility</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={ev.visibility || "default"} onChange={e => onChange({ ...ev, visibility: e.target.value })}>
                <option value="default">Default</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          {/* Sub / context note */}
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Context note</label>
            <input style={inputStyle} value={ev.sub || ""} onChange={e => onChange({ ...ev, sub: e.target.value })} placeholder="e.g. Pinnacle Peak buyers" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Day Edit Modal (Google Calendar style) ─────────────────────────────────
function DayEditModal({ day, calEvents, onSave, onClose }) {
  const DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dow = DOW[new Date(CAL_YEAR, CAL_MONTH, day).getDay()];
  const [events, setEvents] = React.useState(calEvents.filter(e => e.date === day).map(e => ({ ...e })));
  const [nextId, setNextId] = React.useState(Date.now());

  const handleBackdrop = e => { if (e.target === e.currentTarget) onClose(); };

  const updateEvent = (id, updated) => setEvents(evs => evs.map(e => e.id === id ? updated : e));
  const deleteEvent = id => setEvents(evs => evs.filter(e => e.id !== id));
  const addEvent = () => {
    const id = nextId + 1; setNextId(id);
    setEvents(evs => [...evs, {
      id, date: day, time: "9:00 AM", endTime: "10:00 AM",
      title: "", sub: "", type: "meeting", color: "#0369A1",
      description: "", location: "", guests: "", zoomLink: "",
      notification: "30", status: "busy", visibility: "default", allDay: false,
    }]);
  };

  return (
    <div onClick={handleBackdrop} style={{
      position: "fixed", inset: 0, zIndex: 8000,
      background: "rgba(10,20,40,0.5)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#F8F7F5", borderRadius: 8, width: 520, maxWidth: "92vw",
        maxHeight: "88vh", display: "flex", flexDirection: "column",
        boxShadow: "0 28px 72px rgba(0,0,0,0.24)", animation: "fadeSlideUp 0.15s ease",
      }}>
        {/* Header */}
        <div style={{ background: "var(--navy)", padding: "18px 22px", borderRadius: "8px 8px 0 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{dow}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 300, color: "white", lineHeight: 1 }}>
                March {day} <span style={{ fontSize: 14, color: "var(--gold)" }}>2026</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 5 }}>
                {events.length === 0 ? "No events — add one below" : `${events.length} event${events.length !== 1 ? "s" : ""}`}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 4,
              width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 18, lineHeight: 1, transition: "background 0.12s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            >×</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 0" }}>
          {events.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0 20px", color: "#9CA3AF", fontSize: 13 }}>
              Nothing scheduled. Add an event to get started.
            </div>
          )}
          {events.map(ev => (
            <EventEditorRow
              key={ev.id}
              ev={ev}
              onChange={updated => updateEvent(ev.id, updated)}
              onDelete={() => deleteEvent(ev.id)}
            />
          ))}

          {/* Add event button */}
          <button
            onClick={addEvent}
            style={{
              width: "100%", padding: "10px", border: "1.5px dashed #D1D5DB", borderRadius: 6,
              background: "transparent", cursor: "pointer", fontSize: 12, color: "#9CA3AF",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              marginBottom: 16, transition: "all 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--navy)"; e.currentTarget.style.color = "var(--navy)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#D1D5DB"; e.currentTarget.style.color = "#9CA3AF"; }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add event for March {day}
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 18px 16px", borderTop: "1px solid #E5E7EB", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0, background: "white", borderRadius: "0 0 8px 8px" }}>
          <button onClick={onClose} style={{
            background: "white", color: "var(--navy)", border: "1px solid var(--border)", borderRadius: 4,
            padding: "8px 16px", fontSize: 11, fontWeight: 600, cursor: "pointer", letterSpacing: "0.03em",
          }}>Cancel</button>
          <button onClick={() => { onSave(day, events); onClose(); }} style={{
            background: "var(--navy)", color: "white", border: "none", borderRadius: 4,
            padding: "8px 18px", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Personal Calendar ──────────────────────────────────────────────────────
function PersonalCalendar() {
  const [calEvents, setCalEvents] = React.useState(CAL_EVENTS.map(e => ({ ...e })));
  const [modalDay, setModalDay] = React.useState(null);
  const [hoverState, setHoverState] = React.useState(null); // { day, rect }

  const firstDay    = new Date(CAL_YEAR, CAL_MONTH, 1).getDay();
  const daysInMonth = new Date(CAL_YEAR, CAL_MONTH + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );
  while (cells.length % 7 !== 0) cells.push(null);

  const eventDays    = new Set(calEvents.map(e => e.date));
  const closingDays  = new Set(calEvents.filter(e => e.type === "closing").map(e => e.date));
  const deadlineDays = new Set(calEvents.filter(e => e.type === "deadline").map(e => e.date));

  const handleSave = (day, updatedEvents) => {
    setCalEvents(prev => [
      ...prev.filter(e => e.date !== day),
      ...updatedEvents,
    ]);
  };

  return (
    <>
      {/* Hover popover */}
      {hoverState && !modalDay && (
        <DayHoverPopover
          day={hoverState.day}
          rect={hoverState.rect}
          events={calEvents.filter(e => e.date === hoverState.day)}
        />
      )}

      {/* Edit modal */}
      {modalDay !== null && (
        <DayEditModal
          day={modalDay}
          calEvents={calEvents}
          onSave={handleSave}
          onClose={() => setModalDay(null)}
        />
      )}

      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column", height: 360 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 4 }}>Calendar</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.01em" }}>March 2026</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#7C3AED" }} /><span style={{ fontSize: 9, color: "#6B7280" }}>Listing</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#15803D" }} /><span style={{ fontSize: 9, color: "#6B7280" }}>Closing</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#C2410C" }} /><span style={{ fontSize: 9, color: "#6B7280" }}>Deadline</span></div>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "10px 16px 4px", flexShrink: 0 }}>
          {["S","M","T","W","T","F","S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#9CA3AF" }}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "1fr", gap: 2, padding: "0 16px 8px", flex: 1 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const isToday    = day === CAL_TODAY;
            const hasEvent   = eventDays.has(day);
            const isClosing  = closingDays.has(day);
            const isDeadline = deadlineDays.has(day);
            const dotColor   = isClosing ? "#15803D" : isDeadline ? "#C2410C" : "#7C3AED";
            return (
              <div
                key={i}
                onClick={() => { setHoverState(null); setModalDay(day); }}
                onMouseEnter={e => {
                  if (!isToday) e.currentTarget.style.background = "#F0EDE8";
                  setHoverState({ day, rect: e.currentTarget.getBoundingClientRect() });
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isToday ? "var(--navy)" : "transparent";
                  setHoverState(null);
                }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "5px 2px", borderRadius: 4, cursor: "pointer",
                  background: isToday ? "var(--navy)" : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? "white" : day < CAL_TODAY ? "#C4B9AA" : "var(--navy)", lineHeight: 1 }}>{day}</span>
                {hasEvent && (
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: isToday ? "var(--gold)" : dotColor, marginTop: 2 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}


function CalendarEventsList() {
  const upcoming = CAL_EVENTS.filter(e => e.date >= CAL_TODAY).sort((a, b) => a.date - b.date);
  const TYPE_LABEL = { meeting: "Meeting", listing: "Showing", closing: "Closing", deadline: "Deadline" };
  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>Upcoming Events</div>
        <span style={{ fontSize: 10, color: "#9CA3AF" }}>{upcoming.length} this month</span>
      </div>
      <div>
        {upcoming.map((ev, i) => (
          <div key={ev.id} style={{
            display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 16px",
            borderBottom: i < upcoming.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            {/* Date block */}
            <div style={{ width: 36, flexShrink: 0, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontFamily: "var(--font-display)", fontWeight: 300, color: "var(--navy)", lineHeight: 1 }}>{ev.date}</div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}>Mar</div>
            </div>
            <div style={{ width: 3, borderRadius: 2, background: ev.color, alignSelf: "stretch", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 2 }}>{ev.title}</div>
              <div style={{ fontSize: 10, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.time} · {ev.sub}</div>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", color: ev.color, background: ev.color + "18", border: `1px solid ${ev.color}30`, borderRadius: 2, padding: "2px 6px", flexShrink: 0 }}>{TYPE_LABEL[ev.type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesChartsTabs() {
  const [tab, setTab] = useState("quarterly");

  const currentQ  = QUARTERLY_SALES[QUARTERLY_SALES.length - 1];
  const prevQ     = QUARTERLY_SALES[QUARTERLY_SALES.length - 2];
  const yoyQ      = QUARTERLY_SALES[QUARTERLY_SALES.length - 5];
  const qGrowth   = prevQ ? Math.round(((currentQ.volume - prevQ.volume) / prevQ.volume) * 100) : null;
  const yoyGrowth = yoyQ  ? Math.round(((currentQ.volume - yoyQ.volume)  / yoyQ.volume)  * 100) : null;

  const NAVY = "#0F2B4F";
  const GOLD = "#C9A96E";

  return (
    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", height: 360, display: "flex", flexDirection: "column" }}>
      {/* Header + tabs */}
      <div style={{ padding: "16px 20px 0", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 4 }}>
              {tab === "quarterly" ? "Sales Volume by Quarter" : "Year-over-Year Volume"}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              {tab === "quarterly" ? (
                <>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.01em" }}>{fmtM(currentQ.volume)}</span>
                  {qGrowth != null && <span style={{ fontSize: 10, fontWeight: 700, color: qGrowth > 0 ? "#15803D" : "#DC2626", background: qGrowth > 0 ? "#F0FDF4" : "#FEF2F2", padding: "1px 6px", borderRadius: 2 }}>{qGrowth > 0 ? "↑" : "↓"} {Math.abs(qGrowth)}% vs last Q</span>}
                  {yoyGrowth != null && <span style={{ fontSize: 10, fontWeight: 700, color: yoyGrowth > 0 ? "#0891B2" : "#D97706", background: yoyGrowth > 0 ? "#ECFEFF" : "#FFFBEB", padding: "1px 6px", borderRadius: 2 }}>{yoyGrowth > 0 ? "↑" : "↓"} {Math.abs(yoyGrowth)}% YoY</span>}
                </>
              ) : (
                <>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.01em" }}>Jan – Jun 2025</span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {[["2023","#E5E0D8"],["2024",GOLD],["2025",NAVY]].map(([yr,col]) => (
                      <div key={yr} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 16, height: 2, background: col, borderRadius: 1 }} />
                        <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 600 }}>{yr}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0 }}>
          {[["quarterly","Quarterly"], ["yoy","Year over Year"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: "7px 16px", fontSize: 11, fontWeight: 600, border: "none", background: "none",
              cursor: "pointer", color: tab === key ? "var(--navy)" : "#9CA3AF",
              borderBottom: `2px solid ${tab === key ? "var(--navy)" : "transparent"}`,
              marginBottom: -1, transition: "all 0.15s", letterSpacing: "0.02em",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {tab === "quarterly" ? (
          <>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={QUARTERLY_SALES} barSize={36} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => [fmtM(v), "Volume"]} contentStyle={{ fontFamily: "DM Sans", fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} cursor={{ fill: "#F9FAFB" }} />
                <Bar dataKey="volume" radius={[3, 3, 0, 0]}>
                  {QUARTERLY_SALES.map((_, i) => <Cell key={i} fill={i === QUARTERLY_SALES.length - 1 ? NAVY : GOLD + "90"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
              {[
                { label: "Q1 '25 (current)", vol: fmtM(currentQ.volume), units: currentQ.units + " closed", accent: NAVY },
                { label: "Q4 '24",           vol: fmtM(prevQ.volume),    units: prevQ.units + " closed",    accent: GOLD },
                { label: "Q1 '24 (YoY)",     vol: fmtM(yoyQ?.volume),    units: (yoyQ?.units||"—")+" closed", accent: "#9CA3AF" },
              ].map(s => (
                <div key={s.label} style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.accent, lineHeight: 1 }}>{s.vol}</div>
                  <div style={{ fontSize: 10, color: "#C4B99A" }}>{s.units}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={MONTHLY_VOLUME} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v, name) => [fmtM(v), name === "y2023" ? "2023" : name === "y2024" ? "2024" : "2025"]} contentStyle={{ fontFamily: "DM Sans", fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                <Line type="monotone" dataKey="y2023" stroke="#E5E0D8" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="y2024" stroke={GOLD} strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="y2025" stroke={NAVY} strokeWidth={2.5} dot={{ r: 3, fill: NAVY, strokeWidth: 0 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
              {[
                { label: "YTD 2025", vol: fmtM(MONTHLY_VOLUME.filter(m => m.y2025).reduce((a, m) => a + m.y2025, 0)), color: NAVY },
                { label: "YTD 2024", vol: fmtM(MONTHLY_VOLUME.slice(0,6).reduce((a, m) => a + m.y2024, 0)),           color: GOLD },
                { label: "YTD 2023", vol: fmtM(MONTHLY_VOLUME.slice(0,6).reduce((a, m) => a + m.y2023, 0)),           color: "#9CA3AF" },
              ].map(s => (
                <div key={s.label} style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.vol}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ─── UNIFIED INBOX MOCK DATA ─────────────────────────────────────────────────

const UNIFIED_MESSAGES = [
  {
    id: "m1", channel: "platform", sender: "Lex Baum", initials: "LH",
    avatarBg: "var(--navy)", avatarText: "var(--gold)",
    subject: null,
    preview: "First draft is ready for your review — take a look when you get a chance.",
    context: "Just Listed — Pinnacle Peak",
    time: "2h ago", unread: true,
  },
  {
    id: "m2", channel: "email", sender: "David Kim", initials: "DK",
    avatarBg: "#EFF6FF", avatarText: "#1D4ED8",
    subject: "Q2 Marketing Budget Review",
    preview: "Can you join Thursday at 2pm? I want to walk through the new spend allocation.",
    context: null,
    time: "3h ago", unread: true,
  },
  {
    id: "m3", channel: "dm", sender: "Sarah Chen", initials: "SC",
    avatarBg: "#F0FDF4", avatarText: "#15803D",
    subject: null,
    preview: "Hey! Are you going to the broker open at Desert Mountain on Friday?",
    context: null,
    time: "5h ago", unread: false,
  },
  {
    id: "m4", channel: "platform", sender: "Lex Baum", initials: "LH",
    avatarBg: "var(--navy)", avatarText: "var(--gold)",
    subject: null,
    preview: "Sent the Spring Social Kit back — see revision notes in the thread.",
    context: "Agent Branding — Spring Social Kit",
    time: "4h ago", unread: false,
  },
  {
    id: "m5", channel: "email", sender: "Marcus Webb", initials: "MW",
    avatarBg: "#FFF7ED", avatarText: "#C2410C",
    subject: "Re: Open House Flyer — Photo Assets",
    preview: "Got the Dropbox link, downloading now. Should have a draft to you by EOD.",
    context: null,
    time: "1d ago", unread: false,
  },
  {
    id: "m6", channel: "dm", sender: "Tom Alvarez", initials: "TA",
    avatarBg: "#F5F3FF", avatarText: "#6D28D9",
    subject: null,
    preview: "The Pinnacle Peak listing is getting a lot of traction — any open house planned?",
    context: null,
    time: "1d ago", unread: false,
  },
];

// ─── LYON'S DEN ──────────────────────────────────────────────────────────────

const DEN_ANNOUNCEMENTS = [
  {
    id: "a1", type: "announcement", pinned: true,
    author: "David Kim", initials: "DK", avatarBg: "#EFF6FF", avatarText: "#1D4ED8", role: "CMO",
    time: "Today · 9:04 AM",
    title: "Q1 Results — Best Quarter in 3 Years",
    body: "Team, incredibly proud to share that Q1 closed at $2.4B in total volume across all offices — our strongest quarter since 2023. Scottsdale led with $890M. Full breakdown at the all-hands Thursday. More to come.",
    reactions: { "🏆": 24, "🔥": 18, "👏": 31 },
    comments: 12,
  },
  {
    id: "a2", type: "blog",
    author: "Sarah Kimura", initials: "SK", avatarBg: "#F5F3FF", avatarText: "#6D28D9", role: "Market Research",
    time: "Yesterday · 2:30 PM",
    title: "Paradise Valley Micro-Market Report — March 2026",
    body: "Inventory dropped 18% YoY while median days on market fell to 19 days. Luxury spec homes ($4M+) are seeing multiple-offer situations for the first time since 2022. Key insight: buyers are increasingly waiving inspection contingencies...",
    reactions: { "📊": 9, "👀": 14 },
    comments: 5,
    tag: "Market Research",
  },
  {
    id: "a3", type: "announcement",
    author: "Tom Nguyen", initials: "TN", avatarBg: "#F0FDF4", avatarText: "#15803D", role: "HR Director",
    time: "Mar 5 · 11:00 AM",
    title: "New Agent Onboarding — Welcome Cohort 7",
    body: "Please join us in welcoming 6 new agents joining across Scottsdale, Sedona, and Tucson offices this month. Stop by the welcome lunch Friday at noon in the Paradise Valley conference room.",
    reactions: { "🎉": 41, "👋": 28 },
    comments: 8,
  },
  {
    id: "a4", type: "blog",
    author: "Lex Baum", initials: "LH", avatarBg: "var(--navy)", avatarText: "var(--gold)", role: "Creative Director",
    time: "Mar 3 · 4:15 PM",
    title: "New Brand Refresh Assets Available",
    body: "The updated logo suite, color system, and font stack are now in the shared Brand Kit folder. All agents should use the 2026 templates going forward. Reach out to the design team with any questions.",
    reactions: { "✨": 17, "👍": 22 },
    comments: 3,
    tag: "Design",
  },
];

const DEN_EVENTS = [
  { id: "e1", date: 10, dow: "Tue", title: "All-Hands Q1 Wrap", time: "3:00 PM", type: "meeting", zoom: true, color: "#0F2B4F" },
  { id: "e2", date: 12, dow: "Thu", title: "New Agent Welcome Lunch", time: "12:00 PM", type: "social", zoom: false, color: "#15803D" },
  { id: "e3", date: 14, dow: "Sat", title: "Desert Mountain Broker Open", time: "10:00 AM", type: "event", zoom: false, color: "#7C3AED" },
  { id: "e4", date: 18, dow: "Wed", title: "Marketing Strategy Sync", time: "2:00 PM", type: "meeting", zoom: true, color: "#0F2B4F" },
  { id: "e5", date: 22, dow: "Sun", title: "Pinnacle Peak Open House", time: "1:00 PM", type: "event", zoom: false, color: "#7C3AED" },
  { id: "e6", date: 25, dow: "Wed", title: "Tech Stack Demo — Platform", time: "10:30 AM", type: "meeting", zoom: true, color: "#0F2B4F" },
];

const DEN_PRIDES = [
  { id: "p1", name: "Luxury Lakefront",    category: "Market",    members: 14, description: "Agents focused on waterfront and lakefront estates across the Valley.",                private: false, joined: true,  cover: "#1A3A5C", avatars: ["LH","SC","MW","TN","YC"] },
  { id: "p2", name: "Golf Community Desk", category: "Market",    members: 22, description: "Desert Mountain, Troon, Silverleaf — specialists in golf-access properties.",          private: false, joined: true,  cover: "#2C3E2D", avatars: ["TA","DK","LH","SC","MW"] },
  { id: "p3", name: "New Construction",    category: "Specialty", members: 9,  description: "Pre-sell and new-build pipeline coordination across Phoenix metro.",                   private: false, joined: false, cover: "#3D2C1A", avatars: ["RJ","AM","TN","BK","SL"] },
  { id: "p4", name: "Relocation Team",     category: "Specialty", members: 17, description: "Inbound clients from out-of-state, concierge handoff protocols.",                     private: false, joined: false, cover: "#1A2C3D", avatars: ["PW","MR","JL","KD","HP"] },
  { id: "p5", name: "Investment & Income", category: "Strategy",  members: 11, description: "Multi-family, 1031 exchange, and portfolio buyer relationships.",                     private: true,  joined: false, cover: "#2D1A3D", avatars: [] },
  { id: "p6", name: "First Responders",    category: "Community", members: 8,  description: "Pro-bono and discounted services for emergency services personnel.",                  private: false, joined: false, cover: "#3D1A1A", avatars: ["CF","DM","RB","AL","TW"] },
  { id: "p7", name: "Ultra Luxury Circle", category: "Strategy",  members: 6,  description: "Invitation-only group for $5M+ transactions. Referral and co-listing coordination.", private: true,  joined: false, cover: "#0F2B4F", avatars: [] },
];

const DEN_SUBGROUPS = {
  p1: [
    { id: "sg1a", name: "Tempe Town Lake",      members: 5,  joined: true,  activity: "3 new listings shared",    lastActive: "2h ago",  description: "Focus on Tempe lakefront condos and mixed-use properties." },
    { id: "sg1b", name: "Saguaro Lake Estates", members: 4,  joined: false, activity: "Market report posted",      lastActive: "1d ago",  description: "East Valley lakefront luxury homes and acreage." },
    { id: "sg1c", name: "Waterfront Staging",   members: 6,  joined: true,  activity: "Staging tips thread",       lastActive: "4h ago",  description: "Best practices for photographing and staging water-view properties." },
  ],
  p2: [
    { id: "sg2a", name: "Desert Mountain",       members: 9,  joined: true,  activity: "Caravan notes from Tue",   lastActive: "1d ago",  description: "DM-specific intel: active listings, off-market, broker relationships." },
    { id: "sg2b", name: "Troon / Pinnacle Peak", members: 7,  joined: true,  activity: "New comp added",            lastActive: "6h ago",  description: "Troon North, Pinnacle Peak, and adjacent golf communities." },
    { id: "sg2c", name: "Silverleaf Specialists",members: 5,  joined: false, activity: "Referral opportunity",      lastActive: "3d ago",  description: "Exclusive Silverleaf enclave — invitation-only buyer network." },
    { id: "sg2d", name: "Golf Course Frontage",  members: 4,  joined: false, activity: "Pricing thread",            lastActive: "2d ago",  description: "Lot and home premium analysis for course-frontage listings." },
  ],
};

const PRIDE_CATEGORY_COLORS = { Market: "#0369A1", Specialty: "#7C3AED", Strategy: "#15803D", Community: "#C9A96E" };

// ── Global Search Index ───────────────────────────────────────────────────
const SEARCH_USERS = [
  { id:"u1",  name:"Yong Choi",        title:"Luxury Real Estate Agent", office:"Scottsdale",    years:3,  phone:"(480) 555-0200", email:"ychoi@russlyon.com",     initials:"YC", bg:"#FDF8F0" },
  { id:"u2",  name:"Lex Baum",       title:"Creative Director",        office:"Corporate HQ",  years:4,  phone:"(602) 555-0203", email:"lharmon@russlyon.com",   initials:"LH", bg:"#0F2B4F" },
  { id:"u3",  name:"David Kim",        title:"Chief Marketing Officer",  office:"Corporate HQ",  years:8,  phone:"(602) 555-0201", email:"dkim@russlyon.com",      initials:"DK", bg:"#EFF6FF" },
  { id:"u4",  name:"Derek Walsh",      title:"Marketing Manager",        office:"Corporate HQ",  years:5,  phone:"(602) 555-0202", email:"dwalsh@russlyon.com",    initials:"DW", bg:"#F0FDF4" },
  { id:"u5",  name:"Tom Alvarez",      title:"Real Estate Agent",        office:"Phoenix",        years:7,  phone:"(602) 555-0300", email:"talvarez@russlyon.com",  initials:"TA", bg:"#FFF7ED" },
  { id:"u6",  name:"Sarah Chen",       title:"Real Estate Agent",        office:"Scottsdale",    years:2,  phone:"(480) 555-0201", email:"schen@russlyon.com",     initials:"SC", bg:"#EFF6FF" },
  { id:"u7",  name:"Marcus Webb",      title:"Real Estate Agent",        office:"Sedona",        years:6,  phone:"(928) 555-0100", email:"mwebb@russlyon.com",     initials:"MW", bg:"#F0FDF4" },
  { id:"u8",  name:"Sandra Moore",     title:"Office Manager",           office:"Scottsdale",    years:9,  phone:"(480) 555-0101", email:"smoore@russlyon.com",    initials:"SM", bg:"#FDF4FF" },
  { id:"u9",  name:"Patricia Westfield",title:"Designated Broker",       office:"Corporate HQ",  years:15, phone:"(602) 555-0050", email:"pwestfield@russlyon.com",initials:"PW", bg:"#FFF1F2" },
  { id:"u10", name:"Robert Lyon",      title:"Chief Executive Officer",  office:"Corporate HQ",  years:22, phone:"(602) 555-0100", email:"rlyon@russlyon.com",     initials:"RL", bg:"#0F2B4F" },
];

const SEARCH_LISTINGS = [
  { id:"l1", address:"7842 E Pinnacle Peak Rd",   price:"$4,200,000", status:"Active",  city:"Scottsdale" },
  { id:"l2", address:"22 Mirabel Club Dr",         price:"$3,800,000", status:"Pending", city:"Scottsdale" },
  { id:"l3", address:"5 Saguaro Vista Ln",         price:"$6,100,000", status:"Active",  city:"Cave Creek" },
  { id:"l4", address:"120 Desert Mountain Pkwy",   price:"$8,500,000", status:"Active",  city:"Scottsdale" },
  { id:"l5", address:"4401 N 40th St, Suite 200",  price:"$2,950,000", status:"Sold",    city:"Phoenix"    },
  { id:"l6", address:"9 Taliesin West Circle",     price:"$5,750,000", status:"Active",  city:"Scottsdale" },
];

const SEARCH_PAGES = [
  { label:"Lyon's Den",         sub:"Home base",            nav:"lyonsden"  },
  { label:"Dashboard",          sub:"Your overview",        nav:"dashboard" },
  { label:"My Requests",        sub:"Marketing requests",   nav:"requester" },
  { label:"Design Queue",       sub:"Designer view",        nav:"designer"  },
  { label:"Operations Report",  sub:"Executive overview",   nav:"executive" },
  { label:"Prides",             sub:"Groups & communities", nav:"prides"    },
  { label:"Email",              sub:"Communication",        nav:"email"     },
  { label:"Messaging",          sub:"Direct messages",      nav:"messaging" },
  { label:"Org Chart",          sub:"Company structure",    nav:"orgchart"  },
  { label:"Analytics",          sub:"Market insights",      nav:"analytics" },
];

// Simple fuzzy scorer — returns 0 if no match, higher = better
function fuzzyScore(text, query) {
  if (!query) return 0;
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  // char-by-char subsequence
  let ti = 0, qi = 0, consec = 0, score = 0;
  while (ti < t.length && qi < q.length) {
    if (t[ti] === q[qi]) { qi++; score += (consec++ * 2 + 1); }
    else consec = 0;
    ti++;
  }
  return qi === q.length ? Math.max(1, score) : 0;
}

function searchAll(query) {
  if (!query.trim()) return [];
  const results = [];
  // Pages
  SEARCH_PAGES.forEach(p => {
    const s = Math.max(fuzzyScore(p.label, query), fuzzyScore(p.sub, query));
    if (s > 0) results.push({ type:"page", score:s, label:p.label, sub:p.sub, nav:p.nav });
  });
  // Users
  SEARCH_USERS.forEach(u => {
    const s = Math.max(fuzzyScore(u.name, query), fuzzyScore(u.title, query), fuzzyScore(u.office, query));
    if (s > 0) results.push({ type:"user", score:s, label:u.name, sub:`${u.title} · ${u.office}`, data:u });
  });
  // Listings
  SEARCH_LISTINGS.forEach(l => {
    const s = Math.max(fuzzyScore(l.address, query), fuzzyScore(l.city, query));
    if (s > 0) results.push({ type:"listing", score:s, label:l.address, sub:`${l.price} · ${l.status} · ${l.city}`, data:l });
  });
  // Prides (visible ones only)
  DEN_PRIDES.filter(p => !p.private || p.joined).forEach(p => {
    const s = Math.max(fuzzyScore(p.name, query), fuzzyScore(p.category, query), fuzzyScore(p.description, query));
    if (s > 0) results.push({ type:"pride", score:s, label:p.name, sub:`Group · ${p.category}`, id:p.id });
  });
  // Sort by score desc, limit 8
  return results.sort((a,b) => b.score - a.score).slice(0, 8);
}


// ── Org Chart Data ────────────────────────────────────────────────────────
const ORG_CORPORATE = {
  id:"root", name:"Russ Lyon Sotheby's Int'l Realty", title:"Ownership Group", type:"root", dept:"", email:"", phone:"", office:"Corporate HQ", years:30,
  children:[{
    id:"ceo", name:"Robert Lyon", title:"Chief Executive Officer", type:"csuite", dept:"Executive", email:"rlyon@russlyon.com", phone:"(602) 555-0100", office:"Corporate HQ", years:22,
    children:[
      { id:"cmo", name:"David Kim", title:"Chief Marketing Officer", type:"csuite", dept:"Marketing", email:"dkim@russlyon.com", phone:"(602) 555-0201", office:"Corporate HQ", years:8,
        children:[
          { id:"mktg-mgr", name:"Derek Walsh",  title:"Marketing Manager",  type:"manager", dept:"Marketing", email:"dwalsh@russlyon.com",  phone:"(602) 555-0202", office:"Corporate HQ", years:5, children:[] },
          { id:"creative", name:"Lex Baum",   title:"Creative Director",  type:"manager", dept:"Marketing", email:"lharmon@russlyon.com", phone:"(602) 555-0203", office:"Corporate HQ", years:4, children:[] },
        ]},
      { id:"cto", name:"James Park",     title:"Chief Technology Officer", type:"csuite", dept:"Technology", email:"jpark@russlyon.com",  phone:"(602) 555-0301", office:"Corporate HQ", years:6, children:[] },
      { id:"cfo", name:"Patricia Hill",  title:"Chief Financial Officer",  type:"csuite", dept:"Finance",    email:"phill@russlyon.com",  phone:"(602) 555-0401", office:"Corporate HQ", years:11, children:[] },
      { id:"coo", name:"Angela Torres",  title:"Chief Operating Officer",  type:"csuite", dept:"Operations", email:"atorres@russlyon.com", phone:"(602) 555-0501", office:"Corporate HQ", years:9, children:[
        { id:"hr-mgr",  name:"Kevin Liu",     title:"HR Manager",           type:"manager", dept:"Human Resources", email:"kliu@russlyon.com",  phone:"(602) 555-0502", office:"Corporate HQ", years:4, children:[] },
        { id:"ops-mgr", name:"Lisa Reyes",    title:"Operations Manager",   type:"manager", dept:"Operations",      email:"lreyes@russlyon.com", phone:"(602) 555-0503", office:"Corporate HQ", years:6, children:[] },
      ]},
    ]
  }]
};

const ORG_BROKERAGE_ROOT = {
  id:"owners", name:"Russ Lyon Sotheby's Int'l Realty", title:"Ownership Group", type:"root", dept:"", email:"", phone:"", office:"Corporate HQ", years:30,
  children:[{
    id:"desig-broker", name:"Patricia Westfield", title:"Designated Broker — Arizona", type:"broker", dept:"Brokerage", email:"pwestfield@russlyon.com", phone:"(602) 555-0050", office:"Corporate HQ", years:15,
    children:[] // offices injected below as drill-down
  }]
};

const ORG_OFFICES = [
  { id:"off-scottsdale", name:"Scottsdale", agents:68, address:"7135 E Camelback Rd" },
  { id:"off-phoenix",    name:"Phoenix",    agents:41, address:"3200 E Camelback Rd" },
  { id:"off-sedona",     name:"Sedona",     agents:22, address:"100 Tlaquepaque Ln"  },
  { id:"off-flagstaff",  name:"Flagstaff",  agents:14, address:"1 N San Francisco St" },
  { id:"off-tucson",     name:"Tucson",     agents:31, address:"4500 N Campbell Ave"  },
];

const ORG_OFFICE_TREES = {
  "off-scottsdale": {
    id:"off-scottsdale", name:"Scottsdale Office", title:"Scottsdale", type:"office",
    children:[{
      id:"om-scottsdale", name:"Sandra Moore", title:"Office Manager", type:"manager", dept:"Operations", email:"smoore@russlyon.com", phone:"(480) 555-0101", office:"Scottsdale", years:9,
      children:[
        { id:"ya-scott", name:"Yong Choi",    title:"Luxury Real Estate Agent", type:"agent", dept:"Sales", email:"ychoi@russlyon.com",  phone:"(480) 555-0200", office:"Scottsdale", years:3, children:[] },
        { id:"sc-scott", name:"Sarah Chen",   title:"Real Estate Agent",        type:"agent", dept:"Sales", email:"schen@russlyon.com",  phone:"(480) 555-0201", office:"Scottsdale", years:2, children:[] },
        { id:"rj-scott", name:"Rachel Jones", title:"Real Estate Agent",        type:"agent", dept:"Sales", email:"rjones@russlyon.com", phone:"(480) 555-0202", office:"Scottsdale", years:5, children:[] },
        { id:"bk-scott", name:"Brian Kim",    title:"Real Estate Agent",        type:"agent", dept:"Sales", email:"bkim@russlyon.com",   phone:"(480) 555-0203", office:"Scottsdale", years:4, children:[] },
        { id:"aa-scott", name:"Amy Allen",    title:"Office Administrator",     type:"admin", dept:"Operations", email:"aallen@russlyon.com", phone:"(480) 555-0110", office:"Scottsdale", years:6, children:[] },
      ]
    }]
  },
  "off-phoenix": {
    id:"off-phoenix", name:"Phoenix Office", title:"Phoenix", type:"office",
    children:[{
      id:"om-phoenix", name:"Robert Chen", title:"Office Manager", type:"manager", dept:"Operations", email:"rchen@russlyon.com", phone:"(602) 555-0301", office:"Phoenix", years:7,
      children:[
        { id:"ta-phx", name:"Tom Alvarez",  title:"Real Estate Agent", type:"agent", dept:"Sales", email:"talvarez@russlyon.com", phone:"(602) 555-0302", office:"Phoenix", years:7, children:[] },
        { id:"mw-phx", name:"Mike Wong",    title:"Real Estate Agent", type:"agent", dept:"Sales", email:"mwong@russlyon.com",    phone:"(602) 555-0303", office:"Phoenix", years:3, children:[] },
        { id:"jl-phx", name:"Janet Lin",    title:"Office Administrator", type:"admin", dept:"Operations", email:"jlin@russlyon.com", phone:"(602) 555-0310", office:"Phoenix", years:4, children:[] },
      ]
    }]
  },
  "off-sedona": {
    id:"off-sedona", name:"Sedona Office", title:"Sedona", type:"office",
    children:[{
      id:"om-sedona", name:"Maria Santos", title:"Office Manager", type:"manager", dept:"Operations", email:"msantos@russlyon.com", phone:"(928) 555-0101", office:"Sedona", years:5,
      children:[
        { id:"mw-sed", name:"Marcus Webb", title:"Real Estate Agent", type:"agent", dept:"Sales", email:"mwebb@russlyon.com",  phone:"(928) 555-0102", office:"Sedona", years:6, children:[] },
        { id:"kd-sed", name:"Kate Davis",  title:"Real Estate Agent", type:"agent", dept:"Sales", email:"kdavis@russlyon.com", phone:"(928) 555-0103", office:"Sedona", years:2, children:[] },
      ]
    }]
  },
  "off-flagstaff": {
    id:"off-flagstaff", name:"Flagstaff Office", title:"Flagstaff", type:"office",
    children:[{
      id:"om-flag", name:"Chris Porter", title:"Office Manager", type:"manager", dept:"Operations", email:"cporter@russlyon.com", phone:"(928) 555-0201", office:"Flagstaff", years:3,
      children:[
        { id:"hp-flag", name:"Helen Park", title:"Real Estate Agent", type:"agent", dept:"Sales", email:"hpark@russlyon.com", phone:"(928) 555-0202", office:"Flagstaff", years:4, children:[] },
      ]
    }]
  },
  "off-tucson": {
    id:"off-tucson", name:"Tucson Office", title:"Tucson", type:"office",
    children:[{
      id:"om-tucson", name:"Diana Reed", title:"Office Manager", type:"manager", dept:"Operations", email:"dreed@russlyon.com", phone:"(520) 555-0101", office:"Tucson", years:8,
      children:[
        { id:"pw-tuc", name:"Paul Wright",  title:"Real Estate Agent", type:"agent", dept:"Sales", email:"pwright@russlyon.com", phone:"(520) 555-0102", office:"Tucson", years:5, children:[] },
        { id:"mr-tuc", name:"Maya Reyes",   title:"Real Estate Agent", type:"agent", dept:"Sales", email:"mreyes@russlyon.com",  phone:"(520) 555-0103", office:"Tucson", years:1, children:[] },
        { id:"tw-tuc", name:"Tom Walsh",    title:"Office Administrator", type:"admin", dept:"Operations", email:"twalsh@russlyon.com", phone:"(520) 555-0110", office:"Tucson", years:3, children:[] },
      ]
    }]
  },
};

// Initials helper for org chart
function orgInitials(name) { return name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase(); }
function orgNodeStyle(type) {
  if (type === "root")    return { bg:"var(--navy)",  border:"none",                     txtColor:"white", subColor:"rgba(255,255,255,0.55)" };
  if (type === "csuite")  return { bg:"var(--navy)",  border:"3px solid var(--gold)",    txtColor:"white", subColor:"rgba(255,255,255,0.55)" };
  if (type === "broker")  return { bg:"var(--navy)",  border:"3px solid var(--gold)",    txtColor:"white", subColor:"rgba(255,255,255,0.55)" };
  if (type === "manager") return { bg:"white",        border:"1px solid var(--border)",  txtColor:"var(--navy)", subColor:"#6B7280", topBorder:"2px solid var(--gold)" };
  if (type === "agent")   return { bg:"white",        border:"1px solid var(--border)",  txtColor:"var(--navy)", subColor:"#6B7280" };
  if (type === "admin")   return { bg:"#F9F7F4",      border:"1px dashed #D5D0C8",       txtColor:"var(--navy)", subColor:"#9CA3AF" };
  if (type === "office")  return { bg:"var(--navy)",  border:"2px solid var(--gold)",    txtColor:"white", subColor:"rgba(255,255,255,0.55)" };
  return { bg:"white", border:"1px solid var(--border)", txtColor:"var(--navy)", subColor:"#6B7280" };
}




const DEN_RESOURCES = [
  { id: "r1", category: "Brand", label: "2026 Brand Kit",          icon: "M4 4h12v12H4V4z M4 9h12 M9 4v12", color: "#C9A96E" },
  { id: "r2", category: "Brand", label: "Logo Suite",              icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5", color: "#C9A96E" },
  { id: "r3", category: "Legal", label: "Purchase Contract",       icon: "M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "#0891B2" },
  { id: "r4", category: "Legal", label: "Listing Agreement",       icon: "M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "#0891B2" },
  { id: "r5", category: "Tools", label: "MLS / Flexmls",           icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", color: "#7C3AED" },
  { id: "r6", category: "Tools", label: "ShowingTime",             icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "#7C3AED" },
  { id: "r7", category: "Tools", label: "DocuSign",                icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z", color: "#7C3AED" },
  { id: "r8", category: "HR",    label: "Benefits Portal",         icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "#15803D" },
  { id: "r9", category: "HR",    label: "PTO Request",             icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "#15803D" },
];

const LIVE_MEETING = {
  title: "All-Hands Q1 Wrap",
  host: "David Kim",
  startTime: "3:00 PM",
  date: "Thursday, March 10",
  attendees: 34,
  link: "#",
};

// hero images per post (Unsplash)
const DEN_HERO_IMAGES = {
  a1: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=900&q=80", // celebration/office
  a2: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80", // luxury home PV
  a3: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80", // team welcome
  a4: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=900&q=80", // design/brand
};

// Zoom mock participants
const ZOOM_PARTICIPANTS = [
  { initials: "DK", bg: "#EFF6FF", text: "#1D4ED8", name: "David Kim" },
  { initials: "LH", bg: "#0F2B4F", text: "#C9A96E", name: "Lex Baum" },
  { initials: "TN", bg: "#F0FDF4", text: "#15803D", name: "Tom Nguyen" },
  { initials: "YC", bg: "#FDF8F0", text: "#C9A96E", name: "Yong Choi" },
  { initials: "SK", bg: "#F5F3FF", text: "#6D28D9", name: "Sarah K." },
  { initials: "MW", bg: "#FFF7ED", text: "#C2410C", name: "Marcus W." },
];

function ZoomThumbnail() {
  const [joined, setJoined] = React.useState(false);
  return (
    <div style={{
      background: "#1A1A2E", borderRadius: 8, overflow: "hidden",
      border: "2px solid #22C55E", marginBottom: 0,
    }}>
      {/* Participant grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, padding: 2 }}>
        {ZOOM_PARTICIPANTS.map((p, i) => (
          <div key={i} style={{
            aspectRatio: "16/9", background: i === 0 ? "#0F2B4F" : "#1E293B",
            borderRadius: 4, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3, position: "relative",
            border: i === 0 ? "1.5px solid #22C55E" : "1.5px solid transparent",
          }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: p.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: p.text }}>{p.initials}</span>
            </div>
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.5)", maxWidth: 44, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            {i === 0 && (
              <div style={{ position: "absolute", bottom: 3, left: 4, display: "flex", gap: 2 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><rect x="2" y="1" width="4" height="5" rx="1.5" stroke="white" strokeWidth="0.8"/><path d="M4 6v1.5M3 7.5h2" stroke="white" strokeWidth="0.8" strokeLinecap="round"/></svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Controls bar */}
      <div style={{ background: "#111827", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
          <span style={{ fontSize: 9, color: "#22C55E", fontWeight: 700 }}>LIVE</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>34 attendees</span>
        </div>
        <button
          onClick={() => setJoined(j => !j)}
          style={{
            background: joined ? "#DC2626" : "#22C55E",
            border: "none", borderRadius: 3, padding: "4px 10px",
            fontSize: 9, fontWeight: 700, color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4, transition: "background 0.15s",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="2.5" width="6" height="7" rx="1" stroke="white" strokeWidth="1.2"/>
            <path d="M7 4.5L11 2.5v7L7 7.5V4.5z" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          {joined ? "Leave" : "Join"}
        </button>
      </div>
    </div>
  );
}

function FeedHero({ post, onSelect, active }) {
  return (
    <div
      onClick={() => onSelect(post.id)}
      style={{
        position: "relative", borderRadius: 8, overflow: "hidden",
        cursor: "pointer", height: 240, flexShrink: 0,
        boxShadow: active ? "0 0 0 2px var(--gold)" : "none",
        transition: "box-shadow 0.15s",
      }}
    >
      <img
        src={DEN_HERO_IMAGES[post.id]}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(10,20,40,0.92) 0%, rgba(10,20,40,0.4) 55%, transparent 100%)",
      }} />
      {/* Top badges */}
      <div style={{ position: "absolute", top: 12, left: 14, display: "flex", gap: 6 }}>
        {post.pinned && (
          <span style={{ fontSize: 9, fontWeight: 700, background: "var(--gold)", color: "var(--navy)", borderRadius: 2, padding: "2px 7px", letterSpacing: "0.06em" }}>PINNED</span>
        )}
        <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(255,255,255,0.15)", color: "white", borderRadius: 2, padding: "2px 7px", letterSpacing: "0.06em", backdropFilter: "blur(4px)" }}>
          {post.type === "announcement" ? "ANNOUNCEMENT" : "BLOG"}
        </span>
      </div>
      {/* Bottom content */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 18px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400, color: "white", lineHeight: 1.25, marginBottom: 6 }}>{post.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: post.avatarBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 7, fontWeight: 700, color: post.avatarText }}>{post.initials}</span>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{post.author}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>·</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{post.time}</span>
        </div>
      </div>
    </div>
  );
}

function FeedRow({ post }) {
  const [liked, setLiked] = React.useState({});
  return (
    <div style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid #F3F4F6", alignItems: "flex-start" }}>
      {/* Thumbnail */}
      <div style={{ width: 72, height: 52, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "#F3F4F6" }}>
        <img src={DEN_HERO_IMAGES[post.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 400, color: "var(--navy)", lineHeight: 1.3, marginBottom: 4 }}>{post.title}</div>
        <div style={{ fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 }}>{post.body}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#9CA3AF" }}><ProfileLink name={post.author} style={{ color: "#9CA3AF" }} /> · {post.time}</span>
          <div style={{ display: "flex", gap: 4 }}>
            {Object.entries(post.reactions).slice(0, 2).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => setLiked(l => ({ ...l, [emoji]: !l[emoji] }))}
                style={{
                  display: "flex", alignItems: "center", gap: 2, padding: "1px 6px", borderRadius: 10,
                  border: `1px solid ${liked[emoji] ? "var(--gold)" : "var(--border)"}`,
                  background: liked[emoji] ? "#FDF8F0" : "white",
                  cursor: "pointer", fontSize: 10, fontFamily: "var(--font-body)", transition: "all 0.12s",
                }}
              >
                <span>{emoji}</span>
                <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600 }}>{liked[emoji] ? count + 1 : count}</span>
              </button>
            ))}
          </div>
          <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: "auto" }}>💬 {post.comments}</span>
        </div>
      </div>
    </div>
  );
}

function PlaceholderPage({ title, icon }) {
  return (
    <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "#9CA3AF" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300, color: "#D1D5DB" }}>{title}</div>
      <div style={{ fontSize: 12 }}>Coming soon</div>
    </div>
  );
}

// ── Sotheby's-native design system for Prides ─────────────────────────────
// Single palette: Navy / Gold / Cream / White. No rainbow category colors.
// Typography: Cormorant Garamond display, DM Sans body.

function SubgroupCard({ sg, onToggle }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      style={{
        background: "white", borderLeft: `2px solid ${sg.joined ? "var(--gold)" : "#E5E1D8"}`,
        borderTop: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        padding: "14px 16px", transition: "border-color 0.15s",
      }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 400, color: "var(--navy)" }}>{sg.name}</span>
            {sg.joined && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", borderBottom: "1px solid var(--gold)" }}>Member</span>}
          </div>
          <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5, marginBottom: 8 }}>{sg.description}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>{sg.members} members</span>
            <span style={{ fontSize: 10, color: "#D1D5DB" }}>·</span>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>{sg.lastActive}</span>
          </div>
        </div>
        <button
          onClick={() => onToggle(sg.id)}
          style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "5px 12px", border: "1px solid", cursor: "pointer", flexShrink: 0,
            borderColor: sg.joined ? "#D1D5DB" : "var(--navy)",
            background: sg.joined ? "white" : "var(--navy)",
            color: sg.joined ? "#9CA3AF" : "white",
            transition: "all 0.14s",
          }}
          onMouseEnter={e => { if (sg.joined) { e.currentTarget.style.borderColor = "#9CA3AF"; e.currentTarget.style.color = "#6B7280"; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = sg.joined ? "#D1D5DB" : "var(--navy)"; e.currentTarget.style.color = sg.joined ? "#9CA3AF" : "white"; }}
        >{sg.joined ? "Leave" : "Join"}</button>
      </div>
    </div>
  );
}

const PRIDE_MESSAGES = {
  p1: [
    { id: 1, author: "Lex Baum",   initials: "LH", time: "9:14 AM",  text: "Anyone have comps for the Tempe Town Lake listings? Seeing some movement this week.", type: "text" },
    { id: 2, author: "Sarah Chen",   initials: "SC", time: "9:22 AM",  text: "Pulled three from last month — $1.2M, $1.45M, $1.6M. All lakefront condos under 2,500 sq ft. Dropping the full comp sheet now.", type: "text" },
    { id: 3, author: "Sarah Chen",   initials: "SC", time: "9:23 AM",  text: "Tempe_Lakefront_Comps_Feb2026.pdf", type: "file", fileSize: "248 KB" },
    { id: 4, author: "Yong Choi",    initials: "YC", time: "10:05 AM", text: "Perfect timing — I have a buyer coming in from Seattle next week. Will review tonight.", type: "text", isMe: true },
    { id: 5, author: "Marcus Webb",  initials: "MW", time: "10:31 AM", text: "Heads up: unit 4B just went back on market. Price dropped $80K. Could be interesting for motivated buyers.", type: "text" },
    { id: 6, author: "Lex Baum",   initials: "LH", time: "11:00 AM", text: "Nice find Marcus. I'll schedule a walkthrough — anyone want to co-show?", type: "text" },
    { id: 7, author: "Yong Choi",    initials: "YC", time: "11:08 AM", text: "I'm in. Wednesday afternoon works for me.", type: "text", isMe: true },
  ],
  p2: [
    { id: 1, author: "Tom Alvarez",  initials: "TA", time: "8:45 AM",  text: "Broker caravan recap: Desert Mountain had 3 units open Tuesday. Apache Peak lot is a serious value play at $1.8M.", type: "text" },
    { id: 2, author: "Yong Choi",    initials: "YC", time: "8:52 AM",  text: "That Apache Peak lot has been sitting since October. Seller is motivated — worth a direct approach.", type: "text", isMe: true },
    { id: 3, author: "David Kim",    initials: "DK", time: "9:10 AM",  text: "Golf community Q1 summary is ready.", type: "text" },
    { id: 4, author: "David Kim",    initials: "DK", time: "9:10 AM",  text: "GolfDesk_Q1_Market_Summary.pdf", type: "file", fileSize: "1.2 MB" },
    { id: 5, author: "Tom Alvarez",  initials: "TA", time: "9:44 AM",  text: "Great summary David. Silverleaf numbers are strong — anyone working buyers in that range?", type: "text" },
    { id: 6, author: "Yong Choi",    initials: "YC", time: "9:58 AM",  text: "Yes — two leads from last month's open house. Both golf-focused, $3M+ range. Will loop you in Tom.", type: "text", isMe: true },
  ],
};

const PRIDE_FILES = {
  p1: [
    { id: "f1", name: "Tempe_Lakefront_Comps_Feb2026.pdf", size: "248 KB", author: "Sarah Chen", date: "Mar 8"  },
    { id: "f2", name: "Waterfront_Staging_Guide_v2.pdf",   size: "3.4 MB", author: "Lex Baum", date: "Mar 3"  },
    { id: "f3", name: "Q1_Lakefront_Market_Data.xlsx",     size: "180 KB", author: "Yong Choi",  date: "Feb 28" },
    { id: "f4", name: "Lake_Property_Checklist.docx",      size: "92 KB",  author: "Marcus Webb", date: "Feb 20" },
  ],
  p2: [
    { id: "f1", name: "GolfDesk_Q1_Market_Summary.pdf",     size: "1.2 MB", author: "David Kim",   date: "Mar 8"  },
    { id: "f2", name: "Desert_Mountain_Comps_Q1.xlsx",      size: "340 KB", author: "Tom Alvarez", date: "Mar 5"  },
    { id: "f3", name: "Silverleaf_Buyer_Profile_2026.pdf",  size: "2.1 MB", author: "Lex Baum",  date: "Mar 1"  },
    { id: "f4", name: "Golf_Community_Talking_Points.docx", size: "78 KB",  author: "Yong Choi",   date: "Feb 22" },
    { id: "f5", name: "Broker_Caravan_Notes_Mar.txt",       size: "12 KB",  author: "Tom Alvarez", date: "Feb 18" },
  ],
};

const PRIDE_MEMBERS = {
  p1: [
    { name: "Yong Choi",   initials: "YC", online: true,  role: "Member", isMe: true  },
    { name: "Lex Baum",  initials: "LH", online: true,  role: "Lead"   },
    { name: "Sarah Chen",  initials: "SC", online: false, role: "Member" },
    { name: "Marcus Webb", initials: "MW", online: true,  role: "Member" },
    { name: "Tom Nguyen",  initials: "TN", online: false, role: "Member" },
  ],
  p2: [
    { name: "Yong Choi",   initials: "YC", online: true,  role: "Member", isMe: true  },
    { name: "Tom Alvarez", initials: "TA", online: true,  role: "Lead"   },
    { name: "David Kim",   initials: "DK", online: true,  role: "Member" },
    { name: "Lex Baum",  initials: "LH", online: false, role: "Member" },
    { name: "Sarah Chen",  initials: "SC", online: false, role: "Member" },
    { name: "Marcus Webb", initials: "MW", online: true,  role: "Member" },
  ],
};

function fileExt(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf')  return { label: 'PDF',  color: '#9B1C1C' };
  if (ext === 'xlsx') return { label: 'XLS',  color: '#14532D' };
  if (ext === 'docx') return { label: 'DOC',  color: '#1E3A5F' };
  return { label: ext.toUpperCase(), color: '#4B5563' };
}

// ── Chat Tab ────────────────────────────────────────────────────────────────
function PrideChatTab({ prideId }) {
  const [messages, setMessages] = React.useState(PRIDE_MESSAGES[prideId] || []);
  const [input, setInput]       = React.useState("");
  const [nextId, setNextId]     = React.useState(100);
  const bottomRef = React.useRef(null);
  React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    const txt = input.trim(); if (!txt) return;
    const id = nextId + 1; setNextId(id);
    setMessages(ms => [...ms, { id, author: "Yong Choi", initials: "YC", time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), text: txt, type: "text", isMe: true }]);
    setInput("");
  };

  const members = PRIDE_MEMBERS[prideId] || [];

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

      {/* Members column */}
      <div style={{ width: 192, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "white" }}>
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF" }}>Members · {members.length}</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Online */}
          <div style={{ padding: "10px 16px 4px", fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C4B9AA" }}>Online</div>
          {members.filter(m => m.online).map(m => (
            <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 16px", background: m.isMe ? "#FDFAF5" : "transparent" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <ProfileAvatar name={m.isMe ? null : m.name} initials={m.initials} bg={m.isMe ? "var(--navy)" : "#F3F0EB"} txtColor={m.isMe ? "var(--gold)" : "var(--navy)"} size={28} />
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 7, height: 7, borderRadius: "50%", background: "#22C55E", border: "1.5px solid white", pointerEvents:"none" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {m.isMe
                  ? <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)" }}>You</div>
                  : <ProfileLink name={m.name} style={{ fontSize: 11, color: "var(--navy)", display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} />
                }
                <div style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: "0.03em" }}>{m.role}</div>
              </div>
            </div>
          ))}
          {/* Offline */}
          {members.filter(m => !m.online).length > 0 && (
            <>
              <div style={{ padding: "10px 16px 4px", fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C4B9AA" }}>Away</div>
              {members.filter(m => !m.online).map(m => (
                <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 16px", opacity: 0.5 }}>
                  <ProfileAvatar name={m.name} initials={m.initials} bg="#F3F0EB" txtColor="var(--navy)" size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ProfileLink name={m.name} style={{ fontSize: 11, color: "var(--navy)", display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} />
                    <div style={{ fontSize: 9, color: "#9CA3AF" }}>{m.role}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Thread */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "#FAFAF9" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            const showHeader = !prev || prev.author !== msg.author;
            const isFile = msg.type === "file";
            if (msg.isMe) return (
              <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end", marginTop: showHeader ? 16 : 3 }}>
                <div style={{ maxWidth: "62%" }}>
                  {showHeader && <div style={{ fontSize: 9, color: "#9CA3AF", textAlign: "right", marginBottom: 4, letterSpacing: "0.04em" }}>{msg.time}</div>}
                  {isFile ? (
                    <div style={{ background: "#F3F0EB", border: "1px solid #E5E1D8", borderLeft: "3px solid var(--gold)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                      </div>
                      <div><div style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)" }}>{msg.text}</div><div style={{ fontSize: 10, color: "#9CA3AF" }}>{msg.fileSize}</div></div>
                    </div>
                  ) : (
                    <div style={{ background: "var(--navy)", padding: "10px 14px", fontSize: 12, color: "white", lineHeight: 1.55 }}>{msg.text}</div>
                  )}
                </div>
              </div>
            );
            return (
              <div key={msg.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: showHeader ? 16 : 3 }}>
                {showHeader
                  ? <ProfileAvatar name={msg.author} initials={msg.initials} bg="#F3F0EB" txtColor="var(--navy)" size={28} style={{ marginTop:2 }} />
                  : <div style={{ width: 28, flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  {showHeader && <div style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 3 }}><ProfileLink name={msg.author} style={{ fontWeight: 600, color: "var(--navy)", fontSize: 11 }} /> <span style={{ fontWeight: 400, color: "#9CA3AF", fontSize: 9, letterSpacing: "0.03em" }}>{msg.time}</span></div>}
                  {isFile ? (
                    <div style={{ background: "white", border: "1px solid var(--border)", borderLeft: "3px solid var(--gold)", padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                      </div>
                      <div><div style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)" }}>{msg.text}</div><div style={{ fontSize: 10, color: "#9CA3AF" }}>{msg.fileSize}</div></div>
                    </div>
                  ) : (
                    <div style={{ background: "white", border: "1px solid #EEEBE4", padding: "10px 14px", fontSize: 12, color: "#1F2937", lineHeight: 1.55, display: "inline-block", maxWidth: "100%" }}>{msg.text}</div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 16px", display: "flex", gap: 8, alignItems: "flex-end", background: "white" }}>
          <button title="Attach file" style={{ width: 32, height: 32, border: "1px solid var(--border)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = "#F9F7F4"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <textarea
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message the group…"
            rows={1}
            style={{ flex: 1, border: "1px solid var(--border)", padding: "8px 12px", fontSize: 12, fontFamily: "var(--font-body)", resize: "none", outline: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", background: "#FAFAF9" }}
            onFocus={e => e.target.style.borderColor = "var(--navy)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
          <button onClick={send} style={{ width: 32, height: 32, border: "none", cursor: "pointer", background: input.trim() ? "var(--navy)" : "#E5E1D8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Files Tab ────────────────────────────────────────────────────────────────
function PrideFilesTab({ prideId }) {
  const [files, setFiles] = React.useState(PRIDE_FILES[prideId] || []);
  const [dragging, setDragging] = React.useState(false);

  const handleDrop = e => {
    e.preventDefault(); setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    const newFiles = dropped.map((f, i) => ({
      id: "new" + i, name: f.name,
      size: f.size > 1048576 ? (f.size/1048576).toFixed(1)+" MB" : Math.round(f.size/1024)+" KB",
      author: "Yong Choi", date: "Just now",
    }));
    setFiles(fs => [...newFiles, ...fs]);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "#FAFAF9" }}>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{ border: `1px dashed ${dragging ? "var(--navy)" : "#D5D0C8"}`, padding: "24px", textAlign: "center", marginBottom: 24, background: dragging ? "#FDFAF5" : "white", transition: "all 0.15s", cursor: "pointer" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dragging ? "var(--navy)" : "#C4B9AA"} strokeWidth="1.4" style={{ marginBottom: 8 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        <div style={{ fontSize: 12, fontWeight: 600, color: dragging ? "var(--navy)" : "#9CA3AF" }}>{dragging ? "Release to upload" : "Drag files here to share with the group"}</div>
        <div style={{ fontSize: 10, color: "#C4B9AA", marginTop: 2 }}>PDF, Excel, Word, images accepted</div>
      </div>

      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 120px 72px", gap: 8, padding: "6px 12px 6px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
        {["Name","Size","Shared by","Date"].map(h => (
          <span key={h} style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9CA3AF" }}>{h}</span>
        ))}
      </div>
      {files.map(f => {
        const ext = fileExt(f.name);
        return (
          <div key={f.id} style={{ display: "grid", gridTemplateColumns: "1fr 72px 120px 72px", gap: 8, padding: "10px 12px", borderBottom: "1px solid #F5F3EE", background: "white", alignItems: "center", cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#FDFAF5"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{ width: 24, height: 24, background: ext.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 7, fontWeight: 800, color: "white", letterSpacing: "0.04em" }}>{ext.label}</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
            </div>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{f.size}</span>
            <ProfileLink name={f.author} style={{ fontSize: 11, color: "#6B7280" }} />
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>{f.date}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Calendar Tab ─────────────────────────────────────────────────────────────
function PrideCalendarTab() {
  const PRIDE_CAL_EVENTS = [
    { date: 11, title: "Group Showing",   time: "2:00 PM"  },
    { date: 15, title: "Strategy Call",   time: "10:00 AM" },
    { date: 22, title: "Market Review",   time: "1:00 PM"  },
    { date: 28, title: "Quarterly Sync",  time: "9:00 AM"  },
  ];
  const eventDays = new Set(PRIDE_CAL_EVENTS.map(e => e.date));
  const firstDay = new Date(CAL_YEAR, CAL_MONTH, 1).getDay();
  const daysInMonth = new Date(CAL_YEAR, CAL_MONTH + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "#FAFAF9" }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "start" }}>

        {/* Mini calendar */}
        <div style={{ background: "white", border: "1px solid var(--border)", width: 260 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 300, color: "var(--navy)" }}>March 2026</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)" }}>{PRIDE_CAL_EVENTS.length} events</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "10px 12px 4px" }}>
            {["S","M","T","W","T","F","S"].map((d,i) => <div key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "#9CA3AF" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, padding: "0 12px 12px" }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isToday = day === CAL_TODAY;
              const hasEvent = eventDays.has(day);
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5px 2px", cursor: hasEvent ? "pointer" : "default", background: isToday ? "var(--navy)" : "transparent", transition: "background 0.1s" }}
                  onMouseEnter={e => { if (!isToday && hasEvent) e.currentTarget.style.background = "#F9F7F4"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isToday ? "var(--navy)" : "transparent"; }}
                >
                  <span style={{ fontSize: 11, color: isToday ? "white" : "var(--navy)", fontWeight: isToday ? 700 : 400 }}>{day}</span>
                  {hasEvent && <div style={{ width: 3, height: 3, borderRadius: "50%", background: isToday ? "var(--gold)" : "var(--gold)", marginTop: 2 }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Event list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 12 }}>Upcoming</div>
          {PRIDE_CAL_EVENTS.map((ev, i) => (
            <div key={ev.date} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "14px 0", borderBottom: i < PRIDE_CAL_EVENTS.length - 1 ? "1px solid #F0EDE8" : "none" }}>
              <div style={{ width: 44, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 300, color: "var(--navy)", lineHeight: 1 }}>{ev.date}</div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF" }}>Mar</div>
              </div>
              <div style={{ width: 1, background: "var(--gold)", alignSelf: "stretch", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 2 }}>{ev.title}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{ev.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Pride Detail Page ────────────────────────────────────────────────────────
function PrideDetailPage({ pride, onBack, onTogglePride }) {
  const [tab, setTab] = React.useState("chat");
  const [subgroups, setSubgroups] = React.useState((DEN_SUBGROUPS[pride.id] || []).map(s => ({ ...s })));
  const toggleSubgroup = id => setSubgroups(sgs => sgs.map(s => s.id === id ? { ...s, joined: !s.joined } : s));

  const TABS = [
    { key: "chat",      label: "Chat" },
    { key: "calendar",  label: "Calendar" },
    { key: "files",     label: "Files" },
    { key: "subgroups", label: `Subgroups${subgroups.length ? " (" + subgroups.length + ")" : ""}` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>

      {/* Header */}
      <div style={{ background: "var(--navy)", padding: "0 28px", flexShrink: 0 }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: 0, transition: "color 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--gold)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Prides
          </button>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>›</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 300, color: "white", letterSpacing: "0.01em", flex: 1 }}>{pride.name}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{pride.members} members</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", borderBottom: "1px solid var(--gold)", paddingBottom: 1 }}>{pride.category}</span>
            <button onClick={() => onTogglePride(pride.id)} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "rgba(255,255,255,0.65)", cursor: "pointer", transition: "all 0.14s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
            >{pride.joined ? "Leave" : "Join"}</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
              fontSize: 11, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? "white" : "rgba(255,255,255,0.4)",
              borderBottom: `2px solid ${tab === t.key ? "var(--gold)" : "transparent"}`,
              letterSpacing: "0.03em", transition: "all 0.12s",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {tab === "chat"      && <PrideChatTab prideId={pride.id} />}
        {tab === "calendar"  && <PrideCalendarTab />}
        {tab === "files"     && <PrideFilesTab prideId={pride.id} />}
        {tab === "subgroups" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "#FAFAF9" }}>
            {subgroups.length === 0
              ? <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: 13 }}>No subgroups yet.</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 4 }}>Groups within {pride.name}</div>
                  {subgroups.map(sg => <SubgroupCard key={sg.id} sg={sg} onToggle={toggleSubgroup} />)}
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ── Prides Page (index) ──────────────────────────────────────────────────────
// ── Prides Page ──────────────────────────────────────────────────────────────
function RequestGroupModal({ onClose, onSubmit }) {
  const [name, setName]     = React.useState("");
  const [desc, setDesc]     = React.useState("");
  const [cat, setCat]       = React.useState("Market");
  const [priv, setPriv]     = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  if (submitted) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,43,79,0.55)", zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", width: 440, padding: "40px 36px", textAlign: "center" }}>
        <div style={{ width: 40, height: 40, background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300, color: "var(--navy)", marginBottom: 8 }}>Request Submitted</div>
        <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>
          Your request for <strong style={{ color: "var(--navy)" }}>{name}</strong> has been sent to management for review. You'll receive a notification once it's approved or if they need more information.
        </div>
        <button onClick={onClose} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "9px 24px", background: "var(--navy)", border: "none", color: "white", cursor: "pointer" }}>Done</button>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,43,79,0.55)", zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", width: 480, maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 300, color: "var(--navy)" }}>Request a New Group</div>
            <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>Submitted for manager approval</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7280", marginBottom: 5 }}>Group Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Historic Properties" style={{ width: "100%", border: "1px solid var(--border)", padding: "8px 10px", fontSize: 12, fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "var(--navy)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7280", marginBottom: 5 }}>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this group for? Who should join?" rows={3} style={{ width: "100%", border: "1px solid var(--border)", padding: "8px 10px", fontSize: 12, fontFamily: "var(--font-body)", outline: "none", resize: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "var(--navy)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7280", marginBottom: 5 }}>Category</label>
            <div style={{ display: "flex", gap: 0, border: "1px solid var(--border)" }}>
              {["Market","Specialty","Strategy","Community"].map((c, i, arr) => (
                <button key={c} onClick={() => setCat(c)} style={{ flex: 1, padding: "7px", fontSize: 10, fontWeight: cat === c ? 700 : 400, background: cat === c ? "var(--navy)" : "white", color: cat === c ? "white" : "#9CA3AF", border: "none", borderRight: i < arr.length-1 ? "1px solid var(--border)" : "none", cursor: "pointer", transition: "all 0.12s" }}>{c}</button>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px", background: "#F9F7F4", border: "1px solid #E5E1D8" }}>
            <div onClick={() => setPriv(p => !p)} style={{ width: 16, height: 16, border: `1px solid ${priv ? "var(--navy)" : "#D5D0C8"}`, background: priv ? "var(--navy)" : "white", flexShrink: 0, cursor: "pointer", marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {priv && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 2 }}>Private — invite only</div>
              <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5 }}>The group will not appear in the Prides directory. Members can only join via direct invitation from the group lead.</div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7280", marginBottom: 5 }}>Why should this group exist?</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Help management understand the business purpose…" rows={3} style={{ width: "100%", border: "1px solid var(--border)", padding: "8px 10px", fontSize: 12, fontFamily: "var(--font-body)", outline: "none", resize: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "var(--navy)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFAF9" }}>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>Reviewed by management within 2 business days</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 16px", border: "1px solid #D5D0C8", background: "white", color: "#9CA3AF", cursor: "pointer" }}>Cancel</button>
            <button
              onClick={() => { if (name.trim() && desc.trim()) setSubmitted(true); }}
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 20px", border: "none", background: name.trim() && desc.trim() ? "var(--navy)" : "#E5E1D8", color: name.trim() && desc.trim() ? "white" : "#9CA3AF", cursor: name.trim() && desc.trim() ? "pointer" : "default", transition: "all 0.15s" }}
            >Submit Request</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrideThumbnailCard({ pride, onClick, onToggle }) {
  const [hov, setHov] = React.useState(false);

  return (
    <div
      onClick={() => pride.joined && onClick(pride.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: "white", border: `1px solid ${hov && pride.joined ? "#C4B9AA" : "var(--border)"}`, display: "flex", flexDirection: "column", cursor: pride.joined ? "pointer" : "default", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: hov && pride.joined ? "0 2px 12px rgba(15,43,79,0.08)" : "none", overflow: "hidden" }}
    >
      {/* Cover band */}
      <div style={{ height: 72, background: pride.cover, position: "relative", flexShrink: 0 }}>
        {/* Subtle diagonal texture */}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg, transparent, transparent 12px, rgba(255,255,255,0.02) 12px, rgba(255,255,255,0.02) 13px)" }} />
        {/* Category label — bottom left of cover */}
        <div style={{ position: "absolute", bottom: 8, left: 12 }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>{pride.category}</span>
        </div>
        {/* Joined badge — top right */}
        {pride.joined && (
          <div style={{ position: "absolute", top: 8, right: 10, fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", borderBottom: "1px solid var(--gold)", paddingBottom: 1 }}>Member</div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "14px 14px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 400, color: "var(--navy)", marginBottom: 5, lineHeight: 1.2 }}>{pride.name}</div>
        <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5, marginBottom: 12, flex: 1 }}>{pride.description}</div>

        {/* Member avatars + count */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {pride.avatars.slice(0, 4).map((initials, i) => (
              <div key={i} style={{ width: 22, height: 22, background: "#F3F0EB", border: "1.5px solid white", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: i === 0 ? 0 : -6, zIndex: 4 - i, position: "relative" }}>
                <span style={{ fontSize: 7, fontWeight: 700, color: "var(--navy)", letterSpacing: "0.02em" }}>{initials}</span>
              </div>
            ))}
            {pride.members > 4 && (
              <div style={{ width: 22, height: 22, background: "#E5E1D8", border: "1.5px solid white", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: -6, position: "relative", zIndex: 0 }}>
                <span style={{ fontSize: 7, fontWeight: 700, color: "#9CA3AF" }}>+{pride.members - 4}</span>
              </div>
            )}
            <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 8 }}>{pride.members} members</span>
          </div>
        </div>
      </div>

      {/* Footer action */}
      <div style={{ borderTop: "1px solid #F5F3EE", padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAFAF9" }}>
        {pride.joined
          ? <span style={{ fontSize: 10, color: "#9CA3AF" }}>Open group ›</span>
          : <span style={{ fontSize: 10, color: "#9CA3AF" }}>Not a member</span>
        }
        <button
          onClick={e => { e.stopPropagation(); onToggle(pride.id); }}
          style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 12px", border: "1px solid", cursor: "pointer", transition: "all 0.14s", borderColor: pride.joined ? "#D5D0C8" : "var(--navy)", background: pride.joined ? "white" : "var(--navy)", color: pride.joined ? "#9CA3AF" : "white" }}
          onMouseEnter={e => { e.stopPropagation(); if (!pride.joined) e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >{pride.joined ? "Leave" : "Join"}</button>
      </div>
    </div>
  );
}

function PridesPage() {
  const [prides, setPrides]           = React.useState(DEN_PRIDES);
  const [filter, setFilter]           = React.useState("All");
  const [search, setSearch]           = React.useState("");
  const [selectedPrideId, setSelectedPrideId] = React.useState(null);
  const [showModal, setShowModal]     = React.useState(false);

  const toggle = id => setPrides(ps => ps.map(p => p.id === id ? { ...p, joined: !p.joined } : p));
  const categories = ["All", ...Array.from(new Set(DEN_PRIDES.map(p => p.category)))];

  if (selectedPrideId) {
    const pride = prides.find(p => p.id === selectedPrideId);
    return <PrideDetailPage pride={pride} onBack={() => setSelectedPrideId(null)} onTogglePride={toggle} />;
  }

  // Private groups are hidden entirely from non-members
  const visible = prides
    .filter(p => !p.private || p.joined)
    .filter(p => filter === "All" || p.category === filter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));

  const joined = prides.filter(p => p.joined);

  return (
    <div style={{ padding: "28px 0 60px" }}>
      {showModal && <RequestGroupModal onClose={() => setShowModal(false)} />}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.01em" }}>Prides</div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>You are a member of {joined.length} group{joined.length !== 1 ? "s" : ""}.</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 16px", background: "var(--navy)", border: "none", color: "white", cursor: "pointer", transition: "opacity 0.14s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Request New Group
        </button>
      </div>

      {/* Your groups strip */}
      {joined.length > 0 && (
        <div style={{ borderTop: "1px solid #E5E1D8", borderBottom: "1px solid #E5E1D8", padding: "9px 0", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9CA3AF", flexShrink: 0 }}>Your Groups</span>
          {joined.map(p => (
            <button key={p.id} onClick={() => setSelectedPrideId(p.id)} style={{ fontSize: 10, fontWeight: 600, color: "var(--navy)", background: "none", border: "1px solid #D5D0C8", padding: "3px 12px", cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--navy)"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "var(--navy)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--navy)"; e.currentTarget.style.borderColor = "#D5D0C8"; }}
            >{p.name}</button>
          ))}
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="9" cy="9" r="6" stroke="#9CA3AF" strokeWidth="1.6"/>
            <path d="M15 15l-3-3" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups…" style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7, border: "1px solid var(--border)", fontSize: 12, fontFamily: "var(--font-body)", outline: "none", background: "white", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = "var(--navy)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>
        <div style={{ display: "flex", gap: 0, border: "1px solid var(--border)" }}>
          {categories.map((cat, i) => (
            <button key={cat} onClick={() => setFilter(cat)} style={{ padding: "7px 14px", fontSize: 10, fontWeight: filter === cat ? 700 : 400, background: filter === cat ? "var(--navy)" : "white", color: filter === cat ? "white" : "#9CA3AF", border: "none", borderRight: i < categories.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", transition: "all 0.12s" }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Thumbnail grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {visible.map(pride => (
          <PrideThumbnailCard key={pride.id} pride={pride} onClick={setSelectedPrideId} onToggle={toggle} />
        ))}
        {visible.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 0", color: "#9CA3AF", fontSize: 13 }}>No groups match your search.</div>
        )}
      </div>
    </div>
  );
}

// ── Prides Panel (Lyon's Den sidebar) ────────────────────────────────────────
function PridesPanel() {
  const [prides, setPrides] = React.useState(DEN_PRIDES);
  const [expanded, setExpanded] = React.useState(false);
  const toggle = id => setPrides(ps => ps.map(p => p.id === id ? { ...p, joined: !p.joined } : p));
  const joined = prides.filter(p => p.joined);
  // Panel only shows joined groups + public non-joined (not private hidden ones)
  const panelPrides = prides.filter(p => p.joined || !p.private);
  const visible = expanded ? panelPrides : panelPrides.slice(0, 3);

  return (
    <div style={{ background: "white", border: "1px solid var(--border)" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--navy)" }}>Prides</span>
        <span style={{ fontSize: 9, color: "#9CA3AF" }}>{joined.length} joined</span>
      </div>
      {joined.length > 0 && (
        <div style={{ padding: "8px 14px", borderBottom: "1px solid #F5F3EE", display: "flex", gap: 5, flexWrap: "wrap" }}>
          {joined.map(p => (
            <span key={p.id} style={{ fontSize: 9, fontWeight: 600, color: "var(--navy)", border: "1px solid #D5D0C8", padding: "2px 8px", letterSpacing: "0.04em" }}>{p.name}</span>
          ))}
        </div>
      )}
      {visible.map((pride, i) => (
        <div key={pride.id} style={{ padding: "10px 14px", borderBottom: i < visible.length - 1 ? "1px solid #F5F3EE" : "none" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 400, color: "var(--navy)" }}>{pride.name}</span>
                {pride.joined && <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", borderBottom: "1px solid var(--gold)" }}>Member</span>}
              </div>
              <div style={{ fontSize: 10, color: "#9CA3AF" }}>{pride.members} members · {pride.category}</div>
            </div>
            <button onClick={() => toggle(pride.id)} style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 9px", border: "1px solid", cursor: "pointer", flexShrink: 0, borderColor: pride.joined ? "#D5D0C8" : "var(--navy)", background: pride.joined ? "white" : "var(--navy)", color: pride.joined ? "#9CA3AF" : "white", transition: "all 0.14s" }}>
              {pride.joined ? "Leave" : "Join"}
            </button>
          </div>
        </div>
      ))}
      {panelPrides.length > 3 && (
        <button onClick={() => setExpanded(e => !e)} style={{ width: "100%", padding: "8px", background: "#F9F7F4", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9CA3AF", transition: "background 0.1s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#F3F0EB"}
          onMouseLeave={e => e.currentTarget.style.background = "#F9F7F4"}
        >{expanded ? "Show less" : `${panelPrides.length - 3} more`}</button>
      )}
    </div>
  );
}


function LyonsDen() {
  const [feedTab, setFeedTab] = React.useState("All");
  const [evTab, setEvTab] = React.useState("All");
  const [heroId, setHeroId] = React.useState("a1");

  const heroPost = DEN_ANNOUNCEMENTS.find(p => p.id === heroId) || DEN_ANNOUNCEMENTS[0];

  const filteredFeed = feedTab === "All" ? DEN_ANNOUNCEMENTS
    : feedTab === "Announcements" ? DEN_ANNOUNCEMENTS.filter(p => p.type === "announcement")
    : DEN_ANNOUNCEMENTS.filter(p => p.type === "blog");
  const belowFold = filteredFeed.filter(p => p.id !== heroPost.id);

  const filteredEvents = evTab === "All" ? DEN_EVENTS
    : evTab === "Company" ? DEN_EVENTS.filter(e => e.zoom)
    : DEN_EVENTS.filter(e => !e.zoom);

  const DEN_KPIS = [
    { label: "VOL YTD",   value: "$2.4B", delta: "+11%", up: true  },
    { label: "LISTINGS",  value: "312",   delta: "+23",  up: true  },
    { label: "AGENTS",    value: "184",   delta: "+6",   up: true  },
    { label: "AVG DOM",   value: "19d",   delta: "-4d",  up: true  },
    { label: "PENDING",   value: "47",    delta: "+3",   up: true  },
    { label: "REV RATE",  value: "8%",    delta: "-2%",  up: true  },
    { label: "SLA COMP",  value: "96%",   delta: "+1%",  up: true  },
    { label: "CLOSINGS",  value: "29",    delta: "-2",   up: false },
  ];

  return (
    <div style={{ padding: "28px 0 60px" }}>

      {/* Page header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 3 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.01em" }}>Lyon's Den</div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>Russ Lyon Sotheby's Internal Hub</div>
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, Yong. Here's what's happening across the brokerage.
        </div>
      </div>

      {/* ── DOW-style ticker banner ── */}
      <div style={{ background: "#0A1628", borderRadius: 6, marginBottom: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "stretch" }}>

          {/* Brand label */}
          <div style={{ background: "var(--gold)", padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", color: "var(--navy)", textTransform: "uppercase", whiteSpace: "nowrap", lineHeight: 1.4, textAlign: "center" }}>RUSS LYON MARKET</span>
          </div>

          {/* Ticker items */}
          <div style={{ display: "flex", flex: 1, overflowX: "auto" }}>
            {DEN_KPIS.map((k, i) => (
              <div key={k.label} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
                borderRight: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.38)", textTransform: "uppercase" }}>{k.label}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: "white", letterSpacing: "-0.01em" }}>{k.value}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, fontWeight: 700, color: k.up ? "#22C55E" : "#EF4444" }}>
                  {k.up
                    ? <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M3.5 1L6.5 5.5H0.5L3.5 1Z" fill="#22C55E"/></svg>
                    : <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M3.5 6L0.5 1.5H6.5L3.5 6Z" fill="#EF4444"/></svg>
                  }
                  {k.delta}
                </span>
              </div>
            ))}
          </div>

          {/* Timestamp */}
          <div style={{ padding: "0 14px", display: "flex", alignItems: "center", flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
              {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} · Q1 2026
            </span>
          </div>
        </div>
      </div>

      {/* ── Main 2-col layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }}>

        {/* ── LEFT: Feed ── */}
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Hero image */}
          <FeedHero post={heroPost} onSelect={setHeroId} active={true} />

          {/* Hero body */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "14px 18px 12px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.65, marginBottom: 10 }}>{heroPost.body}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {Object.entries(heroPost.reactions).map(([emoji, count]) => (
                <button key={emoji} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 12, border: "1px solid var(--border)", background: "white", cursor: "pointer", fontSize: 11, fontFamily: "var(--font-body)" }}>
                  <span>{emoji}</span><span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{count}</span>
                </button>
              ))}
              <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>💬 {heroPost.comments} comments</span>
            </div>
          </div>

          {/* Feed tabs */}
          <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 2 }}>
            {["All", "Announcements", "Blog"].map(t => (
              <button key={t} onClick={() => setFeedTab(t)} style={{
                background: "none", border: "none", borderBottom: `2px solid ${feedTab === t ? "var(--navy)" : "transparent"}`,
                marginBottom: -2, padding: "7px 14px", fontSize: 11, fontWeight: feedTab === t ? 700 : 500,
                color: feedTab === t ? "var(--navy)" : "#9CA3AF", cursor: "pointer", transition: "all 0.12s",
              }}>{t}</button>
            ))}
          </div>

          {/* Feed rows */}
          <div>
            {belowFold.length === 0
              ? <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>No more posts in this category.</div>
              : belowFold.map(post => <FeedRow key={post.id} post={post} />)
            }
          </div>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Office Events with tabs */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "12px 14px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--navy)", marginBottom: 8 }}>Office Events</div>
              <div style={{ display: "flex", gap: 0 }}>
                {["All", "Company", "Office"].map(t => (
                  <button key={t} onClick={() => setEvTab(t)} style={{
                    background: "none", border: "none", borderBottom: `2px solid ${evTab === t ? "var(--navy)" : "transparent"}`,
                    marginBottom: -1, padding: "5px 10px", fontSize: 10, fontWeight: evTab === t ? 700 : 500,
                    color: evTab === t ? "var(--navy)" : "#9CA3AF", cursor: "pointer", transition: "all 0.12s",
                  }}>{t}</button>
                ))}
              </div>
            </div>

            {/* All-Hands Zoom card — shown when tab is All or Company */}
            {(evTab === "All" || evTab === "Company") && (
              <div style={{ padding: "12px 12px 10px", borderBottom: "1px solid var(--border)", background: "#F8FAFF" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 0 2px rgba(34,197,94,0.25)" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)" }}>{LIVE_MEETING.title}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{LIVE_MEETING.date} · {LIVE_MEETING.startTime}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#22C55E" }}>LIVE</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{LIVE_MEETING.attendees} in call</div>
                  </div>
                </div>
                <ZoomThumbnail />
              </div>
            )}

            {/* Event list rows */}
            <div>
              {filteredEvents.filter(ev => ev.id !== "e1" || evTab === "Office").map((ev, i, arr) => (
                <div key={ev.id} style={{ padding: "9px 14px", borderBottom: i < arr.length - 1 ? "1px solid #F9FAFB" : "none", display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 30, flexShrink: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontFamily: "var(--font-display)", fontWeight: 300, color: "var(--navy)", lineHeight: 1 }}>{ev.date}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>{ev.dow}</div>
                  </div>
                  <div style={{ width: 3, borderRadius: 2, background: ev.color, alignSelf: "stretch", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>{ev.time}</div>
                  </div>
                  {ev.zoom && (
                    <button style={{ flexShrink: 0, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 3, padding: "3px 7px", fontSize: 9, fontWeight: 700, color: "#1D4ED8", cursor: "pointer" }}>ZOOM</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Prides ── */}
          <PridesPanel />

          {/* Quick Links */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ padding: "14px 14px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--navy)" }}>Quick Links</div>
            </div>
            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
              {["Brand", "Legal", "Tools", "HR"].map(cat => (
                <div key={cat}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D1D5DB", padding: "5px 4px 3px" }}>{cat}</div>
                  {DEN_RESOURCES.filter(r => r.category === cat).map(r => (
                    <button key={r.id} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "6px 6px", background: "white", border: "none", borderRadius: 4, cursor: "pointer", textAlign: "left", transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: 4, background: r.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={r.icon} /></svg>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--navy)", fontWeight: 500 }}>{r.label}</span>
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ marginLeft: "auto", opacity: 0.3 }}><path d="M3 2l4 3-4 3" stroke="var(--navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function AgentKPITile({ label, value, accent, barPct, signal, target }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#FAFAFA" : "white",
        border: `1px solid ${hovered ? accent + "60" : "var(--border)"}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 4, padding: "12px 14px",
        cursor: "default", transition: "border 0.15s, background 0.15s",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 300, fontFamily: "var(--font-display)", color: accent, lineHeight: 1 }}>{value}</div>
      <div>
        <div style={{ height: 3, background: "#F3F4F6", borderRadius: 2, marginBottom: 5 }}>
          <div style={{ width: `${barPct}%`, height: "100%", background: accent, borderRadius: 2, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 500 }}>{signal}</span>
          <span style={{ fontSize: 9, color: "#D1D5DB" }}>{target}</span>
        </div>
      </div>
    </div>
  );
}

function AgentDashboard({ onSelectRequest, onNewRequest }) {
  const [doneTasks, setDoneTasks] = useState({});
  const active = MOCK_REQUESTS.filter(r => !["completed","cancelled"].includes(r.status));
  const needsAction = MOCK_REQUESTS.filter(r => r.status === "review");
  const rush = MOCK_REQUESTS.filter(r => r.isRush && r.status !== "completed");

  return (
    <div style={{ padding: "28px 0 40px" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.01em" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, Yong.
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
          You have <strong style={{ color: needsAction.length > 0 ? "#C2410C" : "var(--navy)" }}>{needsAction.length} request{needsAction.length !== 1 ? "s" : ""} awaiting your approval</strong>{rush.length > 0 ? ` and ${rush.length} rush order${rush.length !== 1 ? "s" : ""} in progress` : ""}.
        </div>
      </div>

      {/* ── Row 1: Chart (1fr) | Calendar (1fr) — natural height, top-aligned */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, alignItems: "start" }}>
        <SalesChartsTabs />
        <PersonalCalendar />
      </div>

      {/* ── Row 2: KPI 2×2 (260px fixed) | Active Requests (280px fixed) | Upcoming Events (280px fixed) */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 260px", gap: 16, marginBottom: 16, alignItems: "start" }}>

        {/* KPI 2×2 — HealthTile style: 3px accent border, display number, progress bar, signal + target */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 10, height: 280 }}>
          {[
            { label: "GCI YTD",        value: "$168K",  accent: "var(--navy)", barPct: 42, signal: "⚠ Behind pace",   target: "Goal $400K" },
            { label: "Volume YTD",     value: "$11.2M", accent: "#C9A96E",     barPct: 45, signal: "↑ 8% vs last yr", target: "Goal $25M"  },
            { label: "Active Listings",value: "4",      accent: "#7C3AED",     barPct: 50, signal: "✓ Healthy",        target: "Target 6–8" },
            { label: "Avg DOM",        value: "23d",    accent: "#15803D",     barPct: 77, signal: "✓ Below market",   target: "Market 30d" },
          ].map(k => (
            <AgentKPITile key={k.label} {...k} />
          ))}
        </div>

        {/* Active Requests — fixed 280px */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column", height: 280 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>Active Requests</div>
            <button onClick={onNewRequest} style={{ background: "var(--navy)", color: "white", border: "none", borderRadius: 2, padding: "5px 14px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>+ New Request</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {MOCK_REQUESTS.map((req, i) => {
              const sla = slaCountdown(req.slaDeadline, req.status === "awaiting_materials");
              return (
                <div key={req.id} onClick={() => onSelectRequest(req)} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "13px 20px",
                  borderBottom: i < MOCK_REQUESTS.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer", background: req.status === "review" ? "#FFFBF5" : "white",
                  transition: "background 0.1s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = req.status === "review" ? "#FFFBF5" : "white"}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.title}</span>
                      {req.isRush && <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF3C7", color: "#D97706", padding: "1px 6px", borderRadius: 2, flexShrink: 0 }}>RUSH</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{req.materialType}</span>
                      <span style={{ fontSize: 10, color: "#D1C9BC" }}>·</span>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{req.designerName || "Unassigned"}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <RequestStatusChip status={req.status} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: sla.paused ? "#0891B2" : sla.urgent ? "#DC2626" : "#9CA3AF", minWidth: 52, textAlign: "right" }}>{sla.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events — fixed 280px */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column", height: 280 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>Upcoming Events</div>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>{CAL_EVENTS.filter(e => e.date >= CAL_TODAY).length} this month</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {CAL_EVENTS.filter(e => e.date >= CAL_TODAY).sort((a, b) => a.date - b.date).map((ev, i, arr) => (
              <div key={ev.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 16px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width: 32, flexShrink: 0, textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontFamily: "var(--font-display)", fontWeight: 300, color: "var(--navy)", lineHeight: 1 }}>{ev.date}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF" }}>Mar</div>
                </div>
                <div style={{ width: 3, borderRadius: 2, background: ev.color, alignSelf: "stretch", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)", marginBottom: 1 }}>{ev.title}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Recent Messages (1fr) | Action Items (260px) — Action Items aligns under Upcoming Events */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16, alignItems: "start", marginBottom: 40 }}>

        {/* Recent Messages — fixed 320px */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column", height: 320 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>Recent Messages</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["All","all"],["Platform","platform"],["Email","email"],["DM","dm"]].map(([label, val]) => (
                <button key={val} style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", padding: "2px 8px", borderRadius: 2, border: "1px solid var(--border)", background: val === "all" ? "var(--navy)" : "white", color: val === "all" ? "white" : "#9CA3AF", cursor: "pointer" }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {UNIFIED_MESSAGES.slice(0, 5).map((msg, i) => (
              <div key={msg.id} style={{
                padding: "12px 20px", borderBottom: i < UNIFIED_MESSAGES.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start", position: "relative",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: msg.avatarBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: msg.avatarText }}>{msg.initials}</span>
                  </div>
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: msg.channel === "email" ? "#EFF6FF" : msg.channel === "dm" ? "#F0FDF4" : "#F8F5F0", border: "1.5px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {msg.channel === "email"    && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><rect x="0.5" y="0.5" width="7" height="5" rx="0.5" stroke="#3B82F6" strokeWidth="0.8"/><path d="M0.5 1.5L4 3.5L7.5 1.5" stroke="#3B82F6" strokeWidth="0.8"/></svg>}
                    {msg.channel === "dm"       && <svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M1 1h6a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H4.5L3 6V5H1a.5.5 0 01-.5-.5v-3A.5.5 0 011 1z" stroke="#16A34A" strokeWidth="0.8"/></svg>}
                    {msg.channel === "platform" && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" stroke="#C9A96E" strokeWidth="0.8"/><path d="M4 2.5v2l1 1" stroke="#C9A96E" strokeWidth="0.8" strokeLinecap="round"/></svg>}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)" }}>{msg.sender}</span>
                    <span style={{ fontSize: 10, color: "#9CA3AF", flexShrink: 0, marginLeft: 8 }}>{msg.time}</span>
                  </div>
                  {msg.subject && <div style={{ fontSize: 10, fontWeight: 600, color: "#374151", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.subject}</div>}
                  <div style={{ fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.preview}</div>
                  {msg.context && <div style={{ fontSize: 10, color: "#C4B99A", marginTop: 2 }}>{msg.context}</div>}
                  {msg.unread && <div style={{ position: "absolute", top: 14, right: 14, width: 6, height: 6, borderRadius: "50%", background: "var(--navy)" }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items — fixed 320px */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column", height: 320 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>Action Items</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {AGENT_TASKS.map((task, i) => (
              <div key={task.id} style={{
                padding: "11px 16px", borderBottom: i < AGENT_TASKS.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex", gap: 10, alignItems: "flex-start",
                opacity: doneTasks[task.id] ? 0.4 : 1, transition: "opacity 0.2s",
              }}>
                <button onClick={() => setDoneTasks(d => ({ ...d, [task.id]: !d[task.id] }))} style={{
                  width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 1,
                  background: doneTasks[task.id] ? "var(--navy)" : "white",
                  border: `1.5px solid ${doneTasks[task.id] ? "var(--navy)" : "#D1D5DB"}`,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {doneTasks[task.id] && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--navy)", lineHeight: 1.4, marginBottom: 4, textDecoration: doneTasks[task.id] ? "line-through" : "none" }}>{task.text}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <TaskPill priority={task.priority} />
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{task.due}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function DesignerDashboardHome({ onSelectRequest }) {
  const [doneTasks, setDoneTasks] = useState({});
  const myQueue = DESIGNER_ALL_REQUESTS.filter(r => r.designerName === "Lex Baum" && !["completed","cancelled"].includes(r.status));
  const inProgress = myQueue.filter(r => r.status === "in_progress").length;
  const inReview   = myQueue.filter(r => r.status === "review").length;
  const rushItems  = myQueue.filter(r => r.isRush).length;
  const breached   = myQueue.filter(r => r.slaBreached).length;

  return (
    <div style={{ padding: "28px 0 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.01em" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, Lex.
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
          You have <strong style={{ color: "var(--navy)" }}>{myQueue.length} active item{myQueue.length !== 1 ? "s" : ""}</strong> in your queue{breached > 0 ? <span>, <strong style={{ color: "#DC2626" }}>{breached} SLA breached</strong></span> : ""}.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <DashKPI label="My Queue" value={myQueue.length} sub="active assignments" />
        <DashKPI label="In Progress" value={inProgress} sub="being worked on" accent="var(--navy)" />
        <DashKPI label="In Review" value={inReview} sub="awaiting approval" accent="#7C3AED" />
        <DashKPI label="SLA Breached" value={breached} sub="needs attention" accent={breached > 0 ? "#DC2626" : undefined} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* My Queue */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>My Queue</div>
            </div>
            {myQueue.map((req, i) => {
              const sla = slaCountdown(req.slaDeadline, req.status === "awaiting_materials");
              return (
                <div key={req.id} onClick={() => onSelectRequest(req)} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                  borderBottom: i < myQueue.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer", background: req.slaBreached ? "#FFF5F5" : "white",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = req.slaBreached ? "#FFF5F5" : "white"}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.title}</span>
                      {req.isRush && <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF3C7", color: "#D97706", padding: "1px 6px", borderRadius: 2, flexShrink: 0 }}>RUSH</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{req.materialType}</span>
                      <span style={{ fontSize: 10, color: "#D1C9BC" }}>·</span>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{req.requesterName}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <RequestStatusChip status={req.status} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: sla.paused ? "#0891B2" : sla.urgent ? "#DC2626" : "#9CA3AF" }}>{sla.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent messages across all queue items */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>Recent Agent Messages</div>
            </div>
            {MOCK_REQUESTS.filter(r => r.messages.some(m => m.senderRole === "requester")).map((req, i, arr) => {
              const last = req.messages.filter(m => m.senderRole === "requester").slice(-1)[0];
              return (
                <div key={req.id} onClick={() => onSelectRequest(req)} style={{
                  padding: "12px 20px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}
                >
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gold)20", border: "1px solid var(--gold)40", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--navy)" }}>{last.senderName.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--navy)" }}>{last.senderName}</span>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{timeAgo(last.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{last.body}</div>
                    <div style={{ fontSize: 10, color: "#C4B99A", marginTop: 2 }}>{req.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Tasks + Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>Today's Tasks</div>
            </div>
            {DESIGNER_TASKS.map((task, i) => (
              <div key={task.id} style={{
                padding: "11px 16px", borderBottom: i < DESIGNER_TASKS.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex", gap: 10, alignItems: "flex-start",
                opacity: doneTasks[task.id] ? 0.4 : 1, transition: "opacity 0.2s",
              }}>
                <button onClick={() => setDoneTasks(d => ({ ...d, [task.id]: !d[task.id] }))} style={{
                  width: 16, height: 16, borderRadius: 3, flexShrink: 0, marginTop: 1,
                  background: doneTasks[task.id] ? "var(--navy)" : "white",
                  border: `1.5px solid ${doneTasks[task.id] ? "var(--navy)" : "#D1D5DB"}`,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {doneTasks[task.id] && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--navy)", lineHeight: 1.4, marginBottom: 4, textDecoration: doneTasks[task.id] ? "line-through" : "none" }}>{task.text}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <TaskPill priority={task.priority} />
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{task.due}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>Activity</div>
            </div>
            <div style={{ padding: "8px 0" }}>
              {ACTIVITY_FEED.slice(0, 5).map(item => (
                <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 16px" }}>
                  <ActivityDot type={item.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--navy)", lineHeight: 1.4 }}><strong>{item.actor}</strong> {item.action}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.target}</div>
                  </div>
                  <span style={{ fontSize: 10, color: "#C4B99A", flexShrink: 0 }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutiveDashboardHome() {
  const allReqs = DESIGNER_ALL_REQUESTS;
  const open     = allReqs.filter(r => !["completed","cancelled"].includes(r.status)).length;
  const breached = allReqs.filter(r => r.slaBreached).length;
  const inReview = allReqs.filter(r => r.status === "review").length;
  const rush     = allReqs.filter(r => r.isRush && r.status !== "completed").length;

  const byDesigner = [
    { name: "Lex Baum",   active: DESIGNER_ALL_REQUESTS.filter(r => r.designerName === "Lex Baum" && !["completed","cancelled"].includes(r.status)).length, breached: DESIGNER_ALL_REQUESTS.filter(r => r.designerName === "Lex Baum" && r.slaBreached).length },
    { name: "Marcus Webb",  active: DESIGNER_ALL_REQUESTS.filter(r => r.designerName === "Marcus Webb" && !["completed","cancelled"].includes(r.status)).length, breached: 0 },
    { name: "Unassigned",   active: DESIGNER_ALL_REQUESTS.filter(r => !r.designerName).length, breached: 0 },
  ];

  return (
    <div style={{ padding: "28px 0 40px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 300, color: "var(--navy)", letterSpacing: "-0.01em" }}>
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, David.
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
          Marketing operations overview — {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <DashKPI label="Open Requests" value={open} sub="across all agents" />
        <DashKPI label="In Review" value={inReview} sub="awaiting agent approval" accent="#7C3AED" />
        <DashKPI label="Rush Orders" value={rush} sub="elevated priority" accent={rush > 0 ? "#D97706" : undefined} />
        <DashKPI label="SLA Breached" value={breached} sub="requires attention" accent={breached > 0 ? "#DC2626" : undefined} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* All requests table */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>All Active Requests</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA" }}>
                  {["Request","Agent","Designer","Status","SLA"].map(h => (
                    <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allReqs.filter(r => !["completed","cancelled"].includes(r.status)).map((req, i, arr) => {
                  const sla = slaCountdown(req.slaDeadline, req.status === "awaiting_materials");
                  return (
                    <tr key={req.id} style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none", background: req.slaBreached ? "#FFF5F5" : "white" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)" }}>{req.title}</div>
                        <div style={{ fontSize: 10, color: "#9CA3AF" }}>{req.materialType}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "#374151" }}>{req.requesterName}</td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: req.designerName ? "#374151" : "#C4B99A" }}>{req.designerName || "—"}</td>
                      <td style={{ padding: "12px 16px" }}><RequestStatusChip status={req.status} /></td>
                      <td style={{ padding: "12px 16px", fontSize: 11, fontWeight: 600, color: sla.paused ? "#0891B2" : sla.urgent ? "#DC2626" : "#9CA3AF" }}>{sla.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Activity */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>Recent Activity</div>
            </div>
            <div style={{ padding: "8px 0" }}>
              {ACTIVITY_FEED.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 20px" }}>
                  <ActivityDot type={item.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--navy)", lineHeight: 1.4 }}><strong>{item.actor}</strong> {item.action}</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.target}</div>
                  </div>
                  <span style={{ fontSize: 10, color: "#C4B99A", flexShrink: 0 }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Designer workload */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy)" }}>Designer Workload</div>
            </div>
            {byDesigner.map((d, i) => (
              <div key={d.name} style={{ padding: "14px 16px", borderBottom: i < byDesigner.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)" }}>{d.name}</span>
                  {d.breached > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", padding: "2px 6px", borderRadius: 2 }}>{d.breached} BREACHED</span>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ background: "#F3F4F6", borderRadius: 2, padding: "4px 10px", flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)" }}>{d.active}</div>
                    <div style={{ fontSize: 9, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active</div>
                  </div>
                </div>
                {d.active > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, (d.active / 5) * 100)}%`, background: d.active >= 4 ? "#DC2626" : d.active >= 3 ? "#D97706" : "#15803D", borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 3 }}>{d.active >= 4 ? "At capacity" : d.active >= 3 ? "High load" : "Available"}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



// ─── MOCK DATA for Marketing Dashboard ───────────────────────────────────────

const MMD_COMMS = [
  { id:1, from:"Yong Choi",    initials:"YC", subject:"Open House flyer — quick tweak",          time:"9:14 AM",  unread:true,  type:"email" },
  { id:2, from:"David Kim",    initials:"DK", subject:"Q1 report looks great — board loved it",  time:"Yesterday",unread:false, type:"email" },
  { id:3, from:"Sarah Patel",  initials:"SP", subject:"New listing going live Friday",            time:"Yesterday",unread:true,  type:"email" },
  { id:4, from:"Marcus Webb",  initials:"MW", subject:"Pinnacle Peak — draft v2 ready",          time:"Mon",      unread:false, type:"slack" },
  { id:5, from:"Yong Choi",    initials:"YC", subject:"Can we rush the social pack?",            time:"Mon",      unread:false, type:"message" },
];

const MMD_CALENDAR = (() => {
  const today = new Date();
  const d = (offset, title, color, time) => ({
    id: offset,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset),
    title, color, time,
  });
  return [
    d(0,  "Sprint Review — Design Team",       "var(--navy)",  "10:00 AM"),
    d(0,  "SLA Review",                         "#7C3AED",     "2:00 PM"),
    d(1,  "Yong Choi — Rush Flyer Deadline",    "#DC2626",     "EOD"),
    d(2,  "Desert Mountain Social Kit Due",     "#D97706",     "EOD"),
    d(3,  "Board Presentation Prep",            "var(--navy)", "11:00 AM"),
    d(5,  "Agent Feedback Round",               "#0891B2",     "3:30 PM"),
    d(6,  "Weekly Queue Review",                "var(--navy)", "9:00 AM"),
    d(8,  "Q1 Campaign Planning",               "#15803D",     "1:00 PM"),
  ];
})();

const MMD_VOLUME_12W = [
  { week:"W1",  submitted:4, completed:3 },
  { week:"W2",  submitted:6, completed:5 },
  { week:"W3",  submitted:3, completed:4 },
  { week:"W4",  submitted:7, completed:5 },
  { week:"W5",  submitted:5, completed:6 },
  { week:"W6",  submitted:8, completed:7 },
  { week:"W7",  submitted:4, completed:5 },
  { week:"W8",  submitted:9, completed:7 },
  { week:"W9",  submitted:6, completed:8 },
  { week:"W10", submitted:7, completed:6 },
  { week:"W11", submitted:5, completed:6 },
  { week:"W12", submitted:8, completed:7 },
];

const MMD_MATERIAL_BREAKDOWN = [
  { type:"Flyer",       count:18, color:"var(--navy)" },
  { type:"Social Pack", count:12, color:"var(--gold)" },
  { type:"Report",      count:9,  color:"#7C3AED"    },
  { type:"Video",       count:6,  color:"#0891B2"    },
  { type:"Brochure",    count:4,  color:"#15803D"    },
];

const MMD_SLA_TREND = [
  { month:"Oct", rate:88 },
  { month:"Nov", rate:91 },
  { month:"Dec", rate:85 },
  { month:"Jan", rate:93 },
  { month:"Feb", rate:91 },
  { month:"Mar", rate:94 },
];

// ─── MARKETING MANAGER DASHBOARD ─────────────────────────────────────────────

function MMDSectionHeader({ title, sub, action, onAction }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", borderBottom:"1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy)" }}>{title}</div>
        {sub && <div style={{ fontSize:10, color:"#9CA3AF", marginTop:2 }}>{sub}</div>}
      </div>
      {action && (
        <button onClick={onAction} style={{ fontSize:9, fontWeight:700, color:"var(--gold)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase" }}>
          {action} →
        </button>
      )}
    </div>
  );
}

function MarketingManagerDashboard({ onSelectRequest }) {
  const allReqs    = DESIGNER_ALL_REQUESTS;
  const open       = allReqs.filter(r => !["completed","cancelled"].includes(r.status));
  const unassigned = allReqs.filter(r => !r.designerName && !["completed","cancelled"].includes(r.status));
  const inReview   = allReqs.filter(r => r.status === "review");
  const breached   = allReqs.filter(r => r.slaBreached);
  const completed  = allReqs.filter(r => r.status === "completed");
  const rushActive = allReqs.filter(r => r.isRush && !["completed","cancelled"].includes(r.status));
  const needsAttn  = allReqs.filter(r =>
    !["completed","cancelled"].includes(r.status) &&
    (r.feasibilityFlag || r.slaBreached || !r.designerName)
  );

  const thisWeekTotal = WEEK_TREND_DATA.reduce((s,d) => s + d.thisWeek, 0);
  const lastWeekTotal = WEEK_TREND_DATA.reduce((s,d) => s + d.lastWeek, 0);
  const weekTrend     = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0;
  const currentSLA    = MMD_SLA_TREND[MMD_SLA_TREND.length-1].rate;
  const prevSLA       = MMD_SLA_TREND[MMD_SLA_TREND.length-2].rate;
  const slaTrend      = currentSLA - prevSLA;

  const [triageActions, setTriageActions] = useState({});
  const [assignMap,     setAssignMap]     = useState({});
  const [calToday,      setCalToday]      = useState(true);
  const [commsTab,      setCommsTab]      = useState("all");
  const [chartTab,      setChartTab]      = useState("volume");

  function handleQuickApprove(req) {
    if (!assignMap[req.id]) return;
    setTriageActions(prev => ({ ...prev, [req.id]:"approved" }));
  }
  function handleQuickReject(req) {
    setTriageActions(prev => ({ ...prev, [req.id]:"rejected" }));
  }
  function undoAction(id) {
    setTriageActions(prev => { const n={...prev}; delete n[id]; return n; });
  }

  const today     = new Date();
  const todayStr  = today.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  const greeting  = today.getHours() < 12 ? "morning" : today.getHours() < 17 ? "afternoon" : "evening";
  const calEvents = calToday
    ? MMD_CALENDAR.filter(e => e.date.toDateString() === today.toDateString())
    : MMD_CALENDAR.filter(e => {
        const diff = Math.floor((e.date - today) / 86400000);
        return diff >= 0 && diff <= 6;
      });

  const byDesigner = [
    { name:"Lex Baum",    active: allReqs.filter(r => r.designerName==="Lex Baum"    && !["completed","cancelled"].includes(r.status)).length, breached: allReqs.filter(r=>r.designerName==="Lex Baum"    && r.slaBreached).length },
    { name:"Marcus Webb", active: allReqs.filter(r => r.designerName==="Marcus Webb" && !["completed","cancelled"].includes(r.status)).length, breached:0 },
    { name:"Unassigned",  active: unassigned.length, breached:0 },
  ];

  const volMax = Math.max(...MMD_VOLUME_12W.map(w => Math.max(w.submitted, w.completed)));

  return (
    <div style={{ padding:"28px 0 48px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          <div style={{ fontFamily:"var(--font-display)", fontSize:26, fontWeight:300, color:"var(--navy)", letterSpacing:"-0.01em" }}>
            Good {greeting}, Lex.
          </div>
          <div style={{ fontSize:12, color:"#9CA3AF", marginTop:4 }}>
            {open.length} open · {todayStr}
            {unassigned.length > 0 && <> · <strong style={{color:"#D97706"}}>{unassigned.length} unassigned</strong></>}
            {breached.length  > 0 && <> · <strong style={{color:"#DC2626"}}>{breached.length} SLA breached</strong></>}
          </div>
        </div>
        <div style={{ fontSize:10, color:"#9CA3AF", textAlign:"right" }}>
          <div style={{ fontSize:22, fontFamily:"var(--font-display)", fontWeight:300, color:"var(--navy)" }}>{open.length}</div>
          active requests
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10, marginBottom:20 }}>
        {[
          { label:"Open",          value:open.length,        sub:"in queue",           accent:undefined },
          { label:"Unassigned",    value:unassigned.length,  sub:"need assignment",    accent:unassigned.length>0?"#D97706":undefined },
          { label:"In Review",     value:inReview.length,    sub:"awaiting approval",  accent:"#7C3AED" },
          { label:"SLA Breached",  value:breached.length,    sub:"requires attention", accent:breached.length>0?"#DC2626":undefined },
          { label:"Rush Active",   value:rushActive.length,  sub:"elevated priority",  accent:rushActive.length>0?"#B45309":undefined },
          { label:"Completed MTD", value:completed.length,   sub:"this month",         accent:"#15803D" },
          { label:"SLA Rate",      value:`${currentSLA}%`,   sub:slaTrend>0?`↑ ${slaTrend}% MoM`:`↓ ${Math.abs(slaTrend)}% MoM`, accent:currentSLA>=90?"#15803D":"#D97706" },
        ].map(k => (
          <div key={k.label} style={{ background:"white", border:"1px solid var(--border)", borderTop:`3px solid ${k.accent||"var(--navy)"}`, padding:"12px 14px" }}>
            <div style={{ fontSize:22, fontFamily:"var(--font-display)", fontWeight:300, color:k.accent||"var(--navy)", letterSpacing:"-0.02em", lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#9CA3AF", marginTop:4 }}>{k.label}</div>
            <div style={{ fontSize:9, color:k.accent||"#C4B9AA", marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Charts (full width) ── */}
      <div style={{ background:"white", border:"1px solid var(--border)", marginBottom:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy)" }}>Performance Charts</div>
          <div style={{ display:"flex", gap:2, background:"#F3F4F6", padding:2 }}>
            {[["volume","Volume 12W"],["sla","SLA Trend"],["material","By Type"]].map(([k,l]) => (
              <button key={k} onClick={() => setChartTab(k)} style={{
                fontSize:9, fontWeight:700, padding:"4px 12px", border:"none", cursor:"pointer",
                background:chartTab===k?"white":"transparent",
                color:chartTab===k?"var(--navy)":"#9CA3AF",
                boxShadow:chartTab===k?"0 1px 3px rgba(0,0,0,0.08)":"none",
                letterSpacing:"0.06em", textTransform:"uppercase",
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ padding:"20px 24px" }}>
          {/* Volume 12W bar chart */}
          {chartTab === "volume" && (
            <div>
              <div style={{ display:"flex", gap:12, marginBottom:8, alignItems:"center" }}>
                {[["var(--navy)","Submitted"],["var(--gold)","Completed"]].map(([c,l]) => (
                  <span key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"#6B7280" }}>
                    <div style={{ width:10, height:10, background:c }} />{l}
                  </span>
                ))}
                <span style={{ marginLeft:"auto", fontSize:10, color:"#9CA3AF" }}>12-week rolling</span>
              </div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:120 }}>
                {MMD_VOLUME_12W.map(w => (
                  <div key={w.week} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                    <div style={{ width:"100%", display:"flex", gap:1, alignItems:"flex-end", height:100 }}>
                      <div style={{ flex:1, background:"var(--navy)", height:`${(w.submitted/volMax)*100}%`, minHeight:2, transition:"height 0.3s" }} />
                      <div style={{ flex:1, background:"var(--gold)", height:`${(w.completed/volMax)*100}%`, minHeight:2, transition:"height 0.3s" }} />
                    </div>
                    <div style={{ fontSize:8, color:"#9CA3AF", whiteSpace:"nowrap" }}>{w.week}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLA Trend line */}
          {chartTab === "sla" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:10, color:"#6B7280" }}>SLA compliance rate — 6 months</span>
                <span style={{ fontSize:10, fontWeight:700, color:currentSLA>=90?"#15803D":"#D97706" }}>{currentSLA}% current</span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={MMD_SLA_TREND} margin={{top:4,right:4,bottom:4,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false} />
                  <YAxis domain={[80,100]} tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false} width={28} tickFormatter={v=>`${v}%`} />
                  <Tooltip formatter={v=>[`${v}%`,"SLA"]} contentStyle={{fontSize:11,border:"1px solid var(--border)"}} />
                  <ReferenceLine y={90} stroke="#E5E7EB" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="rate" stroke="var(--navy)" strokeWidth={2} dot={{fill:"var(--navy)",r:3}} activeDot={{r:5}} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ fontSize:9, color:"#9CA3AF", textAlign:"center", marginTop:4 }}>Dashed line = 90% target</div>
            </div>
          )}

          {/* Material breakdown */}
          {chartTab === "material" && (
            <div style={{ display:"flex", gap:32, alignItems:"center" }}>
              <PieChart width={140} height={120}>
                <Pie data={MMD_MATERIAL_BREAKDOWN} cx={65} cy={55} innerRadius={34} outerRadius={54} dataKey="count" strokeWidth={2} stroke="white">
                  {MMD_MATERIAL_BREAKDOWN.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v,n)=>[v,n]} contentStyle={{fontSize:11,border:"1px solid var(--border)"}} />
              </PieChart>
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                {MMD_MATERIAL_BREAKDOWN.map(m => (
                  <div key={m.type} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:8, height:8, background:m.color, flexShrink:0 }} />
                    <div style={{ fontSize:11, color:"var(--navy)", width:80, flexShrink:0 }}>{m.type}</div>
                    <div style={{ flex:1, height:4, background:"#F3F4F6", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(m.count/18)*100}%`, background:m.color, borderRadius:2 }} />
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--navy)", width:24, textAlign:"right", fontFamily:"monospace" }}>{m.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Three columns ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>

        {/* Col 1: Needs Attention */}
        <div style={{ background:"white", border:"1px solid var(--border)", overflow:"hidden" }}>
          <MMDSectionHeader title="Needs Attention" sub={`${needsAttn.length} requiring action`} />
          {needsAttn.length === 0 ? (
            <div style={{ padding:"24px 18px", textAlign:"center", color:"#9CA3AF", fontSize:11 }}>✓ All on track</div>
          ) : needsAttn.slice(0,5).map((req,i,arr) => {
            const sla   = slaCountdown(req.slaDeadline, req.status==="awaiting_materials");
            const borderColor = req.slaBreached ? "#EF4444" : !req.designerName ? "#F59E0B" : "#E5E7EB";
            return (
              <div key={req.id} onClick={()=>onSelectRequest(req)}
                style={{ padding:"10px 18px", borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
                  borderLeft:`3px solid ${borderColor}`, cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"}
                onMouseLeave={e=>e.currentTarget.style.background="white"}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--navy)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:140 }}>{req.title}</div>
                  {req.isRush && <RushBadge />}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:10, color:"#9CA3AF" }}>{req.materialType} · {req.requesterName}</div>
                  <div style={{ fontSize:10, fontWeight:600, color:sla.urgent?"#DC2626":"#9CA3AF" }}>{sla.label}</div>
                </div>
                {!req.designerName && <div style={{ fontSize:9, fontWeight:700, color:"#D97706", marginTop:2 }}>⚠ Unassigned</div>}
                {req.slaBreached    && <div style={{ fontSize:9, fontWeight:700, color:"#DC2626", marginTop:2 }}>✕ SLA Breached</div>}
              </div>
            );
          })}
        </div>

        {/* Col 2: Quick Triage */}
        <div style={{ background:"white", border:"1px solid var(--border)", overflow:"hidden" }}>
          <MMDSectionHeader title="Quick Triage" sub="Approve without leaving dashboard" />
          {unassigned.length === 0 ? (
            <div style={{ padding:"24px 18px", textAlign:"center", color:"#9CA3AF", fontSize:11 }}>✓ No unassigned requests</div>
          ) : unassigned.slice(0,4).map((req,i,arr) => {
            const action   = triageActions[req.id];
            const designer = assignMap[req.id] || "";
            return (
              <div key={req.id} style={{ padding:"10px 14px", borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
                background:action==="approved"?"#F0FDF4":action==="rejected"?"#FEF2F2":"white", transition:"background 0.2s" }}>
                {action ? (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:action==="approved"?"#15803D":"#DC2626" }}>
                        {action==="approved"?"✓ Approved":"✕ Rejected"}
                      </div>
                      <div style={{ fontSize:10, color:"#9CA3AF" }}>{req.title.slice(0,30)}…</div>
                    </div>
                    <button onClick={()=>undoAction(req.id)}
                      style={{ fontSize:9, color:"#9CA3AF", background:"none", border:"1px solid var(--border)", padding:"3px 8px", cursor:"pointer" }}>
                      Undo
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--navy)", marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{req.title}</div>
                    <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:8 }}>{req.materialType}{req.isRush?" · 🔥 RUSH":""}</div>
                    <div style={{ display:"flex", gap:6 }}>
                      <select value={designer} onChange={e=>setAssignMap(prev=>({...prev,[req.id]:e.target.value}))}
                        style={{ flex:1, fontSize:10, border:"1px solid var(--border)", padding:"5px 6px", background:"white", color:designer?"var(--navy)":"#9CA3AF", fontFamily:"var(--font-body)", outline:"none", cursor:"pointer" }}>
                        <option value="">Assign…</option>
                        {["Lex Baum","Marcus Webb"].map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                      <button onClick={()=>handleQuickApprove(req)} disabled={!designer}
                        style={{ fontSize:10, fontWeight:700, padding:"5px 10px", border:"none", cursor:designer?"pointer":"not-allowed",
                          background:designer?"var(--navy)":"#E5E1D8", color:designer?"white":"#C4B9AA" }}>✓</button>
                      <button onClick={()=>handleQuickReject(req)}
                        style={{ fontSize:10, fontWeight:700, padding:"5px 8px", background:"#FEF2F2", color:"#B91C1C", border:"1px solid #FCA5A5", cursor:"pointer" }}>✕</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Col 3: Designer Capacity */}
        <div style={{ background:"white", border:"1px solid var(--border)", overflow:"hidden" }}>
          <MMDSectionHeader title="Designer Capacity" />
          {byDesigner.map((d,i) => {
            const pct   = Math.min(100,(d.active/5)*100);
            const sc    = d.name==="Unassigned" ? "#9CA3AF" : d.active>=5?"#DC2626":d.active>=3?"#D97706":"#15803D";
            const sl    = d.name==="Unassigned" ? "pool" : d.active>=5?"overloaded":d.active>=3?"busy":"available";
            return (
              <div key={d.name} style={{ padding:"14px 18px", borderBottom:i<byDesigner.length-1?"1px solid var(--border)":"none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:"var(--navy)" }}>{d.name}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
                      <div style={{ width:5, height:5, borderRadius:"50%", background:sc }} />
                      <span style={{ fontSize:9, color:sc, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{sl}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:22, fontFamily:"var(--font-display)", fontWeight:300, color:sc, lineHeight:1 }}>{d.active}</div>
                    <div style={{ fontSize:9, color:"#9CA3AF" }}>active</div>
                  </div>
                </div>
                {d.name !== "Unassigned" && (
                  <div style={{ height:3, background:"#F3F4F6", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:sc, borderRadius:2, transition:"width 0.4s ease" }} />
                  </div>
                )}
                {d.breached>0 && <div style={{ fontSize:9, fontWeight:700, color:"#DC2626", marginTop:5 }}>⚠ {d.breached} SLA breached</div>}
              </div>
            );
          })}

          {/* Avg turnaround mini */}
          <div style={{ padding:"12px 18px", borderTop:"1px solid var(--border)", background:"#FDFAF5" }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:8 }}>Avg Turnaround</div>
            {TURNAROUND_BY_TYPE.map(t => (
              <div key={t.type} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <div style={{ fontSize:9, color:"#6B7280", width:52, flexShrink:0 }}>{t.type}</div>
                <div style={{ flex:1, height:3, background:"#F3F4F6", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(t.days/7)*100}%`,
                    background:t.days>5?"#DC2626":t.days>3?"#D97706":"var(--navy)", borderRadius:2 }} />
                </div>
                <div style={{ fontSize:9, fontWeight:700, color:"var(--navy)", width:24, textAlign:"right", fontFamily:"monospace", flexShrink:0 }}>{t.days}d</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Communications + Calendar + Activity ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>

        {/* Communications */}
        <div style={{ background:"white", border:"1px solid var(--border)", overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy)" }}>Communications</div>
              <div style={{ display:"flex", gap:2 }}>
                {[["all","All"],["email","Email"],["message","DM"]].map(([k,l]) => (
                  <button key={k} onClick={()=>setCommsTab(k)} style={{
                    fontSize:9, fontWeight:700, padding:"2px 8px", border:"none", cursor:"pointer",
                    background:commsTab===k?"var(--navy)":"transparent",
                    color:commsTab===k?"white":"#9CA3AF",
                    letterSpacing:"0.04em",
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          {MMD_COMMS.filter(c => commsTab==="all" || c.type===commsTab).map((c,i,arr) => (
            <div key={c.id} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 18px",
              borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
              background:c.unread?"#FDFAF5":"white", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background="#F9F7F4"}
              onMouseLeave={e=>e.currentTarget.style.background=c.unread?"#FDFAF5":"white"}>
              <div style={{ width:30, height:30, background:c.unread?"var(--navy)":"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:700, color:c.unread?"white":"#9CA3AF" }}>{c.initials}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:11, fontWeight:c.unread?700:500, color:"var(--navy)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:140 }}>{c.from}</div>
                  <div style={{ fontSize:9, color:"#9CA3AF", flexShrink:0 }}>{c.time}</div>
                </div>
                <div style={{ fontSize:10, color:c.unread?"#374151":"#9CA3AF", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.subject}</div>
              </div>
              {c.unread && <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--gold)", flexShrink:0, marginTop:4 }} />}
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div style={{ background:"white", border:"1px solid var(--border)", overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy)" }}>Calendar</div>
            <div style={{ display:"flex", gap:2 }}>
              {[[true,"Today"],[false,"This Week"]].map(([v,l]) => (
                <button key={l} onClick={()=>setCalToday(v)} style={{
                  fontSize:9, fontWeight:700, padding:"2px 8px", border:"none", cursor:"pointer",
                  background:calToday===v?"var(--navy)":"transparent",
                  color:calToday===v?"white":"#9CA3AF",
                  letterSpacing:"0.04em",
                }}>{l}</button>
              ))}
            </div>
          </div>
          {calEvents.length === 0 ? (
            <div style={{ padding:"24px 18px", textAlign:"center", color:"#9CA3AF", fontSize:11 }}>No events {calToday?"today":"this week"}</div>
          ) : calEvents.map((ev,i,arr) => {
            const isToday = ev.date.toDateString() === today.toDateString();
            const dayLabel = isToday ? "Today" : ev.date.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
            return (
              <div key={ev.id} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"10px 18px",
                borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
                borderLeft:`3px solid ${ev.color}` }}>
                <div style={{ flexShrink:0 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:isToday?"var(--gold)":"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.08em" }}>{dayLabel}</div>
                  <div style={{ fontSize:9, color:"#9CA3AF", marginTop:1 }}>{ev.time}</div>
                </div>
                <div style={{ flex:1, fontSize:11, fontWeight:500, color:"var(--navy)", lineHeight:1.4 }}>{ev.title}</div>
              </div>
            );
          })}
        </div>

        {/* Activity Feed */}
        <div style={{ background:"white", border:"1px solid var(--border)", overflow:"hidden" }}>
          <MMDSectionHeader title="Recent Activity" sub="Status changes &amp; submissions" />
          <div style={{ padding:"8px 0" }}>
            {ACTIVITY_FEED.concat([
              { id:7, actor:"Yong Choi",  action:"submitted",      target:"Desert Mountain — Spring Social", time:"3h ago",  type:"submit"  },
              { id:8, actor:"Lex Baum",   action:"approved",       target:"16020 N Horseshoe — Flyer",       time:"5h ago",  type:"approve" },
              { id:9, actor:"Marcus Webb",action:"started work on",target:"Just Listed — Pinnacle Peak",     time:"7h ago",  type:"work"    },
            ]).map(item => (
              <div key={item.id} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"8px 18px" }}>
                <ActivityDot type={item.type} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, color:"var(--navy)", lineHeight:1.4 }}><strong>{item.actor}</strong> {item.action}</div>
                  <div style={{ fontSize:10, color:"#9CA3AF", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.target}</div>
                </div>
                <span style={{ fontSize:10, color:"#C4B99A", flexShrink:0 }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── MANAGER DASHBOARD HOME (top-level Dashboard nav, marketing_manager role) ──

// ─── MARKETING CALENDAR DATA ─────────────────────────────────────────────────
const MKTG_CAMPAIGNS = [
  { id:1,  date:9,  title:"Open House Push — Pinnacle Peak",    type:"social",    status:"live",     agent:"Yong Choi",   color:"#7C3AED" },
  { id:2,  date:11, title:"Spring Collection Email Blast",      type:"email",     status:"scheduled",agent:"Team",        color:"#0369A1" },
  { id:3,  date:12, title:"16020 N Horseshoe — Flyer Due",      type:"print",     status:"due",      agent:"Marcus Webb", color:"#C2410C" },
  { id:4,  date:14, title:"Desert Mountain — Spring Social Kit",type:"social",    status:"in-design",agent:"Lex Baum",    color:"#7C3AED" },
  { id:5,  date:15, title:"Broker Preview Video Drop",          type:"video",     status:"scheduled",agent:"Team",        color:"#0369A1" },
  { id:6,  date:17, title:"Market Report — Q1 Distribution",    type:"report",    status:"scheduled",agent:"David Kim",   color:"#15803D" },
  { id:7,  date:19, title:"Just Listed — Arcadia Modern",       type:"social",    status:"scheduled",agent:"Sarah Patel", color:"#7C3AED" },
  { id:8,  date:20, title:"Photography Shoot — 74th St",        type:"print",     status:"due",      agent:"Lex Baum",    color:"#C2410C" },
  { id:9,  date:22, title:"Open House 2 — 74th St Social Push", type:"social",    status:"scheduled",agent:"Yong Choi",   color:"#7C3AED" },
  { id:10, date:25, title:"Monthly Sphere Email",               type:"email",     status:"scheduled",agent:"Team",        color:"#0369A1" },
  { id:11, date:27, title:"Q2 Campaign Planning Deck Due",      type:"report",    status:"due",      agent:"Lex Baum",    color:"#C2410C" },
  { id:12, date:29, title:"Desert Mountain — Summer Preview",   type:"video",     status:"draft",    agent:"Marcus Webb", color:"#D97706" },
];

const MKTG_TYPE_COLORS = { social:"#7C3AED", email:"#0369A1", print:"#C2410C", video:"#D97706", report:"#15803D" };
const MKTG_STATUS_COLORS = { live:"#15803D", scheduled:"#0369A1", "in-design":"#D97706", due:"#C2410C", draft:"#9CA3AF" };

// ─── MANAGER CHARTS + CALENDARS ──────────────────────────────────────────────

function ManagerChartsPanel() {
  const [tab, setTab] = useState("volume");
  const current = MMD_SLA_TREND[MMD_SLA_TREND.length-1].rate;
  const prev    = MMD_SLA_TREND[MMD_SLA_TREND.length-2].rate;
  const delta   = current - prev;
  const volMax  = Math.max(...MMD_VOLUME_12W.map(w => Math.max(w.submitted,w.completed)));

  return (
    <div style={{ background:"white", border:"1px solid var(--border)", borderRadius:4, overflow:"hidden" }}>
      <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy)" }}>
          {tab==="volume" ? "Queue Volume — 12 Weeks" : tab==="sla" ? "SLA Compliance — 6 Months" : "Requests by Type"}
        </div>
        <div style={{ display:"flex", gap:2, background:"#F3F4F6", padding:2 }}>
          {[["volume","Volume"],["sla","SLA"],["type","By Type"]].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} style={{
              fontSize:9, fontWeight:700, padding:"3px 10px", border:"none", cursor:"pointer",
              background:tab===k?"white":"transparent",
              color:tab===k?"var(--navy)":"#9CA3AF",
              boxShadow:tab===k?"0 1px 3px rgba(0,0,0,0.08)":"none",
              letterSpacing:"0.06em", textTransform:"uppercase",
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"16px 20px 14px" }}>
        {/* ── Volume tab ── */}
        {tab==="volume" && (
          <>
            <div style={{ display:"flex", gap:10, marginBottom:10, alignItems:"center" }}>
              {[["var(--navy)","Submitted"],["var(--gold)","Completed"]].map(([c,l]) => (
                <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, color:"#9CA3AF" }}>
                  <div style={{ width:8, height:8, background:c }} />{l}
                </span>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:90 }}>
              {MMD_VOLUME_12W.map(w => (
                <div key={w.week} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <div style={{ width:"100%", display:"flex", gap:1, alignItems:"flex-end", height:76 }}>
                    <div style={{ flex:1, background:"var(--navy)", height:`${(w.submitted/volMax)*100}%`, minHeight:2, transition:"height 0.3s" }} />
                    <div style={{ flex:1, background:"var(--gold)",  height:`${(w.completed/volMax)*100}%`, minHeight:2, transition:"height 0.3s" }} />
                  </div>
                  <div style={{ fontSize:7, color:"#C4B9AA", marginTop:3 }}>{w.week}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid var(--border)", marginTop:8 }}>
              <span style={{ fontSize:10, color:"#9CA3AF" }}>
                <strong style={{ fontSize:18, fontFamily:"var(--font-display)", fontWeight:300, color:"var(--navy)" }}>
                  {MMD_VOLUME_12W.reduce((s,w)=>s+w.submitted,0)}
                </strong> submitted
              </span>
              <span style={{ fontSize:10, color:"#9CA3AF" }}>
                <strong style={{ fontSize:18, fontFamily:"var(--font-display)", fontWeight:300, color:"var(--gold)" }}>
                  {MMD_VOLUME_12W.reduce((s,w)=>s+w.completed,0)}
                </strong> completed
              </span>
            </div>
          </>
        )}

        {/* ── SLA tab ── */}
        {tab==="sla" && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:22, fontFamily:"var(--font-display)", fontWeight:300, color:current>=90?"#15803D":"#D97706", lineHeight:1 }}>{current}%</span>
              <span style={{ fontSize:9, fontWeight:700, color:delta>=0?"#15803D":"#DC2626", background:delta>=0?"#F0FDF4":"#FEF2F2", padding:"2px 7px", borderRadius:2 }}>
                {delta>=0?"↑":"↓"}{Math.abs(delta)}% MoM
              </span>
              <span style={{ fontSize:9, color:"#9CA3AF", marginLeft:"auto" }}>Target: 90%</span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={MMD_SLA_TREND} margin={{top:2,right:4,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false} />
                <YAxis domain={[80,100]} tick={{fontSize:9,fill:"#9CA3AF"}} axisLine={false} tickLine={false} width={26} tickFormatter={v=>`${v}%`} />
                <Tooltip formatter={v=>[`${v}%`,"SLA"]} contentStyle={{fontSize:11,border:"1px solid var(--border)",borderRadius:2}} />
                <ReferenceLine y={90} stroke="#E5E7EB" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="rate" stroke="var(--navy)" strokeWidth={2} dot={{fill:"var(--navy)",r:3}} activeDot={{r:5}} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid var(--border)", marginTop:8 }}>
              {MMD_SLA_TREND.map(m => (
                <div key={m.month} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:9, fontFamily:"monospace", fontWeight:700, color:m.rate>=90?"#15803D":m.rate>=85?"#D97706":"#DC2626" }}>{m.rate}%</div>
                  <div style={{ fontSize:8, color:"#C4B9AA" }}>{m.month}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── By Type tab ── */}
        {tab==="type" && (
          <div style={{ display:"flex", gap:24, alignItems:"center" }}>
            <PieChart width={130} height={130}>
              <Pie data={MMD_MATERIAL_BREAKDOWN} cx={60} cy={60} innerRadius={32} outerRadius={52} dataKey="count" strokeWidth={2} stroke="white">
                {MMD_MATERIAL_BREAKDOWN.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v,n)=>[v,n]} contentStyle={{fontSize:11,border:"1px solid var(--border)"}} />
            </PieChart>
            <div style={{ flex:1 }}>
              {MMD_MATERIAL_BREAKDOWN.map(m => (
                <div key={m.type} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                  <div style={{ width:8, height:8, background:m.color, flexShrink:0 }} />
                  <div style={{ fontSize:10, color:"var(--navy)", width:72, flexShrink:0 }}>{m.type}</div>
                  <div style={{ flex:1, height:4, background:"#F3F4F6", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(m.count/18)*100}%`, background:m.color, borderRadius:2 }} />
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color:"var(--navy)", width:22, textAlign:"right", fontFamily:"monospace", flexShrink:0 }}>{m.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ManagerCalendarPanel() {
  const [calTab, setCalTab] = useState("personal");
  const [mktgFilter, setMktgFilter] = useState("all");

  // ── Personal calendar — reuse CAL_EVENTS + grid from PersonalCalendar ──
  const firstDay    = new Date(CAL_YEAR, CAL_MONTH, 1).getDay();
  const daysInMonth = new Date(CAL_YEAR, CAL_MONTH + 1, 0).getDate();
  const cells       = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );
  while (cells.length % 7 !== 0) cells.push(null);
  const eventDays    = new Set(CAL_EVENTS.map(e => e.date));
  const deadlineDays = new Set(CAL_EVENTS.filter(e => e.type==="deadline").map(e => e.date));
  const closingDays  = new Set(CAL_EVENTS.filter(e => e.type==="closing").map(e => e.date));
  const upcomingPer  = CAL_EVENTS.filter(e => e.date >= CAL_TODAY).sort((a,b)=>a.date-b.date);

  // ── Marketing calendar ──
  const mktgFiltered = mktgFilter==="all"
    ? MKTG_CAMPAIGNS
    : MKTG_CAMPAIGNS.filter(c => c.type===mktgFilter);
  const mktgEventDays = new Set(MKTG_CAMPAIGNS.map(c => c.date));

  // mini grid helper
  function MiniGrid({ highlightFn }) {
    return (
      <div style={{ padding:"0 12px 8px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:2 }}>
          {["S","M","T","W","T","F","S"].map((d,i) => (
            <div key={i} style={{ textAlign:"center", fontSize:7, fontWeight:700, color:"#C4B9AA", letterSpacing:"0.04em", padding:"3px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1 }}>
          {cells.map((day,i) => {
            if (!day) return <div key={i} style={{ height:34 }} />;
            const isToday    = day===CAL_TODAY;
            const highlights = highlightFn(day);
            return (
              <div key={i} style={{ position:"relative", height:34, display:"flex", alignItems:"center", justifyContent:"center",
                background:isToday?"var(--navy)":highlights.bg||"transparent",
                borderRadius:2, cursor:highlights.dot?"pointer":"default" }}>
                <span style={{ fontSize:8, fontWeight:isToday?700:400, color:isToday?"white":highlights.dot?"var(--navy)":"#9CA3AF", lineHeight:1 }}>{day}</span>
                {highlights.dot && !isToday && (
                  <div style={{ position:"absolute", bottom:1, left:"50%", transform:"translateX(-50%)", width:3, height:3, borderRadius:"50%", background:highlights.dotColor||"var(--navy)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:"white", border:"1px solid var(--border)", borderRadius:4, overflow:"hidden", display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid var(--border)" }}>
        {[["personal","My Calendar"],["marketing","Marketing Cal"]].map(([k,l]) => (
          <button key={k} onClick={()=>setCalTab(k)} style={{
            flex:1, padding:"11px 0", fontSize:9, fontWeight:700, letterSpacing:"0.1em",
            textTransform:"uppercase", border:"none", cursor:"pointer",
            background:calTab===k?"white":"#FAFAFA",
            color:calTab===k?"var(--navy)":"#9CA3AF",
            borderBottom:calTab===k?"2px solid var(--navy)":"2px solid transparent",
          }}>{l}</button>
        ))}
      </div>

      {/* ── Personal ── */}
      {calTab==="personal" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
          <MiniGrid highlightFn={day => ({
            dot: eventDays.has(day),
            dotColor: closingDays.has(day) ? "#15803D" : deadlineDays.has(day) ? "#C2410C" : "var(--navy)",
            bg: undefined,
          })} />
          <div style={{ borderTop:"1px solid var(--border)", overflowY:"auto", marginTop:"auto" }}>
            {upcomingPer.slice(0,5).map((ev,i,arr) => (
              <div key={ev.id} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 16px",
                borderBottom:i<arr.length-1?"1px solid var(--border)":"none" }}>
                <div style={{ width:2, borderRadius:2, background:ev.color, alignSelf:"stretch", flexShrink:0 }} />
                <div style={{ width:28, flexShrink:0, textAlign:"center" }}>
                  <div style={{ fontSize:16, fontFamily:"var(--font-display)", fontWeight:300, color:"var(--navy)", lineHeight:1 }}>{ev.date}</div>
                  <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"#9CA3AF" }}>Mar</div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"var(--navy)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
                  <div style={{ fontSize:9, color:"#9CA3AF" }}>{ev.time} · {ev.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Marketing ── */}
      {calTab==="marketing" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
          {/* Type filter chips */}
          <div style={{ padding:"8px 16px", borderBottom:"1px solid var(--border)", display:"flex", gap:4, flexWrap:"wrap" }}>
            {[["all","All"],["social","Social"],["email","Email"],["print","Print"],["video","Video"],["report","Report"]].map(([k,l]) => (
              <button key={k} onClick={()=>setMktgFilter(k)} style={{
                fontSize:8, fontWeight:700, padding:"2px 8px", border:"none", cursor:"pointer",
                background:mktgFilter===k?(MKTG_TYPE_COLORS[k]||"var(--navy)"):"#F3F4F6",
                color:mktgFilter===k?"white":"#9CA3AF",
                letterSpacing:"0.06em", textTransform:"uppercase", borderRadius:2,
              }}>{l}</button>
            ))}
          </div>
          <MiniGrid highlightFn={day => {
            const evs = MKTG_CAMPAIGNS.filter(c => c.date===day);
            const due = evs.find(c => c.status==="due");
            const live= evs.find(c => c.status==="live");
            return {
              dot: mktgEventDays.has(day),
              dotColor: due?"#C2410C":live?"#15803D":"var(--navy)",
              bg: undefined,
            };
          }} />
          <div style={{ borderTop:"1px solid var(--border)", overflowY:"auto", marginTop:"auto" }}>
            {mktgFiltered.filter(c=>c.date>=CAL_TODAY).sort((a,b)=>a.date-b.date).map((ev,i,arr) => (
              <div key={ev.id} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 16px",
                borderBottom:i<arr.length-1?"1px solid var(--border)":"none" }}>
                <div style={{ width:2, borderRadius:2, background:MKTG_TYPE_COLORS[ev.type]||"#9CA3AF", alignSelf:"stretch", flexShrink:0 }} />
                <div style={{ width:28, flexShrink:0, textAlign:"center" }}>
                  <div style={{ fontSize:16, fontFamily:"var(--font-display)", fontWeight:300, color:"var(--navy)", lineHeight:1 }}>{ev.date}</div>
                  <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"#9CA3AF" }}>Mar</div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"var(--navy)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
                    <span style={{ fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em",
                      color:MKTG_STATUS_COLORS[ev.status]||"#9CA3AF",
                      background:ev.status==="live"?"#F0FDF4":ev.status==="due"?"#FEF2F2":"#F3F4F6",
                      padding:"1px 5px", borderRadius:2 }}>{ev.status}</span>
                    <span style={{ fontSize:9, color:"#9CA3AF" }}>{ev.agent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ManagerDashboardHome({ onSelectRequest }) {
  const allReqs    = DESIGNER_ALL_REQUESTS;
  const open       = allReqs.filter(r => !["completed","cancelled"].includes(r.status));
  const unassigned = allReqs.filter(r => !r.designerName && !["completed","cancelled"].includes(r.status));
  const inReview   = allReqs.filter(r => r.status === "review");
  const breached   = allReqs.filter(r => r.slaBreached);
  const rushActive = allReqs.filter(r => r.isRush && !["completed","cancelled"].includes(r.status));
  const completed  = allReqs.filter(r => r.status === "completed");
  const needsAttn  = allReqs.filter(r =>
    !["completed","cancelled"].includes(r.status) &&
    (r.feasibilityFlag || r.slaBreached || !r.designerName)
  );

  const [triageActions, setTriageActions] = useState({});
  const [assignMap,     setAssignMap]     = useState({});
  const [doneTasks,     setDoneTasks]     = useState({});

  function handleQuickApprove(req) {
    if (!assignMap[req.id]) return;
    setTriageActions(prev => ({...prev,[req.id]:"approved"}));
  }
  function handleQuickReject(req) {
    setTriageActions(prev => ({...prev,[req.id]:"rejected"}));
  }
  function undoAction(id) {
    setTriageActions(prev => { const n={...prev}; delete n[id]; return n; });
  }

  const byDesigner = [
    { name:"Lex Baum",    active:allReqs.filter(r=>r.designerName==="Lex Baum"    && !["completed","cancelled"].includes(r.status)).length, breached:allReqs.filter(r=>r.designerName==="Lex Baum"    && r.slaBreached).length },
    { name:"Marcus Webb", active:allReqs.filter(r=>r.designerName==="Marcus Webb" && !["completed","cancelled"].includes(r.status)).length, breached:0 },
    { name:"Unassigned",  active:unassigned.length, breached:0 },
  ];

  const greeting = new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening";

  return (
    <div style={{ padding:"28px 0 40px" }}>

      {/* ── Greeting ── */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"var(--font-display)", fontSize:26, fontWeight:300, color:"var(--navy)", letterSpacing:"-0.01em" }}>
          Good {greeting}, Lex.
        </div>
        <div style={{ fontSize:12, color:"#9CA3AF", marginTop:4 }}>
          {open.length} open request{open.length!==1?"s":""}
          {unassigned.length>0 && <> · <strong style={{color:"#D97706"}}>{unassigned.length} unassigned</strong></>}
          {breached.length>0   && <> · <strong style={{color:"#DC2626"}}>{breached.length} SLA breached</strong></>}
        </div>
      </div>

      {/* ── Row 1: Left col (charts + needs attention) | Right col (calendar) ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16, alignItems:"stretch" }}>

        {/* Left column: charts stacked above needs attention */}
        <div style={{ display:"flex", flexDirection:"column", gap:16, height:"100%" }}>
          <ManagerChartsPanel />

          {/* Needs Attention */}
          <div style={{ background:"white", border:"1px solid var(--border)", borderRadius:4, overflow:"hidden" }}>
            <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy)" }}>Needs Attention</div>
              {needsAttn.length>0 && (
                <span style={{ fontSize:9, fontWeight:700, background:"#FEF2F2", color:"#DC2626", padding:"2px 8px", borderRadius:2 }}>{needsAttn.length}</span>
              )}
            </div>
            {needsAttn.length===0 ? (
              <div style={{ padding:"20px", textAlign:"center", color:"#9CA3AF", fontSize:11 }}>✓ All requests on track</div>
            ) : <div style={{ maxHeight:176, overflowY:"auto" }}>{needsAttn.map((req,i,arr) => {
              const sla = slaCountdown(req.slaDeadline, req.status==="awaiting_materials");
              const borderColor = req.slaBreached?"#EF4444":!req.designerName?"#F59E0B":"#E5E7EB";
              return (
                <div key={req.id} onClick={()=>onSelectRequest(req)}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"11px 20px",
                    borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
                    borderLeft:`3px solid ${borderColor}`, cursor:"pointer", transition:"background 0.1s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F9FAFB"}
                  onMouseLeave={e=>e.currentTarget.style.background="white"}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:"var(--navy)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{req.title}</span>
                      {req.isRush && <RushBadge />}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:10, color:"#9CA3AF" }}>{req.materialType}</span>
                      <span style={{ fontSize:10, color:"#D1C9BC" }}>·</span>
                      <span style={{ fontSize:10, color:req.designerName?"#9CA3AF":"#D97706", fontWeight:req.designerName?400:700 }}>
                        {req.designerName||"Unassigned"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                    <RequestStatusChip status={req.status} />
                    <span style={{ fontSize:10, fontWeight:600, color:sla.urgent?"#DC2626":"#9CA3AF", minWidth:52, textAlign:"right" }}>{sla.label}</span>
                  </div>
                </div>
              );
            })}</div>}
          </div>
        </div>

        {/* Right column: stretches to match left column */}
        <div style={{ display:"flex", flexDirection:"column", minHeight:0 }}>
          <ManagerCalendarPanel />
        </div>
      </div>

      {/* ── Row 2: KPI 2×2 (260px) | Designer Capacity (300px) | Quick Triage (300px) ── */}
      <div style={{ display:"grid", gridTemplateColumns:"260px 390px 1fr", gap:16, marginBottom:16, alignItems:"start" }}>

        {/* KPI 2×2 */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gridTemplateRows:"1fr 1fr", gap:10, height:280 }}>
          {[
            { label:"Open Requests",  value:open.length,       accent:"var(--navy)", barPct:Math.min(100,(open.length/10)*100),      signal:open.length>8?"⚠ High volume":"✓ Manageable",        target:"Target <10" },
            { label:"SLA Compliance", value:`${MMD_SLA_TREND[MMD_SLA_TREND.length-1].rate}%`, accent:"#15803D", barPct:MMD_SLA_TREND[MMD_SLA_TREND.length-1].rate, signal:"↑ 3% MoM", target:"Target ≥90%" },
            { label:"Rush Active",    value:rushActive.length, accent:"#B45309",     barPct:Math.min(100,(rushActive.length/5)*100),  signal:rushActive.length>0?`${rushActive.length} active`:"✓ None", target:"Watch closely" },
            { label:"Completed MTD",  value:completed.length,  accent:"var(--gold)", barPct:Math.min(100,(completed.length/20)*100), signal:`${completed.length} this month`,                      target:"Goal 20/mo" },
          ].map(k => <AgentKPITile key={k.label} {...k} />)}
        </div>

        {/* Designer Capacity — left: designer rows, right: avg turnaround */}
        <div style={{ background:"white", border:"1px solid var(--border)", borderRadius:4, overflow:"hidden", display:"flex", flexDirection:"column", height:200 }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy)" }}>Designer Capacity</div>
          </div>
          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

            {/* Left: designer rows */}
            <div style={{ flex:1, borderRight:"1px solid var(--border)", overflowY:"auto" }}>
              {byDesigner.map((d,i) => {
                const pct = Math.min(100,(d.active/5)*100);
                const sc  = d.name==="Unassigned"?"#9CA3AF":d.active>=5?"#DC2626":d.active>=3?"#D97706":"#15803D";
                const sl  = d.name==="Unassigned"?"pool":d.active>=5?"overloaded":d.active>=3?"busy":"available";
                return (
                  <div key={d.name} style={{ padding:"10px 12px", borderBottom:i<byDesigner.length-1?"1px solid var(--border)":"none" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
                      <div>
                        <div style={{ fontSize:10, fontWeight:600, color:"var(--navy)" }}>{d.name}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:3, marginTop:2 }}>
                          <div style={{ width:4, height:4, borderRadius:"50%", background:sc }} />
                          <span style={{ fontSize:8, color:sc, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{sl}</span>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:18, fontFamily:"var(--font-display)", fontWeight:300, color:sc, lineHeight:1 }}>{d.active}</div>
                        <div style={{ fontSize:8, color:"#9CA3AF" }}>active</div>
                      </div>
                    </div>
                    {d.name!=="Unassigned" && (
                      <div style={{ height:3, background:"#F3F4F6", borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:sc, borderRadius:2, transition:"width 0.4s ease" }} />
                      </div>
                    )}
                    {d.breached>0 && <div style={{ fontSize:8, fontWeight:700, color:"#DC2626", marginTop:3 }}>⚠ {d.breached} breached</div>}
                  </div>
                );
              })}
            </div>

            {/* Right: avg turnaround */}
            <div style={{ width:180, flexShrink:0, padding:"12px 10px", background:"#FDFAF5", overflowY:"auto" }}>
              <div style={{ fontSize:7, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:10 }}>Avg / Type</div>
              {TURNAROUND_BY_TYPE.map(t => (
                <div key={t.type} style={{ marginBottom:11 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:3 }}>
                    <span style={{ fontSize:9, color:"var(--navy)", fontWeight:500 }}>{t.type}</span>
                    <span style={{ fontSize:13, fontFamily:"var(--font-display)", fontWeight:300, color:t.days>5?"#DC2626":t.days>3?"#D97706":"var(--navy)", lineHeight:1 }}>{t.days}<span style={{ fontSize:8, color:"#9CA3AF", fontFamily:"var(--font-body)" }}>d</span></span>
                  </div>
                  <div style={{ height:2, background:"#F0EDE8", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(t.days/7)*100}%`, background:t.days>5?"#DC2626":t.days>3?"#D97706":"var(--navy)", borderRadius:2 }} />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Quick Triage */}
        <div style={{ background:"white", border:"1px solid var(--border)", borderRadius:4, overflow:"hidden", display:"flex", flexDirection:"column", height:200 }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy)" }}>Quick Triage</div>
            {unassigned.length>0 && (
              <span style={{ fontSize:9, fontWeight:700, background:"#FFFBEB", color:"#D97706", padding:"2px 5px", borderRadius:2 }}>{unassigned.length}</span>
            )}
          </div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {unassigned.length===0 ? (
              <div style={{ padding:"20px 12px", textAlign:"center", color:"#9CA3AF", fontSize:11 }}>✓ No unassigned</div>
            ) : unassigned.slice(0,4).map((req,i,arr) => {
              const action   = triageActions[req.id];
              const designer = assignMap[req.id]||"";
              return (
                <div key={req.id} style={{ padding:"9px 12px", borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
                  background:action==="approved"?"#F0FDF4":action==="rejected"?"#FEF2F2":"white", transition:"background 0.2s" }}>
                  {action ? (
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:action==="approved"?"#15803D":"#DC2626" }}>
                          {action==="approved"?"✓ Approved":"✕ Rejected"}
                        </div>
                        <div style={{ fontSize:9, color:"#9CA3AF", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>{req.title}</div>
                      </div>
                      <button onClick={()=>undoAction(req.id)}
                        style={{ fontSize:9, color:"#9CA3AF", background:"none", border:"1px solid var(--border)", padding:"2px 6px", cursor:"pointer" }}>
                        Undo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize:10, fontWeight:600, color:"var(--navy)", marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{req.title}</div>
                      <div style={{ fontSize:9, color:"#9CA3AF", marginBottom:5 }}>{req.materialType}{req.isRush?" · RUSH":""}</div>
                      <div style={{ display:"flex", gap:3 }}>
                        <select value={designer} onChange={e=>setAssignMap(prev=>({...prev,[req.id]:e.target.value}))}
                          style={{ flex:1, fontSize:9, border:"1px solid var(--border)", padding:"3px 4px", background:"white", color:designer?"var(--navy)":"#9CA3AF", fontFamily:"var(--font-body)", outline:"none", cursor:"pointer" }}>
                          <option value="">Assign…</option>
                          {["Lex Baum","Marcus Webb"].map(n=><option key={n} value={n}>{n}</option>)}
                        </select>
                        <button onClick={()=>handleQuickApprove(req)} disabled={!designer}
                          style={{ fontSize:10, fontWeight:700, padding:"3px 7px", border:"none", cursor:designer?"pointer":"not-allowed",
                            background:designer?"var(--navy)":"#E5E1D8", color:designer?"white":"#C4B9AA" }}>✓</button>
                        <button onClick={()=>handleQuickReject(req)}
                          style={{ fontSize:10, fontWeight:700, padding:"3px 5px", background:"#FEF2F2", color:"#B91C1C", border:"1px solid #FCA5A5", cursor:"pointer" }}>✕</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Recent Messages (1fr) | Active Queue (616px = 300+16+300) ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 796px", gap:16, alignItems:"stretch", marginBottom:40 }}>

        {/* Recent Messages */}
        <div style={{ background:"white", border:"1px solid var(--border)", borderRadius:4, overflow:"hidden", display:"flex", flexDirection:"column", height:320 }}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy)" }}>Recent Messages</div>
            <div style={{ display:"flex", gap:6 }}>
              {[["All","all"],["Platform","platform"],["Email","email"],["DM","dm"]].map(([label, val]) => (
                <button key={val} style={{ fontSize:9, fontWeight:600, letterSpacing:"0.06em", padding:"2px 8px", borderRadius:2, border:"1px solid var(--border)", background:val==="all"?"var(--navy)":"white", color:val==="all"?"white":"#9CA3AF", cursor:"pointer" }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {UNIFIED_MESSAGES.slice(0,5).map((msg,i) => (
              <div key={msg.id} style={{
                padding:"12px 20px", borderBottom:i<UNIFIED_MESSAGES.length-1?"1px solid var(--border)":"none",
                cursor:"pointer", display:"flex", gap:12, alignItems:"flex-start", position:"relative",
              }}
                onMouseEnter={e=>e.currentTarget.style.background="#F9FAFB"}
                onMouseLeave={e=>e.currentTarget.style.background="white"}
              >
                <div style={{ position:"relative", flexShrink:0 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:msg.avatarBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:msg.avatarText }}>{msg.initials}</span>
                  </div>
                  <div style={{ position:"absolute", bottom:-2, right:-2, width:14, height:14, borderRadius:"50%", background:msg.channel==="email"?"#EFF6FF":msg.channel==="dm"?"#F0FDF4":"#F8F5F0", border:"1.5px solid white", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {msg.channel==="email"    && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><rect x="0.5" y="0.5" width="7" height="5" rx="0.5" stroke="#3B82F6" strokeWidth="0.8"/><path d="M0.5 1.5L4 3.5L7.5 1.5" stroke="#3B82F6" strokeWidth="0.8"/></svg>}
                    {msg.channel==="dm"       && <svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M1 1h6a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H4.5L3 6V5H1a.5.5 0 01-.5-.5v-3A.5.5 0 011 1z" stroke="#16A34A" strokeWidth="0.8"/></svg>}
                    {msg.channel==="platform" && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" stroke="#C9A96E" strokeWidth="0.8"/><path d="M4 2.5v2l1 1" stroke="#C9A96E" strokeWidth="0.8" strokeLinecap="round"/></svg>}
                  </div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:1 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:"var(--navy)" }}>{msg.sender}</span>
                    <span style={{ fontSize:10, color:"#9CA3AF", flexShrink:0, marginLeft:8 }}>{msg.time}</span>
                  </div>
                  {msg.subject && <div style={{ fontSize:10, fontWeight:600, color:"#374151", marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{msg.subject}</div>}
                  <div style={{ fontSize:11, color:"#6B7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{msg.preview}</div>
                  {msg.context && <div style={{ fontSize:10, color:"#C4B99A", marginTop:2 }}>{msg.context}</div>}
                  {msg.unread && <div style={{ position:"absolute", top:14, right:14, width:6, height:6, borderRadius:"50%", background:"var(--navy)" }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Queue — matches Recent Messages height via alignItems:stretch */}
        <div style={{ background:"white", border:"1px solid var(--border)", borderRadius:4, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy)" }}>Active Queue</div>
            <span style={{ fontSize:9, color:"#9CA3AF" }}>{open.length}</span>
          </div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {open.map((req,i,arr) => {
              const sla = slaCountdown(req.slaDeadline, req.status==="awaiting_materials");
              return (
                <div key={req.id} onClick={()=>onSelectRequest(req)}
                  style={{ padding:"9px 14px", borderBottom:i<arr.length-1?"1px solid var(--border)":"none",
                    cursor:"pointer", background:req.slaBreached?"#FFF5F5":!req.designerName?"#FFFBF5":"white",
                    transition:"background 0.1s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#F9FAFB"}
                  onMouseLeave={e=>e.currentTarget.style.background=req.slaBreached?"#FFF5F5":!req.designerName?"#FFFBF5":"white"}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6, marginBottom:2 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:"var(--navy)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{req.title}</span>
                    {req.isRush && <RushBadge />}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:9, color:req.designerName?"#9CA3AF":"#D97706", fontWeight:req.designerName?400:700 }}>
                      {req.designerName||"Unassigned"}
                    </span>
                    <span style={{ fontSize:9, fontWeight:600, color:sla.paused?"#0891B2":sla.urgent?"#DC2626":"#9CA3AF" }}>{sla.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


    </div>
  );
}

function Dashboard({ role, onSelectRequest, onNewRequest }) {
  if (role === "designer")  return <DesignerDashboardHome  onSelectRequest={onSelectRequest} />;
  if (role === "marketing_manager") return <ManagerDashboardHome onSelectRequest={onSelectRequest} />;
  if (role === "executive") return <ExecutiveDashboardHome />;
  return <AgentDashboard onSelectRequest={onSelectRequest} onNewRequest={onNewRequest} />;
}


// ─── MESSENGER (LinkedIn-style) ──────────────────────────────────────────────

const MESSENGER_CONTACTS = [
  { id: "c1", name: "Lex Baum",    initials: "LH", role: "Designer",      avatarBg: "var(--navy)",  avatarText: "var(--gold)",  online: true,  unread: 2,
    thread: [
      { from: "them", text: "First draft is ready for Pinnacle Peak — take a look when you get a chance.", time: "2:14 PM" },
      { from: "me",   text: "Perfect timing, reviewing now.", time: "2:31 PM" },
      { from: "them", text: "Let me know if you want any changes to the typography or layout.", time: "2:33 PM" },
    ]},
  { id: "c2", name: "David Kim",     initials: "DK", role: "CMO",           avatarBg: "#EFF6FF",      avatarText: "#1D4ED8",  online: true,  unread: 1,
    thread: [
      { from: "them", text: "Can you join Thursday at 2pm? I want to walk through the new spend allocation.", time: "11:02 AM" },
      { from: "me",   text: "Thursday works, I'll send a calendar invite.", time: "11:45 AM" },
    ]},
  { id: "c3", name: "Sarah Chen",    initials: "SC", role: "Agent",         avatarBg: "#F0FDF4",      avatarText: "#15803D",  online: false, unread: 0,
    thread: [
      { from: "them", text: "Are you going to the broker open at Desert Mountain on Friday?", time: "Yesterday" },
      { from: "me",   text: "Planning on it — see you there!", time: "Yesterday" },
    ]},
  { id: "c4", name: "Marcus Webb",   initials: "MW", role: "Designer",      avatarBg: "#FFF7ED",      avatarText: "#C2410C",  online: true,  unread: 0,
    thread: [
      { from: "them", text: "Got the Dropbox link for the open house flyer assets. Should have a draft by EOD.", time: "10:20 AM" },
    ]},
  { id: "c5", name: "Tom Alvarez",   initials: "TA", role: "Agent",         avatarBg: "#F5F3FF",      avatarText: "#6D28D9",  online: false, unread: 0,
    thread: [
      { from: "them", text: "The Pinnacle Peak listing is getting traction. Any open house planned?", time: "Yesterday" },
      { from: "me",   text: "Working on scheduling one for the 22nd.", time: "Yesterday" },
    ]},
];

function MessengerPanel({ contact, onClose, onMinimize, minimized }) {
  const [input, setInput] = React.useState("");
  const [msgs, setMsgs] = React.useState(contact.thread);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    if (!minimized && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [msgs, minimized]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setMsgs(m => [...m, { from: "me", text, time: "Just now" }]);
    setInput("");
  }

  return (
    <div style={{
      width: 300, background: "white", borderRadius: "8px 8px 0 0",
      boxShadow: "0 4px 24px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column",
      overflow: "hidden", border: "1px solid #E5E7EB", borderBottom: "none",
    }}>
      {/* Panel header */}
      <div
        onClick={onMinimize}
        style={{
          background: "var(--navy)", padding: "8px 12px", display: "flex", alignItems: "center",
          gap: 8, cursor: "pointer", flexShrink: 0,
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProfileAvatar name={contact.name} initials={contact.initials} bg={contact.avatarBg} txtColor={contact.avatarText} size={30} style={{ borderRadius:"50%", border:"1.5px solid rgba(255,255,255,0.2)" }} />
          {contact.online && <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#22C55E", border: "1.5px solid var(--navy)", pointerEvents:"none" }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ProfileLink name={contact.name} style={{ fontSize: 12, fontWeight: 700, color: "white" }} />
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{contact.role}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={e => { e.stopPropagation(); onMinimize(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 14, padding: "2px 4px", lineHeight: 1 }} title="Minimize">—</button>
          <button onClick={e => { e.stopPropagation(); onClose(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 14, padding: "2px 4px", lineHeight: 1 }} title="Close">✕</button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Message thread */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 8px", display: "flex", flexDirection: "column", gap: 8, height: 280, background: "#FAFAFA" }}>
            {msgs.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: msg.from === "me" ? "row-reverse" : "row", alignItems: "flex-end", gap: 6 }}>
                {msg.from === "them" && (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: contact.avatarBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: contact.avatarText }}>{contact.initials}</span>
                  </div>
                )}
                <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: msg.from === "me" ? "flex-end" : "flex-start", gap: 2 }}>
                  <div style={{
                    padding: "7px 11px", borderRadius: msg.from === "me" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: msg.from === "me" ? "var(--navy)" : "white",
                    color: msg.from === "me" ? "white" : "var(--navy)",
                    fontSize: 12, lineHeight: 1.45,
                    boxShadow: msg.from === "them" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    border: msg.from === "them" ? "1px solid #E5E7EB" : "none",
                  }}>{msg.text}</div>
                  <span style={{ fontSize: 9, color: "#9CA3AF" }}>{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "8px 12px 10px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 8, alignItems: "center", background: "white", flexShrink: 0 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Write a message…"
              style={{
                flex: 1, border: "1px solid #E5E7EB", borderRadius: 20, padding: "6px 12px",
                fontSize: 12, outline: "none", background: "#F9FAFB", color: "var(--navy)",
                fontFamily: "var(--font-body)",
              }}
            />
            <button
              onClick={send}
              style={{
                width: 30, height: 30, borderRadius: "50%", background: input.trim() ? "var(--navy)" : "#E5E7EB",
                border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s", flexShrink: 0,
              }}
            >
              <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
                <path d="M1 6h11M7 1l5 5-5 5" stroke={input.trim() ? "white" : "#9CA3AF"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Messenger() {
  const [open, setOpen] = React.useState(false);
  const [openPanels, setOpenPanels]   = React.useState([]);   // contact ids with open panels
  const [minimized, setMinimized]     = React.useState({});   // { id: bool }
  const [search, setSearch]           = React.useState("");
  const [listMinimized, setListMinimized] = React.useState(true);

  const totalUnread = MESSENGER_CONTACTS.reduce((a, c) => a + c.unread, 0);
  const filtered = MESSENGER_CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  function openChat(id) {
    setOpen(false);
    if (!openPanels.includes(id)) {
      setOpenPanels(p => [...p.slice(-2), id]); // max 3 panels
    }
    setMinimized(m => ({ ...m, [id]: false }));
  }

  function closePanel(id) {
    setOpenPanels(p => p.filter(x => x !== id));
    setMinimized(m => { const n = { ...m }; delete n[id]; return n; });
  }

  function toggleMinimize(id) {
    setMinimized(m => ({ ...m, [id]: !m[id] }));
  }

  return (
    <div style={{ position: "fixed", bottom: 0, right: 24, display: "flex", alignItems: "flex-end", gap: 10, zIndex: 9000 }}>

      {/* Open chat panels — stacked left of the main bar */}
      {openPanels.map(id => {
        const contact = MESSENGER_CONTACTS.find(c => c.id === id);
        if (!contact) return null;
        return (
          <MessengerPanel
            key={id}
            contact={contact}
            minimized={!!minimized[id]}
            onClose={() => closePanel(id)}
            onMinimize={() => toggleMinimize(id)}
          />
        );
      })}

      {/* Main messaging bar */}
      <div style={{ width: 260, background: "white", borderRadius: "8px 8px 0 0", boxShadow: "0 4px 24px rgba(0,0,0,0.16)", border: "1px solid #E5E7EB", borderBottom: "none", overflow: "hidden" }}>

        {/* Bar header */}
        <div
          onClick={() => setListMinimized(l => !l)}
          style={{ background: "var(--navy)", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "white", letterSpacing: "0.01em" }}>Messaging</span>
            {totalUnread > 0 && (
              <div style={{ background: "#DC2626", borderRadius: "50%", minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "white" }}>{totalUnread}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={e => { e.stopPropagation(); setOpen(o => !o); setListMinimized(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: "2px 4px", borderRadius: 3, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
              title="New message"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{listMinimized ? "▲" : "▼"}</span>
          </div>
        </div>

        {!listMinimized && (
          <>
            {/* Search */}
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ position: "relative" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }}>
                  <circle cx="5" cy="5" r="4" stroke="#9CA3AF" strokeWidth="1.2"/>
                  <path d="M8.5 8.5L11 11" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search messages"
                  style={{ width: "100%", paddingLeft: 26, paddingRight: 8, paddingTop: 5, paddingBottom: 5, border: "1px solid #E5E7EB", borderRadius: 20, fontSize: 11, outline: "none", background: "#F9FAFB", color: "var(--navy)", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Contact list */}
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {filtered.map((c, i) => {
                const lastMsg = c.thread[c.thread.length - 1];
                const isOpen = openPanels.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => openChat(c.id)}
                    style={{
                      padding: "9px 14px", display: "flex", gap: 10, alignItems: "center",
                      cursor: "pointer", borderBottom: i < filtered.length - 1 ? "1px solid #F9FAFB" : "none",
                      background: isOpen ? "#F0EDE8" : "white", transition: "background 0.1s",
                    }}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "#F9FAFB"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isOpen ? "#F0EDE8" : "white"; }}
                  >
                    {/* Avatar + online dot */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <ProfileAvatar name={c.name} initials={c.initials} bg={c.avatarBg} txtColor={c.avatarText} size={36} style={{ borderRadius:"50%", border:"1.5px solid #E5E7EB" }} />
                      {c.online && <div style={{ position: "absolute", bottom: 1, right: 1, width: 9, height: 9, borderRadius: "50%", background: "#22C55E", border: "2px solid white" }} />}
                    </div>

                    {/* Name + preview */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                        <ProfileLink name={c.name} style={{ fontSize: 12, fontWeight: c.unread > 0 ? 700 : 500, color: "var(--navy)" }} />
                        <span style={{ fontSize: 9, color: "#9CA3AF", flexShrink: 0, marginLeft: 4 }}>{lastMsg.time}</span>
                      </div>
                      <div style={{ fontSize: 11, color: c.unread > 0 ? "#374151" : "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: c.unread > 0 ? 600 : 400 }}>
                        {lastMsg.from === "me" ? "You: " : ""}{lastMsg.text}
                      </div>
                    </div>

                    {/* Unread badge */}
                    {c.unread > 0 && (
                      <div style={{ flexShrink: 0, width: 17, height: 17, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>{c.unread}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 11, color: "#9CA3AF" }}>No results</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ── Global Search ─────────────────────────────────────────────────────────
const TYPE_ICONS = {
  page:    "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  user:    "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  listing: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  pride:   "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0",
};

const TYPE_LABELS = { page:"Page", user:"Person", listing:"Listing", pride:"Group" };

function GlobalSearch({ onNavigate }) {
  const [query, setQuery]   = React.useState("");
  const [open, setOpen]     = React.useState(false);
  const [cursor, setCursor] = React.useState(-1);
  const { openProfile } = useProfile();
  const inputRef  = React.useRef(null);
  const wrapRef   = React.useRef(null);
  const results   = React.useMemo(() => searchAll(query), [query]);

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); setCursor(-1);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard navigation
  function handleKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c+1, results.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c-1, -1)); }
    if (e.key === "Escape")    { setOpen(false); setCursor(-1); inputRef.current?.blur(); }
    if (e.key === "Enter" && cursor >= 0) { handleSelect(results[cursor]); }
  }

  function handleSelect(r) {
    if (r.type === "page")    { onNavigate(r.nav); setQuery(""); setOpen(false); }
    if (r.type === "user")    { openProfile(r.data); setOpen(false); }
    if (r.type === "pride")   { onNavigate("prides"); setQuery(""); setOpen(false); }
    if (r.type === "listing") { setQuery(""); setOpen(false); }
    setCursor(-1);
  }

  // Group results by type
  const grouped = {};
  results.forEach(r => { if (!grouped[r.type]) grouped[r.type] = []; grouped[r.type].push(r); });
  const typeOrder = ["page","user","listing","pride"].filter(t => grouped[t]);
  // flat index for cursor
  const flat = typeOrder.flatMap(t => grouped[t]);

  return (
    <div ref={wrapRef} style={{ flex: 1, maxWidth: 480, position: "relative" }}>
        {/* Search input */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" style={{ position:"absolute", left:10, pointerEvents:"none", zIndex:1 }}>
          <circle cx="9" cy="9" r="6" stroke="#9CA3AF" strokeWidth="1.6"/>
          <path d="M15 15l-3-3" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setCursor(-1); }}
          onFocus={() => { if (query) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search people, pages, listings, groups…"
          style={{
            width:"100%", paddingLeft:32, paddingRight: query ? 28 : 10,
            paddingTop:7, paddingBottom:7,
            border:"1px solid var(--border)", fontSize:12,
            fontFamily:"var(--font-body)", outline:"none",
            background:"#FAFAF9", boxSizing:"border-box",
            transition:"border-color 0.12s",
          }}
          onMouseEnter={e => { if (document.activeElement !== e.target) e.target.style.borderColor = "#C4B9AA"; }}
          onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = "var(--border)"; }}
          onFocusCapture={e => e.target.style.borderColor = "var(--navy)"}
          onBlurCapture={e => e.target.style.borderColor = "var(--border)"}
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }} style={{ position:"absolute", right:8, background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:14, lineHeight:1, padding:0 }}>×</button>
        )}
      </div>

      {/* Dropdown */}
      {open && query && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"white", border:"1px solid var(--border)", zIndex:9000, boxShadow:"0 8px 24px rgba(15,43,79,0.12)", maxHeight:360, overflowY:"auto" }}>
          {flat.length === 0 ? (
            <div style={{ padding:"16px", fontSize:12, color:"#9CA3AF", textAlign:"center" }}>No results for "{query}"</div>
          ) : (
            typeOrder.map(type => (
              <div key={type}>
                {/* Type header */}
                <div style={{ padding:"8px 14px 4px", fontSize:8, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"#C4B9AA", background:"#FAFAF9", borderBottom:"1px solid #F5F3EE" }}>{TYPE_LABELS[type]}</div>
                {grouped[type].map(r => {
                  const idx = flat.indexOf(r);
                  const active = cursor === idx;
                  return (
                    <div key={r.label + r.sub} onMouseDown={() => handleSelect(r)} onMouseEnter={() => setCursor(idx)}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", background: active ? "#F5F3EE" : "white", cursor:"pointer", borderBottom:"1px solid #FAFAF9" }}>
                      {type === "user" ? (
                        <div style={{ width:26, height:26, background:r.data?.bg || "#F3F0EB", border:"1px solid #E5E1D8", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <span style={{ fontSize:8, fontWeight:700, color:"var(--navy)" }}>{orgInitials(r.label)}</span>
                        </div>
                      ) : (
                        <div style={{ width:26, height:26, background: type==="page" ? "var(--navy)" : type==="listing" ? "#F3F0EB" : "#EEF4ED", border:"none", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={type==="page" ? "var(--gold)" : "var(--navy)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d={TYPE_ICONS[type]}/>
                          </svg>
                        </div>
                      )}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"var(--navy)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.label}</div>
                        <div style={{ fontSize:10, color:"#9CA3AF", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.sub}</div>
                      </div>
                      {active && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M5 2l4 4-4 4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div style={{ padding:"7px 14px", borderTop:"1px solid #F5F3EE", background:"#FAFAF9" }}>
            <span style={{ fontSize:9, color:"#C4B9AA" }}>↑↓ navigate · Enter to select · Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Org Chart Components ──────────────────────────────────────────────────
const ORG_NODE_W = 160;
const ORG_NODE_GAP = 20;

// ── Profile Drawer ────────────────────────────────────────────────────────
const MOCK_SOCIALS = {
  "u2":  { linkedin:"lex-harmon", instagram:"lexharmon.re",  twitter:"lexharmon",    facebook:"", website:"lexharmon.com" },
  "u3":  { linkedin:"david-kim-cmo", instagram:"",           twitter:"davidkimrlsr", facebook:"DavidKimRLSR", website:"" },
  "u10": { linkedin:"robert-lyon",   instagram:"",           twitter:"",             facebook:"", website:"russlyon.com"   },
};

const AVAIL_DAYS  = ["Mon","Tue","Wed","Thu","Fri"];
const AVAIL_SLOTS = ["Morning","Afternoon","Evening"];

// Generate deterministic mock availability from person id
function mockAvailability(personId) {
  const seed = (personId || "x").split("").reduce((a,c) => a + c.charCodeAt(0), 0);
  const grid = {};
  AVAIL_DAYS.forEach((d, di) => {
    grid[d] = {};
    AVAIL_SLOTS.forEach((s, si) => {
      const v = (seed * (di+1) * (si+3) * 7) % 10;
      grid[d][s] = v > 3 ? "free" : v > 1 ? "busy" : "tentative";
    });
  });
  // today's slots always partially filled
  grid["Mon"]["Morning"]   = "busy";
  grid["Mon"]["Afternoon"] = "free";
  grid["Wed"]["Morning"]   = "busy";
  grid["Wed"]["Afternoon"] = "busy";
  return grid;
}

const AVAIL_STYLE = {
  free:      { bg:"#F0FDF4", border:"1px solid #BBF7D0", txt:"#15803D", label:"Free"      },
  busy:      { bg:"#F9F7F4", border:"1px solid #E5E1D8", txt:"#9CA3AF", label:"Busy"      },
  tentative: { bg:"#FFFBEB", border:"1px solid #FDE68A", txt:"#B45309", label:"Tentative" },
};

// Schedule meeting modal (simple inline form within drawer)
function ScheduleForm({ person, onClose }) {
  const [date, setDate]   = React.useState("");
  const [time, setTime]   = React.useState("10:00");
  const [type, setType]   = React.useState("call");
  const [note, setNote]   = React.useState("");
  const [sent, setSent]   = React.useState(false);

  if (sent) return (
    <div style={{ padding:"20px 0", textAlign:"center" }}>
      <div style={{ width:36, height:36, background:"var(--navy)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.2" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:300, color:"var(--navy)", marginBottom:6 }}>Invite Sent</div>
      <div style={{ fontSize:11, color:"#9CA3AF" }}>Calendar invite sent to {person.name}</div>
      <button onClick={onClose} style={{ marginTop:16, fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"7px 20px", border:"1px solid #D5D0C8", background:"white", color:"#9CA3AF", cursor:"pointer" }}>Done</button>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Meeting type */}
      <div>
        <label style={{ display:"block", fontSize:8, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:5 }}>Meeting Type</label>
        <div style={{ display:"flex", gap:0, border:"1px solid var(--border)" }}>
          {[["call","Phone Call"],["video","Video Call"],["inperson","In Person"]].map(([val, label], i, arr) => (
            <button key={val} onClick={() => setType(val)} style={{ flex:1, padding:"6px 4px", fontSize:10, fontWeight: type===val ? 700 : 400, background: type===val ? "var(--navy)" : "white", color: type===val ? "white" : "#9CA3AF", border:"none", borderRight: i < arr.length-1 ? "1px solid var(--border)" : "none", cursor:"pointer", transition:"all 0.12s" }}>{label}</button>
          ))}
        </div>
      </div>
      {/* Date + time row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div>
          <label style={{ display:"block", fontSize:8, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:5 }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width:"100%", border:"1px solid var(--border)", padding:"7px 8px", fontSize:11, fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }}
            onFocus={e => e.target.style.borderColor="var(--navy)"}
            onBlur={e => e.target.style.borderColor="var(--border)"}
          />
        </div>
        <div>
          <label style={{ display:"block", fontSize:8, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:5 }}>Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width:"100%", border:"1px solid var(--border)", padding:"7px 8px", fontSize:11, fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }}
            onFocus={e => e.target.style.borderColor="var(--navy)"}
            onBlur={e => e.target.style.borderColor="var(--border)"}
          />
        </div>
      </div>
      {/* Note */}
      <div>
        <label style={{ display:"block", fontSize:8, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:5 }}>Note (optional)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Agenda or context for the meeting…" style={{ width:"100%", border:"1px solid var(--border)", padding:"7px 8px", fontSize:11, fontFamily:"var(--font-body)", outline:"none", resize:"none", boxSizing:"border-box" }}
          onFocus={e => e.target.style.borderColor="var(--navy)"}
          onBlur={e => e.target.style.borderColor="var(--border)"}
        />
      </div>
      <button onClick={() => { if (date) setSent(true); }} style={{ padding:"9px", fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", border:"none", background: date ? "var(--navy)" : "#E5E1D8", color: date ? "white" : "#9CA3AF", cursor: date ? "pointer" : "default", transition:"all 0.15s" }}>
        Send Invite to {person.name.split(" ")[0]}
      </button>
    </div>
  );
}

function OrgProfileModal({ person, onClose }) {
  const [activeSection, setActiveSection] = React.useState("about");
  const [scheduleOpen, setScheduleOpen]   = React.useState(false);
  const [visible, setVisible]             = React.useState(false);

  React.useEffect(() => {
    if (person) { requestAnimationFrame(() => setVisible(true)); }
    else setVisible(false);
  }, [person]);

  if (!person || !person.name) return null;

  const initials     = orgInitials(person.name);
  const isLeadership = person.type === "csuite" || person.type === "broker";
  const socials      = MOCK_SOCIALS[person.id] || {};
  const avail        = mockAvailability(person.id);

  const SECTIONS = [
    { key:"about",    label:"About"    },
    { key:"calendar", label:"Calendar" },
    { key:"schedule", label:"Schedule" },
  ];

  const SOCIAL_LINKS = [
    { key:"linkedin",  label:"LinkedIn",  icon:"M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",  href: socials.linkedin  ? `https://linkedin.com/in/${socials.linkedin}`  : null },
    { key:"instagram", label:"Instagram", icon:"M22.56 12c0 5.845-4.715 10.56-10.56 10.56S1.44 17.845 1.44 12 6.155 1.44 12 1.44 22.56 6.155 22.56 12zM12 7.2a4.8 4.8 0 100 9.6 4.8 4.8 0 000-9.6zm6.24-1.44a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z", href: socials.instagram ? `https://instagram.com/${socials.instagram}` : null },
    { key:"twitter",   label:"X / Twitter", icon:"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z", href: socials.twitter   ? `https://x.com/${socials.twitter}`           : null },
    { key:"facebook",  label:"Facebook",  icon:"M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z", href: socials.facebook  ? `https://facebook.com/${socials.facebook}`  : null },
    { key:"website",   label:"Website",   icon:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",                     href: socials.website   ? `https://${socials.website}`                  : null },
  ].filter(s => s.href);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,43,79,0.35)", zIndex:9190, transition:"opacity 0.25s", opacity: visible ? 1 : 0 }} />

      {/* Drawer */}
      <div style={{
        position:"fixed", top:0, right:0, bottom:0, width:400,
        background:"white", zIndex:9200,
        boxShadow:"-8px 0 32px rgba(15,43,79,0.18)",
        display:"flex", flexDirection:"column",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",
      }}>

        {/* ── Hero ── */}
        <div style={{ background:"var(--navy)", padding:"28px 24px 0", flexShrink:0, position:"relative", overflow:"hidden" }}>
          {/* Decorative accents */}
          <div style={{ position:"absolute", right:-24, top:-24, width:100, height:100, borderRadius:"50%", background:"rgba(201,169,110,0.08)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", right:24, top:40, width:40, height:40, borderRadius:"50%", background:"rgba(201,169,110,0.05)", pointerEvents:"none" }} />

          {/* Close button */}
          <button onClick={onClose} style={{ position:"absolute", top:14, right:16, background:"rgba(255,255,255,0.08)", border:"none", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.5)", fontSize:16, transition:"background 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
          >×</button>

          {/* Avatar + name */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:20, position:"relative" }}>
            <div style={{ width:68, height:68, flexShrink:0, background: isLeadership ? "var(--gold)" : "#1E3D5C", border: isLeadership ? "none" : "1px solid rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:22, fontWeight:700, color: isLeadership ? "var(--navy)" : "white", letterSpacing:"0.04em" }}>{initials}</span>
            </div>
            <div style={{ flex:1, paddingTop:2 }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:300, color:"white", letterSpacing:"0.01em", lineHeight:1.2, marginBottom:4 }}>{person.name}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", lineHeight:1.4 }}>{person.title}</div>
              {person.dept && (
                <div style={{ display:"inline-block", marginTop:6, fontSize:8, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)", borderBottom:"1px solid var(--gold)", paddingBottom:1 }}>{person.dept}</div>
              )}
            </div>
          </div>

          {/* Quick facts strip */}
          <div style={{ display:"flex", gap:0, borderTop:"1px solid rgba(255,255,255,0.08)", marginLeft:-24, marginRight:-24, padding:"10px 24px", background:"rgba(0,0,0,0.12)" }}>
            {[
              { icon:"M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", val: person.office || "—" },
              { icon:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", val: `${person.years || 0}y tenure` },
            ].map((f, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginRight:20 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon}/></svg>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>{f.val}</span>
              </div>
            ))}
            {/* Socials inline */}
            {SOCIAL_LINKS.slice(0,3).map(s => (
              <a key={s.key} href={s.href} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title={s.label} style={{ display:"flex", alignItems:"center", justifyContent:"center", width:22, height:22, marginRight:4, background:"rgba(255,255,255,0.07)", border:"none", cursor:"pointer", textDecoration:"none", transition:"background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.07)"}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
              </a>
            ))}
          </div>

          {/* Section tabs flush with bottom of hero */}
          <div style={{ display:"flex", marginLeft:-24, marginRight:-24, marginTop:0 }}>
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => { setActiveSection(s.key); setScheduleOpen(false); }} style={{ flex:1, padding:"10px 0", border:"none", background:"none", cursor:"pointer", fontSize:11, fontWeight: activeSection===s.key ? 700 : 400, color: activeSection===s.key ? "white" : "rgba(255,255,255,0.4)", borderBottom:`2px solid ${activeSection===s.key ? "var(--gold)" : "transparent"}`, transition:"all 0.12s", letterSpacing:"0.02em" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex:1, overflowY:"auto", background:"#FAFAF9" }}>

          {/* ── About ── */}
          {activeSection === "about" && (
            <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:0 }}>
              {/* Contact rows */}
              {[
                { icon:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label:"Email",  val:person.email,  link:`mailto:${person.email}` },
                { icon:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", label:"Phone",  val:person.phone,  link:`tel:${person.phone}` },
                { icon:"M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", label:"Office", val:person.office, link:null },
              ].filter(r => r.val).map((r, i, arr) => (
                <div key={r.label} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 0", borderBottom: i < arr.length-1 ? "1px solid #F0EDE8" : "none" }}>
                  <div style={{ width:32, height:32, background:"white", border:"1px solid #E5E1D8", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={r.icon}/></svg>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:2 }}>{r.label}</div>
                    {r.link
                      ? <a href={r.link} style={{ fontSize:12, color:"var(--navy)", textDecoration:"none", fontWeight:500 }} onMouseEnter={e => e.target.style.color="var(--gold)"} onMouseLeave={e => e.target.style.color="var(--navy)"}>{r.val}</a>
                      : <span style={{ fontSize:12, color:"var(--navy)", fontWeight:500 }}>{r.val}</span>
                    }
                  </div>
                </div>
              ))}

              {/* Socials section */}
              {SOCIAL_LINKS.length > 0 && (
                <div style={{ marginTop:20 }}>
                  <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:10 }}>Online Presence</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {SOCIAL_LINKS.map(s => (
                      <a key={s.key} href={s.href} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:"white", border:"1px solid #E5E1D8", textDecoration:"none", transition:"border-color 0.12s, background 0.12s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor="var(--navy)"; e.currentTarget.style.background="#FDFAF5"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor="#E5E1D8"; e.currentTarget.style.background="white"; }}
                      >
                        <div style={{ width:28, height:28, background:"var(--navy)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
                        </div>
                        <span style={{ fontSize:12, fontWeight:500, color:"var(--navy)" }}>{s.label}</span>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ marginLeft:"auto" }}><path d="M5 2l4 4-4 4" stroke="#C4B9AA" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <button onClick={() => setActiveSection("schedule")} style={{ marginTop:24, width:"100%", padding:"10px", fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", background:"var(--navy)", border:"none", color:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"opacity 0.14s" }}
                onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity="1"}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Schedule a Meeting
              </button>
            </div>
          )}

          {/* ── Calendar / Availability ── */}
          {activeSection === "calendar" && (
            <div style={{ padding:"20px 24px" }}>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--navy)", marginBottom:2 }}>This Week's Availability</div>
                <div style={{ fontSize:11, color:"#9CA3AF" }}>Based on {person.name.split(" ")[0]}'s shared calendar</div>
              </div>

              {/* Grid */}
              <div style={{ background:"white", border:"1px solid var(--border)", overflow:"hidden" }}>
                {/* Header row */}
                <div style={{ display:"grid", gridTemplateColumns:`72px repeat(${AVAIL_DAYS.length}, 1fr)`, borderBottom:"1px solid var(--border)" }}>
                  <div style={{ padding:"8px 10px", background:"#F9F7F4" }} />
                  {AVAIL_DAYS.map((d, i) => {
                    const date = 9 + i; // mock dates starting Mon Mar 9
                    const isToday = d === "Mon";
                    return (
                      <div key={d} style={{ padding:"8px 6px", textAlign:"center", background: isToday ? "var(--navy)" : "#F9F7F4", borderLeft:"1px solid var(--border)" }}>
                        <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color: isToday ? "var(--gold)" : "#9CA3AF" }}>{d}</div>
                        <div style={{ fontSize:12, fontWeight: isToday ? 700 : 400, color: isToday ? "white" : "var(--navy)" }}>{date}</div>
                      </div>
                    );
                  })}
                </div>
                {/* Slot rows */}
                {AVAIL_SLOTS.map((slot, si) => (
                  <div key={slot} style={{ display:"grid", gridTemplateColumns:`72px repeat(${AVAIL_DAYS.length}, 1fr)`, borderBottom: si < AVAIL_SLOTS.length-1 ? "1px solid #F0EDE8" : "none" }}>
                    {/* Row label */}
                    <div style={{ padding:"12px 10px", display:"flex", alignItems:"center", background:"#FAFAF9", borderRight:"1px solid var(--border)" }}>
                      <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#9CA3AF" }}>{slot}</span>
                    </div>
                    {AVAIL_DAYS.map(day => {
                      const status = avail[day]?.[slot] || "free";
                      const st = AVAIL_STYLE[status];
                      return (
                        <div key={day} title={st.label} style={{ padding:"10px 6px", display:"flex", alignItems:"center", justifyContent:"center", borderLeft:"1px solid #F0EDE8", background: st.bg, cursor: status === "free" ? "pointer" : "default", transition:"opacity 0.1s" }}
                          onClick={() => { if (status === "free") setActiveSection("schedule"); }}
                          onMouseEnter={e => { if (status === "free") e.currentTarget.style.opacity="0.75"; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity="1"; }}
                        >
                          <div style={{ width:6, height:6, borderRadius:"50%", background: status==="free" ? "#22C55E" : status==="busy" ? "#D5D0C8" : "#F59E0B" }} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div style={{ display:"flex", gap:14, marginTop:12 }}>
                {Object.entries(AVAIL_STYLE).map(([k,v]) => (
                  <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background: k==="free" ? "#22C55E" : k==="busy" ? "#D5D0C8" : "#F59E0B" }} />
                    <span style={{ fontSize:9, color:"#9CA3AF" }}>{v.label}</span>
                  </div>
                ))}
                <span style={{ fontSize:9, color:"#C4B9AA", marginLeft:"auto" }}>Click free slot to schedule</span>
              </div>

              <button onClick={() => setActiveSection("schedule")} style={{ marginTop:16, width:"100%", padding:"9px", fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", background:"var(--navy)", border:"none", color:"white", cursor:"pointer", transition:"opacity 0.14s" }}
                onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity="1"}
              >Request a Time</button>
            </div>
          )}

          {/* ── Schedule ── */}
          {activeSection === "schedule" && (
            <div style={{ padding:"20px 24px" }}>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--navy)", marginBottom:2 }}>Schedule with {person.name.split(" ")[0]}</div>
                <div style={{ fontSize:11, color:"#9CA3AF" }}>An invite will be sent to their company calendar</div>
              </div>
              <ScheduleForm person={person} onClose={() => setActiveSection("about")} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}


function OrgNodeCard({ node, onClick, compact }) {
  const [hov, setHov] = React.useState(false);
  const s = orgNodeStyle(node.type);
  if (node.type === "root") return (
    <div style={{ width: compact ? 140 : ORG_NODE_W, textAlign:"center", padding:"8px 10px", background:"var(--navy)", border:"2px solid var(--gold)" }}>
      <div style={{ fontFamily:"var(--font-display)", fontSize: compact ? 11 : 13, fontWeight:400, color:"white", lineHeight:1.3 }}>{node.name}</div>
      <div style={{ fontSize:8, color:"rgba(255,255,255,0.45)", letterSpacing:"0.06em", textTransform:"uppercase", marginTop:2 }}>{node.title}</div>
    </div>
  );
  return (
    <div onClick={() => node.type !== "root" && onClick(node)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: compact ? 140 : ORG_NODE_W, cursor: node.type!=="root" ? "pointer" : "default", background: s.bg, border: s.border, borderTop: s.topBorder, boxShadow: hov ? "0 2px 8px rgba(15,43,79,0.1)" : "none", transition:"box-shadow 0.15s", overflow:"hidden" }}
    >
      <div style={{ padding: compact ? "8px 10px" : "10px 12px" }}>
        {/* Avatar row */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: compact ? 4 : 6 }}>
          <div style={{ width: compact ? 20 : 26, height: compact ? 20 : 26, background: s.bg === "var(--navy)" ? "rgba(255,255,255,0.12)" : "#F3F0EB", border: s.bg === "var(--navy)" ? "1px solid rgba(255,255,255,0.15)" : "1px solid #E5E1D8", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ fontSize: compact ? 7 : 9, fontWeight:700, color: s.bg === "var(--navy)" ? "var(--gold)" : "var(--navy)", letterSpacing:"0.04em" }}>{orgInitials(node.name)}</span>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize: compact ? 10 : 11, fontWeight:600, color:s.txtColor, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{node.name}</div>
          </div>
        </div>
        <div style={{ fontSize: compact ? 8 : 9, color:s.subColor, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{node.title}</div>
      </div>
    </div>
  );
}

function OrgConnector({ count }) {
  if (count === 0) return null;
  return (
    <>
      {/* Vertical drop from parent */}
      <div style={{ width:1, height:20, background:"#D5D0C8", flexShrink:0 }} />
    </>
  );
}

function OrgTree({ node, onClick, depth = 0 }) {
  const compact = depth >= 2;
  const children = node.children || [];
  const hasKids = children.length > 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <OrgNodeCard node={node} onClick={onClick} compact={compact} />
      {hasKids && (
        <>
          {/* Line down */}
          <div style={{ width:1, height:18, background:"#D5D0C8" }} />
          {/* Children row */}
          <div style={{ position:"relative", display:"flex", alignItems:"flex-start", gap: compact ? ORG_NODE_GAP - 8 : ORG_NODE_GAP }}>
            {/* Horizontal bridge */}
            {children.length > 1 && (
              <div style={{
                position:"absolute", top:0, height:1, background:"#D5D0C8",
                left: `calc(${100 / (2 * children.length)}%)`,
                right:`calc(${100 / (2 * children.length)}%)`,
              }} />
            )}
            {children.map(child => (
              <div key={child.id} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:1, height:18, background:"#D5D0C8" }} />
                <OrgTree node={child} onClick={onClick} depth={depth+1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrgChart() {
  const [tab, setTab]             = React.useState("corporate");
  const [drillOffice, setDrillOffice] = React.useState(null); // brokerage drill-in
  const { openProfile } = useProfile();

  const handleNodeClick = node => {
    if (node.type === "office") { setDrillOffice(node.id); return; }
    if (node.type === "root")   return;
    openProfile(node);
  };

  // ── Brokerage top-level: show offices as clickable nodes ──
  function BrokerageIndex() {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
        {/* Root + broker row */}
        <OrgTree node={{ ...ORG_BROKERAGE_ROOT, children:[] }} onClick={handleNodeClick} />
        {/* Down from broker */}
        <div style={{ width:1, height:18, background:"#D5D0C8" }} />
        {/* Office grid */}
        <div style={{ position:"relative", display:"flex", alignItems:"flex-start", gap:ORG_NODE_GAP }}>
          {ORG_OFFICES.length > 1 && (
            <div style={{ position:"absolute", top:0, height:1, background:"#D5D0C8", left:`calc(${100/(2*ORG_OFFICES.length)}%)`, right:`calc(${100/(2*ORG_OFFICES.length)}%)` }} />
          )}
          {ORG_OFFICES.map(off => (
            <div key={off.id} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ width:1, height:18, background:"#D5D0C8" }} />
              <div onClick={() => setDrillOffice(off.id)}
                style={{ width:ORG_NODE_W, background:"white", border:"1px solid var(--border)", borderTop:"2px solid var(--gold)", cursor:"pointer", transition:"box-shadow 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow="0 2px 8px rgba(15,43,79,0.1)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow="none"}
              >
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--navy)", marginBottom:2 }}>{off.name}</div>
                  <div style={{ fontSize:9, color:"#9CA3AF" }}>{off.agents} agents · Click to view</div>
                  <div style={{ fontSize:9, color:"#C4B9AA", marginTop:2 }}>{off.address}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:"28px 0 60px" }}>
          {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:300, color:"var(--navy)", letterSpacing:"-0.01em", marginBottom:3 }}>Org Chart</div>
        <div style={{ fontSize:11, color:"#9CA3AF" }}>Russ Lyon Sotheby's International Realty — Company Structure</div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom:"1px solid var(--border)", display:"flex", gap:0, marginBottom:28 }}>
        {[["corporate","Corporate"],["brokerage","Brokerage"]].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setDrillOffice(null); }} style={{ padding:"9px 20px", border:"none", background:"none", cursor:"pointer", fontSize:12, fontWeight: tab===key ? 700 : 400, color: tab===key ? "var(--navy)" : "#9CA3AF", borderBottom:`2px solid ${tab===key ? "var(--gold)" : "transparent"}`, letterSpacing:"0.02em", transition:"all 0.12s" }}>{label}</button>
        ))}
      </div>

      {/* Back button for brokerage drill */}
      {tab === "brokerage" && drillOffice && (
        <button onClick={() => setDrillOffice(null)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:10, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:20, padding:0, transition:"color 0.12s" }}
          onMouseEnter={e => e.currentTarget.style.color="var(--navy)"}
          onMouseLeave={e => e.currentTarget.style.color="#9CA3AF"}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          All Offices
          <span style={{ color:"#E2DDD6" }}>›</span>
          <span style={{ color:"var(--navy)" }}>{ORG_OFFICES.find(o=>o.id===drillOffice)?.name}</span>
        </button>
      )}

      {/* Chart area */}
      <div style={{ overflowX:"auto", paddingBottom:16 }}>
        <div style={{ display:"inline-block", minWidth:"100%" }}>
          <div style={{ display:"flex", justifyContent:"center", padding:"0 24px" }}>
            {tab === "corporate" && (
              <OrgTree node={ORG_CORPORATE} onClick={handleNodeClick} />
            )}
            {tab === "brokerage" && !drillOffice && <BrokerageIndex />}
            {tab === "brokerage" && drillOffice && (
              <OrgTree node={ORG_OFFICE_TREES[drillOffice] || { id:"?", name:"Office", title:"", type:"office", children:[] }} onClick={handleNodeClick} />
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop:32, display:"flex", gap:16, flexWrap:"wrap" }}>
        {[
          { label:"Ownership / C-Suite", bg:"var(--navy)", border:"2px solid var(--gold)", txt:"white" },
          { label:"Manager",             bg:"white",       border:"1px solid #E5E7EB",     topBorder:"2px solid var(--gold)", txt:"var(--navy)" },
          { label:"Agent",               bg:"white",       border:"1px solid #E5E7EB",     txt:"var(--navy)" },
          { label:"Admin / Support",     bg:"#F9F7F4",     border:"1px dashed #D5D0C8",    txt:"var(--navy)" },
        ].map(l => (
          <div key={l.label} style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:14, height:14, background:l.bg, border:l.border, borderTop:l.topBorder || l.border, flexShrink:0 }} />
            <span style={{ fontSize:10, color:"#6B7280" }}>{l.label}</span>
          </div>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <svg width="16" height="6" viewBox="0 0 16 6" fill="none"><path d="M1 3h14" stroke="#D5D0C8" strokeWidth="1.2" strokeDasharray="3 2"/></svg>
          <span style={{ fontSize:10, color:"#6B7280" }}>Reports to</span>
        </div>
      </div>
    </div>
  );
}


// ── Global Profile Context ────────────────────────────────────────────────
const ProfileContext = React.createContext({ openProfile: () => {} });
const useProfile = () => React.useContext(ProfileContext);

// Lookup a person from SEARCH_USERS by name string; fall back to stub
function lookupPerson(name) {
  if (!name) return null;
  const found = SEARCH_USERS.find(u => u.name.toLowerCase() === name.toLowerCase());
  if (found) return { ...found, type: found.title.toLowerCase().includes("manager") || found.title.toLowerCase().includes("director") || found.title.toLowerCase().includes("officer") ? "manager" : "agent", dept: "" };
  // Stub for names not in the index
  const parts = name.trim().split(" ");
  return { id: "stub-" + name, name, title: "", dept: "", email: "", phone: "", office: "", years: 0, initials: parts.map(p=>p[0]).slice(0,2).join("").toUpperCase(), bg: "#F3F0EB", type: "agent" };
}

// Drop-in clickable name span
function ProfileLink({ name, style: extraStyle = {}, children }) {
  const { openProfile } = useProfile();
  if (!name) return null;
  return (
    <span
      onClick={e => { e.stopPropagation(); const p = lookupPerson(name); if (p) openProfile(p); }}
      style={{ cursor: "pointer", transition: "color 0.12s", ...extraStyle }}
      onMouseEnter={e => e.currentTarget.style.color = "var(--gold)"}
      onMouseLeave={e => { e.currentTarget.style.color = extraStyle.color || ""; }}
    >{children || name}</span>
  );
}

// Clickable avatar square
function ProfileAvatar({ name, initials, bg, txtColor, size = 28, style: extraStyle = {} }) {
  const { openProfile } = useProfile();
  return (
    <div
      onClick={e => { e.stopPropagation(); const p = lookupPerson(name); if (p) openProfile(p); }}
      title={name}
      style={{ width: size, height: size, background: bg || "#F3F0EB", border: "1px solid #E5E1D8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "opacity 0.12s", ...extraStyle }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      <span style={{ fontSize: size * 0.32, fontWeight: 700, color: txtColor || "var(--navy)", letterSpacing: "0.04em" }}>{initials || (name || "").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}</span>
    </div>
  );
}


function SidebarIcon({ d, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d={d} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function NavStub({ item, onNavigate, activeView }) {
  const clickable = !!item.nav;
  const active = item.nav && item.nav === activeView;
  return (
    <button
      onClick={clickable ? () => onNavigate(item.nav) : undefined}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 20px", background: active ? "rgba(201,169,110,0.1)" : "none",
        border: "none", borderLeft: `2px solid ${active ? "var(--gold)" : "transparent"}`,
        cursor: clickable ? "pointer" : "not-allowed",
        color: active ? "rgba(255,255,255,0.9)" : clickable ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)",
        opacity: clickable ? 1 : 0.5,
      }}
      onMouseEnter={e => { if (clickable && !active) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
      onMouseLeave={e => { if (clickable && !active) e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
    >
      <SidebarIcon d={item.icon} />
      <span style={{ fontSize: 12, fontWeight: active ? 600 : 500 }}>{item.label}</span>
    </button>
  );
}

export default function MarketingIntakeApp() {
  const [view, setView] = useState("dashboard");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [expanded, setExpanded] = useState({ marketing: true, communication: true });
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [dashboardRole, setDashboardRole] = useState("requester");

  // ── Toast system ──────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const pushToast = useCallback((type, title, sub, duration = 4000) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, title, sub }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);
  const dismissToast = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);

  // ── Notification bell ─────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);
  const [bellOpen, setBellOpen] = useState(false);
  const unreadCount = notifications.filter(n => n.unread).length;
  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, unread: false })));

  function toggleSection(key) {
    setExpanded(s => ({ ...s, [key]: !s[key] }));
  }

  function navigate(v) {
    setView(v);
    setSelectedRequest(null);
    setRolePickerOpen(false);
    if (v === "requester" || v === "designer" || v === "executive" || v === "marketing_manager") {
      setDashboardRole(v);
    }
  }

  const ROLE_LABELS = { requester: "Agent", designer: "Designer", executive: "Executive", marketing_manager: "Manager" };

  // Platform nav — only Marketing is active/built; others are placeholders
  const NAV = [
    {
      key: "lyonsden", label: "Lyon's Den", nav: "lyonsden",
      icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10",
    },
    {
      key: "dashboard", label: "Dashboard", nav: "dashboard",
      icon: "M2 6L8 2l6 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6z M6 15V9h4v6",
    },
    {
      key: "contacts", label: "Contacts", single: "contacts",
      icon: "M11 7a3 3 0 11-6 0 3 3 0 016 0zM3 14a5 5 0 0110 0",
    },
    {
      key: "listings", label: "Listings", single: "listings",
      icon: "M3 3h10v10H3V3zM3 8h10M8 3v10",
    },
    {
      key: "marketing", label: "Marketing",
      icon: "M2 12l4-4 3 3 5-6",
      children: [
        { key: "requester",         label: "My Requests",         sub: "Agent" },
        { key: "marketing_manager", label: "Marketing Dashboard", sub: "Manager",  managerOnly: true },
        { key: "designer",          label: "Design Queue",        sub: "Designer", restricted: true },
        { key: "executive",         label: "Operations Report",   sub: "Executive" },
      ],
    },
    {
      key: "communication", label: "Communication",
      icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
      children: [
        { key: "email",     label: "Email",     sub: "Inbox" },
        { key: "messaging", label: "Messaging", sub: "DMs" },
        { key: "prides",    label: "Prides",    sub: "Groups" },
      ],
    },
    {
      key: "analytics", label: "Analytics", single: "analytics",
      icon: "M2 14l3.5-5 3 3L12 5l2 2",
    },
    {
      key: "components", label: "Components", nav: "components",
      icon: "M4 6h16M4 12h8M4 18h16",
    },
    {
      key: "orgchart", label: "Org Chart", nav: "orgchart",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    },
  ];

  const visibleNav = NAV;
  const SIDEBAR_W = 224;

  const breadcrumb =
    view === "dashboard" ? "Dashboard" :
    view === "executive" ? "Operations Report" :
    view === "settings"  ? "Settings" :
    view === "designer"  ? "Design Queue" :
    view === "lyonsden"  ? "Lyon's Den" :
    view === "prides"    ? "Prides" :
    view === "email"     ? "Email" :
    view === "messaging" ? "Messaging" :
    view === "orgchart"  ? "Org Chart" :
    view === "components" ? "Components" :
    view === "marketing_manager" ? "Marketing Dashboard" :
    "My Requests";

  const [globalProfilePerson, setGlobalProfilePerson] = React.useState(null);
  const openProfile = React.useCallback(person => setGlobalProfilePerson(person), []);

  return (
    <ProfileContext.Provider value={{ openProfile }}>
    {globalProfilePerson && <OrgProfileModal person={globalProfilePerson} onClose={() => setGlobalProfilePerson(null)} />}
    <div style={{
      "--navy":         "#0F2B4F",
      "--gold":         "#C9A96E",
      "--cream":        "#FFFFFF",
      "--border":       "#E5E7EB",
      "--sidebar-bg":   "#0A1F3A",
      "--font-display": "'Cormorant Garamond', 'Georgia', serif",
      "--font-body":    "'DM Sans', 'system-ui', sans-serif",
      minHeight: "100vh", display: "flex",
      fontFamily: "var(--font-body)", background: "#F5F4F1",
    }}>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div style={{
        width: SIDEBAR_W, flexShrink: 0, background: "var(--sidebar-bg)",
        display: "flex", flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--cream)", letterSpacing: "0.05em", fontWeight: 400, lineHeight: 1.4 }}>
            RUSS LYON <span style={{ color: "var(--gold)" }}>SOTHEBY'S</span>
          </div>
          <div style={{ marginTop: 5, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
            Agent Platform
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {visibleNav.map(item => {
            // Expandable section (Marketing)
            if (item.children) {
              const isOpen = !!expanded[item.key];
              const sectionActive = item.children.some(c => c.key === view);
              return (
                <div key={item.key}>
                  <button
                    onClick={() => toggleSection(item.key)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 20px", background: "none", border: "none", cursor: "pointer",
                      color: sectionActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
                    onMouseLeave={e => e.currentTarget.style.color = sectionActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)"}
                  >
                    <SidebarIcon d={item.icon} />
                    <span style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: sectionActive ? 600 : 500 }}>{item.label}</span>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {isOpen && (
                    <div style={{ paddingBottom: 4 }}>
                      {item.children.filter(child => {
                          if (child.restricted  && dashboardRole === "requester") return false;
                          if (child.managerOnly && dashboardRole !== "marketing_manager") return false;
                          return true;
                        }).map(child => {
                        const active = view === child.key;
                        return (
                          <button
                            key={child.key}
                            onClick={() => navigate(child.key)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center",
                              padding: "8px 20px 8px 44px",
                              background: active ? "rgba(201,169,110,0.13)" : "none",
                              border: "none",
                              borderLeft: `2px solid ${active ? "var(--gold)" : "transparent"}`,
                              cursor: "pointer", transition: "all 0.12s", textAlign: "left",
                            }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? "rgba(201,169,110,0.13)" : "none"; }}
                          >
                            <div>
                              <div style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "var(--cream)" : "rgba(255,255,255,0.5)", transition: "color 0.12s" }}>{child.label}</div>
                              <div style={{ fontSize: 9, letterSpacing: "0.07em", color: active ? "var(--gold)" : "rgba(255,255,255,0.22)", fontWeight: 600, textTransform: "uppercase", marginTop: 1 }}>{child.sub}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Single nav item (placeholder)
            return <NavStub key={item.key} item={item} onNavigate={navigate} activeView={view} />;
          })}
        </nav>

        {/* ── Profile + Settings ─────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "12px 14px" }}>

          {/* Role picker */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <button
              onClick={() => setRolePickerOpen(o => !o)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9,
                padding: "8px 10px", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)", borderRadius: 3,
                cursor: "pointer",
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gold)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--navy)" }}>
                  {view === "designer" ? "LH" : view === "marketing_manager" ? "LB" : view === "executive" ? "DK" : "YC"}
                </span>
              </div>
              <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--cream)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {view === "designer" ? "Lex Baum" : view === "marketing_manager" ? "Lex Baum" : view === "executive" ? "David Kim" : "Yong Choi"}
                </div>
                <div style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
                  {ROLE_LABELS[view] || "Agent"}
                </div>
              </div>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 4L5 7L8 4" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {rolePickerOpen && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0,
                background: "#0D2540", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 3, overflow: "hidden", zIndex: 50,
                boxShadow: "0 -8px 24px rgba(0,0,0,0.4)",
              }}>
                <div style={{ padding: "8px 12px 5px", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", fontWeight: 700 }}>Switch Role</div>
                {[["requester","Yong Choi","Agent","YC"],["marketing_manager","Lex Baum","Manager","LB"],["designer","Lex Baum","Designer","LH"],["executive","David Kim","Executive","DK"]].map(([v, name, role, initials]) => (
                  <button key={v} onClick={() => navigate(v)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      background: view === v ? "rgba(201,169,110,0.15)" : "none",
                      border: "none", cursor: "pointer",
                      borderLeft: `2px solid ${view === v ? "var(--gold)" : "transparent"}`,
                    }}
                    onMouseEnter={e => { if (view !== v) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (view !== v) e.currentTarget.style.background = "none"; }}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: view === v ? "var(--gold)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: view === v ? "var(--navy)" : "rgba(255,255,255,0.5)" }}>{initials}</span>
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 11, color: view === v ? "var(--cream)" : "rgba(255,255,255,0.5)", fontWeight: view === v ? 600 : 400 }}>{name}</div>
                      <div style={{ fontSize: 9, color: view === v ? "var(--gold)" : "rgba(255,255,255,0.22)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => navigate("settings")}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "7px 10px",
              background: view === "settings" ? "rgba(201,169,110,0.12)" : "none",
              border: "none", borderRadius: 3, cursor: "pointer",
              color: view === "settings" ? "var(--gold)" : "rgba(255,255,255,0.32)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={e => e.currentTarget.style.color = view === "settings" ? "var(--gold)" : "rgba(255,255,255,0.32)"}
          >
            <SidebarIcon d="M8 10a2 2 0 100-4 2 2 0 000 4zM8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.64 3.64l1.06 1.06M11.3 11.3l1.06 1.06M3.64 12.36l1.06-1.06M11.3 4.7l1.06-1.06" size={13} />
            <span style={{ fontSize: 11, fontWeight: 500 }}>Settings</span>
          </button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "0 20px", height: 46, display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          {/* Breadcrumb — compact left */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: "#C4B99A", fontWeight: 500, whiteSpace: "nowrap" }}>{breadcrumb}</span>
            {selectedRequest && <>
              <span style={{ fontSize: 10, color: "#E2DDD6" }}>›</span>
              <span style={{ fontSize: 10, color: "var(--navy)", fontWeight: 600, whiteSpace: "nowrap", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>#{selectedRequest.queueNumber}</span>
            </>}
          </div>
          {/* Search — center, full flex */}
          <GlobalSearch onNavigate={navigate} />
          {/* Notification bell + date — right */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setBellOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center", position: "relative" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <div style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg,#991B1B,#B91C1C)", border: "1.5px solid white" }} />
                )}
              </button>
              {bellOpen && (
                <NotificationPanel notifications={notifications} onMarkAllRead={() => { markAllRead(); setBellOpen(false); }} onClose={() => setBellOpen(false)} />
              )}
            </div>
            <div style={{ fontSize: 10, color: "#C4B99A", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, minWidth: 0, padding: "0 32px", overflowY: "auto", overflowX: "hidden" }}>
          {selectedRequest ? (
            <RequestDetail req={selectedRequest} onBack={() => setSelectedRequest(null)} viewerRole={view === "designer" ? "designer" : "requester"} />
          ) : view === "dashboard" ? (
            <Dashboard role={dashboardRole} onSelectRequest={req => { setDashboardRole(dashboardRole); navigate(dashboardRole === "designer" ? "designer" : dashboardRole === "executive" ? "executive" : "requester"); setTimeout(() => setSelectedRequest(req), 50); }} onNewRequest={() => navigate("requester")} />
          ) : view === "requester" ? (
            <RequesterDashboard onSelectRequest={setSelectedRequest} />
          ) : view === "designer" ? (
            <DesignerDashboard onSelectRequest={setSelectedRequest} viewerRole={dashboardRole} />
          ) : view === "lyonsden" ? (
            <LyonsDen />
          ) : view === "prides" ? (
            <PridesPage />
          ) : view === "orgchart" ? (
            <OrgChart />
          ) : view === "email" ? (
            <PlaceholderPage title="Email" icon="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          ) : view === "messaging" ? (
            <PlaceholderPage title="Messaging" icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          ) : view === "marketing_manager" ? (
            <MarketingManagerDashboard onSelectRequest={setSelectedRequest} />
          ) : view === "executive" ? (
            <ExecutiveView />
          ) : view === "components" ? (
            <ComponentLibraryPage />
          ) : (
            <ExecutiveSettings onSelectRequest={setSelectedRequest} />
          )}
        </div>
      </div>

      {/* LinkedIn-style messenger */}
      <Messenger />

      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    </div>
    <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </ProfileContext.Provider>
  );
}

// ─── COMPONENT LIBRARY ────────────────────────────────────────────────────────

const CL_GROUPS = [
  { key:"primitives",  label:"Primitives",        icon:"M4 6h16M4 12h16M4 18h7",          count:14 },
  { key:"cards",       label:"Cards & Containers", icon:"M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z", count:6 },
  { key:"tables",      label:"Tables & Pagination",icon:"M3 10h18M3 6h18M3 14h18M3 18h18", count:5 },
  { key:"charts",      label:"Charts",             icon:"M2 14l3.5-5 3 3L12 5l2 2",        count:4 },
  { key:"modals",      label:"Modals & Drawers",   icon:"M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2", count:5 },
  { key:"navigation",  label:"Navigation",         icon:"M4 8V4m0 0h4M4 4l5 5M20 4h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5M20 20h-4m4 0v-4m0 4l-5-5", count:4 },
  { key:"chat",        label:"Chat & Messaging",   icon:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", count:4 },
  { key:"forms",       label:"Forms",              icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", count:6 },
];

// ── Story card wrapper ─────────────────────────────────────────────────────────
function CLStoryCard({ name, description, variant, children, onExpand, fullWidth }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      style={{
        gridColumn: fullWidth ? "1/-1" : undefined,
        background:"white", border:`1px solid ${hov ? "var(--gold)" : "var(--border)"}`,
        display:"flex", flexDirection:"column", overflow:"hidden",
        transition:"border-color 0.15s, box-shadow 0.15s",
        boxShadow: hov ? "0 4px 20px rgba(0,0,0,0.07)" : "none",
        cursor:"pointer",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onExpand({ name, description, variant, children })}
    >
      {/* Preview area */}
      <div style={{ padding:"24px 20px", minHeight:80, display:"flex", alignItems:"center", justifyContent:"center", flexWrap:"wrap", gap:8, background:"#FDFAF5", borderBottom:"1px solid var(--border)", flex:1 }}>
        {children}
      </div>
      {/* Label */}
      <div style={{ padding:"10px 14px", borderTop: hov ? "1px solid rgba(201,169,110,0.3)" : "1px solid transparent", transition:"border-color 0.15s" }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--navy)", letterSpacing:"0.02em" }}>{name}</div>
        {description && <div style={{ fontSize:9, color:"#9CA3AF", marginTop:2, letterSpacing:"0.04em" }}>{description}</div>}
        {variant && <div style={{ display:"inline-block", marginTop:4, fontSize:8, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", padding:"2px 6px", background:"#F3F4F6", color:"#6B7280" }}>{variant}</div>}
      </div>
    </div>
  );
}

// ── Expand modal ───────────────────────────────────────────────────────────────
function CLExpandModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,20,40,0.65)", zIndex:9500, display:"flex", alignItems:"center", justifyContent:"center", padding:32 }}
      onClick={onClose}>
      <div style={{ background:"white", maxWidth:760, width:"100%", maxHeight:"85vh", overflow:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.3)", display:"flex", flexDirection:"column" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--navy)", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)", marginBottom:2 }}>Component Preview</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:300, color:"white" }}>{item.name}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"rgba(255,255,255,0.7)", width:32, height:32, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        {/* Description */}
        {item.description && (
          <div style={{ padding:"12px 20px", background:"#F9F7F4", borderBottom:"1px solid var(--border)", fontSize:11, color:"#6B7280", lineHeight:1.6, flexShrink:0 }}>
            {item.description}
          </div>
        )}
        {/* Live preview */}
        <div style={{ padding:"40px 32px", flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexWrap:"wrap", gap:12, minHeight:160 }}>
          {item.children}
        </div>
      </div>
    </div>
  );
}

// ── All component stories by group ─────────────────────────────────────────────
function getCLStories(group) {
  const MOCK_REQ = {
    id:"demo", title:"16020 N Horseshoe Dr — Open House Flyer", materialType:"Flyer",
    queueNumber:42, status:"in_progress", isRush:true, dueDate:"Mar 12",
    designerName:"Lex Baum", slaDeadline: new Date(Date.now()+5*3600000).toISOString(),
    messages:[{ senderName:"Yong Choi", body:"Can we add the mountain view callout?" }],
    referenceFiles:[{ fileType:"image", url:"https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&q=80" }],
  };

  if (group === "primitives") return [
    { name:"Button — Primary",      description:"Main CTA. Navy fill, cream text.",   v:"primary",
      el: <button style={{ background:"var(--navy)", color:"white", border:"none", padding:"10px 22px", fontSize:12, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer" }}>Submit Request</button> },
    { name:"Button — Gold",         description:"Accent action. Gold fill.",           v:"gold",
      el: <button style={{ background:"var(--gold)", color:"white", border:"none", padding:"10px 22px", fontSize:12, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer" }}>Approve</button> },
    { name:"Button — Ghost",        description:"Secondary action. Bordered.",         v:"ghost",
      el: <button style={{ background:"white", color:"var(--navy)", border:"1px solid var(--border)", padding:"10px 22px", fontSize:12, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer" }}>Cancel</button> },
    { name:"Button — Danger",       description:"Destructive action. Red fill.",       v:"danger",
      el: <button style={{ background:"#EF4444", color:"white", border:"none", padding:"10px 22px", fontSize:12, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer" }}>Delete</button> },
    { name:"Button — Ghost Danger", description:"Soft destructive. Red bordered.",     v:"ghost-danger",
      el: <button style={{ background:"#FEF2F2", color:"#B91C1C", border:"1px solid #FCA5A5", padding:"10px 22px", fontSize:12, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer" }}>Cancel Request</button> },
    { name:"Button — Icon",         description:"Icon-only control. Square.",          v:"icon",
      el: <button style={{ background:"white", border:"1px solid var(--border)", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--navy)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          </button> },
    { name:"Badge — Status",        description:"All request lifecycle states.",       v:"all-states",
      el: <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{["submitted","assigned","in_progress","awaiting_materials","review","approved","completed","cancelled"].map(s=><Badge key={s} status={s}/>)}</div> },
    { name:"Badge — Rush",          description:"Urgency indicator. Red pill.",        v:"rush",
      el: <RushBadge /> },
    { name:"SLA — Healthy",         description:"SLA state: on track.",               v:"healthy",
      el: <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", background:"#F0FDF4", border:"1px solid #BBF7D0" }}><div style={{ width:5, height:5, borderRadius:"50%", background:"#22C55E" }}/><span style={{ fontSize:9, fontWeight:700, color:"#15803D" }}>Due in 2d 4h</span></span> },
    { name:"SLA — Warning",         description:"SLA state: approaching breach.",     v:"warning",
      el: <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", background:"#FFFBEB", border:"1px solid #FDE68A" }}><div style={{ width:5, height:5, borderRadius:"50%", background:"#F59E0B" }}/><span style={{ fontSize:9, fontWeight:700, color:"#92400E" }}>Due in 2h</span></span> },
    { name:"SLA — Breached",        description:"SLA state: past deadline.",          v:"breached",
      el: <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", background:"#FEF2F2", border:"1px solid #FCA5A5" }}><div style={{ width:5, height:5, borderRadius:"50%", background:"#EF4444" }}/><span style={{ fontSize:9, fontWeight:700, color:"#B91C1C" }}>BREACHED</span></span> },
    { name:"Avatar — Initials",     description:"User avatar with initials fallback.", v:"initials",
      el: <div style={{ display:"flex", gap:8 }}>{[["YC","#0F2B4F"],["LH","#C9A96E"],["DK","#374151"]].map(([i,c])=>(
            <div key={i} style={{ width:36, height:36, background:c, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"white", letterSpacing:"0.05em" }}>{i}</div>))}</div> },
    { name:"Section Header",        description:"Page/section heading with subtitle.", v:"default",
      el: <div><div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)", marginBottom:3 }}>Marketing</div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:300, color:"var(--navy)", letterSpacing:"-0.02em" }}>My Requests</div></div> },
    { name:"Feasibility Flag",      description:"Red/amber risk dot for intake triage.", v:"flags",
      el: <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:8, height:8, borderRadius:"50%", background:"#EF4444" }}/><span style={{ fontSize:10, color:"#B91C1C", fontWeight:700 }}>Hard Flag</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:8, height:8, borderRadius:"50%", background:"#F59E0B" }}/><span style={{ fontSize:10, color:"#92400E", fontWeight:700 }}>Soft Flag</span></div>
          </div> },
  ];

  if (group === "cards") return [
    { name:"Request Card",          description:"Agent's My Requests view. Thumbnail + 2×2 detail grid + SLA strip.", v:"active",     fullWidth:true,
      el: <div style={{ maxWidth:320, width:"100%" }}><RequestCard req={MOCK_REQ} onClick={()=>{}} onCancel={()=>{}} role="requester"/></div> },
    { name:"Request Card — Completed", description:"Completed/cancelled state at reduced opacity.", v:"completed",  fullWidth:true,
      el: <div style={{ maxWidth:320, width:"100%", opacity:0.65 }}><RequestCard req={{...MOCK_REQ, status:"completed", isRush:false}} onClick={()=>{}} onCancel={()=>{}} role="requester"/></div> },
    { name:"KPI Card",              description:"Top-line metric display. Accent border-top variant.", v:"default",
      el: <div style={{ display:"flex", gap:10 }}>{[{l:"Active",v:7,a:"var(--navy)"},{l:"In Review",v:2,a:"#7C3AED"},{l:"Rush",v:1,a:"#92400E"}].map(k=>(
            <div key={k.l} style={{ background:"white", border:"1px solid var(--border)", borderTop:`3px solid ${k.a}`, padding:"14px 18px", minWidth:90 }}>
              <div style={{ fontSize:26, fontWeight:300, fontFamily:"var(--font-display)", color:k.a }}>{k.v}</div>
              <div style={{ fontSize:9, letterSpacing:"0.08em", textTransform:"uppercase", color:"#9CA3AF", fontWeight:600, marginTop:2 }}>{k.l}</div>
            </div>))}</div> },
    { name:"Feed Card — Pinned",    description:"Lyon's Den hero announcement card.", v:"pinned",    fullWidth:true,
      el: <div style={{ maxWidth:420, width:"100%", background:"white", border:"1px solid var(--border)", overflow:"hidden" }}>
            <div style={{ height:100, background:"linear-gradient(135deg,#0F2B4F,#2A4A7A)", position:"relative", display:"flex", alignItems:"flex-end", padding:"10px 14px" }}>
              <div style={{ position:"absolute", top:10, left:10, background:"var(--gold)", fontSize:8, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", padding:"3px 8px", color:"white" }}>PINNED</div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:400, color:"white" }}>Q1 2026 Market Report — Now Live</div>
            </div>
            <div style={{ padding:"10px 14px" }}>
              <div style={{ fontSize:11, color:"#6B7280", lineHeight:1.5 }}>Sotheby's holds #1 in all 14 Arizona luxury markets.</div>
              <div style={{ marginTop:8, fontSize:9, color:"#C4B9AA" }}>David Kim · Mar 3</div>
            </div>
          </div> },
    { name:"Exec KPI Card",         description:"Executive summary metric. Large number + trend.", v:"exec",
      el: <div style={{ display:"flex", gap:10 }}>{[{l:"Total Requests",v:"247",s:"YTD",a:"var(--navy)"},{l:"SLA Compliance",v:"91%",s:"+3% MoM",a:"#15803D"},{l:"Overdue",v:"4",s:"critical",a:"#DC2626"}].map(k=>(
            <div key={k.l} style={{ background:"white", border:"1px solid var(--border)", padding:"14px 18px", borderLeft:`3px solid ${k.a}`, minWidth:110 }}>
              <div style={{ fontSize:24, fontWeight:300, fontFamily:"var(--font-display)", color:k.a }}>{k.v}</div>
              <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em", color:"#9CA3AF", fontWeight:600, marginTop:2 }}>{k.l}</div>
              <div style={{ fontSize:9, color:k.a, marginTop:4 }}>{k.s}</div>
            </div>))}</div> },
    { name:"Health Tile",           description:"Team health grid cell. Color-coded capacity status.", v:"states",
      el: <div style={{ display:"flex", gap:8 }}>
            {[["Available","#15803D","#F0FDF4","#BBF7D0"],["At Capacity","#92400E","#FFFBEB","#FDE68A"],["Overloaded","#B91C1C","#FEF2F2","#FECACA"]].map(([l,c,bg,b])=>(
              <div key={l} style={{ padding:"10px 14px", background:bg, border:`1px solid ${b}`, textAlign:"center" }}>
                <div style={{ fontSize:10, fontWeight:700, color:c }}>{l}</div>
                <div style={{ fontSize:9, color:c, opacity:0.7, marginTop:2 }}>Lex Baum</div>
              </div>))}</div> },
  ];

  if (group === "tables") return [
    { name:"Table Row — Request",   description:"Design Queue row. Sortable, hoverable, Canva button.", v:"default", fullWidth:true,
      el: <div style={{ width:"100%", overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
              <thead><tr style={{ borderBottom:"2px solid var(--border)" }}>{["#","Requester","Designer","Material","Due","SLA","Status","Canva"].map(h=>(
                <th key={h} style={{ padding:"8px 14px", textAlign:"left", fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#9CA3AF", whiteSpace:"nowrap" }}>{h}</th>))}</tr></thead>
              <tbody><tr style={{ borderBottom:"1px solid var(--border)", background:"white" }}>
                <td style={{ padding:"11px 14px", color:"var(--gold)", fontWeight:700, fontFamily:"var(--font-display)" }}>#42</td>
                <td style={{ padding:"11px 14px", fontWeight:600, color:"var(--navy)" }}>Yong Choi</td>
                <td style={{ padding:"11px 14px", color:"var(--navy)" }}>Lex Baum</td>
                <td style={{ padding:"11px 14px", color:"#6B7280" }}>Flyer</td>
                <td style={{ padding:"11px 14px", color:"#6B7280" }}>Mar 12</td>
                <td style={{ padding:"11px 14px" }}><span style={{ fontSize:11, fontWeight:600, color:"#92400E" }}>2h left</span></td>
                <td style={{ padding:"11px 14px" }}><Badge status="in_progress"/></td>
                <td style={{ padding:"8px 12px" }}><button style={{ fontSize:10, fontWeight:700, padding:"4px 10px", background:"#7B2FBE08", border:"1px solid #7B2FBE30", color:"#7B2FBE", cursor:"pointer" }}>⬡ Canva</button></td>
              </tr></tbody>
            </table>
          </div> },
    { name:"Intake Queue Row",      description:"Triage row with feasibility flag, assign dropdown, 3-action decision.", v:"default", fullWidth:true,
      el: <div style={{ padding:"12px 14px", background:"white", border:"1px solid var(--border)", borderLeft:"3px solid #EF4444", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#EF4444", flexShrink:0 }}/>
              <div><div style={{ fontSize:11, fontWeight:700, color:"var(--navy)" }}>iq-003 · Full Rebrand</div>
              <div style={{ fontSize:9, color:"#9CA3AF" }}>47pp · Rush · 2 biz days</div></div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
              <select style={{ fontSize:10, border:"1px solid var(--border)", padding:"4px 8px", color:"var(--navy)", background:"white" }}><option>Lex Baum</option></select>
              <button style={{ fontSize:9, fontWeight:700, padding:"4px 10px", background:"var(--navy)", border:"none", color:"white", cursor:"pointer" }}>Begin</button>
              <button style={{ fontSize:9, fontWeight:700, padding:"4px 8px", background:"#FFFBEB", border:"1px solid #FDE68A", color:"#92400E", cursor:"pointer" }}>?</button>
              <button style={{ fontSize:9, fontWeight:700, padding:"4px 8px", background:"#FEF2F2", border:"1px solid #FCA5A5", color:"#B91C1C", cursor:"pointer" }}>✕</button>
            </div>
          </div> },
    { name:"Pagination Bar",        description:"Page controls with rows-per-page selector and numbered pages.", v:"default", fullWidth:true,
      el: <PaginationBar total={47} pageSize={10} page={2} onPageSize={()=>{}} onPage={()=>{}} /> },
    { name:"Column Sort Header",    description:"Sortable column with asc/desc chevrons.", v:"default",
      el: <div style={{ display:"flex", gap:2 }}>
            {[["#",true,"asc"],["Requester",false,null],["Status",false,null]].map(([l,a,d])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:3, padding:"6px 12px", background: a ? "#F3F4F6" : "white", border:"1px solid var(--border)", cursor:"pointer", fontSize:9, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color: a ? "var(--navy)" : "#9CA3AF" }}>
                {l}{a && <span style={{ fontSize:8, color:"var(--navy)" }}>{d==="asc"?"↑":"↓"}</span>}
              </div>))}</div> },
    { name:"Empty Table State",     description:"Zero results state shown inside a table body.", v:"empty", fullWidth:true,
      el: <div style={{ padding:"40px 20px", textAlign:"center", background:"white", border:"1px solid var(--border)" }}>
            <div style={{ fontSize:28, marginBottom:8, opacity:0.3 }}>📋</div>
            <div style={{ fontSize:12, fontWeight:600, color:"var(--navy)", marginBottom:4 }}>No requests found</div>
            <div style={{ fontSize:11, color:"#9CA3AF" }}>Try adjusting your filters or search terms</div>
          </div> },
  ];

  if (group === "charts") return [
    { name:"Line Chart — Requests Trend", description:"YoY or rolling 30d comparison. Solid navy (current), dashed gold (prior), dotted slate (LY). Partial dot on in-progress periods.", v:"multi-period", fullWidth:true,
      el: <div style={{ width:"100%", height:200 }}><RequestsLineChart data={PERIOD_DATA["3M"]} teamMode={true} period="3M"/></div> },
    { name:"Pie Panel",             description:"Donut chart — request distribution by material type.", v:"default",
      el: <div style={{ height:180, width:"100%" }}><PiePanel allRequests={DESIGNER_ALL_REQUESTS} unassigned={DESIGNER_ALL_REQUESTS.filter(r=>!r.designerName)} inReview={DESIGNER_ALL_REQUESTS.filter(r=>r.status==="review")} totalOpen={DESIGNER_ALL_REQUESTS.filter(r=>!["completed","cancelled"].includes(r.status)).length} /></div> },
    { name:"Bar Chart Panel",       description:"KPI column (Year/Month/Daily) + line chart with period stepper.", v:"full", fullWidth:true,
      el: <div style={{ height:220 }}><BarChartPanel teamYearTotal={101} personalYearTotal={28} personalDailyAvg={1.5} /></div> },
    { name:"Team Health Grid",      description:"Designer capacity heatmap. Color coded by utilization %.", v:"default", fullWidth:true,
      el: <div style={{ width:"100%" }}><TeamHealthGrid revisionRate={18} slaCompliance={91} reqPerDesigner={6} avgCompletionDays={4} /></div> },
  ];

  if (group === "modals") return [
    { name:"Cancel Modal — Agent",  description:"Confirms agent-side cancellation. Blocks in-progress requests with explanation.", v:"agent",     fullWidth:true,
      el: <div style={{ position:"relative", pointerEvents:"none" }}>
            <div style={{ width:420, boxShadow:"0 20px 60px rgba(0,0,0,0.15)", border:"1px solid var(--border)", background:"white" }}>
              <div style={{ background:"var(--navy)", padding:"14px 18px", display:"flex", justifyContent:"space-between" }}>
                <div><div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)", marginBottom:2 }}>Cancel Request</div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:300, color:"white" }}>Pinnacle Peak Twilight Flyer</div></div>
                <div style={{ width:28, height:28, background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.6)" }}>×</div>
              </div>
              <div style={{ padding:16 }}>
                <div style={{ padding:"10px 12px", background:"#F9F7F4", border:"1px solid var(--border)", display:"flex", gap:10, marginBottom:12 }}>
                  <div style={{ width:40, height:40, background:"linear-gradient(135deg,var(--navy),#2A4A7A)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📄</div>
                  <div><div style={{ fontSize:11, fontWeight:600, color:"var(--navy)" }}>#42 · Flyer</div><div style={{ fontSize:9, color:"#9CA3AF" }}>Submitted 2 days ago · Due Mar 12</div></div>
                </div>
                <div style={{ fontSize:9, color:"#9CA3AF", marginBottom:4, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Reason (optional)</div>
                <div style={{ border:"1px solid var(--border)", height:60, background:"#FAFAFA" }}/>
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <div style={{ flex:1, padding:8, fontSize:10, fontWeight:700, textAlign:"center", background:"white", border:"1px solid var(--border)", color:"#9CA3AF" }}>Keep Request</div>
                  <div style={{ flex:1, padding:8, fontSize:10, fontWeight:700, textAlign:"center", background:"#EF4444", color:"white" }}>Cancel Request</div>
                </div>
              </div>
            </div>
          </div> },
    { name:"Cancel Modal — Blocked", description:"Shown when agent tries to cancel an in-progress request.", v:"blocked",    fullWidth:true,
      el: <div style={{ pointerEvents:"none" }}>
            <div style={{ width:420, boxShadow:"0 20px 60px rgba(0,0,0,0.15)", border:"1px solid var(--border)", background:"white" }}>
              <div style={{ background:"var(--navy)", padding:"14px 18px" }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)", marginBottom:2 }}>Cancel Request</div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:300, color:"white" }}>Social Pack — Spring 2026</div>
              </div>
              <div style={{ padding:16 }}>
                <div style={{ display:"flex", gap:8, padding:"10px 12px", background:"#FFFBEB", border:"1px solid #FDE68A", marginBottom:12 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                  <span style={{ fontSize:11, color:"#92400E" }}>This request is already in progress. Contact the designer directly to discuss changes.</span>
                </div>
                <div style={{ padding:8, fontSize:10, fontWeight:700, textAlign:"center", background:"white", border:"1px solid var(--border)", color:"#9CA3AF" }}>Close</div>
              </div>
            </div>
          </div> },
    { name:"Profile Drawer",        description:"Slide-in panel from right. About / Calendar / Schedule tabs. Social links, availability grid.", v:"about-tab", fullWidth:true,
      el: <div style={{ pointerEvents:"none", display:"flex", justifyContent:"flex-end" }}>
            <div style={{ width:360, background:"white", border:"1px solid var(--border)", boxShadow:"-8px 0 32px rgba(0,0,0,0.12)" }}>
              <div style={{ background:"linear-gradient(135deg,var(--navy),#1E3D6B)", padding:"20px 18px" }}>
                <div style={{ width:56, height:56, background:"var(--gold)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, color:"white", letterSpacing:"0.05em", marginBottom:10 }}>YC</div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:300, color:"white" }}>Yong Choi</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)", marginTop:2 }}>Associate Broker · Scottsdale North</div>
                <div style={{ display:"flex", gap:10, marginTop:10 }}>
                  {["About","Calendar","Schedule"].map((t,i)=>(
                    <div key={t} style={{ fontSize:10, fontWeight:700, color: i===0 ? "var(--gold)" : "rgba(255,255,255,0.4)", paddingBottom:4, borderBottom: i===0 ? "2px solid var(--gold)" : "2px solid transparent", cursor:"pointer" }}>{t}</div>))}
                </div>
              </div>
              <div style={{ padding:"14px 18px" }}>
                {[["Email","yong.choi@russlyon.com"],["Phone","(480) 555-0142"],["Office","Scottsdale North"]].map(([l,v])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--border)", fontSize:11 }}>
                    <span style={{ color:"#9CA3AF", fontWeight:600, fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em" }}>{l}</span>
                    <span style={{ color:"var(--navy)" }}>{v}</span>
                  </div>))}
              </div>
            </div>
          </div> },
    { name:"New Request Modal",     description:"Multi-step form. Material type selector → dynamic field set → submit.", v:"step-1", fullWidth:true,
      el: <div style={{ pointerEvents:"none" }}>
            <div style={{ width:560, background:"white", border:"1px solid var(--border)", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ background:"var(--navy)", padding:"14px 18px" }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)", marginBottom:2 }}>New Marketing Request</div>
                <div style={{ display:"flex", gap:6 }}>
                  {["Material Type","Details","Submit"].map((s,i)=>(
                    <div key={s} style={{ fontSize:9, fontWeight:700, padding:"3px 10px", background: i===0 ? "var(--gold)" : "rgba(255,255,255,0.08)", color: i===0 ? "white" : "rgba(255,255,255,0.35)" }}>{s}</div>))}
                </div>
              </div>
              <div style={{ padding:20 }}>
                <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:12 }}>Select a material type to begin</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
                  {[["📄","Flyer"],["◈","Social Pack"],["📊","Report"],["▶","Video"],["📰","Brochure"]].map(([ic,l])=>(
                    <div key={l} style={{ padding:"12px 8px", textAlign:"center", border:"1px solid var(--border)", background: l==="Flyer" ? "#F0F4FF" : "white", borderColor: l==="Flyer" ? "var(--navy)" : "var(--border)", cursor:"pointer" }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>{ic}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:l==="Flyer" ? "var(--navy)" : "#6B7280", letterSpacing:"0.04em" }}>{l}</div>
                    </div>))}
                </div>
              </div>
            </div>
          </div> },
    { name:"Revision Request Modal", description:"Designer requests revisions. Checklist of required items + note.", v:"default",  fullWidth:true,
      el: <div style={{ pointerEvents:"none" }}>
            <div style={{ width:480, background:"white", border:"1px solid var(--border)", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ background:"var(--navy)", padding:"14px 18px" }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--gold)", marginBottom:2 }}>Request Revision</div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:16, fontWeight:300, color:"white" }}>Pinnacle Peak Twilight Flyer</div>
              </div>
              <div style={{ padding:16 }}>
                <div style={{ fontSize:9, color:"#9CA3AF", marginBottom:8, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Revision items needed</div>
                {["Updated copy from client","New hero photo (see brief)","Color correction on gold elements"].map((i,n)=>(
                  <div key={n} style={{ display:"flex", gap:8, alignItems:"center", padding:"6px 0", borderBottom:"1px solid var(--border)", fontSize:11 }}>
                    <div style={{ width:14, height:14, border:"1px solid var(--border)", background: n<2 ? "var(--navy)" : "white", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:9 }}>{n<2?"✓":""}</div>
                    <span style={{ color: n<2 ? "var(--navy)" : "#9CA3AF", fontWeight: n<2 ? 600 : 400 }}>{i}</span>
                  </div>))}
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <div style={{ flex:1, padding:8, textAlign:"center", fontSize:10, fontWeight:700, background:"white", border:"1px solid var(--border)", color:"#9CA3AF" }}>Cancel</div>
                  <div style={{ flex:1, padding:8, textAlign:"center", fontSize:10, fontWeight:700, background:"var(--navy)", color:"white" }}>Send Revision Request</div>
                </div>
              </div>
            </div>
          </div> },
  ];

  if (group === "navigation") return [
    { name:"Sidebar — Collapsed Group", description:"Left nav. Dark navy, gold active state, expandable groups.", v:"full", fullWidth:true,
      el: <div style={{ width:200, background:"#0A1F3A", padding:"8px 0", pointerEvents:"none" }}>
            {[["Lyon's Den","M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z",false],
              ["Dashboard","M2 6L8 2l6 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6z",false],
              ["Marketing","M2 12l4-4 3 3 5-6",true],
            ].map(([l,ic,active])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", background: active ? "rgba(201,169,110,0.12)" : "none", borderLeft: active ? "2px solid var(--gold)" : "2px solid transparent" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active?"var(--gold)":"rgba(255,255,255,0.4)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ic}/></svg>
                <span style={{ fontSize:11, fontWeight: active ? 600 : 400, color: active ? "var(--gold)" : "rgba(255,255,255,0.55)", letterSpacing:"0.01em" }}>{l}</span>
                {active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{ marginLeft:"auto" }}><path d="M19 9l-7 7-7-7"/></svg>}
              </div>))}
            <div style={{ paddingLeft:32 }}>
              {["My Requests","Design Queue","Operations Report"].map((l,i)=>(
                <div key={l} style={{ padding:"6px 12px", display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:3, height:3, borderRadius:"50%", background: i===0 ? "var(--gold)" : "rgba(255,255,255,0.2)" }}/>
                  <span style={{ fontSize:10, color: i===0 ? "var(--gold)" : "rgba(255,255,255,0.35)", fontWeight: i===0 ? 600 : 400 }}>{l}</span>
                </div>))}
            </div>
          </div> },
    { name:"Breadcrumb",            description:"Page location indicator in top bar.", v:"default",
      el: <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {["Platform","Marketing","My Requests"].map((c,i,arr)=>(
              <React.Fragment key={c}>
                <span style={{ fontSize:11, fontWeight: i===arr.length-1 ? 700 : 400, color: i===arr.length-1 ? "var(--navy)" : "#9CA3AF" }}>{c}</span>
                {i<arr.length-1 && <span style={{ color:"#D1C9BC", fontSize:10 }}>›</span>}
              </React.Fragment>))}</div> },
    { name:"Top Bar",               description:"Fixed header. Breadcrumb left, search center, date right.", v:"full", fullWidth:true,
      el: <div style={{ background:"white", borderBottom:"1px solid var(--border)", padding:"0 24px", height:46, display:"flex", alignItems:"center", gap:16, pointerEvents:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#9CA3AF" }}>
              <span>Platform</span><span style={{ color:"#D1C9BC" }}>›</span><span style={{ color:"var(--navy)", fontWeight:700 }}>My Requests</span>
            </div>
            <div style={{ flex:1, maxWidth:360, height:28, background:"#F9F7F4", border:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8, padding:"0 10px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <span style={{ fontSize:11, color:"#C4B9AA" }}>Search requests, people, pages…</span>
            </div>
            <div style={{ marginLeft:"auto", fontSize:10, color:"#9CA3AF" }}>Mar 8, 2026</div>
          </div> },
    { name:"Role Picker",           description:"Switch between Agent / Designer / Executive views in demo.", v:"default",
      el: <div style={{ display:"flex", gap:2, background:"#F3F4F6", padding:2 }}>
            {["Agent","Designer","Executive"].map((r,i)=>(
              <div key={r} style={{ padding:"5px 14px", fontSize:10, fontWeight:700, letterSpacing:"0.04em", background: i===0 ? "white" : "transparent", color: i===0 ? "var(--navy)" : "#9CA3AF", boxShadow: i===0 ? "0 1px 3px rgba(0,0,0,0.1)" : "none", cursor:"pointer" }}>{r}</div>))}</div> },
  ];

  if (group === "chat") return [
    { name:"Message Bubble — Agent", description:"Outgoing message. Right-aligned, navy background.", v:"outgoing", fullWidth:true,
      el: <div style={{ display:"flex", flexDirection:"column", gap:8, width:"100%", maxWidth:400 }}>
            <div style={{ alignSelf:"flex-end", maxWidth:"75%" }}>
              <div style={{ background:"var(--navy)", color:"white", padding:"8px 12px", fontSize:11, lineHeight:1.5 }}>Can we add the mountain view callout in the copy?</div>
              <div style={{ fontSize:8, color:"#9CA3AF", textAlign:"right", marginTop:3 }}>Yong Choi · 9:45 AM</div>
            </div>
            <div style={{ alignSelf:"flex-start", maxWidth:"75%" }}>
              <div style={{ background:"white", border:"1px solid var(--border)", padding:"8px 12px", fontSize:11, lineHeight:1.5, color:"var(--navy)" }}>Sure — I'll add it above the price point. Will send draft v2 shortly.</div>
              <div style={{ fontSize:8, color:"#9CA3AF", marginTop:3 }}>Lex Baum · 10:02 AM</div>
            </div>
          </div> },
    { name:"System Message",        description:"Status change notification inline in chat thread.", v:"default",
      el: <div style={{ textAlign:"center", padding:"6px 0" }}>
            <span style={{ fontSize:9, fontWeight:600, color:"#9CA3AF", background:"#F3F4F6", padding:"3px 10px", letterSpacing:"0.06em" }}>✓ Status changed: In Progress → Review · Lex Baum · 10:04 AM</span>
          </div> },
    { name:"Chat Input",            description:"Message composer. Textarea + send button.", v:"default", fullWidth:true,
      el: <div style={{ display:"flex", gap:8, padding:"10px 14px", background:"white", border:"1px solid var(--border)", borderTop:"2px solid var(--border)", pointerEvents:"none" }}>
            <div style={{ flex:1, border:"1px solid var(--border)", padding:"7px 10px", fontSize:11, color:"#C4B9AA", minHeight:36, lineHeight:1.4 }}>Reply to agent…</div>
            <button style={{ background:"var(--navy)", border:"none", color:"white", padding:"0 14px", fontSize:11, fontWeight:700, letterSpacing:"0.06em", cursor:"pointer" }}>Send</button>
          </div> },
    { name:"Messenger Panel",       description:"Bottom-right floating chat panel. LinkedIn-style multi-tab.", v:"minimized",
      el: <div style={{ pointerEvents:"none" }}>
            <div style={{ width:240, background:"var(--navy)", borderRadius:"4px 4px 0 0", boxShadow:"0 -4px 20px rgba(0,0,0,0.15)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:24, height:24, background:"var(--gold)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"white" }}>YC</div>
                  <span style={{ fontSize:11, fontWeight:600, color:"white" }}>Yong Choi</span>
                </div>
                <div style={{ display:"flex", gap:4 }}>
                  {["–","×"].map(c=><div key={c} style={{ fontSize:12, color:"rgba(255,255,255,0.5)", cursor:"pointer", width:16, textAlign:"center" }}>{c}</div>)}
                </div>
              </div>
              <div style={{ background:"white", padding:"10px 12px", height:80, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:10, color:"#9CA3AF" }}>Messages appear here…</span>
              </div>
            </div>
          </div> },
  ];

  if (group === "forms") return [
    { name:"Text Input",            description:"Standard text field. Focus state uses navy border.", v:"default",
      el: <div style={{ display:"flex", flexDirection:"column", gap:10, width:280 }}>
            <div>
              <label style={{ display:"block", fontSize:8, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:5 }}>Project Title</label>
              <div style={{ border:"1px solid var(--navy)", padding:"8px 10px", fontSize:11, color:"var(--navy)", background:"white" }}>16020 N Horseshoe — Open House Flyer</div>
            </div>
            <div>
              <label style={{ display:"block", fontSize:8, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:5 }}>MLS ID</label>
              <div style={{ border:"1px solid var(--border)", padding:"8px 10px", fontSize:11, color:"#9CA3AF", background:"white" }}>e.g. 6812340</div>
            </div>
          </div> },
    { name:"Select Dropdown",       description:"Single-select. Matches text input sizing and border style.", v:"default",
      el: <div style={{ width:240 }}>
            <label style={{ display:"block", fontSize:8, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:5 }}>Preferred Designer</label>
            <div style={{ border:"1px solid var(--border)", padding:"8px 10px", fontSize:11, color:"var(--navy)", background:"white", display:"flex", justifyContent:"space-between" }}>
              <span>Lex Baum</span><span style={{ color:"#9CA3AF" }}>▾</span>
            </div>
          </div> },
    { name:"Textarea",              description:"Multi-line. Used for brief/notes, cancel reason, revision notes.", v:"default", fullWidth:true,
      el: <div style={{ width:"100%", maxWidth:400 }}>
            <label style={{ display:"block", fontSize:8, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#9CA3AF", marginBottom:5 }}>Brief / Notes</label>
            <div style={{ border:"1px solid var(--border)", padding:"8px 10px", fontSize:11, color:"var(--navy)", background:"white", minHeight:72, lineHeight:1.6 }}>
              Twilight hero photo for the front page — client specifically requested this. Highlight the mountain views in the copy.
            </div>
          </div> },
    { name:"File Drop Zone",        description:"Drag-and-drop asset upload area.", v:"default", fullWidth:true,
      el: <div style={{ border:"2px dashed var(--border)", padding:"24px", textAlign:"center", background:"#FDFAF5", width:"100%", maxWidth:400, boxSizing:"border-box" }}>
            <div style={{ fontSize:24, marginBottom:8, opacity:0.4 }}>📎</div>
            <div style={{ fontSize:12, fontWeight:600, color:"var(--navy)", marginBottom:4 }}>Drop reference files here</div>
            <div style={{ fontSize:10, color:"#9CA3AF" }}>or click to browse · JPG, PNG, PDF, AI, PSD</div>
          </div> },
    { name:"Rush Toggle",           description:"Checkbox-style rush order flag with fee warning.", v:"on",
      el: <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", background:"#FEF2F2", border:"1px solid #FCA5A5", maxWidth:320 }}>
            <div style={{ width:16, height:16, background:"#EF4444", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#B91C1C" }}>Rush Order</div>
              <div style={{ fontSize:9, color:"#DC2626", marginTop:2 }}>Rush fee applies. SLA reduced by 50%. Approval required.</div>
            </div>
          </div> },
    { name:"Search Filter Bar",     description:"Table header: text search + status/material dropdowns + results count.", v:"default", fullWidth:true,
      el: <div style={{ display:"flex", gap:8, alignItems:"center", padding:"10px 14px", background:"white", border:"1px solid var(--border)", flexWrap:"wrap", pointerEvents:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, border:"1px solid var(--border)", padding:"5px 10px", background:"#F9F7F4", flex:1, minWidth:180 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <span style={{ fontSize:11, color:"#C4B9AA" }}>Search requests…</span>
            </div>
            {["All Status","All Types"].map(p=>(
              <div key={p} style={{ border:"1px solid var(--border)", padding:"5px 10px", fontSize:10, color:"#9CA3AF", display:"flex", gap:6, alignItems:"center", background:"white" }}>
                {p}<span style={{ color:"#D1C9BC" }}>▾</span>
              </div>))}
            <span style={{ fontSize:9, color:"#9CA3AF", marginLeft:"auto" }}>47 requests</span>
          </div> },
  ];

  return [];
}

function ComponentLibraryPage() {
  const [activeGroup, setActiveGroup] = React.useState("primitives");
  const [expanded,    setExpanded]    = React.useState(null);
  const stories = getCLStories(activeGroup);

  return (
    <div style={{ display:"flex", height:"100%", minHeight:0 }}>

      {/* ── Left group nav ── */}
      <div style={{ width:200, flexShrink:0, borderRight:"1px solid var(--border)", background:"white", overflowY:"auto" }}>
        <div style={{ padding:"20px 16px 10px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--gold)", marginBottom:2 }}>Platform UI</div>
          <div style={{ fontFamily:"var(--font-display)", fontSize:17, fontWeight:300, color:"var(--navy)" }}>Components</div>
        </div>
        <div style={{ padding:"8px 0" }}>
          {CL_GROUPS.map(g => {
            const active = activeGroup === g.key;
            return (
              <button key={g.key} onClick={() => setActiveGroup(g.key)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 16px",
                background: active ? "rgba(201,169,110,0.1)" : "none",
                borderLeft: `2px solid ${active ? "var(--gold)" : "transparent"}`,
                border:"none", borderLeft: `2px solid ${active ? "var(--gold)" : "transparent"}`,
                cursor:"pointer", textAlign:"left",
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={active?"var(--gold)":"#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={g.icon}/></svg>
                <span style={{ fontSize:11, fontWeight: active ? 700 : 400, color: active ? "var(--navy)" : "#6B7280", flex:1 }}>{g.label}</span>
                <span style={{ fontSize:9, color: active ? "var(--gold)" : "#C4B9AA", fontWeight:600 }}>{g.count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ padding:"12px 16px", borderTop:"1px solid var(--border)", fontSize:9, color:"#C4B9AA", lineHeight:1.6 }}>
          All components sourced from IntakeUI.jsx. Changes here reflect everywhere.
        </div>
      </div>

      {/* ── Component grid ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
        {/* Group header */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:300, color:"var(--navy)", marginBottom:4 }}>
            {CL_GROUPS.find(g=>g.key===activeGroup)?.label}
          </div>
          <div style={{ fontSize:11, color:"#9CA3AF" }}>
            {stories.length} component{stories.length !== 1 ? "s" : ""} · Click any card to expand
          </div>
        </div>

        {/* Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:14 }}>
          {stories.map(s => (
            <CLStoryCard
              key={s.name}
              name={s.name}
              description={s.description}
              variant={s.v}
              fullWidth={s.fullWidth}
              onExpand={setExpanded}
            >
              {s.el}
            </CLStoryCard>
          ))}
        </div>
      </div>

      {/* ── Expand modal ── */}
      {expanded && (
        <CLExpandModal item={expanded} onClose={() => setExpanded(null)} />
      )}
    </div>
  );
}



