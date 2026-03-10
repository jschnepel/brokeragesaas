"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Megaphone,
  Calendar,
  Users,
  Video,
  ExternalLink,
  Search,
  Clock,
  MapPin,
  FileText,
  TrendingUp,
  Pin,
  Eye,
  MessageCircle,
  ThumbsUp,
  Heart,
  PartyPopper,
  Lightbulb,
  HelpCircle,
  Send,
  Award,
  BarChart3,
  Download,
  Image as ImageIcon,
  Smile,
  Flame,
  Bookmark,
  MoreHorizontal,
  Sparkles,
  Trophy,
  ArrowRight,
  Hash,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  DEN_FEED,
  DEN_EVENTS,
  DEN_PRIDES_PREVIEW,
  DEN_TRENDING,
  LIVE_MEETING,
} from "@/lib/data/lyonsden"
import type { FeedPost, Comment, ReactionType, PostType } from "@/lib/data/lyonsden"

// ── Helpers ──────────────────────────────────────────────────

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

const REACTION_CONFIG: Record<ReactionType, { icon: React.ElementType; label: string; activeColor: string; bgColor: string; emoji: string }> = {
  like: { icon: ThumbsUp, label: "Like", activeColor: "text-blue-600", bgColor: "bg-blue-100", emoji: "👍" },
  love: { icon: Heart, label: "Love", activeColor: "text-red-500", bgColor: "bg-red-100", emoji: "❤️" },
  celebrate: { icon: PartyPopper, label: "Celebrate", activeColor: "text-green-600", bgColor: "bg-green-100", emoji: "🎉" },
  insightful: { icon: Lightbulb, label: "Insightful", activeColor: "text-amber-500", bgColor: "bg-amber-100", emoji: "💡" },
  curious: { icon: HelpCircle, label: "Curious", activeColor: "text-purple-500", bgColor: "bg-purple-100", emoji: "🤔" },
}

const POST_TYPE_CONFIG: Record<PostType, { label: string; badgeClass: string; icon: React.ElementType; accentBorder?: string; accentBg?: string }> = {
  announcement: { label: "Announcement", badgeClass: "bg-blue-50 text-blue-700 border-blue-200", icon: Megaphone, accentBorder: "border-l-blue-500" },
  shoutout: { label: "Shoutout", badgeClass: "bg-amber-50 text-amber-700 border-amber-200", icon: Award, accentBorder: "border-l-amber-500", accentBg: "bg-gradient-to-r from-amber-50/80 via-transparent to-transparent" },
  market: { label: "Market Update", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: BarChart3, accentBorder: "border-l-emerald-500" },
  event: { label: "Event", badgeClass: "bg-purple-50 text-purple-700 border-purple-200", icon: Calendar, accentBorder: "border-l-purple-500" },
  document: { label: "Document", badgeClass: "bg-slate-50 text-slate-700 border-slate-200", icon: FileText, accentBorder: "border-l-slate-400" },
  poll: { label: "Poll", badgeClass: "bg-pink-50 text-pink-700 border-pink-200", icon: BarChart3, accentBorder: "border-l-pink-500" },
}

// ── Hero Banner ─────────────────────────────────────────────

function HeroBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-xl border"
      style={{ background: "linear-gradient(135deg, var(--brand-primary) 0%, #1a3a6b 50%, #0F2B4F 100%)" }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 size-64 rounded-full opacity-10" style={{ background: "var(--brand-accent)" }} />
      <div className="absolute -bottom-16 -left-16 size-48 rounded-full opacity-10" style={{ background: "var(--brand-accent)" }} />
      <div className="absolute top-1/2 right-1/4 size-32 rounded-full opacity-5" style={{ background: "var(--brand-accent)" }} />

      <div className="relative z-10 flex items-center justify-between gap-6 px-8 py-7">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-10 items-center justify-center rounded-lg" style={{ background: "rgba(201, 169, 110, 0.2)" }}>
              <Flame className="size-5" style={{ color: "var(--brand-accent)" }} />
            </div>
            <h1
              className="text-2xl font-bold tracking-tight text-white"
              style={{ fontFamily: "var(--brand-font-display)" }}
            >
              Lyon&apos;s Den
            </h1>
          </div>
          <p className="text-sm text-white/60 max-w-md">
            Your brokerage community — announcements, shoutouts, market intel, and everything happening at Russ Lyon.
          </p>
        </div>

        {/* Quick stats */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: "Active Members", value: "186", icon: Users },
            { label: "Posts This Week", value: "24", icon: MessageCircle },
            { label: "Engagement", value: "94%", icon: TrendingUp },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <stat.icon className="size-3.5 text-white/40" />
                <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--brand-font-display)" }}>
                  {stat.value}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.1em] text-white/40 font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Compose Box ─────────────────────────────────────────────

