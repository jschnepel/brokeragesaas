/**
 * Prides (groups) mock data for the RLSIR platform.
 */

export type PrideCategory = "department" | "office" | "interest" | "committee"

export interface Pride {
  id: string
  name: string
  description: string
  category: PrideCategory
  memberCount: number
  color: string
  members: string[]
  createdAt: string
}

export interface PrideMessage {
  id: string
  prideId: string
  sender: string
  senderInitials: string
  body: string
  timestamp: string
}

export const PRIDE_CATEGORIES: PrideCategory[] = [
  "department",
  "office",
  "interest",
  "committee",
]

export const CATEGORY_LABELS: Record<PrideCategory, string> = {
  department: "Department",
  office: "Office",
  interest: "Interest",
  committee: "Committee",
}

export const CATEGORY_COLORS: Record<PrideCategory, string> = {
  department: "bg-blue-100 text-blue-700",
  office: "bg-emerald-100 text-emerald-700",
  interest: "bg-purple-100 text-purple-700",
  committee: "bg-amber-100 text-amber-700",
}

export const CATEGORY_ACCENT_COLORS: Record<PrideCategory, string> = {
  department: "bg-blue-500",
  office: "bg-emerald-500",
  interest: "bg-purple-500",
  committee: "bg-amber-500",
}

export const PRIDES: Pride[] = [
  {
    id: "mkt",
    name: "Marketing Team",
    description:
      "Central hub for the marketing department — campaign updates, brand guidelines, creative briefs, and design collaboration.",
    category: "department",
    memberCount: 6,
    color: "bg-blue-500",
    members: [
      "Lauren Mitchell",
      "Lex Baum",
      "Marcus Webb",
      "Sophia Chen",
      "Rachel Torres",
      "Joey Schnepel",
    ],
    createdAt: "2025-06-15",
  },
  {
    id: "scottsdale",
    name: "Scottsdale Office",
    description:
      "News, events, and coordination for the Scottsdale office. Office hours, parking updates, and social gatherings.",
    category: "office",
    memberCount: 12,
    color: "bg-emerald-500",
    members: [
      "Karen Reeves",
      "Yong Choi",
      "James Whitfield",
      "Natalie Brooks",
      "David Harrington",
      "Todd Gillenwater",
      "Lauren Mitchell",
      "Lex Baum",
      "Marcus Webb",
      "Michael Santos",
      "Ashley Morgan",
      "Ryan Park",
    ],
    createdAt: "2025-05-01",
  },
  {
    id: "luxury",
    name: "Luxury Collection",
    description:
      "Exclusive group for agents in the luxury tier. Market insights, high-end staging tips, and premium listing strategies.",
    category: "interest",
    memberCount: 5,
    color: "bg-purple-500",
    members: [
      "Yong Choi",
      "James Whitfield",
      "Karen Reeves",
      "David Harrington",
      "Natalie Brooks",
    ],
    createdAt: "2025-07-10",
  },
  {
    id: "new-agents",
    name: "New Agents",
    description:
      "Onboarding support and mentorship for agents in their first year. Training schedules, Q&A, and peer support.",
    category: "interest",
    memberCount: 4,
    color: "bg-rose-500",
    members: ["Natalie Brooks", "Priya Sharma", "Daniel Kim", "Ashley Morgan"],
    createdAt: "2025-08-20",
  },
  {
    id: "golf",
    name: "Golf Enthusiasts",
    description:
      "Tee times, tournament info, and networking on the course. Monthly outings at Desert Mountain and Troon North.",
    category: "interest",
    memberCount: 7,
    color: "bg-green-600",
    members: [
      "Todd Gillenwater",
      "David Harrington",
      "Yong Choi",
      "James Whitfield",
      "Brian Caldwell",
      "Karen Reeves",
      "Michael Santos",
    ],
    createdAt: "2025-09-01",
  },
  {
    id: "tech",
    name: "Tech Committee",
    description:
      "Platform feedback, feature requests, and beta testing coordination. Driving innovation across the brokerage.",
    category: "committee",
    memberCount: 5,
    color: "bg-amber-500",
    members: [
      "Ryan Park",
      "Joey Schnepel",
      "Lex Baum",
      "Christine Voss",
      "Rachel Torres",
    ],
    createdAt: "2025-10-15",
  },
  {
    id: "phoenix",
    name: "Phoenix Office",
    description:
      "Updates and coordination for the Phoenix metro office. Community events, local market data, and office logistics.",
    category: "office",
    memberCount: 5,
    color: "bg-teal-500",
    members: [
      "Brian Caldwell",
      "Priya Sharma",
      "Daniel Kim",
      "Christine Voss",
      "Michael Santos",
    ],
    createdAt: "2025-06-01",
  },
  {
    id: "events",
    name: "Events Committee",
    description:
      "Planning and organizing brokerage events — galas, open houses, client appreciation nights, and team retreats.",
    category: "committee",
    memberCount: 4,
    color: "bg-pink-500",
    members: ["Lauren Mitchell", "Karen Reeves", "Sophia Chen", "Natalie Brooks"],
    createdAt: "2025-11-01",
  },
]

