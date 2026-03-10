"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Send, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { REQUEST_STATUS } from "@/lib/constants"
import { LAYOUT } from "@/lib/config/layout"
import { getMessages, sendMessage } from "@/actions/intake"
import { ChatManager } from "@/lib/models"
import type { ChatMessage } from "@/lib/models"
import type { ViewerRole, DetailTab, StatusLogDTO } from "@/lib/types"

interface ChatPanelProps {
  requestId: string
  currentUserId: string
  status: string
  viewerRole: ViewerRole
  statusLog: StatusLogDTO[]
  loadingAction: boolean
  onStatusUpdate: (newStatus: string) => void
  expanded?: boolean
  onToggleExpand?: () => void
}

const REVISION_IMAGE_RE = /\[revision-image:(data:image\/[^\]]+)\]/

function parseRevisionMessage(body: string): { text: string; imageUrl: string | null } {
  const match = REVISION_IMAGE_RE.exec(body)
  if (!match) return { text: body, imageUrl: null }
  return {
    text: body.replace(REVISION_IMAGE_RE, "").trim(),
    imageUrl: match[1] ?? null,
  }
}

function RevisionImageModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div onClick={(e) => e.stopPropagation()} className="relative max-h-[90vh] max-w-[90vw]">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 size-8 rounded-full bg-white p-0 shadow-md hover:bg-gray-100"
        >
          <X className="size-4" />
        </Button>
        <img src={imageUrl} alt="Revision annotations" className="max-h-[85vh] rounded-lg shadow-2xl" />
      </div>
    </div>
  )
}

function ActivityItem({ entry }: { entry: StatusLogDTO }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 text-xs text-muted-foreground">
      <div className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
      <div>
        <span className="font-medium text-foreground">{entry.changerName}</span>
        {" changed status "}
        {entry.oldStatus && (
          <>
            from <span className="font-medium">{entry.oldStatus}</span>
          </>
        )}
        {" to "}
        <span className="font-medium">{entry.newStatus}</span>
        <span className="ml-2 opacity-50">
          {new Date(entry.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  )
}

export function ChatPanel({
  requestId,
  currentUserId,
  status,
  viewerRole,
  statusLog,
  loadingAction,
  onStatusUpdate,
}: ChatPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("thread")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [revisionLightbox, setRevisionLightbox] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const managerRef = useRef<ChatManager | null>(null)

  useEffect(() => {
    const manager = new ChatManager(requestId, currentUserId, getMessages, sendMessage)
    managerRef.current = manager
    manager
      .fetchMessages()
      .then((msgs) => setMessages(manager.toDisplayMessages(msgs)))
      .catch(() => {})
    manager.startPolling((msgs) => setMessages(manager.toDisplayMessages(msgs)))
    return () => manager.stopPolling()
  }, [requestId, currentUserId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function handleSend() {
    const body = draft.trim()
    if (!body || sending || !managerRef.current) return
    setSending(true)
    try {
      const msg = await managerRef.current.sendMessage(body)
      const [display] = managerRef.current.toDisplayMessages([msg])
      if (display) setMessages((prev) => [...prev, display])
      setDraft("")
    } catch {
      // keep draft for retry
    } finally {
      setSending(false)
    }
  }

  const isPaused = status === REQUEST_STATUS.AWAITING_MATERIALS

  return (
    <div data-testid="chat-panel" className="flex h-full flex-col rounded-md border bg-card">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center gap-1 border-b px-4">
        {(["thread", "activity"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative px-2 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors",
              activeTab === tab
                ? "text-[var(--brand-accent)]"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid={`tab-${tab}`}
          >
            {tab === "thread" ? "Thread" : "Activity"}
            {tab === "thread" && messages.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[9px]">
                {messages.length}
              </Badge>
            )}
            {activeTab === tab && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--brand-accent)]" />
            )}
          </button>
        ))}
        {isPaused && (
          <Badge className="ml-auto bg-cyan-100 text-[10px] text-cyan-700">SLA Paused</Badge>
        )}
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto p-4"
        style={{ minHeight: LAYOUT.detail.chatDefaultHeight }}
      >
        {activeTab === "thread" ? (
          <div className="flex flex-col gap-2.5">
            {messages.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No messages yet. Start the conversation.
              </p>
            )}
            {messages.map((m) => {
              const { text, imageUrl } = parseRevisionMessage(m.body)
              const isRevision = !!imageUrl
              return (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[85%] rounded-xl px-3.5 py-2.5",
                    m.isOwn
                      ? "ml-auto bg-[var(--brand-primary)] text-white"
                      : isRevision
                        ? "mr-auto border border-orange-200 bg-orange-50 text-foreground"
                        : "mr-auto bg-muted text-foreground",
                  )}
                >
                  <div className={cn(
                    "mb-1 flex items-center gap-1.5 text-[10px] font-medium",
                    m.isOwn ? "text-white/60" : "text-muted-foreground",
                  )}>
                    <span>{m.senderName}</span>
                    <span>&middot;</span>
                    <span>{m.senderRole}</span>
                    <span>&middot;</span>
                    <span>{m.formattedTime}</span>
                  </div>
                  {text && <p className="text-sm leading-relaxed">{text}</p>}
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setRevisionLightbox(imageUrl)}
                      className="mt-2 block cursor-pointer overflow-hidden rounded-lg border border-orange-200 bg-white p-1"
                    >
                      <img
                        src={imageUrl}
                        alt="Revision annotations"
                        className="max-h-40 rounded shadow-sm transition-opacity hover:opacity-80"
                      />
                      <span className="mt-1 block text-center text-[10px] font-medium text-orange-600">
                        Click to view full size
                      </span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col">
            {statusLog.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No activity recorded yet.
              </p>
            ) : (
              statusLog.map((entry) => <ActivityItem key={entry.id} entry={entry} />)
            )}
          </div>
        )}
      </div>

      {/* Message input — always visible on thread tab */}
      {activeTab === "thread" && (
        <div className="flex shrink-0 items-center gap-2 border-t px-4 py-2.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder="Type a message..."
            className="flex-1 text-sm"
            data-testid="chat-input"
          />
          <Button
            size="sm"
            disabled={!draft.trim() || sending}
            onClick={() => void handleSend()}
            className="bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent)]/90"
            data-testid="chat-send"
          >
            <Send className="size-4" />
          </Button>
        </div>
      )}

      {/* Revision image lightbox */}
      {revisionLightbox && (
        <RevisionImageModal imageUrl={revisionLightbox} onClose={() => setRevisionLightbox(null)} />
      )}
    </div>
  )
}
