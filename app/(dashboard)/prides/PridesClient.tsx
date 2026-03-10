"use client"

import { useState, useMemo } from "react"
import {
  Search,
  ArrowLeft,
  Users,
  Send,
  Calendar,
  Tag,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { BRAND_FONTS } from "@/lib/config"
import {
  PRIDES,
  PRIDE_MESSAGES,
  PRIDE_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ACCENT_COLORS,
  type Pride,
  type PrideCategory,
} from "@/lib/data/prides"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function PridesClient() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<PrideCategory | "all">(
    "all",
  )
  const [selectedPride, setSelectedPride] = useState<Pride | null>(null)
  const [joinedPrides, setJoinedPrides] = useState<Set<string>>(
    () => new Set(["mkt", "tech"]),
  )
  const [messageInput, setMessageInput] = useState("")

  const filteredPrides = useMemo(() => {
    return PRIDES.filter((p) => {
      const matchesSearch =
        search.length === 0 ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        categoryFilter === "all" || p.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [search, categoryFilter])

  const toggleJoin = (prideId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setJoinedPrides((prev) => {
      const next = new Set(prev)
      if (next.has(prideId)) {
        next.delete(prideId)
      } else {
        next.add(prideId)
      }
      return next
    })
  }

  const prideMessages = useMemo(() => {
    if (!selectedPride) return []
    return PRIDE_MESSAGES.filter((m) => m.prideId === selectedPride.id)
  }, [selectedPride])

  /* ── Detail View ──────────────────────────────────────────── */
  if (selectedPride) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedPride(null)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: BRAND_FONTS.display }}
            >
              {selectedPride.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className={CATEGORY_COLORS[selectedPride.category]}
              >
                {CATEGORY_LABELS[selectedPride.category]}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="size-3.5" />
                {selectedPride.memberCount} members
              </span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList>
            <TabsTrigger value="chat">
              <MessageSquare className="mr-1.5 size-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="mr-1.5 size-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="about">
              <Tag className="mr-1.5 size-4" />
              About
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-96 p-4">
                  <div className="space-y-4">
                    {prideMessages.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No messages yet. Start the conversation!
                      </p>
                    )}
                    {prideMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-muted text-xs">
                            {msg.senderInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium">
                              {msg.sender}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-foreground/90">
                            {msg.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Separator />
                <div className="flex items-center gap-2 p-3">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && messageInput.trim()) {
                        setMessageInput("")
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    disabled={!messageInput.trim()}
                    onClick={() => setMessageInput("")}
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {selectedPride.members.map((member) => (
                    <div
                      key={member}
                      className="flex items-center gap-2 rounded-md border p-2"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-muted text-xs">
                          {getInitials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm">{member}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="mt-4">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Description
                  </h3>
                  <p className="mt-1 text-sm">{selectedPride.description}</p>
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Category:</span>
                    <Badge
                      variant="secondary"
                      className={CATEGORY_COLORS[selectedPride.category]}
                    >
                      {CATEGORY_LABELS[selectedPride.category]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Members:</span>
                    <span className="font-medium">
                      {selectedPride.memberCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {formatDate(selectedPride.createdAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  /* ── Grid View ────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: BRAND_FONTS.display }}
        >
          Prides
        </h1>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search prides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={categoryFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setCategoryFilter("all")}
        >
          All
        </Button>
        {PRIDE_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={categoryFilter === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </Button>
        ))}
      </div>

      {/* Prides Grid */}
      {filteredPrides.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="mb-2 size-10" />
          <p className="text-sm">No prides match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrides.map((pride) => {
            const isJoined = joinedPrides.has(pride.id)
            return (
              <button
                key={pride.id}
                type="button"
                onClick={() => setSelectedPride(pride)}
                className="cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg transition-shadow hover:shadow-md"
              >
                <Card className="overflow-hidden h-full">
                  {/* Accent bar */}
                  <div
                    className={cn(
                      "h-1.5",
                      CATEGORY_ACCENT_COLORS[pride.category],
                    )}
                  />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle
                        className="text-base"
                        style={{ fontFamily: BRAND_FONTS.display }}
                      >
                        {pride.name}
                      </CardTitle>
                      <Button
                        variant={isJoined ? "secondary" : "default"}
                        size="sm"
                        className="shrink-0 text-xs"
                        onClick={(e) => toggleJoin(pride.id, e)}
                      >
                        {isJoined ? "Joined" : "Join"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {pride.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={CATEGORY_COLORS[pride.category]}
                      >
                        {CATEGORY_LABELS[pride.category]}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3.5" />
                        {pride.memberCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
