"use client"

import { useState, useMemo } from "react"
import {
  Megaphone,
  Calendar,
  BookOpen,
  Users,
  Video,
  ExternalLink,
  Search,
  Clock,
  MapPin,
  FileText,
  Palette,
  Camera,
  Share2,
  ClipboardCheck,
  GraduationCap,
  Mail,
  Send,
  Sparkles,
  Link,
  LayoutDashboard,
  HelpCircle,
  MessageSquare,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Announcement } from "@/lib/models"
import {
  DEN_ANNOUNCEMENTS,
  DEN_EVENTS,
  DEN_RESOURCES,
  DEN_PRIDES_PREVIEW,
  LIVE_MEETING,
} from "@/lib/data/lyonsden"
import type { AnnouncementCategory, DenResource } from "@/lib/data/lyonsden"

// ── Icon Resolver ──────────────────────────────────────────

const RESOURCE_ICONS: Record<string, React.ElementType> = {
  Palette,
  FileText,
  Camera,
  BookOpen,
  Share2,
  ClipboardCheck,
  GraduationCap,
  Mail,
  Send,
}

function ResourceIcon({ name }: { name: string }) {
  const Icon = RESOURCE_ICONS[name] ?? FileText
  return <Icon className="size-5 text-[var(--brand-accent)]" />
}

// ── Event Type Colors ──────────────────────────────────────

const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: "bg-blue-100 text-blue-700",
  training: "bg-emerald-100 text-emerald-700",
  social: "bg-amber-100 text-amber-700",
  deadline: "bg-red-100 text-red-700",
}

// ── All Categories ─────────────────────────────────────────

const ALL_CATEGORIES: AnnouncementCategory[] = [
  "Company News",
  "Training",
  "Market Update",
  "Social",
  "Recognition",
]

// ── Sub-Components ─────────────────────────────────────────

