"use client"

import { useState, useMemo } from "react"
import {
  Inbox,
  Send,
  FileText,
  Star,
  Trash2,
  Search,
  Archive,
  Mail,
  MailOpen,
  Reply,
  Forward,
  Paperclip,
  ArrowLeft,
  Plus,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { MOCK_EMAILS, EMAIL_FOLDERS } from "@/lib/data/email"
import type { EmailThread } from "@/lib/data/email"

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const FOLDER_ICONS = {
  inbox: Inbox,
  send: Send,
  file: FileText,
  star: Star,
  trash: Trash2,
} as const

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/* ── Email Client ────────────────────────────────────────────────────────── */

export function EmailClient() {
  const [emails, setEmails] = useState<EmailThread[]>(MOCK_EMAILS)
  const [activeFolder, setActiveFolder] = useState("Inbox")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [composeOpen, setComposeOpen] = useState(false)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  const selectedEmail = useMemo(
    () => emails.find((e) => e.id === selectedId) ?? null,
    [emails, selectedId]
  )

  const filteredEmails = useMemo(() => {
    let list = emails

    if (activeFolder === "Starred") {
      list = list.filter((e) => e.starred)
    } else if (activeFolder === "Drafts") {
      list = list.filter((e) => e.labels.includes("Drafts"))
    } else if (activeFolder === "Sent") {
      list = list.filter((e) => e.labels.includes("Sent"))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.from.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q)
      )
    }

    return list
  }, [emails, activeFolder, search])

  const folderCounts = useMemo(() => {
    const unreadInbox = emails.filter((e) => !e.read && e.labels.includes("Inbox")).length
    const starred = emails.filter((e) => e.starred).length
    const drafts = emails.filter((e) => e.labels.includes("Drafts")).length
    return { Inbox: unreadInbox, Starred: starred, Drafts: drafts, Sent: 0, Trash: 0 }
  }, [emails])

  function handleSelectEmail(id: string) {
    setSelectedId(id)
    setMobileShowDetail(true)
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, read: true } : e))
    )
  }

  function handleToggleStar(id: string) {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e))
    )
  }

  function handleToggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleBatchMarkRead() {
    setEmails((prev) =>
      prev.map((e) => (checkedIds.has(e.id) ? { ...e, read: true } : e))
    )
    setCheckedIds(new Set())
  }

  function handleBatchDelete() {
    setEmails((prev) => prev.filter((e) => !checkedIds.has(e.id)))
    setCheckedIds(new Set())
    setSelectedId(null)
  }

  function handleBatchArchive() {
    setEmails((prev) =>
      prev.map((e) =>
        checkedIds.has(e.id)
          ? { ...e, labels: e.labels.filter((l) => l !== "Inbox") }
          : e
      )
    )
    setCheckedIds(new Set())
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)] gap-0 overflow-hidden rounded-lg border bg-card">
      {/* ── Left sidebar (folders) ─────────────────────────────────── */}
      <div className="hidden w-56 shrink-0 flex-col border-r md:flex">
        <div className="p-3">
          <Button className="w-full" onClick={() => setComposeOpen(true)}>
            <Plus className="size-4" />
            Compose
          </Button>
        </div>
        <Separator />
        <nav className="flex-1 space-y-0.5 p-2">
          {EMAIL_FOLDERS.map((folder) => {
            const Icon = FOLDER_ICONS[folder.icon]
            const count = folderCounts[folder.name as keyof typeof folderCounts] ?? 0
            const isActive = activeFolder === folder.name
            return (
              <button
                key={folder.name}
                onClick={() => setActiveFolder(folder.name)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1 text-left">{folder.name}</span>
                {count > 0 && (
                  <Badge variant="secondary" className="text-xs tabular-nums">
                    {count}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
        <Separator />
        <div className="p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Labels
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-blue-500" />
              Work
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-green-500" />
              Personal
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-amber-500" />
              Urgent
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle column (email list) ─────────────────────────────── */}
      <div
        className={cn(
          "flex w-full flex-col border-r md:w-96 md:shrink-0",
          mobileShowDetail && "hidden md:flex"
        )}
      >
        {/* Search + mobile compose */}
        <div className="flex items-center gap-2 border-b p-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            size="icon"
            variant="outline"
            className="md:hidden"
            onClick={() => setComposeOpen(true)}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {/* Batch actions */}
        {checkedIds.size > 0 && (
          <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {checkedIds.size} selected
            </span>
            <div className="ml-auto flex gap-1">
              <Button size="sm" variant="ghost" onClick={handleBatchArchive}>
                <Archive className="size-3.5" />
                Archive
              </Button>
              <Button size="sm" variant="ghost" onClick={handleBatchDelete}>
                <Trash2 className="size-3.5" />
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={handleBatchMarkRead}>
                <MailOpen className="size-3.5" />
                Mark Read
              </Button>
            </div>
          </div>
        )}

        {/* Email list */}
        <ScrollArea className="flex-1">
          {filteredEmails.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No emails found.
            </p>
          ) : (
            <div className="divide-y">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/50",
                    !email.read && "bg-muted/30",
                    selectedId === email.id && "bg-accent"
                  )}
                  onClick={() => handleSelectEmail(email.id)}
                >
                  <div className="flex shrink-0 flex-col items-center gap-2 pt-0.5">
                    <Checkbox
                      checked={checkedIds.has(email.id)}
                      onCheckedChange={() => handleToggleCheck(email.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStar(email.id)
                      }}
                      className="text-muted-foreground hover:text-amber-500"
                    >
                      <Star
                        className={cn(
                          "size-3.5",
                          email.starred && "fill-amber-500 text-amber-500"
                        )}
                      />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-sm",
                          !email.read ? "font-semibold" : "font-normal"
                        )}
                      >
                        {email.from}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(email.date)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "truncate text-sm",
                        !email.read ? "font-medium" : "text-muted-foreground"
                      )}
                    >
                      {email.subject}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {email.preview}
                    </p>
                    {email.attachments.length > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="size-3" />
                        <span>{email.attachments.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Right column (email detail) ────────────────────────────── */}
      <div
        className={cn(
          "flex-1 flex-col",
          mobileShowDetail ? "flex" : "hidden md:flex"
        )}
      >
        {selectedEmail ? (
          <div className="flex h-full flex-col">
            {/* Mobile back button */}
            <div className="flex items-center gap-2 border-b p-3 md:hidden">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setMobileShowDetail(false)
                  setSelectedId(null)
                }}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <span className="text-sm font-medium">Back</span>
            </div>

            {/* Email header */}
            <div className="border-b p-4 lg:p-6">
              <h2 className="font-[family-name:var(--brand-font-display)] text-xl font-semibold lg:text-2xl">
                {selectedEmail.subject}
              </h2>
              <div className="mt-4 flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {selectedEmail.fromInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{selectedEmail.from}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatFullDate(selectedEmail.date)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    To: {selectedEmail.to}
                  </p>
                </div>
              </div>
            </div>

            {/* Email body */}
            <ScrollArea className="flex-1 p-4 lg:p-6">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {selectedEmail.body}
              </div>

              {/* Attachments */}
              {selectedEmail.attachments.length > 0 && (
                <div className="mt-6">
                  <Separator className="mb-4" />
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Attachments
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((file) => (
                      <Card
                        key={file}
                        className="flex items-center gap-2 px-3 py-2"
                      >
                        <Paperclip className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">{file}</span>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Reply / Forward */}
            <div className="flex gap-2 border-t p-4">
              <Button variant="outline" className="flex-1">
                <Reply className="size-4" />
                Reply
              </Button>
              <Button variant="outline" className="flex-1">
                <Forward className="size-4" />
                Forward
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Mail className="mx-auto mb-3 size-10 opacity-40" />
              <p className="text-sm">Select an email to read</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Compose Dialog ─────────────────────────────────────────── */}
      <ComposeDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  )
}

/* ── Compose Dialog ──────────────────────────────────────────────────────── */

function ComposeDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    // Mock send — in production this would call a server action
    setTo("")
    setSubject("")
    setBody("")
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSend} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="compose-to">To</Label>
            <Input
              id="compose-to"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="compose-subject">Subject</Label>
            <Input
              id="compose-subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="compose-body">Message</Label>
            <Textarea
              id="compose-body"
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Discard
            </DialogClose>
            <Button type="submit" disabled={!to.trim() || !subject.trim()}>
              <Send className="size-4" />
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
