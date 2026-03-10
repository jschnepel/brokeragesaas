/* ── Messaging mock data ─────────────────────────────────────────────────── */

export interface Contact {
  id: string
  name: string
  initials: string
  role: string
  online: boolean
  lastMessage: string
  lastMessageTime: string
  unread: number
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  body: string
  timestamp: string
  isOwn: boolean
}

export const MOCK_CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Lex Baum",
    initials: "LB",
    role: "Marketing Director",
    online: true,
    lastMessage: "Sounds good, let's sync tomorrow morning.",
    lastMessageTime: "2026-03-10T09:45:00",
    unread: 2,
  },
  {
    id: "c2",
    name: "Marcus Webb",
    initials: "MW",
    role: "Photographer",
    online: true,
    lastMessage: "Photos are uploaded to the shared drive.",
    lastMessageTime: "2026-03-10T08:30:00",
    unread: 0,
  },
  {
    id: "c3",
    name: "David Kim",
    initials: "DK",
    role: "Graphic Designer",
    online: false,
    lastMessage: "I'll have the revisions done by 3 PM.",
    lastMessageTime: "2026-03-09T16:20:00",
    unread: 1,
  },
  {
    id: "c4",
    name: "Sarah Chen",
    initials: "SC",
    role: "Content Strategist",
    online: true,
    lastMessage: "The blog post draft is in your inbox.",
    lastMessageTime: "2026-03-09T14:00:00",
    unread: 0,
  },
  {
    id: "c5",
    name: "Mike Torres",
    initials: "MT",
    role: "Office Manager",
    online: false,
    lastMessage: "Printer is back online, all good now.",
    lastMessageTime: "2026-03-08T11:30:00",
    unread: 0,
  },
]