function ComposeBox() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback className="text-xs text-white" style={{ background: "var(--brand-primary)" }}>
              YC
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div
              className="rounded-full border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground cursor-pointer transition-colors hover:bg-muted/60"
            >
              Share something with the team...
            </div>
            <div className="mt-3 flex items-center gap-1">
              {[
                { icon: ImageIcon, label: "Photo", color: "text-emerald-600" },
                { icon: Calendar, label: "Event", color: "text-purple-600" },
                { icon: FileText, label: "Document", color: "text-blue-600" },
                { icon: Award, label: "Shoutout", color: "text-amber-600" },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60"
                >
                  <action.icon className={cn("size-4", action.color)} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Reaction Bar ────────────────────────────────────────────

function ReactionBar({ post, onToggle }: { post: FeedPost; onToggle: (postId: string, type: ReactionType) => void }) {
  const [showPicker, setShowPicker] = useState(false)
  const totalReactions = post.reactions.reduce((sum, r) => sum + r.count, 0)
  const userReaction = post.reactions.find((r) => r.reacted)

  return (
    <div className="px-5">
      {/* Reaction summary row */}
      {(totalReactions > 0 || post.comments.length > 0 || post.views > 0) && (
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-1.5">
            {/* Stacked emoji badges */}
            <div className="flex -space-x-1">
              {post.reactions
                .filter((r) => r.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
                .map((r) => {
                  const config = REACTION_CONFIG[r.type]
                  const Icon = config.icon
                  return (
                    <span
                      key={r.type}
                      className={cn(
                        "inline-flex size-[22px] items-center justify-center rounded-full border-2 border-card",
                        config.bgColor, config.activeColor,
                      )}
                    >
                      <Icon className="size-3" />
                    </span>
                  )
                })}
            </div>
            {totalReactions > 0 && (
              <span className="text-xs text-muted-foreground font-medium">{formatNumber(totalReactions)}</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {post.comments.length > 0 && (
              <span className="hover:underline cursor-pointer hover:text-foreground transition-colors">
                {post.comments.length} comment{post.comments.length !== 1 ? "s" : ""}
              </span>
            )}
            {post.views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="size-3 opacity-60" />
                {formatNumber(post.views)} views
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action buttons row */}
      <div className="relative">
        <Separator />
        <div className="grid grid-cols-3 py-1">
          <button
            type="button"
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold transition-all hover:bg-muted/60",
              userReaction ? REACTION_CONFIG[userReaction.type].activeColor : "text-muted-foreground",
            )}
            onClick={() => onToggle(post.id, userReaction?.type ?? "like")}
            onMouseEnter={() => setShowPicker(true)}
            onMouseLeave={() => setShowPicker(false)}
          >
            {userReaction ? (
              <>
                {(() => { const Icon = REACTION_CONFIG[userReaction.type].icon; return <Icon className="size-[18px]" /> })()}
                {REACTION_CONFIG[userReaction.type].label}
              </>
            ) : (
              <>
                <ThumbsUp className="size-[18px]" />
                Like
              </>
            )}
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold text-muted-foreground transition-all hover:bg-muted/60"
          >
            <MessageCircle className="size-[18px]" />
            Comment
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-semibold text-muted-foreground transition-all hover:bg-muted/60"
          >
            <Send className="size-[18px]" />
            Share
          </button>
        </div>

        {/* Reaction picker flyout */}
        {showPicker && (
          <div
            className="absolute -top-14 left-0 z-10 flex gap-1 rounded-full border bg-card px-3 py-2 shadow-xl"
            onMouseEnter={() => setShowPicker(true)}
            onMouseLeave={() => setShowPicker(false)}
          >
            {(Object.entries(REACTION_CONFIG) as [ReactionType, typeof REACTION_CONFIG[ReactionType]][]).map(([type, config]) => {
              const isActive = post.reactions.find((r) => r.type === type)?.reacted
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => { onToggle(post.id, type); setShowPicker(false) }}
                  className={cn(
                    "group/reaction flex size-10 items-center justify-center rounded-full transition-all hover:scale-[1.35] hover:-translate-y-1",
                    isActive ? cn(config.bgColor, config.activeColor) : "hover:bg-muted",
                  )}
                  title={config.label}
                >
                  <span className="text-lg">{config.emoji}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Comment Section ─────────────────────────────────────────

function CommentSection({ comments }: { comments: Comment[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? comments : comments.slice(0, 2)
  const hasMore = comments.length > 2

  if (comments.length === 0) return null

  return (
    <div className="px-5 pb-4 pt-2">
      <Separator className="mb-3" />
      {hasMore && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mb-3 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          View all {comments.length} comments
        </button>
      )}
      <div className="space-y-3.5">
        {visible.map((c) => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar size="sm">
              <AvatarFallback className="text-[10px] text-white" style={{ background: "var(--brand-primary)" }}>
                {c.authorInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="rounded-xl bg-muted/50 px-3.5 py-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-bold">{c.authorName}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{c.authorRole}</span>
                </div>
                <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/90">{c.body}</p>
              </div>
              <div className="mt-1 flex items-center gap-3.5 px-2 text-[11px] text-muted-foreground">
                <button type="button" className="font-bold hover:text-foreground transition-colors">Like</button>
                <span className="text-muted-foreground/30">|</span>
                <button type="button" className="font-bold hover:text-foreground transition-colors">Reply</button>
                <span className="text-muted-foreground/30">|</span>
                <span>{timeAgo(c.timestamp)}</span>
                {c.likes > 0 && (
                  <span className="ml-auto flex items-center gap-1 text-blue-600">
                    <ThumbsUp className="size-2.5" />
                    {c.likes}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {expanded && hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-3 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          Show less
        </button>
      )}

      {/* Inline reply input */}
      <div className="mt-3 flex items-center gap-2.5">
        <Avatar size="sm">
          <AvatarFallback className="text-[10px] text-white" style={{ background: "var(--brand-primary)" }}>
            YC
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex items-center gap-2 rounded-full border bg-muted/30 px-3.5 py-1.5">
          <input
            type="text"
            placeholder="Write a comment..."
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center gap-0.5">
            <button type="button" className="rounded-full p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <Smile className="size-4" />
            </button>
            <button type="button" className="rounded-full p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <ImageIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Post Type-Specific Content ──────────────────────────────

function EventBlock({ post }: { post: FeedPost }) {
  if (!post.eventDate) return null
  const date = new Date(post.eventDate)
  return (
    <div className="mx-5 mb-4 overflow-hidden rounded-xl border">
      {/* Purple gradient header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">
              {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--brand-font-display)" }}>
              {post.eventTime}
            </p>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-2xl font-bold text-white leading-none" style={{ fontFamily: "var(--brand-font-display)" }}>
              {date.getDate()}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/80 font-semibold">
              {date.toLocaleDateString("en-US", { month: "short" })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 bg-muted/30 px-5 py-3">
        {post.eventLocation && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 text-purple-500" />
            {post.eventLocation}
          </span>
        )}
        {post.eventAttendees != null && post.eventAttendees > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-3.5 text-purple-500" />
            {post.eventAttendees} attending
          </span>
        )}
        <Button size="sm" className="ml-auto gap-1.5 bg-purple-600 text-white hover:bg-purple-700">
          <Calendar className="size-3.5" />
          RSVP
        </Button>
      </div>
    </div>
  )
}

function DocumentBlock({ post }: { post: FeedPost }) {
  if (!post.documentName) return null
  return (
    <div className="mx-5 mb-4 flex items-center gap-4 rounded-xl border bg-gradient-to-r from-red-50 to-transparent px-5 py-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-100 shadow-sm">
        <FileText className="size-6 text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{post.documentName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{post.documentType ?? "Document"} &middot; Shared {timeAgo(post.timestamp)}</p>
      </div>
      <Button variant="outline" size="sm" className="shrink-0 gap-1.5 font-semibold">
        <Download className="size-3.5" />
        Download
      </Button>
    </div>
  )
}

function ShoutoutHeader({ post }: { post: FeedPost }) {
  if (post.type !== "shoutout") return null
  return (
    <div
      className="mx-5 mb-3 flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.04) 100%)" }}
    >
      <div className="flex size-9 items-center justify-center rounded-full" style={{ background: "rgba(201,169,110,0.2)" }}>
        <Trophy className="size-4" style={{ color: "var(--brand-accent)" }} />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--brand-accent)" }}>
          Recognition
        </p>
        <p className="text-xs text-muted-foreground">Give this post a reaction to celebrate!</p>
      </div>
    </div>
  )
}

// ── Feed Post Card ──────────────────────────────────────────

function FeedPostCard({
  post,
  onReactionToggle,
}: {
  post: FeedPost
  onReactionToggle: (postId: string, type: ReactionType) => void
}) {
  const config = POST_TYPE_CONFIG[post.type]
  const TypeIcon = config.icon

  return (
    <Card className={cn(
      "overflow-hidden border-l-[3px] transition-all hover:shadow-lg",
      config.accentBorder,
      post.pinned && "ring-1 ring-[var(--brand-accent)]/20",
    )}>
      {/* Pinned banner */}
      {post.pinned && (
        <div className="flex items-center gap-1.5 px-5 pt-3 pb-0">
          <Pin className="size-3" style={{ color: "var(--brand-accent)" }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--brand-accent)" }}>
            Pinned Post
          </span>
        </div>
      )}

      {/* Author header */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-0">
        <Avatar className="size-11 ring-2 ring-muted/50">
          <AvatarFallback className="text-sm text-white font-semibold" style={{ background: "var(--brand-primary)" }}>
            {post.authorInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold hover:underline cursor-pointer">{post.authorName}</span>
            <Badge variant="outline" className={cn("gap-1 text-[10px] font-semibold border px-1.5 py-0", config.badgeClass)}>
              <TypeIcon className="size-2.5" />
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <span className="font-medium">{post.authorRole}</span>
            <span className="opacity-30">&bull;</span>
            <span>{timeAgo(post.timestamp)}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button type="button" className="rounded-full p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground">
            <Bookmark className="size-4" />
          </button>
          <button type="button" className="rounded-full p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground">
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>

      {/* Shoutout special treatment */}
      {post.type === "shoutout" && <div className="pt-3"><ShoutoutHeader post={post} /></div>}

      {/* Content body */}
      <div className={cn("px-5 pb-3", post.type === "shoutout" ? "pt-0" : "pt-3")}>
        {post.title && (
          <h3
            className="text-[17px] font-bold leading-snug mb-2"
            style={{ fontFamily: "var(--brand-font-display)" }}
          >
            {post.title}
          </h3>
        )}
        <p className="text-[14px] leading-[1.65] text-foreground/80 whitespace-pre-line">
          {post.body}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground cursor-pointer transition-colors hover:bg-muted hover:text-foreground"
              >
                <Hash className="size-2.5 opacity-50" />
                {tag.replace(/\s/g, "")}
              </span>
            ))}
          </div>
        )}

        {/* Link CTA */}
        {post.linkUrl && post.linkLabel && (
          <a
            href={post.linkUrl}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
            style={{ color: "var(--brand-accent)", borderColor: "rgba(201,169,110,0.3)" }}
          >
            {post.linkLabel}
            <ArrowRight className="size-3.5" />
          </a>
        )}
      </div>

      {/* Type-specific blocks */}
      <EventBlock post={post} />
      <DocumentBlock post={post} />

      {/* Reactions + Actions */}
      <ReactionBar post={post} onToggle={onReactionToggle} />

      {/* Comments */}
      <CommentSection comments={post.comments} />
    </Card>
  )
}

// ── Sidebar Components ──────────────────────────────────────

function LiveMeetingCard() {
  return (
    <Card className="overflow-hidden border-emerald-200">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-white" />
          </span>
          <span className="text-xs font-bold text-white uppercase tracking-wider">Live Now</span>
        </div>
      </div>
      <CardContent className="p-4">
        <h4 className="text-sm font-bold mb-1" style={{ fontFamily: "var(--brand-font-display)" }}>
          {LIVE_MEETING.title}
        </h4>
        <p className="text-xs text-muted-foreground mb-2">
          Hosted by {LIVE_MEETING.host}
        </p>
        <div className="flex items-center gap-2 mb-3">
          <AvatarGroup>
            {LIVE_MEETING.participants.slice(0, 4).map((name) => (
              <Avatar key={name} size="sm">
                <AvatarFallback className="text-[9px] text-white" style={{ background: "var(--brand-primary)" }}>
                  {name.split(" ").map((w) => w[0]).join("")}
                </AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <span className="text-[11px] text-muted-foreground font-medium">
            {LIVE_MEETING.participants.length} in meeting
          </span>
        </div>
        <Button
          size="sm"
          className="w-full gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
          render={<a href={LIVE_MEETING.zoomUrl} target="_blank" rel="noopener noreferrer" />}
        >
          <Video className="size-4" />
          Join Meeting
        </Button>
      </CardContent>
    </Card>
  )
}

function UpcomingEventsCard() {
  const upcoming = DEN_EVENTS
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  const EVENT_TYPE_STYLES: Record<string, { dot: string; bg: string }> = {
    meeting: { dot: "bg-blue-500", bg: "bg-blue-50" },
    training: { dot: "bg-emerald-500", bg: "bg-emerald-50" },
    social: { dot: "bg-amber-500", bg: "bg-amber-50" },
    deadline: { dot: "bg-red-500", bg: "bg-red-50" },
  }

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Calendar className="size-4" style={{ color: "var(--brand-accent)" }} />
            Upcoming
          </div>
          <button type="button" className="text-[11px] font-semibold hover:underline transition-colors" style={{ color: "var(--brand-accent)" }}>
            View All
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-1">
        {upcoming.map((evt) => {
          const styles = EVENT_TYPE_STYLES[evt.type] ?? { dot: "bg-gray-400", bg: "bg-gray-50" }
          return (
            <div
              key={evt.id}
              className={cn(
                "flex items-start gap-3 rounded-lg p-2.5 transition-all hover:shadow-sm cursor-pointer",
                styles.bg,
              )}
            >
              <div className="flex flex-col items-center pt-0.5">
                <span className={cn("size-2 rounded-full", styles.dot)} />
                <span className="mt-1 h-full w-px bg-border" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate">{evt.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {new Date(evt.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} &middot; {evt.time}
                </p>
                {evt.attendees > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Users className="size-2.5" /> {evt.attendees} going
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function TrendingCard() {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <Flame className="size-4 text-orange-500" />
          Trending
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5 pt-1">
        {DEN_TRENDING.map((topic, i) => (
          <div
            key={topic.label}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60 cursor-pointer"
          >
            <span className={cn(
              "flex size-6 items-center justify-center rounded-full text-[10px] font-black",
              i === 0 ? "bg-orange-100 text-orange-600" : i === 1 ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground",
            )}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold">#{topic.label.replace(/\s/g, "")}</p>
              <p className="text-[10px] text-muted-foreground">{topic.postCount} posts this week</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function GroupsCard() {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Users className="size-4" style={{ color: "var(--brand-accent)" }} />
            Groups
          </div>
          <button type="button" className="text-[11px] font-semibold hover:underline transition-colors" style={{ color: "var(--brand-accent)" }}>
            See All
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-1">
        {DEN_PRIDES_PREVIEW.map((group) => (
          <div
            key={group.id}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60 cursor-pointer"
          >
            <div className={cn("flex size-8 items-center justify-center rounded-lg text-white text-[10px] font-bold", group.color)}>
              {group.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{group.name}</p>
              <p className="text-[10px] text-muted-foreground">{group.memberCount} members</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function QuickLinksCard() {
  const links = [
    { label: "Submit Design Request", href: "/intake", icon: Sparkles, color: "text-blue-600 bg-blue-50" },
    { label: "My Requests", href: "/requests", icon: FileText, color: "text-emerald-600 bg-emerald-50" },
    { label: "Brand Guidelines", href: "#", icon: Award, color: "text-amber-600 bg-amber-50" },
    { label: "Company Directory", href: "#", icon: Users, color: "text-purple-600 bg-purple-50" },
  ]

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="size-4" style={{ color: "var(--brand-accent)" }} />
          Quick Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-1">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60"
          >
            <div className={cn("flex size-8 items-center justify-center rounded-lg", link.color)}>
              <link.icon className="size-4" />
            </div>
            <span className="text-[13px] font-medium">{link.label}</span>
          </a>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Main Component ──────────────────────────────────────────

export function LyonsDenClient() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<PostType | "all">("all")
  const [feed, setFeed] = useState(DEN_FEED)

  const handleReactionToggle = useCallback((postId: string, type: ReactionType) => {
    setFeed((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        return {
          ...p,
          reactions: p.reactions.map((r) =>
            r.type === type
              ? { ...r, reacted: !r.reacted, count: r.reacted ? r.count - 1 : r.count + 1 }
              : r,
          ),
        }
      }),
    )
  }, [])

  const filtered = useMemo(() => {
    let posts = feed
    if (typeFilter !== "all") {
      posts = posts.filter((p) => p.type === typeFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      posts = posts.filter(
        (p) =>
          (p.title?.toLowerCase().includes(q)) ||
          p.body.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)),
      )
    }
    return [...posts].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
  }, [feed, typeFilter, search])

  const typeOptions: { value: PostType | "all"; label: string; icon: React.ElementType; count: number }[] = [
    { value: "all", label: "All", icon: Flame, count: feed.length },
    { value: "announcement", label: "Announcements", icon: Megaphone, count: feed.filter((p) => p.type === "announcement").length },
    { value: "shoutout", label: "Shoutouts", icon: Award, count: feed.filter((p) => p.type === "shoutout").length },
    { value: "market", label: "Market", icon: BarChart3, count: feed.filter((p) => p.type === "market").length },
    { value: "event", label: "Events", icon: Calendar, count: feed.filter((p) => p.type === "event").length },
    { value: "document", label: "Docs", icon: FileText, count: feed.filter((p) => p.type === "document").length },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Search + Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {typeOptions.map((opt) => {
            const Icon = opt.icon
            const isActive = typeFilter === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTypeFilter(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all",
                  isActive
                    ? "border-transparent text-white shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
                )}
                style={isActive ? { background: "var(--brand-primary)" } : undefined}
              >
                <Icon className="size-3.5" />
                {opt.label}
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                  isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                )}>
                  {opt.count}
                </span>
              </button>
            )
          })}
        </div>
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full bg-muted/40 border-0"
          />
        </div>
      </div>

      {/* Main Layout: Feed + Sidebar */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
        {/* Feed Column */}
        <div className="space-y-5">
          <ComposeBox />
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Search className="size-10 text-muted-foreground/30" />
                <div>
                  <p className="font-semibold text-foreground">No posts found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search terms.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filtered.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                onReactionToggle={handleReactionToggle}
              />
            ))
          )}
        </div>

        {/* Sidebar — sticky */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <LiveMeetingCard />
          <UpcomingEventsCard />
          <TrendingCard />
          <GroupsCard />
          <QuickLinksCard />
        </div>
      </div>
    </div>
  )
}
