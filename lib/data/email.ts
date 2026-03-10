/* ── Email mock data ─────────────────────────────────────────────────────── */

export interface EmailThread {
  id: string
  subject: string
  from: string
  fromInitials: string
  to: string
  preview: string
  body: string
  date: string
  read: boolean
  starred: boolean
  labels: string[]
  attachments: string[]
}

export const EMAIL_LABELS = ["All", "Inbox", "Sent", "Drafts", "Starred"] as const

export const EMAIL_FOLDERS = [
  { name: "Inbox", count: 5, icon: "inbox" },
  { name: "Sent", count: 0, icon: "send" },
  { name: "Drafts", count: 1, icon: "file" },
  { name: "Starred", count: 2, icon: "star" },
  { name: "Trash", count: 0, icon: "trash" },
] as const

export const MOCK_EMAILS: EmailThread[] = [
  {
    id: "e1",
    subject: "Spring Open House Flyer — Final Proof",
    from: "Sarah Chen",
    fromInitials: "SC",
    to: "me",
    preview: "Attached is the final proof for the Scottsdale spring open house flyer. Please review and approve by EOD...",
    body: `Hi team,

Attached is the final proof for the Scottsdale spring open house flyer. Please review and approve by EOD so we can send it to print first thing tomorrow.

Key changes from the last round:
- Updated the headline font to Playfair Display per brand guidelines
- Swapped the hero image for the twilight exterior shot
- Added the QR code linking to the virtual tour

Let me know if you need any further revisions.

Best,
Sarah`,
    date: "2026-03-10T09:15:00",
    read: false,
    starred: true,
    labels: ["Inbox"],
    attachments: ["spring-open-house-flyer-v3.pdf"],
  },
  {
    id: "e2",
    subject: "New Listing Photography — Desert Mountain",
    from: "Marcus Webb",
    fromInitials: "MW",
    to: "me",
    preview: "The Desert Mountain shoot is confirmed for Thursday at 4 PM. Golden hour lighting should be perfect...",
    body: `Hey,

The Desert Mountain shoot is confirmed for Thursday at 4 PM. Golden hour lighting should be perfect for the exterior and pool shots.

I'll need access to the property by 3:30 PM for setup. Can you coordinate with the listing agent?

Also, do we want drone footage for this one? The aerial views of the course would be stunning.

Thanks,
Marcus`,
    date: "2026-03-10T08:42:00",
    read: false,
    starred: false,
    labels: ["Inbox"],
    attachments: [],
  },
  {
    id: "e3",
    subject: "Q1 Marketing Budget Review",
    from: "David Kim",
    fromInitials: "DK",
    to: "me",
    preview: "Please see the attached Q1 marketing spend summary. We're tracking 12% under budget on print...",
    body: `Hi all,

Please see the attached Q1 marketing spend summary. We're tracking 12% under budget on print materials but slightly over on digital ads.

Key highlights:
- Print: $18,200 spent of $21,000 allocated
- Digital: $14,800 spent of $13,500 allocated
- Events: $6,400 spent of $8,000 allocated

I'd like to discuss reallocating some of the print savings to cover the digital overage. Can we schedule a quick call this week?

Best,
David`,
    date: "2026-03-09T16:30:00",
    read: false,
    starred: false,
    labels: ["Inbox"],
    attachments: ["q1-marketing-budget.xlsx", "spend-breakdown.pdf"],
  },
  {
    id: "e4",
    subject: "Re: Brand Guidelines Update",
    from: "Lex Baum",
    fromInitials: "LB",
    to: "me",
    preview: "Looks good! I've approved the updated color palette. One note — let's keep the gold at the exact...",
    body: `Looks good! I've approved the updated color palette. One note — let's keep the gold at the exact hex value (#C9A96E) we settled on. A few templates I reviewed last week had drifted to a warmer tone.

Also, the new typography section is solid. Playfair for headings, Inter for body — clean and on-brand.

Let me know when the final PDF is ready for distribution.

— Lex`,
    date: "2026-03-09T14:10:00",
    read: true,
    starred: true,
    labels: ["Inbox"],
    attachments: [],
  },
  {
    id: "e5",
    subject: "Office Announcement — New Printer Setup",
    from: "Mike Torres",
    fromInitials: "MT",
    to: "all@russlyon.com",
    preview: "The new large-format printer has been installed in the marketing suite. Training sessions are...",
    body: `Team,

The new large-format printer has been installed in the marketing suite. Training sessions are available this week:

- Tuesday 10 AM — Basic operation and paper loading
- Wednesday 2 PM — Color calibration and proofing
- Thursday 11 AM — Large format and banner printing

Please sign up on the shared calendar. The old printer will be decommissioned by end of month.

Thanks,
Mike`,
    date: "2026-03-08T11:00:00",
    read: true,
    starred: false,
    labels: ["Inbox"],
    attachments: [],
  },
  {
    id: "e6",
    subject: "Social Media Content Calendar — March",
    from: "Sarah Chen",
    fromInitials: "SC",
    to: "me",
    preview: "Here's the March social media calendar for review. I've scheduled 4 posts per week across...",
    body: `Hi,

Here's the March social media calendar for review. I've scheduled 4 posts per week across Instagram and Facebook with a mix of:

- New listing spotlights (2x/week)
- Market insights / stats (1x/week)
- Lifestyle / community content (1x/week)

All posts are drafted and scheduled in Buffer. Please review the copy and imagery by Friday so we can finalize.

Thanks,
Sarah`,
    date: "2026-03-07T15:20:00",
    read: true,
    starred: false,
    labels: ["Inbox"],
    attachments: ["march-content-calendar.xlsx"],
  },
  {
    id: "e7",
    subject: "Luxury Listing Brochure — Draft for Review",
    from: "David Kim",
    fromInitials: "DK",
    to: "me",
    preview: "The 16-page brochure for the Pinnacle Peak estate is ready for initial review. I went with the...",
    body: `Hi,

The 16-page brochure for the Pinnacle Peak estate is ready for initial review. I went with the premium linen paper stock we discussed and a gatefold cover.

Highlights:
- Full-bleed photography on every spread
- Neighborhood amenities section with map
- Floor plan illustrations on pages 8-9
- Agent bio and contact on the back cover

Please take a look and mark up any changes. Aiming to send to print by next Wednesday.

Thanks,
David`,
    date: "2026-03-07T10:45:00",
    read: true,
    starred: false,
    labels: ["Inbox"],
    attachments: ["pinnacle-peak-brochure-draft.pdf"],
  },
  {
    id: "e8",
    subject: "Upcoming Event — Broker's Open House",
    from: "Lex Baum",
    fromInitials: "LB",
    to: "me",
    preview: "Reminder: The broker's open house for the Troon Village listing is this Saturday from 11-2. We need...",
    body: `Reminder: The broker's open house for the Troon Village listing is this Saturday from 11-2. We need:

- 50 printed brochures
- Property info sheets (MLS data + features)
- Sign-in iPad with lead capture form
- Branded water bottles and napkins

Can the design team have the brochure ready by Thursday for a Friday print run?

Thanks,
Lex`,
    date: "2026-03-06T09:30:00",
    read: true,
    starred: false,
    labels: ["Inbox"],
    attachments: [],
  },
  {
    id: "e9",
    subject: "Website Banner Refresh Request",
    from: "Mike Torres",
    fromInitials: "MT",
    to: "me",
    preview: "Can we update the homepage hero banner? The current one has been up since January. I'm thinking...",
    body: `Can we update the homepage hero banner? The current one has been up since January. I'm thinking something fresh for spring — maybe the new Silverleaf listing with the infinity pool?

Specs:
- 1920x600px desktop
- 768x400px mobile
- Include "Spring Collection" headline text
- CTA button: "View Listings"

No rush — next week is fine.

Mike`,
    date: "2026-03-05T13:15:00",
    read: true,
    starred: false,
    labels: ["Inbox", "Drafts"],
    attachments: [],
  },
]