function HeroSection({ featured }: { featured: Announcement }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* Featured Announcement */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Badge className={featured.categoryColor}>
              {featured.category}
            </Badge>
            {featured.isNew && (
              <Badge variant="outline" className="gap-1">
                <Sparkles className="size-3" />
                New
              </Badge>
            )}
          </div>
          <h2
            className="text-2xl font-bold tracking-tight mb-3"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            {featured.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            {featured.excerpt}
          </p>
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback className="bg-[var(--brand-primary)] text-white text-xs">
                {featured.authorInitials}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <span className="font-medium">{featured.author}</span>
              <span className="text-muted-foreground"> · {featured.timeAgo}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Meeting Indicator */}
      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
              </span>
              <Badge className="bg-emerald-100 text-emerald-700">
                Live Now
              </Badge>
            </div>
            <h3
              className="text-lg font-bold mb-1"
              style={{ fontFamily: "var(--brand-font-display)" }}
            >
              {LIVE_MEETING.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-1">
              Hosted by {LIVE_MEETING.host}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
              <Users className="size-3.5" />
              <span>{LIVE_MEETING.participants.length} participants</span>
            </div>
          </div>
          <Button
            className="w-full gap-2 bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)]"
            render={<a href={LIVE_MEETING.zoomUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <Video className="size-4" />
            Join Meeting
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function FeedTab() {
  const [filter, setFilter] = useState<AnnouncementCategory | "All">("All")
  const [search, setSearch] = useState("")

  const announcements = useMemo(() => {
    return Announcement.fromDTOs(DEN_ANNOUNCEMENTS)
  }, [])

  const filtered = useMemo(() => {
    return announcements.filter((a) => {
      if (filter !== "All" && a.category !== filter) return false
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [announcements, filter, search])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "All" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("All")}
          >
            All
          </Button>
          {ALL_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No announcements match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((a) => (
            <Card key={a.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={a.categoryColor}>{a.category}</Badge>
                  {a.isNew && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Sparkles className="size-3" />
                      New
                    </Badge>
                  )}
                </div>
                <h3
                  className="font-bold mb-2 line-clamp-2"
                  style={{ fontFamily: "var(--brand-font-display)" }}
                >
                  {a.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {a.excerpt}
                </p>
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-[var(--brand-primary)] text-white text-xs">
                      {a.authorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {a.author} · {a.timeAgo}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function EventsTab() {
  return (
    <div className="space-y-3">
      {DEN_EVENTS.map((evt) => {
        const evtDate = new Date(evt.date)
        const dayNum = evtDate.getDate()
        const monthStr = evtDate.toLocaleDateString("en-US", { month: "short" })
        const typeColor = EVENT_TYPE_COLORS[evt.type] ?? "bg-secondary text-secondary-foreground"

        return (
          <Card key={evt.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              {/* Date Badge */}
              <div className="flex flex-col items-center justify-center rounded-lg bg-[var(--brand-surface)] px-3 py-2 min-w-[56px]">
                <span
                  className="text-xl font-bold text-[var(--brand-primary)]"
                  style={{ fontFamily: "var(--brand-font-display)" }}
                >
                  {dayNum}
                </span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {monthStr}
                </span>
              </div>

              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{evt.title}</h3>
                  <Badge className={typeColor}>{evt.type}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {evt.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {evt.location}
                  </span>
                  {evt.attendees > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {evt.attendees} attending
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ResourcesTab() {
  const grouped = useMemo(() => {
    const map = new Map<string, DenResource[]>()
    for (const res of DEN_RESOURCES) {
      const list = map.get(res.category) ?? []
      list.push(res)
      map.set(res.category, list)
    }
    return Array.from(map.entries())
  }, [])

  return (
    <div className="space-y-6">
      {grouped.map(([category, resources]) => (
        <div key={category}>
          <h3
            className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3"
            style={{ fontFamily: "var(--brand-font-body)" }}
          >
            {category}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((res) => (
              <Card key={res.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-surface)]">
                      <ResourceIcon name={res.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1">{res.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {res.description}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        render={<a href={res.url} />}
                      >
                        <ExternalLink className="size-3" />
                        Open
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Sidebar() {
  const quickLinks = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Submit Request", icon: FileText, href: "/intake" },
    { label: "Help Center", icon: HelpCircle, href: "#" },
    { label: "IT Support", icon: MessageSquare, href: "#" },
    { label: "Company Directory", icon: Users, href: "#" },
  ]

  return (
    <div className="space-y-6">
      {/* Active Groups */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="size-4 text-[var(--brand-accent)]" />
            Active Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEN_PRIDES_PREVIEW.map((pride) => (
            <div
              key={pride.id}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 cursor-pointer"
            >
              <div className={cn("w-1 h-8 rounded-full", pride.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pride.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pride.memberCount} members
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Link className="size-4 text-[var(--brand-accent)]" />
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {quickLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center gap-3 rounded-lg p-2 text-sm transition-colors hover:bg-muted/50"
            >
              <link.icon className="size-4 text-muted-foreground" />
              {link.label}
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────

export function LyonsDenClient() {
  const announcements = useMemo(() => Announcement.fromDTOs(DEN_ANNOUNCEMENTS), [])
  const featured = announcements.find((a) => a.featured) ?? announcements[0]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--brand-font-display)" }}
        >
          Lyon&apos;s Den
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your brokerage intranet hub — announcements, events, and resources
        </p>
      </div>

      {/* Hero */}
      <HeroSection featured={featured} />

      {/* Main Content + Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Tabs Content */}
        <Tabs defaultValue="feed">
          <TabsList>
            <TabsTrigger value="feed">
              <Megaphone className="size-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="size-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="resources">
              <BookOpen className="size-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <FeedTab />
          </TabsContent>
          <TabsContent value="events">
            <EventsTab />
          </TabsContent>
          <TabsContent value="resources">
            <ResourcesTab />
          </TabsContent>
        </Tabs>

        {/* Sidebar */}
        <Sidebar />
      </div>
    </div>
  )
}
