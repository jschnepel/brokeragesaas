"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Users,
  Zap,
  FileText,
  Phone,
  Home,
  TrendingUp,
  Star,
  Send,
  BarChart3,
  ClipboardList,
  Plus,
  Search,
  Maximize2,
  Minus,
  X,
  Image as ImageIcon,
  Paperclip,
  Smile,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DEN_EVENTS } from "@/lib/data/lyonsden"
import { MOCK_CONTACTS, MOCK_CONVERSATIONS } from "@/lib/data/messaging"
import type { Contact, Message } from "@/lib/data/messaging"
import type { PlatformRole } from "@/auth"

/* ── Helpers ──────────────────────────────────────────────── */

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const today = new Date()
const CALENDAR_ITEMS = [
  { time: "9:00 AM", title: "Team Standup", type: "meeting" as const },
  { time: "11:00 AM", title: "Listing Review", type: "meeting" as const },
  { time: "2:00 PM", title: "Client Call", type: "call" as const },
  { time: "4:30 PM", title: "Photo Review", type: "task" as const },
]

/* ── Tokens ───────────────────────────────────────────────── */

const RP = {
  width: 360,
  bg: "#ffffff",
  border: "#e5e5e5",
  textPrimary: "#191919",
  textSecondary: "#666666",
  textMuted: "#999999",
  sectionPad: "px-4 py-3",
}

