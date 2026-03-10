/**
 * Lyon's Den (Intranet Hub) — Mock data constants.
 * All data lives here; components import from this module.
 */

export type AnnouncementCategory =
  | "Company News"
  | "Training"
  | "Market Update"
  | "Social"
  | "Recognition"

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

// ── Announcements ──────────────────────────────────────────

export const DEN_ANNOUNCEMENTS: AnnouncementDTO[] = [
  {
    id: "ann-1",
    title: "Q1 2026 Market Outlook: Arizona Luxury Segment Continues to Surge",
    excerpt:
      "Our research team has compiled the latest data on the Scottsdale and Paradise Valley luxury markets. Key takeaways include a 12% year-over-year price increase and record-low inventory in the $5M+ bracket.",
    category: "Market Update",
    author: "Laura Breckenridge",
    authorRole: "VP of Marketing",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    featured: true,
  },
  {
    id: "ann-2",
    title: "Welcome to the New Marketing Platform!",
    excerpt:
      "We are thrilled to launch the Russ Lyon Marketing Platform. Submit design requests, track progress, and collaborate with the creative team — all in one place.",
    category: "Company News",
    author: "Michael Chen",
    authorRole: "Director of Technology",
    date: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    featured: false,
  },
  {
    id: "ann-3",
    title: "Mandatory Compliance Training: Fair Housing Update 2026",
    excerpt:
      "All agents must complete the updated Fair Housing training module by March 31. New guidelines from the Arizona Department of Real Estate are covered.",
    category: "Training",
    author: "Rachel Torres",
    authorRole: "Compliance Director",
    date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    featured: false,
  },
  {
    id: "ann-4",
    title: "Agent Spotlight: Yong Choi Closes Record Desert Mountain Sale",
    excerpt:
      "Congratulations to Yong Choi for closing the highest-value residential sale in Desert Mountain history. An outstanding achievement representing the best of Russ Lyon.",
    category: "Recognition",
    author: "Sarah Mitchell",
    authorRole: "Brokerage Manager",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    featured: false,
  },
  {
    id: "ann-5",
    title: "Spring Social: Rooftop Mixer at The Scottsdale Resort",
    excerpt:
      "Join us on April 5th for our quarterly agent social. Enjoy sunset cocktails, networking, and a preview of our new listing presentation templates.",
    category: "Social",
    author: "Amanda Fletcher",
    authorRole: "Events Coordinator",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    featured: false,
  },
  {
    id: "ann-6",
    title: "New Listing Photography Standards Released",
    excerpt:
      "The creative team has published updated guidelines for listing photography. HDR requirements, drone shot minimums, and twilight shoot protocols are all covered.",
    category: "Company News",
    author: "David Park",
    authorRole: "Creative Director",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    featured: false,
  },
  {
    id: "ann-7",
    title: "CRM Migration: Salesforce to Follow Up Boss — What You Need to Know",
    excerpt:
      "Starting April 15, we transition to Follow Up Boss as our primary CRM. Training sessions are available every Tuesday and Thursday through the end of the month.",
    category: "Training",
    author: "Michael Chen",
    authorRole: "Director of Technology",
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    featured: false,
  },
  {
    id: "ann-8",
    title: "February Top Producers Announced",
    excerpt:
      "Congratulations to our February top producers across all offices. Full rankings and awards are posted in the recognition center.",
    category: "Recognition",
    author: "Sarah Mitchell",
    authorRole: "Brokerage Manager",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    featured: false,
  },
]

// ── Events ─────────────────────────────────────────────────

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
  {
    id: "evt-6",
    title: "Monthly Broker Review",
    date: "2026-03-15",
    time: "8:30 AM",
    location: "Scottsdale HQ — Board Room",
    type: "meeting",
    attendees: 12,
  },
]

// ── Resources ──────────────────────────────────────────────

export const DEN_RESOURCES: DenResource[] = [
  {
    id: "res-1",
    title: "Brand Guidelines",
    description: "Logos, color palettes, typography, and usage rules for all Russ Lyon materials.",
    category: "Brand",
    url: "#",
    icon: "Palette",
  },
  {
    id: "res-2",
    title: "Listing Presentation Template",
    description: "Customizable listing presentation for seller appointments.",
    category: "Templates",
    url: "#",
    icon: "FileText",
  },
  {
    id: "res-3",
    title: "Photography Request Form",
    description: "Schedule a professional photo shoot for your listings.",
    category: "Templates",
    url: "#",
    icon: "Camera",
  },
  {
    id: "res-4",
    title: "MLS Quick Reference",
    description: "Field mappings, status codes, and input guidelines for ARMLS.",
    category: "Reference",
    url: "#",
    icon: "BookOpen",
  },
  {
    id: "res-5",
    title: "Social Media Toolkit",
    description: "Pre-approved post templates, hashtags, and scheduling guide.",
    category: "Marketing",
    url: "#",
    icon: "Share2",
  },
  {
    id: "res-6",
    title: "Transaction Checklist",
    description: "Step-by-step checklist from contract to close.",
    category: "Reference",
    url: "#",
    icon: "ClipboardCheck",
  },
  {
    id: "res-7",
    title: "New Agent Onboarding Guide",
    description: "Everything new agents need to know in their first 30 days.",
    category: "Reference",
    url: "#",
    icon: "GraduationCap",
  },
  {
    id: "res-8",
    title: "Email Signature Generator",
    description: "Create a branded email signature with your headshot and credentials.",
    category: "Brand",
    url: "#",
    icon: "Mail",
  },
  {
    id: "res-9",
    title: "Just Listed / Just Sold Postcards",
    description: "Order customizable postcards for neighborhood farming.",
    category: "Marketing",
    url: "#",
    icon: "Send",
  },
]

// ── Prides (Groups) Preview ────────────────────────────────

export const DEN_PRIDES_PREVIEW: PridePreview[] = [
  {
    id: "pride-1",
    name: "Luxury Collection",
    category: "Specialty",
    memberCount: 42,
    color: "bg-amber-500",
  },
  {
    id: "pride-2",
    name: "New Construction",
    category: "Specialty",
    memberCount: 28,
    color: "bg-blue-500",
  },
  {
    id: "pride-3",
    name: "Scottsdale Office",
    category: "Office",
    memberCount: 67,
    color: "bg-emerald-500",
  },
  {
    id: "pride-4",
    name: "Paradise Valley Office",
    category: "Office",
    memberCount: 34,
    color: "bg-purple-500",
  },
  {
    id: "pride-5",
    name: "Top Producers Club",
    category: "Achievement",
    memberCount: 15,
    color: "bg-rose-500",
  },
]

// ── Live Meeting ───────────────────────────────────────────

export const LIVE_MEETING: LiveMeetingDTO = {
  id: "live-1",
  title: "Monday Leadership Standup",
  host: "Sarah Mitchell",
  participants: ["Laura B.", "Michael C.", "David P.", "Rachel T.", "Amanda F."],
  startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  zoomUrl: "https://zoom.us/j/123456789",
}