export const PRIDE_MESSAGES: PrideMessage[] = [
  {
    id: "m1",
    prideId: "mkt",
    sender: "Lauren Mitchell",
    senderInitials: "LM",
    body: "New brand guidelines are live on the shared drive. Please review before submitting any new materials.",
    timestamp: "2026-03-10T09:15:00Z",
  },
  {
    id: "m2",
    prideId: "mkt",
    sender: "Lex Baum",
    senderInitials: "LB",
    body: "Got it! I'll update the templates this afternoon.",
    timestamp: "2026-03-10T09:22:00Z",
  },
  {
    id: "m3",
    prideId: "mkt",
    sender: "Marcus Webb",
    senderInitials: "MW",
    body: "Do we have updated headshot specs? A few agents are asking about dimensions.",
    timestamp: "2026-03-10T10:05:00Z",
  },
  {
    id: "m4",
    prideId: "scottsdale",
    sender: "Karen Reeves",
    senderInitials: "KR",
    body: "Reminder: office lunch is this Friday at noon. Please RSVP by Wednesday.",
    timestamp: "2026-03-09T14:30:00Z",
  },
  {
    id: "m5",
    prideId: "scottsdale",
    sender: "Yong Choi",
    senderInitials: "YC",
    body: "Count me in! Should I bring anything?",
    timestamp: "2026-03-09T14:45:00Z",
  },
  {
    id: "m6",
    prideId: "luxury",
    sender: "James Whitfield",
    senderInitials: "JW",
    body: "Just closed on the Desert Mountain estate — $4.2M. Happy to share staging notes with anyone interested.",
    timestamp: "2026-03-08T16:00:00Z",
  },
  {
    id: "m7",
    prideId: "luxury",
    sender: "Yong Choi",
    senderInitials: "YC",
    body: "Congrats James! Would love to see the staging approach. Let's connect this week.",
    timestamp: "2026-03-08T16:20:00Z",
  },
  {
    id: "m8",
    prideId: "golf",
    sender: "Todd Gillenwater",
    senderInitials: "TG",
    body: "Next outing is March 22 at Troon North. Shotgun start at 7:30am. Let me know if you need a cart.",
    timestamp: "2026-03-07T11:00:00Z",
  },
  {
    id: "m9",
    prideId: "tech",
    sender: "Ryan Park",
    senderInitials: "RP",
    body: "New platform release going out this week. Keep an eye out for the org chart and prides features!",
    timestamp: "2026-03-10T08:00:00Z",
  },
  {
    id: "m10",
    prideId: "tech",
    sender: "Lex Baum",
    senderInitials: "LB",
    body: "Excited to see the new pages. Will test and report any issues here.",
    timestamp: "2026-03-10T08:15:00Z",
  },
  {
    id: "m11",
    prideId: "new-agents",
    sender: "Priya Sharma",
    senderInitials: "PS",
    body: "Does anyone have the link to the CRM training video from last week?",
    timestamp: "2026-03-09T10:30:00Z",
  },
  {
    id: "m12",
    prideId: "new-agents",
    sender: "Ashley Morgan",
    senderInitials: "AM",
    body: "Just sent it to you via email. It's also pinned in the shared docs folder.",
    timestamp: "2026-03-09T10:45:00Z",
  },
  {
    id: "m13",
    prideId: "phoenix",
    sender: "Brian Caldwell",
    senderInitials: "BC",
    body: "Phoenix market report for February is ready. Strong showing in the $500K-$700K range.",
    timestamp: "2026-03-08T09:00:00Z",
  },
  {
    id: "m14",
    prideId: "events",
    sender: "Sophia Chen",
    senderInitials: "SC",
    body: "Spring gala venue is confirmed — The Phoenician on April 12. Save the date!",
    timestamp: "2026-03-07T15:00:00Z",
  },
]
