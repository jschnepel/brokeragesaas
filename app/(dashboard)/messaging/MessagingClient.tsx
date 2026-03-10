"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Search, Send, ArrowLeft, Circle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { MOCK_CONTACTS, MOCK_CONVERSATIONS } from "@/lib/data/messaging"
import type { Contact, Message } from "@/lib/data/messaging"

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday"
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

/* ── Messaging Client ────────────────────────────────────────────────────── */

export function MessagingClient() {
  const [contacts] = useState<Contact[]>(MOCK_CONTACTS)
  const [conversations, setConversations] = useState<Record<string, Message[]>>(
    () => ({ ...MOCK_CONVERSATIONS })
  )
  const [activeContactId, setActiveContactId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [mobileShowConversation, setMobileShowConversation] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeContact = useMemo(
    () => contacts.find((c) => c.id === activeContactId) ?? null,
    [contacts, activeContactId]
  )

  const activeMessages = useMemo(
    () => (activeContactId ? conversations[activeContactId] ?? [] : []),
    [conversations, activeContactId]
  )

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts
    const q = searchQuery.toLowerCase()
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)
    )
  }, [contacts, searchQuery])

  // Auto-scroll to bottom on new messages or conversation switch
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [activeMessages.length, activeContactId])

  function handleSelectContact(id: string) {
    setActiveContactId(id)
    setMobileShowConversation(true)
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageInput.trim() || !activeContactId) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: "me",
      senderName: "You",
      body: messageInput.trim(),
      timestamp: new Date().toISOString(),
      isOwn: true,
    }

    setConversations((prev) => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] ?? []), newMessage],
    }))
    setMessageInput("")
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)] overflow-hidden rounded-lg border bg-card">
      {/* ── Left panel (contact list) ──────────────────────────────── */}
      <div
        className={cn(
          "flex w-full flex-col border-r md:w-80 md:shrink-0",
          mobileShowConversation && "hidden md:flex"
        )}
      >
        {/* Search */}
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Contact list */}
        <ScrollArea className="flex-1">
          {filteredContacts.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No contacts found.
            </p>
          ) : (
            <div className="divide-y">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50",
                    activeContactId === contact.id && "bg-accent"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {contact.initials}
                      </AvatarFallback>
                    </Avatar>
                    {contact.online && (
                      <Circle className="absolute -bottom-0.5 -right-0.5 size-3 fill-green-500 text-green-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {contact.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTime(contact.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{contact.role}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {contact.lastMessage}
                    </p>
                  </div>
                  {contact.unread > 0 && (
                    <Badge className="shrink-0 tabular-nums">
                      {contact.unread}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Right panel (conversation) ─────────────────────────────── */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          mobileShowConversation ? "flex" : "hidden md:flex"
        )}
      >
        {activeContact ? (
          <>
            {/* Conversation header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden"
                onClick={() => {
                  setMobileShowConversation(false)
                  setActiveContactId(null)
                }}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {activeContact.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">{activeContact.name}</h3>
                <div className="flex items-center gap-1.5">
                  {activeContact.online && (
                    <Circle className="size-2 fill-green-500 text-green-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {activeContact.online ? "Online" : "Offline"} &middot;{" "}
                    {activeContact.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                {activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col gap-1",
                      msg.isOwn ? "items-end" : "items-start"
                    )}
                  >
                    <div className="flex items-end gap-2">
                      {!msg.isOwn && (
                        <Avatar size="sm">
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                            {activeContact.initials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-xs rounded-lg px-3 py-2 text-sm lg:max-w-md",
                          msg.isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {!msg.isOwn && (
                          <p className="mb-0.5 text-xs font-medium">
                            {msg.senderName}
                          </p>
                        )}
                        <p className="leading-relaxed">{msg.body}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] text-muted-foreground",
                        msg.isOwn ? "mr-1" : "ml-8"
                      )}
                    >
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div className="border-t p-3">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!messageInput.trim()}
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Send className="mx-auto mb-3 size-10 opacity-40" />
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
