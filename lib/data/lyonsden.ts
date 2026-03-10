/**
 * Lyon's Den — Workplace-style social intranet data.
 */

export type AnnouncementCategory =
  | "Company News"
  | "Training"
  | "Market Update"
  | "Social"
  | "Recognition"

export type PostType = "announcement" | "shoutout" | "market" | "event" | "document" | "poll"

export type ReactionType = "like" | "love" | "celebrate" | "insightful" | "curious"

export interface Reaction {
  type: ReactionType
  count: number
  reacted: boolean
}

export interface Comment {
  id: string
  authorName: string
  authorInitials: string
  authorRole: string
  body: string
  timestamp: string
  likes: number
}

export interface FeedPost {
  id: string
  type: PostType
  authorName: string
  authorInitials: string
  authorRole: string
  authorAvatar?: string
  timestamp: string
  pinned?: boolean
  // Content
  title?: string
  body: string
  imageUrl?: string
  linkUrl?: string
  linkLabel?: string
  // Event-specific
  eventDate?: string
  eventTime?: string
  eventLocation?: string
  eventAttendees?: number
  // Document-specific
  documentName?: string
  documentType?: string
  // Poll-specific
  pollOptions?: { label: string; votes: number; voted?: boolean }[]
  // Social
  tags?: string[]
  reactions: Reaction[]
  comments: Comment[]
  views: number
}

export interface DenEvent {
  id: string
  title: string
  date: string
  time: string
  location: string
  type: "meeting" | "training" | "social" | "deadline"
  attendees: number
}

export interface DenResource {
  id: string
  title: string
  description: string
  category: string
  url: string
  icon: string
}

export interface PridePreview {
  id: string
  name: string
  category: string
  memberCount: number
  color: string
}

export interface LiveMeetingDTO {
  id: string
  title: string
  host: string
  participants: string[]
  startedAt: string
  zoomUrl: string
}

export interface TrendingTopic {
  label: string
  postCount: number
}

export interface AnnouncementDTO {
  id: string
  title: string
  excerpt: string
  category: AnnouncementCategory
  author: string
  authorRole: string
  date: string
  featured: boolean
  imageUrl?: string
}

// ── Feed Posts ────────────────────────────────────────────────

