// ─── Mock Data — extracted from IntakeUI.jsx ─────────────────────────────────
// All constants are typed and exported for use across dashboard views.

import type { RequestStatus } from '@/components/primitives';

// ─── Request Types ───────────────────────────────────────────────────────────

export interface MockMessage {
  id: string;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
}

export interface ReferenceFile {
  id: string;
  fileName: string;
  fileType: string;
  url: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

export interface MockRequest {
  id: string;
  queueNumber: number;
  title: string;
  materialType: string;
  status: RequestStatus | string;
  priority: string;
  isRush: boolean;
  listingAddress: string | null;
  mlsId: string | null;
  requesterName: string;
  designerName: string | null;
  dueDate: string;
  submittedAt: string;
  slaDeadline: string;
  slaBreached: boolean;
  currentStep: string;
  thumbnailUrl: string | null;
  brief?: string;
  targetAudience?: string | null;
  brandGuidelines?: string | null;
  referenceFiles?: ReferenceFile[];
  materialsLog?: Array<{ id: string; requestedAt: string; requestedBy: string; items: string[]; note: string }>;
  steps?: Array<{ step: string; completedAt: string; completedByName: string }>;
  messages: MockMessage[];
  assets?: Array<{ id: string; fileName: string; assetType: string; revisionNumber: number; isCurrentVersion: boolean; createdAt: string }>;
  feasibilityFlag?: boolean;
  cancelReason?: string;
  cancelledBy?: string;
}

// ─── Agent Requests ──────────────────────────────────────────────────────────

export const MOCK_REQUESTS: MockRequest[] = [
  {
    id: 'req-001', queueNumber: 42, title: 'Just Listed — 8920 E Pinnacle Peak Rd',
    materialType: 'Flyer', status: 'in_progress', priority: 'standard',
    isRush: false, listingAddress: '8920 E Pinnacle Peak Rd, Scottsdale AZ 85255',
    mlsId: '6812340', requesterName: 'Yong Choi', designerName: 'Lex Baum',
    dueDate: '2026-03-14', submittedAt: '2026-03-08T09:12:00Z',
    slaDeadline: '2026-03-15T09:12:00Z', slaBreached: false,
    currentStep: 'in_progress', thumbnailUrl: null,
    steps: [
      { step: 'submitted', completedAt: '2026-03-08T09:12:00Z', completedByName: 'Yong Choi' },
      { step: 'assigned', completedAt: '2026-03-08T11:00:00Z', completedByName: 'Lex Baum' },
      { step: 'in_progress', completedAt: '2026-03-09T08:30:00Z', completedByName: 'Lex Baum' },
    ],
    messages: [
      { id: 'm1', senderName: 'Yong Choi', senderRole: 'requester', body: 'Please use the twilight photo for the hero image. Client loves that shot.', createdAt: '2026-03-08T09:15:00Z' },
      { id: 'm2', senderName: 'Lex Baum', senderRole: 'designer', body: "Got it — pulling the MLS photos now. I'll have a first draft to you by EOD tomorrow.", createdAt: '2026-03-08T11:05:00Z' },
      { id: 'm3', senderName: 'Yong Choi', senderRole: 'requester', body: 'Perfect. Also can we add the mountain views callout in the copy?', createdAt: '2026-03-09T07:45:00Z' },
    ],
    brief: 'Twilight hero photo for the front page — client specifically requested this. Highlight the mountain views in the copy. Keep it clean and editorial, consistent with Russ Lyon brand standards. Print-ready for 8.5×11.',
    targetAudience: null, brandGuidelines: null,
    referenceFiles: [
      { id: 'rf1', fileName: 'pinnacle-peak-twilight.jpg', fileType: 'image', url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80', uploadedBy: 'Yong Choi', uploadedAt: '2026-03-08T09:12:00Z' },
      { id: 'rf2', fileName: 'pinnacle-peak-pool.jpg', fileType: 'image', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80', uploadedBy: 'Yong Choi', uploadedAt: '2026-03-08T09:12:00Z' },
      { id: 'rf3', fileName: 'pinnacle-peak-interior.jpg', fileType: 'image', url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&q=80', uploadedBy: 'Yong Choi', uploadedAt: '2026-03-08T09:12:00Z' },
      { id: 'rf4', fileName: 'brand-guidelines-2026.pdf', fileType: 'pdf', url: null, uploadedBy: 'Yong Choi', uploadedAt: '2026-03-08T09:12:00Z' },
    ],
    materialsLog: [],
    assets: [
      { id: 'a1', fileName: 'pinnacle-peak-draft-v1.pdf', assetType: 'working', revisionNumber: 1, isCurrentVersion: true, createdAt: '2026-03-09T16:00:00Z' },
    ],
  },
  {
    id: 'req-002', queueNumber: 38, title: 'Agent Branding — Spring Social Kit',
    materialType: 'Social Pack', status: 'in_review', priority: 'standard',
    isRush: false, listingAddress: null, mlsId: null,
    requesterName: 'Yong Choi', designerName: 'Lex Baum',
    dueDate: '2026-03-12', submittedAt: '2026-03-05T14:00:00Z',
    slaDeadline: '2026-03-12T14:00:00Z', slaBreached: false,
    currentStep: 'review', thumbnailUrl: null,
    steps: [
      { step: 'submitted', completedAt: '2026-03-05T14:00:00Z', completedByName: 'Yong Choi' },
      { step: 'assigned', completedAt: '2026-03-05T15:30:00Z', completedByName: 'Lex Baum' },
      { step: 'in_progress', completedAt: '2026-03-06T09:00:00Z', completedByName: 'Lex Baum' },
      { step: 'review', completedAt: '2026-03-08T14:00:00Z', completedByName: 'Lex Baum' },
    ],
    messages: [
      { id: 'm4', senderName: 'Lex Baum', senderRole: 'designer', body: 'First draft is ready for your review. Let me know what you think!', createdAt: '2026-03-08T14:01:00Z' },
    ],
    brief: 'Spring 2026 social content kit — 4 Instagram posts, 2 stories, 1 LinkedIn banner. Tone should be warm and aspirational. Use the new headshot from the brand folder. Gold and navy palette, keep it consistent with the Russ Lyon brand kit.',
    targetAudience: 'Luxury buyers and sellers in Scottsdale / Paradise Valley corridor',
    brandGuidelines: 'Russ Lyon brand kit v4 — see uploaded PDF',
    referenceFiles: [
      { id: 'rf5', fileName: 'yong-headshot-2026.jpg', fileType: 'image', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80', uploadedBy: 'Yong Choi', uploadedAt: '2026-03-05T14:00:00Z' },
      { id: 'rf6', fileName: 'russ-lyon-brand-kit-v4.pdf', fileType: 'pdf', url: null, uploadedBy: 'Yong Choi', uploadedAt: '2026-03-05T14:00:00Z' },
    ],
    materialsLog: [
      { id: 'ml1', requestedAt: '2026-03-06T10:00:00Z', requestedBy: 'Lex Baum', items: ['Brand Assets', 'Output Specifications'], note: "Need the exact Instagram crop sizes and whether we're doing square or portrait." },
    ],
    assets: [
      { id: 'a2', fileName: 'spring-social-kit-v1.zip', assetType: 'working', revisionNumber: 1, isCurrentVersion: true, createdAt: '2026-03-08T13:55:00Z' },
    ],
  },
  {
    id: 'req-003', queueNumber: 51, title: 'Open House — 4821 N 74th St',
    materialType: 'Flyer', status: 'submitted', priority: 'rush',
    isRush: true, listingAddress: '4821 N 74th St, Scottsdale AZ 85251',
    mlsId: '6819002', requesterName: 'Yong Choi', designerName: null,
    dueDate: '2026-03-10', submittedAt: '2026-03-08T15:30:00Z',
    slaDeadline: '2026-03-10T15:30:00Z', slaBreached: false,
    currentStep: 'submitted', thumbnailUrl: null,
    brief: 'Open house this Saturday 10am–2pm. Need a clean flyer, address prominent, open house time large. Pull MLS photos. Standard Russ Lyon flyer template.',
    targetAudience: null, brandGuidelines: null,
    referenceFiles: [], materialsLog: [],
    steps: [
      { step: 'submitted', completedAt: '2026-03-08T15:30:00Z', completedByName: 'Yong Choi' },
    ],
    messages: [],
    assets: [],
  },
];

// ─── All Requests (Designer + Manager view) ──────────────────────────────────

export const DESIGNER_ALL_REQUESTS: MockRequest[] = [
  ...MOCK_REQUESTS,
  {
    id: 'req-004', queueNumber: 44, title: 'Market Report — Paradise Valley Q1',
    materialType: 'Report', status: 'in_progress', priority: 'standard',
    isRush: false, listingAddress: null, mlsId: null,
    requesterName: 'Sarah Mitchell', designerName: 'Lex Baum',
    dueDate: '2026-03-18', submittedAt: '2026-03-07T10:00:00Z',
    slaDeadline: '2026-03-14T10:00:00Z', slaBreached: true,
    currentStep: 'in_progress', thumbnailUrl: null, steps: [], messages: [], assets: [],
  },
  {
    id: 'req-005', queueNumber: 39, title: 'Listing Video — Desert Mountain',
    materialType: 'Video', status: 'assigned', priority: 'standard',
    isRush: false, listingAddress: '10801 E Happy Valley Rd, Scottsdale AZ',
    mlsId: '6800123', requesterName: 'Chris Barlow', designerName: 'Marcus Webb',
    dueDate: '2026-03-20', submittedAt: '2026-03-06T08:00:00Z',
    slaDeadline: '2026-03-20T08:00:00Z', slaBreached: false,
    currentStep: 'assigned', thumbnailUrl: null, steps: [], messages: [], assets: [],
  },
  {
    id: 'req-006', queueNumber: 51, title: 'Just Listed — Arcadia Modern',
    materialType: 'Flyer', status: 'submitted', priority: 'rush',
    isRush: true, listingAddress: '4201 E Camelback Rd, Phoenix AZ',
    mlsId: '6801234', requesterName: 'Sarah Patel', designerName: '',
    dueDate: '2026-03-10', submittedAt: '2026-03-08T07:00:00Z',
    slaDeadline: '2026-03-10T17:00:00Z', slaBreached: false,
    feasibilityFlag: false, currentStep: 'new', thumbnailUrl: null, steps: [], messages: [], assets: [],
  },
  {
    id: 'req-007', queueNumber: 48, title: 'Spring Social Pack — Troon North',
    materialType: 'Social Pack', status: 'submitted', priority: 'standard',
    isRush: false, listingAddress: '25555 N Windy Walk Dr, Scottsdale AZ',
    mlsId: '6801356', requesterName: 'Marcus Chen', designerName: '',
    dueDate: '2026-03-11', submittedAt: '2026-03-07T09:00:00Z',
    slaDeadline: '2026-03-09T17:00:00Z', slaBreached: true,
    feasibilityFlag: false, currentStep: 'new', thumbnailUrl: null, steps: [], messages: [], assets: [],
  },
  {
    id: 'req-008', queueNumber: 46, title: 'Broker Preview Video — McCormick Ranch',
    materialType: 'Video', status: 'assigned', priority: 'standard',
    isRush: false, listingAddress: '8901 E Pinnacle Peak Rd, Scottsdale AZ',
    mlsId: '6801489', requesterName: 'Lonnie Lopez', designerName: 'Marcus Webb',
    dueDate: '2026-03-09', submittedAt: '2026-03-06T11:00:00Z',
    slaDeadline: '2026-03-08T09:00:00Z', slaBreached: true,
    feasibilityFlag: true, currentStep: 'assigned', thumbnailUrl: null, steps: [], messages: [], assets: [],
  },
  {
    id: 'req-009', queueNumber: 43, title: 'Q1 Market Report — Scottsdale',
    materialType: 'Report', status: 'submitted', priority: 'standard',
    isRush: false, listingAddress: null, mlsId: null,
    requesterName: 'Yong Choi', designerName: '',
    dueDate: '2026-03-12', submittedAt: '2026-03-07T15:00:00Z',
    slaDeadline: '2026-03-12T17:00:00Z', slaBreached: false,
    feasibilityFlag: false, currentStep: 'new', thumbnailUrl: null, steps: [], messages: [], assets: [],
  },
  {
    id: 'req-010', queueNumber: 41, title: 'Open House Signage — Gainey Ranch',
    materialType: 'Print', status: 'in_progress', priority: 'rush',
    isRush: true, listingAddress: '7700 E Gainey Ranch Rd, Scottsdale AZ',
    mlsId: '6801590', requesterName: 'David Park', designerName: 'Lex Baum',
    dueDate: '2026-03-09', submittedAt: '2026-03-06T14:00:00Z',
    slaDeadline: '2026-03-09T12:00:00Z', slaBreached: true,
    feasibilityFlag: false, currentStep: 'in_progress', thumbnailUrl: null, steps: [], messages: [], assets: [],
  },
];

// ─── Status Config ───────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:              { label: 'Draft',              color: '#6B7280' },
  submitted:          { label: 'Submitted',          color: '#B45309' },
  assigned:           { label: 'Assigned',           color: '#1D4ED8' },
  in_progress:        { label: 'In Progress',        color: '#0369A1' },
  review:             { label: 'In Review',          color: '#7C3AED' },
  in_review:          { label: 'In Review',          color: '#7C3AED' },
  revision:           { label: 'Revision',           color: '#C2410C' },
  approved:           { label: 'Approved',           color: '#15803D' },
  completed:          { label: 'Completed',          color: '#166534' },
  cancelled:          { label: 'Cancelled',          color: '#6B7280' },
  on_hold:            { label: 'On Hold',            color: '#92400E' },
  awaiting_materials: { label: 'Awaiting Materials', color: '#0891B2' },
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const AGENT_TASKS = [
  { id: 1, text: 'Approve Spring Social Kit draft', priority: 'high', type: 'approval', req: 'req-002', due: 'Today' },
  { id: 2, text: 'Upload MLS photos for Open House flyer', priority: 'high', type: 'upload', req: 'req-003', due: 'Today' },
  { id: 3, text: 'Review Pinnacle Peak first draft', priority: 'medium', type: 'review', req: 'req-001', due: 'Mar 14' },
];

export const DESIGNER_TASKS = [
  { id: 1, text: 'Finish Pinnacle Peak flyer — due Mar 14', priority: 'high', type: 'work', req: 'req-001', due: 'Mar 14' },
  { id: 2, text: 'Pick up Open House flyer — rush order', priority: 'high', type: 'work', req: 'req-003', due: 'Mar 10' },
  { id: 3, text: 'Send Spring Social Kit back to review', priority: 'medium', type: 'review', req: 'req-002', due: 'Mar 12' },
];

// ─── Activity Feed ───────────────────────────────────────────────────────────

export const ACTIVITY_FEED = [
  { id: 1, actor: 'Yong Choi', action: 'submitted', target: 'Open House — 4821 N 74th St', time: '2h ago', type: 'submit' },
  { id: 2, actor: 'Lex Baum', action: 'sent to review', target: 'Agent Branding — Spring Social Kit', time: '4h ago', type: 'review' },
  { id: 3, actor: 'Yong Choi', action: 'commented on', target: 'Just Listed — Pinnacle Peak', time: '6h ago', type: 'message' },
  { id: 4, actor: 'Lex Baum', action: 'started work on', target: 'Just Listed — Pinnacle Peak', time: '1d ago', type: 'work' },
  { id: 5, actor: 'System', action: 'assigned', target: 'Just Listed — Pinnacle Peak', time: '1d ago', type: 'assign' },
  { id: 6, actor: 'Yong Choi', action: 'submitted', target: 'Just Listed — Pinnacle Peak', time: '1d ago', type: 'submit' },
];

// ─── Week Trend Data ─────────────────────────────────────────────────────────

export const WEEK_TREND_DATA = [
  { day: 'Mon', thisWeek: 3, lastWeek: 2 },
  { day: 'Tue', thisWeek: 5, lastWeek: 1 },
  { day: 'Wed', thisWeek: 2, lastWeek: 3 },
  { day: 'Thu', thisWeek: 4, lastWeek: 2 },
  { day: 'Fri', thisWeek: 3, lastWeek: 4 },
  { day: 'Sat', thisWeek: 1, lastWeek: 0 },
];

// ─── Turnaround by Type ──────────────────────────────────────────────────────

export const TURNAROUND_BY_TYPE = [
  { type: 'Flyer', days: 2.1 },
  { type: 'Social Pack', days: 3.4 },
  { type: 'Report', days: 5.2 },
  { type: 'Video', days: 6.8 },
  { type: 'Brochure', days: 4.1 },
];

// ─── Calendar Events ─────────────────────────────────────────────────────────

export const CAL_EVENTS = [
  { id: 1, date: 9, time: '9:00 AM', title: 'Buyer Consultation', sub: 'Pinnacle Peak buyers', type: 'meeting', color: '#0369A1' },
  { id: 2, date: 10, time: '1:00 PM', title: 'Open House', sub: '4821 N 74th St', type: 'listing', color: '#7C3AED' },
  { id: 3, date: 11, time: '3:00 PM', title: 'Listing Presentation', sub: 'Scottsdale — new lead', type: 'listing', color: '#7C3AED' },
  { id: 4, date: 12, time: 'All day', title: 'Flyer Proof Due', sub: 'Pinnacle Peak marketing', type: 'deadline', color: '#C2410C' },
  { id: 5, date: 14, time: '10:00 AM', title: 'Broker Caravan', sub: 'Desert Mountain — 3 stops', type: 'meeting', color: '#0369A1' },
  { id: 6, date: 15, time: '9:00 AM', title: 'Russ Lyon Team Meeting', sub: 'Phoenix HQ', type: 'meeting', color: '#0369A1' },
  { id: 7, date: 17, time: '2:00 PM', title: 'Closing — Pinnacle Peak', sub: 'Escrow sign-off, $2.1M', type: 'closing', color: '#15803D' },
  { id: 8, date: 20, time: '11:00 AM', title: 'Photography Session', sub: '74th St listing', type: 'deadline', color: '#C2410C' },
  { id: 9, date: 22, time: '1:00 PM', title: 'Open House', sub: '4821 N 74th St (2nd showing)', type: 'listing', color: '#7C3AED' },
  { id: 10, date: 25, time: '3:30 PM', title: 'Offer Review', sub: 'Spring Social Kit listing', type: 'closing', color: '#15803D' },
];

// ─── Unified Messages ────────────────────────────────────────────────────────

export const UNIFIED_MESSAGES = [
  {
    id: 'm1', channel: 'platform', sender: 'Lex Baum', initials: 'LH',
    avatarBg: 'var(--brand-primary)', avatarText: 'var(--brand-accent)',
    subject: null,
    preview: 'First draft is ready for your review — take a look when you get a chance.',
    context: 'Just Listed — Pinnacle Peak',
    time: '2h ago', unread: true,
  },
  {
    id: 'm2', channel: 'email', sender: 'David Kim', initials: 'DK',
    avatarBg: '#EFF6FF', avatarText: '#1D4ED8',
    subject: 'Q2 Marketing Budget Review',
    preview: 'Can you join Thursday at 2pm? I want to walk through the new spend allocation.',
    context: null,
    time: '3h ago', unread: true,
  },
  {
    id: 'm3', channel: 'dm', sender: 'Sarah Chen', initials: 'SC',
    avatarBg: '#F0FDF4', avatarText: '#15803D',
    subject: null,
    preview: 'Hey! Are you going to the broker open at Desert Mountain on Friday?',
    context: null,
    time: '5h ago', unread: false,
  },
  {
    id: 'm4', channel: 'platform', sender: 'Lex Baum', initials: 'LH',
    avatarBg: 'var(--brand-primary)', avatarText: 'var(--brand-accent)',
    subject: null,
    preview: 'Sent the Spring Social Kit back — see revision notes in the thread.',
    context: 'Agent Branding — Spring Social Kit',
    time: '4h ago', unread: false,
  },
  {
    id: 'm5', channel: 'email', sender: 'Marcus Webb', initials: 'MW',
    avatarBg: '#FFF7ED', avatarText: '#C2410C',
    subject: 'Re: Open House Flyer — Photo Assets',
    preview: 'Got the Dropbox link, downloading now. Should have a draft to you by EOD.',
    context: null,
    time: '1d ago', unread: false,
  },
  {
    id: 'm6', channel: 'dm', sender: 'Tom Alvarez', initials: 'TA',
    avatarBg: '#F5F3FF', avatarText: '#6D28D9',
    subject: null,
    preview: 'The Pinnacle Peak listing is getting a lot of traction — any open house planned?',
    context: null,
    time: '1d ago', unread: false,
  },
];

// ─── Marketing Manager Dashboard Data ────────────────────────────────────────

export const MMD_VOLUME_12W = [
  { week: 'W1', submitted: 4, completed: 3 },
  { week: 'W2', submitted: 6, completed: 5 },
  { week: 'W3', submitted: 3, completed: 4 },
  { week: 'W4', submitted: 7, completed: 5 },
  { week: 'W5', submitted: 5, completed: 6 },
  { week: 'W6', submitted: 8, completed: 7 },
  { week: 'W7', submitted: 4, completed: 5 },
  { week: 'W8', submitted: 9, completed: 7 },
  { week: 'W9', submitted: 6, completed: 8 },
  { week: 'W10', submitted: 7, completed: 6 },
  { week: 'W11', submitted: 5, completed: 6 },
  { week: 'W12', submitted: 8, completed: 7 },
];

export const MMD_MATERIAL_BREAKDOWN = [
  { type: 'Flyer', count: 18, color: 'var(--brand-primary)' },
  { type: 'Social Pack', count: 12, color: 'var(--brand-accent)' },
  { type: 'Report', count: 9, color: '#7C3AED' },
  { type: 'Video', count: 6, color: '#0891B2' },
  { type: 'Brochure', count: 4, color: '#15803D' },
];

export const MMD_SLA_TREND = [
  { month: 'Oct', rate: 88 },
  { month: 'Nov', rate: 91 },
  { month: 'Dec', rate: 85 },
  { month: 'Jan', rate: 93 },
  { month: 'Feb', rate: 91 },
  { month: 'Mar', rate: 94 },
];

export const MMD_COMMS = [
  { id: 1, from: 'Yong Choi', initials: 'YC', subject: 'Open House flyer — quick tweak', time: '9:14 AM', unread: true, type: 'email' },
  { id: 2, from: 'David Kim', initials: 'DK', subject: 'Q1 report looks great — board loved it', time: 'Yesterday', unread: false, type: 'email' },
  { id: 3, from: 'Sarah Patel', initials: 'SP', subject: 'New listing going live Friday', time: 'Yesterday', unread: true, type: 'email' },
  { id: 4, from: 'Marcus Webb', initials: 'MW', subject: 'Pinnacle Peak — draft v2 ready', time: 'Mon', unread: false, type: 'slack' },
  { id: 5, from: 'Yong Choi', initials: 'YC', subject: 'Can we rush the social pack?', time: 'Mon', unread: false, type: 'message' },
];

export const MMD_CALENDAR = (() => {
  const today = new Date();
  const d = (offset: number, title: string, color: string, time: string) => ({
    id: offset,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset),
    title, color, time,
  });
  return [
    d(0, 'Sprint Review — Design Team', 'var(--brand-primary)', '10:00 AM'),
    d(0, 'SLA Review', '#7C3AED', '2:00 PM'),
    d(1, 'Yong Choi — Rush Flyer Deadline', '#DC2626', 'EOD'),
    d(2, 'Desert Mountain Social Kit Due', '#D97706', 'EOD'),
    d(3, 'Board Presentation Prep', 'var(--brand-primary)', '11:00 AM'),
    d(5, 'Agent Feedback Round', '#0891B2', '3:30 PM'),
    d(6, 'Weekly Queue Review', 'var(--brand-primary)', '9:00 AM'),
    d(8, 'Q1 Campaign Planning', '#15803D', '1:00 PM'),
  ];
})();

export const MKTG_CAMPAIGNS = [
  { id: 1, date: 9, title: 'Open House Push — Pinnacle Peak', type: 'social', status: 'live', agent: 'Yong Choi', color: '#7C3AED' },
  { id: 2, date: 11, title: 'Spring Collection Email Blast', type: 'email', status: 'scheduled', agent: 'Team', color: '#0369A1' },
  { id: 3, date: 12, title: '16020 N Horseshoe — Flyer Due', type: 'print', status: 'due', agent: 'Marcus Webb', color: '#C2410C' },
  { id: 4, date: 14, title: 'Desert Mountain — Spring Social Kit', type: 'social', status: 'in-design', agent: 'Lex Baum', color: '#7C3AED' },
  { id: 5, date: 15, title: 'Broker Preview Video Drop', type: 'video', status: 'scheduled', agent: 'Team', color: '#0369A1' },
  { id: 6, date: 17, title: 'Market Report — Q1 Distribution', type: 'report', status: 'scheduled', agent: 'David Kim', color: '#15803D' },
  { id: 7, date: 19, title: 'Just Listed — Arcadia Modern', type: 'social', status: 'scheduled', agent: 'Sarah Patel', color: '#7C3AED' },
  { id: 8, date: 20, title: 'Photography Shoot — 74th St', type: 'print', status: 'due', agent: 'Lex Baum', color: '#C2410C' },
  { id: 9, date: 22, title: 'Open House 2 — 74th St Social Push', type: 'social', status: 'scheduled', agent: 'Yong Choi', color: '#7C3AED' },
  { id: 10, date: 25, title: 'Monthly Sphere Email', type: 'email', status: 'scheduled', agent: 'Team', color: '#0369A1' },
  { id: 11, date: 27, title: 'Q2 Campaign Planning Deck Due', type: 'report', status: 'due', agent: 'Lex Baum', color: '#C2410C' },
  { id: 12, date: 29, title: 'Desert Mountain — Summer Preview', type: 'video', status: 'draft', agent: 'Marcus Webb', color: '#D97706' },
];

// ─── Executive View Data ─────────────────────────────────────────────────────

export const BACKLOG_TREND = [
  { week: 'Oct W1', intake: 8, completed: 9, depth: 12 },
  { week: 'Oct W2', intake: 9, completed: 8, depth: 13 },
  { week: 'Oct W3', intake: 11, completed: 9, depth: 15 },
  { week: 'Oct W4', intake: 10, completed: 8, depth: 17 },
  { week: 'Nov W1', intake: 12, completed: 9, depth: 20 },
  { week: 'Nov W2', intake: 13, completed: 10, depth: 23 },
  { week: 'Nov W3', intake: 11, completed: 9, depth: 25 },
  { week: 'Nov W4', intake: 14, completed: 10, depth: 29 },
  { week: 'Dec W1', intake: 10, completed: 11, depth: 28 },
  { week: 'Dec W2', intake: 9, completed: 10, depth: 27 },
  { week: 'Dec W3', intake: 7, completed: 9, depth: 25 },
  { week: 'Dec W4', intake: 6, completed: 8, depth: 23 },
  { week: 'Jan W1', intake: 13, completed: 9, depth: 27 },
  { week: 'Jan W2', intake: 14, completed: 10, depth: 31 },
  { week: 'Jan W3', intake: 15, completed: 10, depth: 36 },
  { week: 'Jan W4', intake: 16, completed: 11, depth: 41 },
  { week: 'Feb W1', intake: 14, completed: 10, depth: 45 },
  { week: 'Feb W2', intake: 15, completed: 11, depth: 49 },
  { week: 'Feb W3', intake: 17, completed: 11, depth: 55 },
  { week: 'Feb W4', intake: 16, completed: 10, depth: 61 },
  { week: 'Mar W1', intake: 12, completed: 8, depth: 65 },
];

export const DEMAND_BY_OFFICE = [
  { office: 'Scottsdale', ytd: 89, mom: 21 },
  { office: 'Paradise Valley', ytd: 61, mom: 14 },
  { office: 'Sedona', ytd: 34, mom: 8 },
  { office: 'Tucson', ytd: 27, mom: 6 },
  { office: 'Flagstaff', ytd: 14, mom: 3 },
];

export const CYCLE_TIME_BY_MATERIAL = [
  { material: 'Video', waitDays: 3.2, prodDays: 7.1, reviewDays: 1.8, total: 12.1 },
  { material: 'Report', waitDays: 2.1, prodDays: 4.8, reviewDays: 1.4, total: 8.3 },
  { material: 'Brochure', waitDays: 1.9, prodDays: 3.6, reviewDays: 1.2, total: 6.7 },
  { material: 'Social', waitDays: 1.4, prodDays: 2.3, reviewDays: 0.9, total: 4.6 },
  { material: 'Flyer', waitDays: 1.1, prodDays: 1.8, reviewDays: 0.7, total: 3.6 },
];

export const STAFFING_MODEL = [
  { material: 'Flyer', avgHrs: 3, monthlyVol: 18, totalHrs: 54, designerSlots: 1.4 },
  { material: 'Social Pack', avgHrs: 6, monthlyVol: 12, totalHrs: 72, designerSlots: 1.8 },
  { material: 'Report', avgHrs: 12, monthlyVol: 9, totalHrs: 108, designerSlots: 2.7 },
  { material: 'Video', avgHrs: 20, monthlyVol: 6, totalHrs: 120, designerSlots: 3.0 },
  { material: 'Brochure', avgHrs: 8, monthlyVol: 4, totalHrs: 32, designerSlots: 0.8 },
];

export const REVISION_DATA = [
  { material: 'Video', revRate: 42, avgRounds: 2.8, hrsLost: 18.4 },
  { material: 'Report', revRate: 31, avgRounds: 2.1, hrsLost: 9.6 },
  { material: 'Social', revRate: 22, avgRounds: 1.6, hrsLost: 4.2 },
  { material: 'Brochure', revRate: 18, avgRounds: 1.4, hrsLost: 3.8 },
  { material: 'Flyer', revRate: 11, avgRounds: 1.2, hrsLost: 1.4 },
];

// ─── Sales Data (Agent Dashboard) ────────────────────────────────────────────

export const QUARTERLY_SALES = [
  { quarter: 'Q1 2024', volume: 4_200_000, units: 3, label: "Q1 '24" },
  { quarter: 'Q2 2024', volume: 6_800_000, units: 5, label: "Q2 '24" },
  { quarter: 'Q3 2024', volume: 5_100_000, units: 4, label: "Q3 '24" },
  { quarter: 'Q4 2024', volume: 7_400_000, units: 6, label: "Q4 '24" },
  { quarter: 'Q1 2025', volume: 5_600_000, units: 4, label: "Q1 '25" },
];

export const MONTHLY_VOLUME = [
  { month: 'Jan', y2023: 1_100_000, y2024: 1_400_000, y2025: 1_800_000 },
  { month: 'Feb', y2023: 900_000, y2024: 1_200_000, y2025: 1_600_000 },
  { month: 'Mar', y2023: 1_400_000, y2024: 1_800_000, y2025: 2_100_000 },
  { month: 'Apr', y2023: 1_200_000, y2024: 2_100_000, y2025: 1_900_000 },
  { month: 'May', y2023: 1_800_000, y2024: 2_400_000, y2025: 2_600_000 },
  { month: 'Jun', y2023: 2_100_000, y2024: 2_300_000, y2025: 2_200_000 },
  { month: 'Jul', y2023: 1_600_000, y2024: 1_900_000, y2025: null },
  { month: 'Aug', y2023: 1_900_000, y2024: 2_200_000, y2025: null },
  { month: 'Sep', y2023: 1_300_000, y2024: 1_000_000, y2025: null },
  { month: 'Oct', y2023: 1_700_000, y2024: 1_800_000, y2025: null },
  { month: 'Nov', y2023: 2_200_000, y2024: 2_600_000, y2025: null },
  { month: 'Dec', y2023: 2_500_000, y2024: 3_100_000, y2025: null },
];

// ─── Intake Queue (Designer Dashboard) ───────────────────────────────────────

export const INTAKE_QUEUE = [
  {
    id: 'iq-001', queueNumber: 55,
    title: 'Just Listed — 7200 E Gainey Ranch Rd #210',
    requesterName: 'Sandra Moore', office: 'Scottsdale',
    materialType: 'Flyer', isRush: false,
    submittedAt: '2026-03-08T07:45:00Z',
    dueDate: '2026-03-13',
    estimatedPages: 2,
    brief: 'Standard just-listed flyer for a condo in Gainey Ranch. Pull MLS photos. Standard template.',
    attachments: 3,
  },
  {
    id: 'iq-002', queueNumber: 56,
    title: 'Agent Bio + Brand Package — Full Rebrand',
    requesterName: 'Tom Alvarez', office: 'Phoenix',
    materialType: 'Brand Package', isRush: false,
    submittedAt: '2026-03-08T08:10:00Z',
    dueDate: '2026-03-11',
    estimatedPages: 14,
    brief: 'Full rebrand: new logo, business card, bio page, email signature, 3 social templates, letterhead, and 8-page buyer presentation.',
    attachments: 1,
  },
  {
    id: 'iq-003', queueNumber: 57,
    title: 'Luxury Market Report — Q1 2026 Full Report',
    requesterName: 'Patricia Westfield', office: 'Scottsdale',
    materialType: 'Report', isRush: true,
    submittedAt: '2026-03-08T09:00:00Z',
    dueDate: '2026-03-10',
    estimatedPages: 47,
    brief: '47-page luxury market report covering all 14 Scottsdale submarkets. Rush — needed for board meeting Monday morning.',
    attachments: 0,
  },
  {
    id: 'iq-004', queueNumber: 58,
    title: 'Open House — 3901 E Camelback Rd #180',
    requesterName: 'Yong Choi', office: 'Scottsdale',
    materialType: 'Flyer', isRush: true,
    submittedAt: '2026-03-08T11:30:00Z',
    dueDate: '2026-03-09',
    estimatedPages: 1,
    brief: 'Open house tomorrow 11am–3pm. Simple flyer, address + time prominent. Pull MLS photos.',
    attachments: 2,
  },
  {
    id: 'iq-005', queueNumber: 59,
    title: 'Social Media Kit — Spring Campaign',
    requesterName: 'Chris Barlow', office: 'Paradise Valley',
    materialType: 'Social Pack', isRush: false,
    submittedAt: '2026-03-07T16:00:00Z',
    dueDate: '2026-03-16',
    estimatedPages: 6,
    brief: '4 Instagram posts, 2 stories, 1 LinkedIn banner. Spring 2026 listings campaign.',
    attachments: 4,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function slaCountdown(deadlineStr: string | null, paused = false): { label: string; urgent: boolean; paused?: boolean } {
  if (!deadlineStr) return { label: '—', urgent: false };
  if (paused) return { label: 'SLA PAUSED', urgent: false, paused: true };
  const diff = new Date(deadlineStr).getTime() - Date.now();
  if (diff <= 0) return { label: 'BREACHED', urgent: true };
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return { label: `${hrs}h left`, urgent: hrs < 8 };
  const days = Math.floor(hrs / 24);
  return { label: `${days}d left`, urgent: days <= 1 };
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatCurrency(v: number | null): string {
  if (v == null) return '—';
  return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;
}