const CHAT = {
  blue: "#0a66c2",
  blueHover: "#004182",
  text: "#191919",
  textSecondary: "#666666",
  border: "#e0dfdc",
  bgHover: "#f5f5f5",
  bubbleOwn: "#0a66c2",
  bubbleOther: "#f2f2f2",
  online: "#13a10e",
  shadow: "0 0 0 1px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.16)",
  radius: 8,
  font: "-apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

/* ── Mini Calendar ────────────────────────────────────────── */

function MiniCalendar() {
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"]
  const d = today.getDate()
  const month = today.getMonth()
  const year = today.getFullYear()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  return (
    <div>
      <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: RP.textSecondary }}>
        {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {dayNames.map((name, i) => (
          <div key={`${name}-${i}`} className="flex items-center justify-center py-0.5 text-[10px] font-semibold" style={{ color: RP.textMuted }}>
            {name}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isToday = day === d
          return (
            <button
              key={day}
              type="button"
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-[11px] font-medium transition-colors",
                isToday ? "text-white font-bold" : "hover:bg-black/5",
              )}
              style={isToday ? { background: "var(--brand-primary)" } : { color: RP.textPrimary }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Today's Schedule ─────────────────────────────────────── */

function TodaySchedule() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: RP.textMuted }}>
          Today&apos;s Schedule
        </span>
        <span className="text-[10px] font-semibold" style={{ color: "var(--brand-accent)" }}>
          {CALENDAR_ITEMS.length} items
        </span>
      </div>
      {CALENDAR_ITEMS.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-black/[0.03] cursor-pointer"
        >
          <div className="flex flex-col items-center w-12 shrink-0">
            <span className="text-[11px] font-bold" style={{ color: RP.textPrimary }}>{item.time}</span>
          </div>
          <div
            className={cn(
              "h-8 w-0.5 shrink-0 rounded-full",
              item.type === "meeting" ? "bg-blue-500" : item.type === "call" ? "bg-emerald-500" : "bg-amber-500",
            )}
          />
          <span className="text-[13px] font-medium truncate" style={{ color: RP.textPrimary }}>{item.title}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Upcoming Events ──────────────────────────────────────── */

function UpcomingEvents() {
  const upcoming = DEN_EVENTS
    .filter((e) => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2)

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: RP.textMuted }}>
        Upcoming Events
      </span>
      {upcoming.map((evt) => {
        const evtDate = new Date(evt.date)
        return (
          <div key={evt.id} className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-black/[0.03] cursor-pointer">
            <div
              className="flex flex-col items-center justify-center rounded-lg px-2 py-1 min-w-[40px]"
              style={{ background: "rgba(201,169,110,0.1)" }}
            >
              <span className="text-sm font-bold leading-none" style={{ color: "var(--brand-primary)", fontFamily: "var(--brand-font-display)" }}>
                {evtDate.getDate()}
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "var(--brand-accent)" }}>
                {evtDate.toLocaleDateString("en-US", { month: "short" })}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: RP.textPrimary }}>{evt.title}</p>
              <p className="text-[10px]" style={{ color: RP.textSecondary }}>{evt.time}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── New Chat Popover ──────────────────────────────────────── */

function NewChatPopover({
  onSelect,
  onClose,
}: {
  onSelect: (contactId: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  const filtered = useMemo(() => {
    if (!query) return MOCK_CONTACTS
    const q = query.toLowerCase()
    return MOCK_CONTACTS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border bg-white shadow-lg"
      style={{ borderColor: RP.border }}
    >
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${RP.border}` }}>
        <div className="flex items-center gap-2 rounded-md bg-black/[0.04] px-2.5 py-1.5">
          <Search className="size-3.5 shrink-0" style={{ color: RP.textMuted }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people..."
            className="flex-1 bg-transparent text-[12px] outline-none"
            style={{ color: RP.textPrimary }}
          />
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-3 text-center text-[11px]" style={{ color: RP.textMuted }}>
            No contacts found
          </p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onSelect(c.id); onClose() }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-black/[0.04]"
            >
              <div className="relative shrink-0">
                <div
                  className="flex size-7 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                  style={{ background: "var(--brand-primary)" }}
                >
                  {c.initials}
                </div>
                {c.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-[1.5px] border-white bg-emerald-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate" style={{ color: RP.textPrimary }}>{c.name}</p>
                <p className="text-[10px] truncate" style={{ color: RP.textSecondary }}>{c.role}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

/* ── Messages Section ─────────────────────────────────────── */

function RecentMessages({
  onOpenChat,
  onViewAll,
}: {
  onOpenChat: (contactId: string) => void
  onViewAll: () => void
}) {
  const [showNewChat, setShowNewChat] = useState(false)
  const recent = MOCK_CONTACTS.slice(0, 3)
  const totalUnread = MOCK_CONTACTS.reduce((s, c) => s + c.unread, 0)

  return (
    <div className="space-y-1.5">
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: RP.textMuted }}>
            Messages
          </span>
          {totalUnread > 0 && (
            <span
              className="flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: "#cc1016" }}
            >
              {totalUnread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setShowNewChat((v) => !v)}
            className={cn(
              "rounded-full p-1 transition-colors",
              showNewChat ? "bg-black/10" : "hover:bg-black/5",
            )}
            title="New message"
          >
            <Plus className="size-3.5" style={{ color: RP.textSecondary }} />
          </button>
          <button
            type="button"
            onClick={onViewAll}
            className="rounded-full p-1 transition-colors hover:bg-black/5"
            title="View all messages"
          >
            <ExternalLink className="size-3.5" style={{ color: RP.textSecondary }} />
          </button>
        </div>

        {/* New chat search popover */}
        {showNewChat && (
          <NewChatPopover
            onSelect={onOpenChat}
            onClose={() => setShowNewChat(false)}
          />
        )}
      </div>
      {recent.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onOpenChat(c.id)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-black/[0.03]"
        >
          <div className="relative shrink-0">
            <div
              className="flex size-8 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ background: "var(--brand-primary)" }}
            >
              {c.initials}
            </div>
            {c.online && (
              <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-1">
              <span className={cn("text-[12px] truncate", c.unread > 0 ? "font-bold" : "font-medium")} style={{ color: RP.textPrimary }}>
                {c.name}
              </span>
            </div>
            <p className={cn("text-[11px] truncate", c.unread > 0 ? "font-semibold" : "")} style={{ color: c.unread > 0 ? RP.textPrimary : RP.textSecondary }}>
              {c.lastMessage}
            </p>
          </div>
          {c.unread > 0 && (
            <span className="flex size-2 shrink-0 rounded-full bg-blue-600" />
          )}
        </button>
      ))}
    </div>
  )
}

/* ── Chat Window (bottom-docked) ──────────────────────────── */

function ChatWindow({
  contact,
  messages,
  minimized,
  onSend,
  onMinimize,
  onMaximize,
  onClose,
  onExpand,
}: {
  contact: Contact
  messages: Message[]
  minimized: boolean
  onSend: (contactId: string, body: string) => void
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
  onExpand: () => void
}) {
  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current && !minimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, minimized])

  function handleSend() {
    const body = draft.trim()
    if (!body) return
    onSend(contact.id, body)
    setDraft("")
  }

  const header = (
    <div
      onClick={minimized ? onMaximize : undefined}
      className="flex items-center gap-2.5 px-3 py-2"
      style={{
        cursor: minimized ? "pointer" : "default",
        borderBottom: minimized ? "none" : `1px solid ${CHAT.border}`,
        fontFamily: CHAT.font,
      }}
    >
      <div className="relative shrink-0">
        <div
          className="flex size-8 items-center justify-center rounded-full text-[11px] font-semibold text-white"
          style={{ backgroundColor: "#56687a" }}
        >
          {contact.initials}
        </div>
        {contact.online && (
          <div className="absolute -bottom-px -right-px size-2.5 rounded-full border-2 border-white" style={{ backgroundColor: CHAT.online }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-tight" style={{ color: CHAT.text }}>
          {contact.name}
        </span>
        {!minimized && (
          <span className="block truncate text-xs" style={{ color: CHAT.textSecondary }}>
            {contact.role}
          </span>
        )}
      </div>
      <div className="flex items-center">
        {!minimized && (
          <button
            onClick={(e) => { e.stopPropagation(); onExpand() }}
            className="rounded-full p-1.5 transition-colors hover:bg-black/5"
            title="Open in full page"
          >
            <Maximize2 className="size-4" style={{ color: CHAT.textSecondary }} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); minimized ? onMaximize() : onMinimize() }}
          className="rounded-full p-1.5 transition-colors hover:bg-black/5"
          title={minimized ? "Expand" : "Minimize"}
        >
          {minimized ? (
            <ChevronUp className="size-4" style={{ color: CHAT.textSecondary }} />
          ) : (
            <Minus className="size-4" style={{ color: CHAT.textSecondary }} />
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="rounded-full p-1.5 transition-colors hover:bg-black/5"
          title="Close"
        >
          <X className="size-4" style={{ color: CHAT.textSecondary }} />
        </button>
      </div>
    </div>
  )

  if (minimized) {
    return (
      <div
        className="w-72 overflow-hidden bg-white"
        style={{ borderRadius: `${CHAT.radius}px ${CHAT.radius}px 0 0`, boxShadow: CHAT.shadow, fontFamily: CHAT.font }}
      >
        {header}
      </div>
    )
  }

  return (
    <div
      className="flex w-80 flex-col overflow-hidden bg-white"
      style={{ borderRadius: `${CHAT.radius}px ${CHAT.radius}px 0 0`, boxShadow: CHAT.shadow, fontFamily: CHAT.font, height: 400 }}
    >
      {header}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
        <div className="flex flex-col gap-1">
          {messages.map((m, i) => {
            const prev = messages[i - 1]
            const showName = !m.isOwn && (!prev || prev.isOwn || prev.senderId !== m.senderId)
            return (
              <div key={m.id}>
                {showName && (
                  <div className="mb-0.5 mt-2 flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: "#56687a" }}>
                      {contact.initials}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: CHAT.text }}>{m.senderName}</span>
                    <span className="text-[11px]" style={{ color: CHAT.textSecondary }}>{formatTime(m.timestamp)}</span>
                  </div>
                )}
                <div className={cn("flex", m.isOwn ? "justify-end" : "justify-start")}>
                  <div
                    className="max-w-[75%] px-3 py-2"
                    style={{
                      backgroundColor: m.isOwn ? CHAT.bubbleOwn : CHAT.bubbleOther,
                      color: m.isOwn ? "#ffffff" : CHAT.text,
                      borderRadius: m.isOwn ? "12px 12px 0 12px" : "12px 12px 12px 0",
                      fontSize: 14,
                      lineHeight: 1.4,
                      fontFamily: CHAT.font,
                    }}
                  >
                    {m.body}
                  </div>
                </div>
                {m.isOwn && (
                  <div className="mt-0.5 text-right text-[11px]" style={{ color: CHAT.textSecondary }}>
                    {formatTime(m.timestamp)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${CHAT.border}` }}>
        <div className="px-3 pt-2 pb-1.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder="Write a message..."
            rows={2}
            className="w-full resize-none bg-transparent text-sm outline-none"
            style={{ color: CHAT.text, fontFamily: CHAT.font }}
          />
        </div>
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <button type="button" className="rounded-full p-1.5 transition-colors hover:bg-black/5">
              <ImageIcon className="size-4" style={{ color: CHAT.textSecondary }} />
            </button>
            <button type="button" className="rounded-full p-1.5 transition-colors hover:bg-black/5">
              <Paperclip className="size-4" style={{ color: CHAT.textSecondary }} />
            </button>
            <button type="button" className="rounded-full p-1.5 transition-colors hover:bg-black/5">
              <Smile className="size-4" style={{ color: CHAT.textSecondary }} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="rounded-full p-2 transition-colors disabled:opacity-30"
            style={{ backgroundColor: draft.trim() ? CHAT.blue : "transparent", color: draft.trim() ? "#fff" : CHAT.textSecondary }}
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Role-specific: Designer Queue ────────────────────────── */

function DesignerQueue() {
  const items = [
    { id: 1, title: "Desert Mountain Brochure", requester: "Yong Choi", sla: "2h left", urgent: true },
    { id: 2, title: "Listing Flyer — 85255", requester: "Jennifer Walsh", sla: "1d left", urgent: false },
    { id: 3, title: "Social Post Set", requester: "Robert Martinez", sla: "3d left", urgent: false },
  ]

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: RP.textMuted }}>
          My Queue
        </span>
        <span className="text-[10px] font-semibold" style={{ color: "var(--brand-accent)" }}>
          {items.length} active
        </span>
      </div>
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-black/[0.03] cursor-pointer">
          <div className={cn("mt-0.5 size-2 shrink-0 rounded-full", item.urgent ? "bg-red-500" : "bg-blue-400")} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate" style={{ color: RP.textPrimary }}>{item.title}</p>
            <p className="text-[10px]" style={{ color: RP.textSecondary }}>{item.requester}</p>
          </div>
          <span className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
            item.urgent ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground",
          )}>
            {item.sla}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Role-specific: Agent CRM ─────────────────────────────── */

function AgentCRM() {
  const leads = [
    { id: 1, name: "Sarah & Tom Mitchell", status: "Hot", property: "DC Ranch", icon: Star },
    { id: 2, name: "James Cooper", status: "Active", property: "Desert Mountain", icon: Home },
    { id: 3, name: "Lisa Patel", status: "Follow-up", property: "Silverleaf", icon: Phone },
  ]

  const stats = [
    { label: "Active Leads", value: "12" },
    { label: "Showings This Week", value: "6" },
    { label: "Pending Offers", value: "3" },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg px-2 py-2 text-center" style={{ background: "rgba(201,169,110,0.06)" }}>
            <span className="block text-base font-bold" style={{ color: "var(--brand-primary)", fontFamily: "var(--brand-font-display)" }}>
              {s.value}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: RP.textMuted }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: RP.textMuted }}>
          Hot Leads
        </span>
        {leads.map((lead) => (
          <div key={lead.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-black/[0.03] cursor-pointer">
            <div className="flex size-8 items-center justify-center rounded-lg" style={{ background: "rgba(201,169,110,0.1)" }}>
              <lead.icon className="size-3.5" style={{ color: "var(--brand-accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: RP.textPrimary }}>{lead.name}</p>
              <p className="text-[10px]" style={{ color: RP.textSecondary }}>{lead.property}</p>
            </div>
            <span className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
              lead.status === "Hot" ? "bg-red-50 text-red-600" : lead.status === "Active" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600",
            )}>
              {lead.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Role-specific: Manager ───────────────────────────────── */

function ManagerPanel() {
  const teamItems = [
    { name: "Marcus Chen", tasks: 4, capacity: "High" },
    { name: "Sarah Kim", tasks: 2, capacity: "Available" },
    { name: "David Park", tasks: 5, capacity: "Full" },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Open", value: "18", color: "text-blue-600" },
          { label: "In Review", value: "6", color: "text-amber-600" },
          { label: "SLA Risk", value: "2", color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border px-2 py-2 text-center">
            <span className={cn("block text-base font-bold", s.color)} style={{ fontFamily: "var(--brand-font-display)" }}>
              {s.value}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: RP.textMuted }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: RP.textMuted }}>
          Team Capacity
        </span>
        {teamItems.map((t) => (
          <div key={t.name} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-black/[0.03] cursor-pointer">
            <div className="flex size-8 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: "var(--brand-primary)" }}>
              {getInitials(t.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: RP.textPrimary }}>{t.name}</p>
              <p className="text-[10px]" style={{ color: RP.textSecondary }}>{t.tasks} active tasks</p>
            </div>
            <span className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
              t.capacity === "Full" ? "bg-red-50 text-red-600" : t.capacity === "High" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600",
            )}>
              {t.capacity}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Role-specific: Executive ─────────────────────────────── */

function ExecutivePanel() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Monthly Vol.", value: "$82.4M", icon: BarChart3 },
          { label: "Active Agents", value: "186", icon: Users },
          { label: "Avg DOM", value: "28d", icon: Clock },
          { label: "Pipeline", value: "$24.1M", icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
            <s.icon className="size-4 shrink-0" style={{ color: "var(--brand-accent)" }} />
            <div>
              <span className="block text-sm font-bold" style={{ color: "var(--brand-primary)", fontFamily: "var(--brand-font-display)" }}>
                {s.value}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: RP.textMuted }}>
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Section Divider ──────────────────────────────────────── */

function Divider() {
  return <div className="mx-4 border-t" style={{ borderColor: RP.border }} />
}

/* ── Open Chat State ──────────────────────────────────────── */

interface OpenChat {
  contactId: string
  minimized: boolean
}

/* ── Main Panel ───────────────────────────────────────────── */

export function RightPanel() {
  const router = useRouter()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)

  // Chat state
  const [openChats, setOpenChats] = useState<OpenChat[]>([])
  const [conversations, setConversations] = useState<Record<string, Message[]>>(() => ({ ...MOCK_CONVERSATIONS }))

  const role = (session?.user as { role?: PlatformRole } | undefined)?.role ?? "agent"
  const userName = session?.user?.name ?? "User"

  const openContact = useCallback((contactId: string) => {
    setOpenChats((prev) => {
      const existing = prev.find((c) => c.contactId === contactId)
      if (existing) return prev.map((c) => c.contactId === contactId ? { ...c, minimized: false } : c)
      const next = [...prev, { contactId, minimized: false }]
      if (next.length > 3) next.shift()
      return next
    })
  }, [])

  const closeChat = useCallback((contactId: string) => {
    setOpenChats((prev) => prev.filter((c) => c.contactId !== contactId))
  }, [])

  const minimizeChat = useCallback((contactId: string) => {
    setOpenChats((prev) => prev.map((c) => c.contactId === contactId ? { ...c, minimized: true } : c))
  }, [])

  const maximizeChat = useCallback((contactId: string) => {
    setOpenChats((prev) => prev.map((c) => c.contactId === contactId ? { ...c, minimized: false } : c))
  }, [])

  const handleSend = useCallback((contactId: string, body: string) => {
    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: "me",
      senderName: "You",
      body,
      timestamp: new Date().toISOString(),
      isOwn: true,
    }
    setConversations((prev) => ({ ...prev, [contactId]: [...(prev[contactId] ?? []), msg] }))
  }, [])

  if (collapsed) {
    return (
      <>
        <div className="hidden lg:flex flex-col items-center py-4 border-l sticky top-0 h-screen" style={{ width: 48, background: RP.bg, borderColor: RP.border }}>
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="rounded-full p-1.5 transition-colors hover:bg-black/5"
            title="Expand panel"
          >
            <ChevronLeft className="size-4" style={{ color: RP.textSecondary }} />
          </button>
          <div className="mt-4 flex flex-col items-center gap-3">
            <Calendar className="size-4" style={{ color: RP.textMuted }} />
            <MessageCircle className="size-4" style={{ color: RP.textMuted }} />
            <ClipboardList className="size-4" style={{ color: RP.textMuted }} />
          </div>
        </div>

        {/* Chat windows still visible when collapsed */}
        {openChats.length > 0 && (
          <div className="fixed bottom-0 right-14 z-[1000] flex items-end gap-2 pointer-events-none">
            {openChats.map((chat) => {
              const contact = MOCK_CONTACTS.find((c) => c.id === chat.contactId)
              if (!contact) return null
              return (
                <div key={chat.contactId} className="pointer-events-auto">
                  <ChatWindow
                    contact={contact}
                    messages={conversations[chat.contactId] ?? []}
                    minimized={chat.minimized}
                    onSend={handleSend}
                    onMinimize={() => minimizeChat(chat.contactId)}
                    onMaximize={() => maximizeChat(chat.contactId)}
                    onClose={() => closeChat(chat.contactId)}
                    onExpand={() => { closeChat(chat.contactId); router.push("/messaging") }}
                  />
                </div>
              )
            })}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <aside
        className="hidden lg:flex flex-col border-l overflow-hidden sticky top-0 h-screen"
        style={{ width: RP.width, background: RP.bg, borderColor: RP.border }}
      >
        {/* Panel Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: "var(--brand-primary)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-white">
              {getInitials(userName)}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white leading-tight">{userName}</p>
              <p className="text-[10px] text-white/50 capitalize">{role.replace("_", " ")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="rounded-full p-1.5 transition-colors hover:bg-white/10"
            title="Collapse panel"
          >
            <ChevronRight className="size-4 text-white/60" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className={RP.sectionPad}>
            <MiniCalendar />
          </div>

          <Divider />

          <div className={RP.sectionPad}>
            <TodaySchedule />
          </div>

          <Divider />

          <div className={RP.sectionPad}>
            <UpcomingEvents />
          </div>

          <Divider />

          <div className={RP.sectionPad}>
            <RecentMessages
              onOpenChat={openContact}
              onViewAll={() => router.push("/messaging")}
            />
          </div>

          <Divider />

          <div className={cn(RP.sectionPad, "flex-1 min-h-0")}>
            {role === "designer" && <DesignerQueue />}
            {role === "agent" && <AgentCRM />}
            {role === "marketing_manager" && <ManagerPanel />}
            {role === "executive" && <ExecutivePanel />}
          </div>
        </div>
      </aside>

      {/* Floating chat windows — bottom of screen, left of panel */}
      {openChats.length > 0 && (
        <div
          className="fixed bottom-0 z-[1000] flex items-end gap-2 pointer-events-none"
          style={{ right: RP.width + 16 }}
        >
          {openChats.map((chat) => {
            const contact = MOCK_CONTACTS.find((c) => c.id === chat.contactId)
            if (!contact) return null
            return (
              <div key={chat.contactId} className="pointer-events-auto">
                <ChatWindow
                  contact={contact}
                  messages={conversations[chat.contactId] ?? []}
                  minimized={chat.minimized}
                  onSend={handleSend}
                  onMinimize={() => minimizeChat(chat.contactId)}
                  onMaximize={() => maximizeChat(chat.contactId)}
                  onClose={() => closeChat(chat.contactId)}
                  onExpand={() => { closeChat(chat.contactId); router.push("/messaging") }}
                />
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
