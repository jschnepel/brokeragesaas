"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  ChevronUp,
  Send,
  Minus,
  Maximize2,
  Search,
  X,
  Pencil,
  MoreHorizontal,
  Image,
  Paperclip,
  Smile,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MOCK_CONTACTS, MOCK_CONVERSATIONS } from "@/lib/data/messaging"
import type { Contact, Message } from "@/lib/data/messaging"

/* ── LinkedIn-ish tokens ─────────────────────────────────────────────── */

const LI = {
  blue: "#0a66c2",
  blueHover: "#004182",
  text: "#191919",
  textSecondary: "#666666",
  textTertiary: "#00000099",
  border: "#e0dfdc",
  bgHover: "#f5f5f5",
  bubbleOwn: "#0a66c2",
  bubbleOther: "#f2f2f2",
  online: "#13a10e",
  shadow: "0 0 0 1px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.16)",
  shadowSm: "0 0 0 1px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.08)",
  radius: 8,
  font: "-apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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

/* ── Shared avatar ───────────────────────────────────────────────────── */

function LiAvatar({ initials, online, size = 40 }: { initials: string; online?: boolean; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex items-center justify-center rounded-full text-white"
        style={{
          width: size,
          height: size,
          backgroundColor: "#56687a",
          fontSize: size * 0.35,
          fontWeight: 600,
          fontFamily: LI.font,
        }}
      >
        {initials}
      </div>
      {online && (
        <div
          className="absolute rounded-full border-2 border-white"
          style={{
            width: size * 0.3,
            height: size * 0.3,
            backgroundColor: LI.online,
            bottom: -1,
            right: -1,
          }}
        />
      )}
    </div>
  )
}

/* ── Chat Window ─────────────────────────────────────────────────────── */

interface ChatWindowProps {
  contact: Contact
  messages: Message[]
  minimized: boolean
  onSend: (contactId: string, body: string) => void
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
  onExpand: () => void
}

function ChatWindow({ contact, messages, minimized, onSend, onMinimize, onMaximize, onClose, onExpand }: ChatWindowProps) {
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

  /* ── Header (always visible) ──────────────────────────────── */
  const header = (
    <div
      onClick={minimized ? onMaximize : undefined}
      className="flex items-center gap-2.5 px-3 py-2"
      style={{
        cursor: minimized ? "pointer" : "default",
        borderBottom: minimized ? "none" : `1px solid ${LI.border}`,
        fontFamily: LI.font,
      }}
    >
      <LiAvatar initials={contact.initials} online={contact.online} size={32} />
      <div className="min-w-0 flex-1">
        <span
          className="block truncate text-sm font-semibold leading-tight"
          style={{ color: LI.text }}
        >
          {contact.name}
        </span>
        {!minimized && (
          <span className="block truncate text-xs" style={{ color: LI.textSecondary }}>
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
            <Maximize2 className="size-4" style={{ color: LI.textSecondary }} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); minimized ? onMaximize() : onMinimize() }}
          className="rounded-full p-1.5 transition-colors hover:bg-black/5"
          title={minimized ? "Expand" : "Minimize"}
        >
          {minimized ? (
            <ChevronUp className="size-4" style={{ color: LI.textSecondary }} />
          ) : (
            <Minus className="size-4" style={{ color: LI.textSecondary }} />
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="rounded-full p-1.5 transition-colors hover:bg-black/5"
          title="Close"
        >
          <X className="size-4" style={{ color: LI.textSecondary }} />
        </button>
      </div>
    </div>
  )

  if (minimized) {
    return (
      <div
        className="w-72 overflow-hidden bg-white"
        style={{
          borderRadius: `${LI.radius}px ${LI.radius}px 0 0`,
          boxShadow: LI.shadow,
          fontFamily: LI.font,
        }}
      >
        {header}
      </div>
    )
  }

  return (
    <div
      className="flex w-80 flex-col overflow-hidden bg-white"
      style={{
        borderRadius: `${LI.radius}px ${LI.radius}px 0 0`,
        boxShadow: LI.shadow,
        fontFamily: LI.font,
        height: 400,
      }}
    >
      {header}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
        <div className="flex flex-col gap-1">
          {messages.map((m, i) => {
            const prev = messages[i - 1]
            const showName = !m.isOwn && (!prev || prev.isOwn || prev.senderId !== m.senderId)
            return (
              <div key={m.id}>
                {showName && (
                  <div className="mb-0.5 mt-2 flex items-center gap-2">
                    <LiAvatar initials={contact.initials} size={24} />
                    <span className="text-xs font-semibold" style={{ color: LI.text }}>
                      {m.senderName}
                    </span>
                    <span className="text-[11px]" style={{ color: LI.textSecondary }}>
                      {formatTime(m.timestamp)}
                    </span>
                  </div>
                )}
                <div className={cn("flex", m.isOwn ? "justify-end" : "justify-start")}>
                  <div
                    className="max-w-[75%] px-3 py-2"
                    style={{
                      backgroundColor: m.isOwn ? LI.bubbleOwn : LI.bubbleOther,
                      color: m.isOwn ? "#ffffff" : LI.text,
                      borderRadius: m.isOwn ? "12px 12px 0 12px" : "12px 12px 12px 0",
                      fontSize: 14,
                      lineHeight: 1.4,
                      fontFamily: LI.font,
                    }}
                  >
                    {m.body}
                  </div>
                </div>
                {m.isOwn && (
                  <div className="mt-0.5 text-right text-[11px]" style={{ color: LI.textSecondary }}>
                    {formatTime(m.timestamp)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Input area */}
      <div style={{ borderTop: `1px solid ${LI.border}` }}>
        <div className="px-3 pt-2 pb-1.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Write a message..."
            rows={2}
            className="w-full resize-none bg-transparent text-sm outline-none"
            style={{ color: LI.text, fontFamily: LI.font }}
          />
        </div>
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <button className="rounded-full p-1.5 transition-colors hover:bg-black/5">
              <Image className="size-4" style={{ color: LI.textSecondary }} />
            </button>
            <button className="rounded-full p-1.5 transition-colors hover:bg-black/5">
              <Paperclip className="size-4" style={{ color: LI.textSecondary }} />
            </button>
            <button className="rounded-full p-1.5 transition-colors hover:bg-black/5">
              <Smile className="size-4" style={{ color: LI.textSecondary }} />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className="rounded-full p-2 transition-colors disabled:opacity-30"
            style={{
              backgroundColor: draft.trim() ? LI.blue : "transparent",
              color: draft.trim() ? "#fff" : LI.textSecondary,
            }}
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Messaging Panel (contact list) ──────────────────────────────────── */

function MessagingPanel({
  expanded,
  onToggle,
  contacts,
  totalUnread,
  search,
  onSearch,
  onSelectContact,
  onCompose,
  onOpenFullPage,
}: {
  expanded: boolean
  onToggle: () => void
  contacts: Contact[]
  totalUnread: number
  search: string
  onSearch: (q: string) => void
  onSelectContact: (id: string) => void
  onCompose: () => void
  onOpenFullPage: () => void
}) {
  /* ── Title bar (always visible) ────────────────────────────── */
  const titleBar = (
    <div
      onClick={onToggle}
      className="flex cursor-pointer items-center gap-2 px-4 py-2.5 select-none"
      style={{ fontFamily: LI.font }}
    >
      <span className="flex-1 text-base font-semibold" style={{ color: LI.text }}>
        Messaging
      </span>
      {totalUnread > 0 && (
        <span
          className="flex size-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ backgroundColor: "#cc1016" }}
        >
          {totalUnread}
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onCompose() }}
        className="rounded-full p-1 transition-colors hover:bg-black/5"
        title="New message"
      >
        <Pencil className="size-4" style={{ color: LI.textSecondary }} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation() }}
        className="rounded-full p-1 transition-colors hover:bg-black/5"
        title="More options"
      >
        <MoreHorizontal className="size-4" style={{ color: LI.textSecondary }} />
      </button>
      {expanded ? (
        <ChevronDown className="size-4" style={{ color: LI.textSecondary }} />
      ) : (
        <ChevronUp className="size-4" style={{ color: LI.textSecondary }} />
      )}
    </div>
  )

  return (
    <div
      className="flex w-80 flex-col overflow-hidden bg-white"
      style={{
        borderRadius: `${LI.radius}px ${LI.radius}px 0 0`,
        boxShadow: LI.shadow,
        fontFamily: LI.font,
      }}
    >
      {titleBar}

      {expanded && (
        <>
          {/* Search */}
          <div className="px-3 pb-2">
            <div
              className="flex items-center gap-2 rounded-sm px-2 py-1.5"
              style={{ backgroundColor: "#eef3f8" }}
            >
              <Search className="size-4 shrink-0" style={{ color: LI.textSecondary }} />
              <input
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search messages"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: LI.text, fontFamily: LI.font }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-3 pb-1" style={{ borderBottom: `1px solid ${LI.border}` }}>
            <button
              className="relative px-2 pb-1.5 text-xs font-semibold"
              style={{ color: LI.blue }}
            >
              Focused
              <span
                className="absolute inset-x-0 bottom-0 h-0.5"
                style={{ backgroundColor: LI.blue }}
              />
            </button>
            <button
              className="px-2 pb-1.5 text-xs font-semibold"
              style={{ color: LI.textSecondary }}
            >
              Other
            </button>
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 400 }}>
            {contacts.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectContact(c.id)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                style={{ fontFamily: LI.font }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = LI.bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <LiAvatar initials={c.initials} online={c.online} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <span
                      className={cn("truncate text-sm", c.unread > 0 ? "font-semibold" : "font-normal")}
                      style={{ color: LI.text }}
                    >
                      {c.name}
                    </span>
                    <span className="shrink-0 text-xs" style={{ color: LI.textSecondary }}>
                      {formatTime(c.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        "flex-1 truncate text-xs",
                        c.unread > 0 ? "font-semibold" : "font-normal",
                      )}
                      style={{ color: c.unread > 0 ? LI.text : LI.textSecondary }}
                    >
                      {c.lastMessage}
                    </span>
                    {c.unread > 0 && (
                      <span
                        className="flex size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: LI.blue }}
                      />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Main Overlay Container ──────────────────────────────────────────── */

interface OpenChat {
  contactId: string
  minimized: boolean
}

export function ChatOverlay() {
  const router = useRouter()
  const [panelExpanded, setPanelExpanded] = useState(false)
  const [openChats, setOpenChats] = useState<OpenChat[]>([])
  const [search, setSearch] = useState("")
  const [conversations, setConversations] = useState<Record<string, Message[]>>(
    () => ({ ...MOCK_CONVERSATIONS }),
  )

  const contacts = MOCK_CONTACTS
  const totalUnread = useMemo(() => contacts.reduce((sum, c) => sum + c.unread, 0), [contacts])

  const filteredContacts = useMemo(() => {
    if (!search) return contacts
    const q = search.toLowerCase()
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q),
    )
  }, [contacts, search])

  const openContact = useCallback((contactId: string) => {
    setOpenChats((prev) => {
      // Already open? Just un-minimize
      const existing = prev.find((c) => c.contactId === contactId)
      if (existing) return prev.map((c) => c.contactId === contactId ? { ...c, minimized: false } : c)
      // Max 3 open windows
      const next = [...prev, { contactId, minimized: false }]
      if (next.length > 3) next.shift()
      return next
    })
  }, [])

  const closeChat = useCallback((contactId: string) => {
    setOpenChats((prev) => prev.filter((c) => c.contactId !== contactId))
  }, [])

  const minimizeChat = useCallback((contactId: string) => {
    setOpenChats((prev) =>
      prev.map((c) => c.contactId === contactId ? { ...c, minimized: true } : c),
    )
  }, [])

  const maximizeChat = useCallback((contactId: string) => {
    setOpenChats((prev) =>
      prev.map((c) => c.contactId === contactId ? { ...c, minimized: false } : c),
    )
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
    setConversations((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] ?? []), msg],
    }))
  }, [])

  return (
    <div className="fixed bottom-0 right-4 z-[1000] flex items-end gap-2 pointer-events-none">
      {/* Open chat windows (left of panel) */}
      {openChats.map((chat) => {
        const contact = contacts.find((c) => c.id === chat.contactId)
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
              onExpand={() => {
                closeChat(chat.contactId)
                router.push("/messaging")
              }}
            />
          </div>
        )
      })}

      {/* Messaging panel (rightmost) */}
      <div className="pointer-events-auto">
        <MessagingPanel
          expanded={panelExpanded}
          onToggle={() => setPanelExpanded((v) => !v)}
          contacts={filteredContacts}
          totalUnread={totalUnread}
          search={search}
          onSearch={setSearch}
          onSelectContact={(id) => {
            openContact(id)
            setPanelExpanded(false)
          }}
          onCompose={() => {}}
          onOpenFullPage={() => {
            setPanelExpanded(false)
            router.push("/messaging")
          }}
        />
      </div>
    </div>
  )
}