export const DEN_FEED: FeedPost[] = [
  {
    id: "post-1",
    type: "announcement",
    authorName: "Laura Breckenridge",
    authorInitials: "LB",
    authorRole: "VP of Marketing",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    pinned: true,
    title: "Q1 2026 Market Outlook: Arizona Luxury Segment Continues to Surge",
    body: "Our research team has compiled the latest data on the Scottsdale and Paradise Valley luxury markets. Key takeaways include a 12% year-over-year price increase and record-low inventory in the $5M+ bracket. Full report is available in the documents section.\n\nPlease review before Thursday's strategy meeting.",
    tags: ["Market Update", "Luxury", "Q1 2026"],
    reactions: [
      { type: "like", count: 24, reacted: false },
      { type: "insightful", count: 18, reacted: true },
      { type: "celebrate", count: 5, reacted: false },
    ],
    comments: [
      {
        id: "c1-1",
        authorName: "Yong Choi",
        authorInitials: "YC",
        authorRole: "Agent",
        body: "The Desert Mountain numbers are particularly strong. I'm seeing 3+ offers on every listing in the $3-5M range.",
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        likes: 8,
      },
      {
        id: "c1-2",
        authorName: "Lex Baum",
        authorInitials: "LB",
        authorRole: "Marketing Director",
        body: "Great data. We should highlight these stats in the next batch of market flyers for agents.",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        likes: 3,
      },
    ],
    views: 312,
  },
  {
    id: "post-2",
    type: "shoutout",
    authorName: "Sarah Mitchell",
    authorInitials: "SM",
    authorRole: "Brokerage Manager",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    title: "Agent Spotlight: Yong Choi Closes Record Desert Mountain Sale",
    body: "Huge congratulations to Yong Choi for closing the highest-value residential sale in Desert Mountain history at $14.2M! This represents the best of Russ Lyon — deep local expertise, white-glove service, and relentless dedication to our clients.\n\nYong, your team and the entire brokerage are proud of you. 🎉",
    imageUrl: "/placeholder-celebration.jpg",
    tags: ["Recognition", "Desert Mountain", "Record Sale"],
    reactions: [
      { type: "celebrate", count: 67, reacted: true },
      { type: "love", count: 42, reacted: false },
      { type: "like", count: 31, reacted: false },
    ],
    comments: [
      {
        id: "c2-1",
        authorName: "David Kim",
        authorInitials: "DK",
        authorRole: "Executive",
        body: "Outstanding work Yong! Setting the bar higher every quarter.",
        timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        likes: 15,
      },
      {
        id: "c2-2",
        authorName: "Marcus Chen",
        authorInitials: "MC",
        authorRole: "Designer",
        body: "The marketing collateral for that listing turned out incredible. Great team effort!",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        likes: 9,
      },
      {
        id: "c2-3",
        authorName: "Amanda Fletcher",
        authorInitials: "AF",
        authorRole: "Events Coordinator",
        body: "We need to celebrate this at the next mixer! 🥂",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        likes: 6,
      },
    ],
    views: 489,
  },
  {
    id: "post-3",
    type: "event",
    authorName: "Amanda Fletcher",
    authorInitials: "AF",
    authorRole: "Events Coordinator",
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    title: "Spring Rooftop Mixer — April 5th",
    body: "Join us for our quarterly agent social! Sunset cocktails, networking, and a preview of the new listing presentation templates. Bring a guest — this is going to be a great one.",
    eventDate: "2026-04-05",
    eventTime: "5:30 PM",
    eventLocation: "The Scottsdale Resort — Rooftop Terrace",
    eventAttendees: 80,
    tags: ["Social", "Networking"],
    reactions: [
      { type: "love", count: 34, reacted: false },
      { type: "like", count: 22, reacted: false },
    ],
    comments: [
      {
        id: "c3-1",
        authorName: "Laura Breckenridge",
        authorInitials: "LB",
        authorRole: "VP of Marketing",
        body: "Can't wait! The rooftop views are incredible at sunset.",
        timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
        likes: 4,
      },
    ],
    views: 267,
  },
  {
    id: "post-4",
    type: "announcement",
    authorName: "Michael Chen",
    authorInitials: "MC",
    authorRole: "Director of Technology",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    title: "Welcome to the New Marketing Platform!",
    body: "We are thrilled to launch the Russ Lyon Marketing Platform. Submit design requests, track progress, and collaborate with the creative team — all in one place.\n\nTraining sessions are available this week. Check the Events tab or reach out to IT if you need help getting started.",
    linkUrl: "/requests",
    linkLabel: "Open Marketing Platform →",
    tags: ["Company News", "Platform Launch"],
    reactions: [
      { type: "like", count: 45, reacted: false },
      { type: "celebrate", count: 19, reacted: false },
    ],
    comments: [],
    views: 534,
  },
  {
    id: "post-5",
    type: "document",
    authorName: "David Park",
    authorInitials: "DP",
    authorRole: "Creative Director",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    title: "Updated Brand Guidelines — March 2026",
    body: "The creative team has published updated brand guidelines. Key changes include new photography standards (HDR required, drone minimums), updated color palette with expanded earth tones, and revised typography hierarchy.\n\nAll agents should review before creating new materials.",
    documentName: "RLSIR-Brand-Guidelines-March-2026.pdf",
    documentType: "PDF",
    tags: ["Brand", "Guidelines"],
    reactions: [
      { type: "like", count: 18, reacted: false },
      { type: "insightful", count: 7, reacted: false },
    ],
    comments: [
      {
        id: "c5-1",
        authorName: "Lex Baum",
        authorInitials: "LB",
        authorRole: "Marketing Director",
        body: "The new earth tone palette is gorgeous. Great work David and team.",
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        likes: 5,
      },
    ],
    views: 198,
  },
  {
    id: "post-6",
    type: "market",
    authorName: "Rachel Torres",
    authorInitials: "RT",
    authorRole: "Market Analyst",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    title: "Weekly Market Pulse: Inventory Tightens in North Scottsdale",
    body: "Active listings in 85255 and 85262 dropped 8% week-over-week. Average DOM for luxury properties ($2M+) is now just 28 days, down from 41 days last quarter. Buyer demand remains robust with out-of-state relocation driving 38% of transactions.",
    tags: ["Market Update", "North Scottsdale", "Inventory"],
    reactions: [
      { type: "insightful", count: 29, reacted: false },
      { type: "like", count: 14, reacted: false },
    ],
    comments: [],
    views: 224,
  },
  {
    id: "post-7",
    type: "shoutout",
    authorName: "Sarah Mitchell",
    authorInitials: "SM",
    authorRole: "Brokerage Manager",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    title: "February Top Producers Announced!",
    body: "Congratulations to our February top producers:\n\n🥇 Yong Choi — $28.4M\n🥈 Jennifer Walsh — $19.1M\n🥉 Robert Martinez — $15.7M\n\nIncredible numbers across the board. Full rankings are available in the Leaderboard section.",
    tags: ["Recognition", "Top Producers"],
    reactions: [
      { type: "celebrate", count: 52, reacted: false },
      { type: "like", count: 28, reacted: false },
      { type: "love", count: 15, reacted: false },
    ],
    comments: [
      {
        id: "c7-1",
        authorName: "Yong Choi",
        authorInitials: "YC",
        authorRole: "Agent",
        body: "Thank you! It's been an incredible start to the year. Grateful for the amazing team support.",
        timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 22,
      },
    ],
    views: 412,
  },
  {
    id: "post-8",
    type: "announcement",
    authorName: "Rachel Torres",
    authorInitials: "RT",
    authorRole: "Compliance Director",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    title: "Mandatory: Fair Housing Training Due March 31",
    body: "All agents must complete the updated Fair Housing training module by March 31. New guidelines from the Arizona Department of Real Estate are covered. This is a licensing requirement — please complete ASAP.\n\nAccess the training through the Learning Center link below.",
    linkUrl: "#",
    linkLabel: "Open Training Module →",
    tags: ["Training", "Compliance", "Deadline"],
    reactions: [
      { type: "like", count: 12, reacted: false },
    ],
    comments: [],
    views: 389,
  },
]