export const MOCK_CONVERSATIONS: Record<string, Message[]> = {
  c1: [
    {
      id: "m1-1",
      senderId: "c1",
      senderName: "Lex Baum",
      body: "Hey, did you get a chance to review the updated brand guidelines doc?",
      timestamp: "2026-03-10T09:00:00",
      isOwn: false,
    },
    {
      id: "m1-2",
      senderId: "me",
      senderName: "You",
      body: "Yes! Looking great. The typography section is really polished. One question — are we officially switching to Playfair for all headings?",
      timestamp: "2026-03-10T09:05:00",
      isOwn: true,
    },
    {
      id: "m1-3",
      senderId: "c1",
      senderName: "Lex Baum",
      body: "That's the plan. Playfair Display for headings, Inter for body. Keeps it elegant but readable.",
      timestamp: "2026-03-10T09:12:00",
      isOwn: false,
    },
    {
      id: "m1-4",
      senderId: "me",
      senderName: "You",
      body: "Perfect. I'll update the templates this week to match.",
      timestamp: "2026-03-10T09:20:00",
      isOwn: true,
    },
    {
      id: "m1-5",
      senderId: "c1",
      senderName: "Lex Baum",
      body: "Awesome. Also, can we meet to discuss the Q2 campaign strategy? I have some ideas for the luxury segment.",
      timestamp: "2026-03-10T09:35:00",
      isOwn: false,
    },
    {
      id: "m1-6",
      senderId: "me",
      senderName: "You",
      body: "Absolutely. How about tomorrow morning at 10?",
      timestamp: "2026-03-10T09:40:00",
      isOwn: true,
    },
    {
      id: "m1-7",
      senderId: "c1",
      senderName: "Lex Baum",
      body: "Sounds good, let's sync tomorrow morning.",
      timestamp: "2026-03-10T09:45:00",
      isOwn: false,
    },
  ],
  c2: [
    {
      id: "m2-1",
      senderId: "me",
      senderName: "You",
      body: "Marcus, how did the Desert Mountain shoot go?",
      timestamp: "2026-03-09T17:00:00",
      isOwn: true,
    },
    {
      id: "m2-2",
      senderId: "c2",
      senderName: "Marcus Webb",
      body: "It went great! The golden hour shots are incredible. Got some amazing drone footage of the golf course too.",
      timestamp: "2026-03-09T17:15:00",
      isOwn: false,
    },
    {
      id: "m2-3",
      senderId: "me",
      senderName: "You",
      body: "Fantastic. Can you upload the selects to the shared drive by tomorrow?",
      timestamp: "2026-03-09T17:20:00",
      isOwn: true,
    },
    {
      id: "m2-4",
      senderId: "c2",
      senderName: "Marcus Webb",
      body: "Already on it. I'm doing color correction tonight. Expect 40-50 final images plus the drone video.",
      timestamp: "2026-03-09T17:30:00",
      isOwn: false,
    },
    {
      id: "m2-5",
      senderId: "me",
      senderName: "You",
      body: "You're the best. Thanks Marcus!",
      timestamp: "2026-03-09T17:35:00",
      isOwn: true,
    },
    {
      id: "m2-6",
      senderId: "c2",
      senderName: "Marcus Webb",
      body: "Photos are uploaded to the shared drive.",
      timestamp: "2026-03-10T08:30:00",
      isOwn: false,
    },
  ],
  c3: [
    {
      id: "m3-1",
      senderId: "me",
      senderName: "You",
      body: "David, what's the status on the Pinnacle Peak brochure?",
      timestamp: "2026-03-09T14:00:00",
      isOwn: true,
    },
    {
      id: "m3-2",
      senderId: "c3",
      senderName: "David Kim",
      body: "Working on the floor plan layouts now. The gatefold cover looks amazing.",
      timestamp: "2026-03-09T14:10:00",
      isOwn: false,
    },
    {
      id: "m3-3",
      senderId: "me",
      senderName: "You",
      body: "Great to hear. Sarah mentioned the copy is finalized, so you should be good to drop it in.",
      timestamp: "2026-03-09T14:15:00",
      isOwn: true,
    },
    {
      id: "m3-4",
      senderId: "c3",
      senderName: "David Kim",
      body: "Perfect, I'll pull the latest copy from the shared doc. Any specific notes on the photography layout?",
      timestamp: "2026-03-09T14:25:00",
      isOwn: false,
    },
    {
      id: "m3-5",
      senderId: "me",
      senderName: "You",
      body: "Full-bleed on every spread. Let the photography be the hero. Minimal text overlay.",
      timestamp: "2026-03-09T14:30:00",
      isOwn: true,
    },
    {
      id: "m3-6",
      senderId: "c3",
      senderName: "David Kim",
      body: "Got it. Bold and immersive. I'll have the revisions done by 3 PM.",
      timestamp: "2026-03-09T16:20:00",
      isOwn: false,
    },
  ],
  c4: [
    {
      id: "m4-1",
      senderId: "c4",
      senderName: "Sarah Chen",
      body: "Quick question — do we want to include market stats in the March newsletter?",
      timestamp: "2026-03-09T10:00:00",
      isOwn: false,
    },
    {
      id: "m4-2",
      senderId: "me",
      senderName: "You",
      body: "Definitely. The Q1 numbers look strong, especially in the luxury segment. Let's highlight median price growth.",
      timestamp: "2026-03-09T10:10:00",
      isOwn: true,
    },
    {
      id: "m4-3",
      senderId: "c4",
      senderName: "Sarah Chen",
      body: "Perfect. I'll pull the data from our analytics dashboard and draft a section. Also, I finished the blog post about spring staging tips.",
      timestamp: "2026-03-09T10:20:00",
      isOwn: false,
    },
    {
      id: "m4-4",
      senderId: "me",
      senderName: "You",
      body: "Awesome, send it over when you're ready.",
      timestamp: "2026-03-09T10:25:00",
      isOwn: true,
    },
    {
      id: "m4-5",
      senderId: "c4",
      senderName: "Sarah Chen",
      body: "The blog post draft is in your inbox.",
      timestamp: "2026-03-09T14:00:00",
      isOwn: false,
    },
  ],
  c5: [
    {
      id: "m5-1",
      senderId: "me",
      senderName: "You",
      body: "Mike, the large format printer is showing an error again. Paper jam on tray 2.",
      timestamp: "2026-03-08T10:00:00",
      isOwn: true,
    },
    {
      id: "m5-2",
      senderId: "c5",
      senderName: "Mike Torres",
      body: "On it. I'll head over to the marketing suite now.",
      timestamp: "2026-03-08T10:05:00",
      isOwn: false,
    },
    {
      id: "m5-3",
      senderId: "me",
      senderName: "You",
      body: "Thanks Mike. We have a print deadline at noon so it's a bit urgent.",
      timestamp: "2026-03-08T10:08:00",
      isOwn: true,
    },
    {
      id: "m5-4",
      senderId: "c5",
      senderName: "Mike Torres",
      body: "Found the issue — someone loaded the wrong paper stock. Clearing it now.",
      timestamp: "2026-03-08T10:30:00",
      isOwn: false,
    },
    {
      id: "m5-5",
      senderId: "me",
      senderName: "You",
      body: "You're a lifesaver. Thanks!",
      timestamp: "2026-03-08T10:35:00",
      isOwn: true,
    },
    {
      id: "m5-6",
      senderId: "c5",
      senderName: "Mike Torres",
      body: "Printer is back online, all good now.",
      timestamp: "2026-03-08T11:30:00",
      isOwn: false,
    },
  ],
}
