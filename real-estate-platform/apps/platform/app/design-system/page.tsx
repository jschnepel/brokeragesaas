'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/primitives';
import type { RequestStatus } from '@/components/primitives';
import { RushBadge } from '@/components/primitives';
import { SLAIndicator } from '@/components/primitives';
import { SectionHeader } from '@/components/primitives';
import { KPITile } from '@/components/primitives';
import { GlassCard } from '@/components/primitives';
import { fadeIn } from '@/lib/motion';
import { RequestCard, NewRequestModal, CancelModal, ChatThread, ProfileDrawer } from '@/components/features';

const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/design-system',          icon: <span>◈</span> },
  { label: 'Requests',     href: '/design-system/requests', icon: <span>◫</span> },
  { label: 'Design Queue', href: '/design-system/queue',    icon: <span>◧</span> },
  { label: 'Reports',      href: '/design-system/reports',  icon: <span>◩</span> },
];

const ALL_STATUSES: RequestStatus[] = [
  'draft', 'submitted', 'in_review', 'assigned',
  'in_progress', 'awaiting_materials', 'completed', 'cancelled',
];

const MOCK_REQUEST = {
  id: 'req-001',
  title: 'Just Listed — 8920 E Pinnacle Peak Rd',
  materialType: 'Flyer',
  status: 'in_progress' as RequestStatus,
  isRush: true,
  designerName: 'Lex Baum',
  requesterName: 'Yong Choi',
  submittedAt: '2026-03-06T09:12:00Z',
  slaDeadline: new Date(Date.now() + 36 * 3600000).toISOString(),
  slaBreached: false,
  referenceFiles: [{ url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80' }],
  lastMessage: { preview: 'Please use the twilight photo for the hero image.', time: '2h ago' },
};

const MOCK_REQUEST_COMPACT = {
  id: 'req-002',
  title: 'Agent Branding — Spring Social Kit',
  materialType: 'Social Pack',
  status: 'submitted' as RequestStatus,
  isRush: false,
  requesterName: 'Marcus Chen',
  submittedAt: '2026-03-05T14:00:00Z',
  slaDeadline: new Date(Date.now() + 5 * 86400000).toISOString(),
  slaBreached: false,
};

const MOCK_CANCEL_REQUEST = {
  id: 'req-003',
  title: 'Open House — 4821 N 74th St, Scottsdale AZ 85251',
  status: 'submitted' as RequestStatus,
};

const MOCK_CHAT_MESSAGES = [
  { id: 'm1', senderId: 'yong', senderName: 'Yong Choi', senderInitials: 'YC', content: 'Please use the twilight photo for the hero image. Client loves that shot.', sentAt: '2026-03-06T09:15:00Z', isOwn: false },
  { id: 'm2', senderId: 'lex', senderName: 'Lex Baum', senderInitials: 'LB', content: "Got it — pulling the MLS photos now. I'll have a first draft to you by EOD tomorrow.", sentAt: '2026-03-06T11:05:00Z', isOwn: true },
  { id: 'm3', senderId: 'yong', senderName: 'Yong Choi', senderInitials: 'YC', content: 'Perfect. Also can we add the mountain views callout in the copy?', sentAt: '2026-03-07T07:45:00Z', isOwn: false },
  { id: 'm4', senderId: 'lex', senderName: 'Lex Baum', senderInitials: 'LB', content: 'Absolutely — adding that to the hero section right now. Should be ready for your review by 3pm.', sentAt: '2026-03-07T08:30:00Z', isOwn: true },
];

const MOCK_AGENT = {
  id: 'yong-choi',
  name: 'Yong Choi',
  initials: 'YC',
  role: 'Agent',
  email: 'yong.choi@russlyon.com',
  phone: '(480) 555-0142',
  title: 'Luxury Real Estate Advisor',
  office: 'Scottsdale — Pinnacle Peak',
  bio: 'Specializing in luxury properties across Scottsdale, Paradise Valley, and the Desert Mountain corridor. 15+ years helping families find their dream home in Arizona.',
};

export default function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <AppShell
      sidebarItems={NAV_ITEMS}
      user={{ name: 'Lex Baum', role: 'Marketing Manager', initials: 'LB' }}
      topBarTitle="Design System"
      topBarSubtitle="Atomic component gallery — navy/gold theme verification"
    >
      {/* ── 1. Token Swatches ──────────────────────────────── */}
      <SectionHeader title="Brand Tokens" />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
        {[
          { label: 'Primary',     bg: 'var(--brand-primary)',     text: '#fff' },
          { label: 'Accent',      bg: 'var(--brand-accent)',      text: '#fff' },
          { label: 'Surface',     bg: 'var(--brand-surface)',     text: 'var(--brand-primary)' },
          { label: 'Surface Alt', bg: 'var(--brand-surface-alt)', text: 'var(--brand-primary)' },
          { label: 'Sidebar',     bg: 'var(--brand-sidebar)',     text: '#fff' },
          { label: 'Dark',        bg: 'var(--brand-dark)',        text: '#fff' },
          { label: 'Destructive', bg: '#DC2626',                  text: '#fff' },
          { label: 'Success',     bg: '#15803D',                  text: '#fff' },
          { label: 'Warning',     bg: '#D97706',                  text: '#fff' },
        ].map(s => (
          <div key={s.label} style={{
            width: 100, height: 60, background: s.bg, border: '1px solid var(--color-border)',
            borderRadius: 'var(--brand-radius)', display: 'flex', alignItems: 'flex-end', padding: '6px 8px',
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: s.text, letterSpacing: '0.06em' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── 2. Buttons ─────────────────────────────────────── */}
      <SectionHeader title="Buttons" />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <Button>Primary</Button>
        <Button variant="accent">Accent</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="destructive">Destructive</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 32 }}>
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">◈</Button>
      </div>

      {/* ── 3. Badges ──────────────────────────────────────── */}
      <SectionHeader title="Status Badges" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        {ALL_STATUSES.map(s => <StatusBadge key={s} status={s} />)}
        <RushBadge />
      </div>
      <SectionHeader title="shadcn Badge Variants" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 32 }}>
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="rush">Rush</Badge>
      </div>

      {/* ── 4. Inputs ──────────────────────────────────────── */}
      <SectionHeader title="Inputs" />
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32, maxWidth: 600 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 4 }}>
            Listing Address
          </label>
          <Input placeholder="8920 E Pinnacle Peak Rd, Scottsdale AZ" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 4 }}>
            Material Type
          </label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flyer">Flyer</SelectItem>
              <SelectItem value="social">Social Pack</SelectItem>
              <SelectItem value="report">Market Report</SelectItem>
              <SelectItem value="video">Listing Video</SelectItem>
              <SelectItem value="brochure">Property Brochure</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div style={{ width: '100%' }}>
          <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 4 }}>
            Creative Brief
          </label>
          <Textarea placeholder="Twilight hero photo for the front page — client specifically requested this. Highlight the mountain views in the copy." />
        </div>
      </div>

      {/* ── 5. Cards ───────────────────────────────────────── */}
      <SectionHeader title="Cards" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-primary)' }}>
              Just Listed — 8920 E Pinnacle Peak Rd
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: '#9CA3AF', marginTop: 4 }}>
              Submitted by Yong Choi · 2 days ago
            </div>
          </CardContent>
          <CardFooter>
            <StatusBadge status="in_progress" size="sm" />
          </CardFooter>
        </Card>

        <GlassCard style={{ padding: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>
            Glass Card
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-primary)' }}>
            Frosted glass effect with optional gold glow. Background blur controlled by <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>--brand-card-blur</code> token.
          </div>
        </GlassCard>

        <GlassCard glow style={{ padding: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brand-accent)', marginBottom: 8 }}>
            Glass Card — Glow
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-primary)' }}>
            Gold accent glow variant for featured or selected states.
          </div>
        </GlassCard>
      </div>

      <SectionHeader title="KPI Tiles" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
        <KPITile label="Open Requests" value="24" accent="var(--brand-primary)" barPct={72} signal="6 new today" target="Target: <30" />
        <KPITile label="SLA Compliance" value="92.4%" accent="var(--brand-accent)" barPct={92} signal="↑ 3.1% this week" target="Target: 95%" />
        <KPITile label="Avg Turnaround" value="1.8d" accent="#15803D" barPct={64} signal="↓ 0.4d improvement" target="Target: <2d" />
        <KPITile label="Rush Queue" value="3" accent="#DC2626" barPct={30} signal="2 due within 4h" target="Target: 0" />
      </div>

      {/* ── 6. Tabs ────────────────────────────────────────── */}
      <SectionHeader title="Tabs" />
      <div style={{ marginBottom: 32 }}>
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active Requests</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <Card>
              <CardContent style={{ padding: 16 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-primary)' }}>
                  12 active requests across 3 designers. 2 rush items need attention.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="completed">
            <Card>
              <CardContent style={{ padding: 16 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-primary)' }}>
                  48 requests completed this month. Average turnaround: 1.8 days.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="archive">
            <Card>
              <CardContent style={{ padding: 16 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: '#9CA3AF' }}>
                  Archived requests from previous quarters.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── 7. SLA Indicator ───────────────────────────────── */}
      <SectionHeader title="SLA Indicator" />
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <SLAIndicator deadline="2020-01-01T00:00:00Z" />
          <span style={{ fontSize: 8, color: '#9CA3AF' }}>Overdue</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <SLAIndicator deadline={new Date(Date.now() + 2 * 3600000).toISOString()} />
          <span style={{ fontSize: 8, color: '#9CA3AF' }}>Urgent (2h)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <SLAIndicator deadline={new Date(Date.now() + 3 * 86400000).toISOString()} />
          <span style={{ fontSize: 8, color: '#9CA3AF' }}>Normal (3d)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <SLAIndicator deadline="2026-03-15T00:00:00Z" paused />
          <span style={{ fontSize: 8, color: '#9CA3AF' }}>Paused</span>
        </div>
      </div>

      {/* ── 8. Section Headers ─────────────────────────────── */}
      <SectionHeader title="Section Headers" />
      <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', padding: 16 }}>
          <SectionHeader title="Active Queue" count={12} />
          <div style={{ fontSize: 'var(--text-xs)', color: '#9CA3AF' }}>With count chip</div>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', padding: 16 }}>
          <SectionHeader title="Designer Workload" action={<Button size="sm" variant="outline">Export CSV</Button>} />
          <div style={{ fontSize: 'var(--text-xs)', color: '#9CA3AF' }}>With action button</div>
        </div>
      </div>

      {/* ── 9. Typography ──────────────────────────────────── */}
      <SectionHeader title="Type Scale" />
      <Card>
        <CardContent style={{ padding: 20 }}>
          {[
            { label: 'display', size: 'var(--text-display)', family: 'var(--font-display)', text: "Sotheby's International Realty" },
            { label: '2xl',     size: 'var(--text-2xl)',     family: 'var(--font-display)', text: 'Desert Mountain Estate' },
            { label: 'xl',      size: 'var(--text-xl)',      family: 'var(--font-body)',    text: 'Open House Flyer — 16020 N Horseshoe Dr' },
            { label: 'lg',      size: 'var(--text-lg)',      family: 'var(--font-body)',    text: 'Marketing Request submitted by Yong Choi' },
            { label: 'base',    size: 'var(--text-base)',    family: 'var(--font-body)',    text: 'SLA deadline: 48hr from assignment — currently on track' },
            { label: 'sm',      size: 'var(--text-sm)',      family: 'var(--font-body)',    text: 'REQ-0042 · In Progress · Assigned to Lex Baum' },
            { label: 'xs',      size: 'var(--text-xs)',      family: 'var(--font-body)',    text: 'SUBMITTED · 2 DAYS AGO · RUSH' },
            { label: 'mono',    size: 'var(--text-sm)',      family: 'var(--font-mono)',    text: '14:32:07  ·  SLA  92.4%  ·  req-0042' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', width: 48, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{t.label}</span>
              <span style={{ fontSize: t.size, fontFamily: t.family, color: 'var(--brand-primary)', lineHeight: 1.4 }}>{t.text}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <div style={{ marginBottom: 32 }} />

      {/* ── 10. Dialog ─────────────────────────────────────── */}
      <SectionHeader title="Dialog" />
      <div style={{ marginBottom: 32 }}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Open Request Detail</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Just Listed — 8920 E Pinnacle Peak Rd</DialogTitle>
              <DialogDescription>
                Open House Flyer · Submitted by Yong Choi · REQ-0042
              </DialogDescription>
            </DialogHeader>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--brand-primary)', lineHeight: 1.6 }}>
              Twilight hero photo for the front page — client specifically requested this.
              Highlight the mountain views in the copy. Keep it clean and editorial,
              consistent with Russ Lyon brand standards. Print-ready for 8.5×11.
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <StatusBadge status="in_progress" />
              <SLAIndicator deadline={new Date(Date.now() + 36 * 3600000).toISOString()} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="accent">Approve</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── 11. Framer Motion ──────────────────────────────── */}
      <SectionHeader title="Framer Motion — Fade In" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { title: 'Pinnacle Peak Estate', addr: '8920 E Pinnacle Peak Rd', type: 'Flyer' },
          { title: 'Desert Mountain Villa', addr: '10801 E Happy Valley Rd', type: 'Social Pack' },
          { title: 'Arcadia Modern', addr: '4201 E Camelback Rd', type: 'Market Report' },
          { title: 'Gainey Ranch Retreat', addr: '7700 E Gainey Ranch Rd', type: 'Property Brochure' },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: i * 0.08 }}
          >
            <Card>
              <CardContent style={{ padding: 16 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 4 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: '#9CA3AF', marginBottom: 8 }}>
                  {item.addr}
                </div>
                <Badge variant="accent" size="sm">{item.type}</Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {/* ── 12. Feature Components ────────────────────── */}
      <SectionHeader title="Feature Components" />

      {/* RequestCard — full */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>RequestCard — Full</div>
        <div style={{ maxWidth: 360 }}>
          <RequestCard
            request={MOCK_REQUEST}
            onClick={r => console.log('Clicked request:', r.id)}
            onCancel={r => console.log('Cancel request:', r.id)}
          />
        </div>
      </div>

      {/* RequestCard — compact */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>RequestCard — Compact</div>
        <div style={{ maxWidth: 600 }}>
          <RequestCard
            request={MOCK_REQUEST_COMPACT}
            onClick={r => console.log('Clicked request:', r.id)}
            compact
          />
        </div>
      </div>

      {/* NewRequestModal */}
      <div style={{ marginBottom: 16 }}>
        <Button variant="outline" onClick={() => setNewRequestOpen(true)}>Open New Request Modal</Button>
        <NewRequestModal
          open={newRequestOpen}
          onOpenChange={setNewRequestOpen}
          onSubmit={data => { console.log('Submit:', data); setNewRequestOpen(false); }}
        />
      </div>

      {/* CancelModal */}
      <div style={{ marginBottom: 16 }}>
        <Button variant="outline" onClick={() => setCancelOpen(true)}>Open Cancel Modal</Button>
        <CancelModal
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          request={MOCK_CANCEL_REQUEST}
          role="marketing_manager"
          onConfirm={reason => { console.log('Cancel reason:', reason); setCancelOpen(false); }}
        />
      </div>

      {/* ChatThread — standalone */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>ChatThread — Standalone</div>
        <div style={{ maxWidth: 400, height: 320, background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChatThread messages={MOCK_CHAT_MESSAGES} />
        </div>
      </div>

      {/* ProfileDrawer */}
      <div style={{ marginBottom: 32 }}>
        <Button variant="outline" onClick={() => setProfileOpen(true)}>Open Profile Drawer</Button>
        <ProfileDrawer
          agent={MOCK_AGENT}
          open={profileOpen}
          onOpenChange={setProfileOpen}
        />
      </div>
    </AppShell>
  );
}