// ── Events ──────────────────────────────────────────────────

export const DEN_EVENTS: DenEvent[] = [
  {
    id: "evt-1",
    title: "Weekly Sales Meeting",
    date: "2026-03-12",
    time: "9:00 AM",
    location: "Scottsdale HQ — Conference Room A",
    type: "meeting",
    attendees: 24,
  },
  {
    id: "evt-2",
    title: "Follow Up Boss CRM Training",
    date: "2026-03-13",
    time: "2:00 PM",
    location: "Virtual — Zoom",
    type: "training",
    attendees: 45,
  },
  {
    id: "evt-3",
    title: "Spring Rooftop Mixer",
    date: "2026-04-05",
    time: "5:30 PM",
    location: "The Scottsdale Resort — Rooftop Terrace",
    type: "social",
    attendees: 80,
  },
  {
    id: "evt-4",
    title: "Fair Housing Training Deadline",
    date: "2026-03-31",
    time: "11:59 PM",
    location: "Online Portal",
    type: "deadline",
    attendees: 0,
  },
  {
    id: "evt-5",
    title: "Luxury Marketing Workshop",
    date: "2026-03-18",
    time: "10:00 AM",
    location: "Paradise Valley Office — Training Room",
    type: "training",
    attendees: 18,
  },
]

// ── Resources ───────────────────────────────────────────────

export const DEN_RESOURCES: DenResource[] = [
  { id: "res-1", title: "Brand Guidelines", description: "Logos, colors, typography, usage rules.", category: "Brand", url: "#", icon: "Palette" },
  { id: "res-2", title: "Listing Presentation Template", description: "Customizable seller listing presentation.", category: "Templates", url: "#", icon: "FileText" },
  { id: "res-3", title: "Photography Request Form", description: "Schedule a professional photo shoot.", category: "Templates", url: "#", icon: "Camera" },
  { id: "res-4", title: "MLS Quick Reference", description: "ARMLS field mappings and status codes.", category: "Reference", url: "#", icon: "BookOpen" },
  { id: "res-5", title: "Social Media Toolkit", description: "Post templates, hashtags, scheduling.", category: "Marketing", url: "#", icon: "Share2" },
  { id: "res-6", title: "Transaction Checklist", description: "Contract to close step-by-step.", category: "Reference", url: "#", icon: "ClipboardCheck" },
]

// ── Prides (Groups) ─────────────────────────────────────────

export const DEN_PRIDES_PREVIEW: PridePreview[] = [
  { id: "pride-1", name: "Luxury Collection", category: "Specialty", memberCount: 42, color: "bg-amber-500" },
  { id: "pride-2", name: "New Construction", category: "Specialty", memberCount: 28, color: "bg-blue-500" },
  { id: "pride-3", name: "Scottsdale Office", category: "Office", memberCount: 67, color: "bg-emerald-500" },
  { id: "pride-4", name: "Paradise Valley Office", category: "Office", memberCount: 34, color: "bg-purple-500" },
  { id: "pride-5", name: "Top Producers Club", category: "Achievement", memberCount: 15, color: "bg-rose-500" },
]

// ── Trending ────────────────────────────────────────────────

export const DEN_TRENDING: TrendingTopic[] = [
  { label: "Desert Mountain", postCount: 12 },
  { label: "Q1 Market Report", postCount: 8 },
  { label: "Spring Mixer", postCount: 7 },
  { label: "New Platform", postCount: 6 },
  { label: "Fair Housing", postCount: 5 },
]

// ── Live Meeting ────────────────────────────────────────────

export const LIVE_MEETING: LiveMeetingDTO = {
  id: "live-1",
  title: "Monday Leadership Standup",
  host: "Sarah Mitchell",
  participants: ["Laura B.", "Michael C.", "David P.", "Rachel T.", "Amanda F."],
  startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  zoomUrl: "https://zoom.us/j/123456789",
}

// ── Legacy exports for Announcement model ───────────────────

export const DEN_ANNOUNCEMENTS: AnnouncementDTO[] = DEN_FEED
  .filter((p) => p.type === "announcement" || p.type === "market")
  .map((p) => ({
    id: p.id,
    title: p.title ?? "",
    excerpt: p.body.slice(0, 200),
    category: (p.type === "market" ? "Market Update" : "Company News") as AnnouncementCategory,
    author: p.authorName,
    authorRole: p.authorRole,
    date: p.timestamp,
    featured: !!p.pinned,
  }))
