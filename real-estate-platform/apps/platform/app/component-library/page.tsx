'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { StatusBadge, RushBadge, SLAIndicator, SectionHeader, KPITile, GlassCard } from '@/components/primitives';
import type { RequestStatus } from '@/components/primitives';
import { RequestCard } from '@/components/features';
import { TokenEditor } from '@/components/features/TokenEditor';
import { getAllThemes, saveTheme } from '@/app/actions/theme';
import type { ThemeTokens, TenantTheme } from '@/services/theme';

const DEFAULT_TOKENS: ThemeTokens = {
  'brand-primary':       '#0F2B4F',
  'brand-primary-dark':  '#0A1F3A',
  'brand-accent':        '#C9A96E',
  'brand-surface':       '#FAF7F2',
  'brand-surface-alt':   '#F3EFE8',
  'brand-dark':          '#071428',
  'brand-sidebar':       '#0A1F3A',
  'brand-font-display':  'Cormorant Garamond, Georgia, serif',
  'brand-font-body':     'DM Sans, system-ui, sans-serif',
  'brand-font-mono':     'Geist Mono, Fira Code, monospace',
  'brand-radius':        '2px',
  'brand-glow-opacity':  '0.18',
  'brand-card-blur':     '0px',
  'brand-sidebar-width': '224px',
};

const ALL_STATUSES: RequestStatus[] = [
  'draft', 'submitted', 'in_review', 'assigned',
  'in_progress', 'awaiting_materials', 'completed', 'cancelled',
];

const MOCK_REQUEST_CARD = {
  id: 'preview-1',
  title: 'Just Listed — 8920 E Pinnacle Peak Rd',
  materialType: 'Flyer',
  status: 'in_progress' as RequestStatus,
  isRush: true,
  requesterName: 'Yong Choi',
  designerName: 'Lex Baum',
  submittedAt: new Date(Date.now() - 86400000).toISOString(),
  slaDeadline: new Date(Date.now() + 172800000).toISOString(),
  slaBreached: false,
  lastMessage: { preview: 'Please use the twilight photo for the hero image.', time: new Date(Date.now() - 3600000).toISOString() },
};

export default function ComponentLibraryPage() {
  const [editMode, setEditMode] = useState(false);
  const [liveTokens, setLiveTokens] = useState<ThemeTokens>(DEFAULT_TOKENS);
  const [savedTokens, setSavedTokens] = useState<ThemeTokens>(DEFAULT_TOKENS);
  const [prebuiltThemes, setPrebuiltThemes] = useState<TenantTheme[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load themes on mount
  useEffect(() => {
    getAllThemes().then(themes => {
      setPrebuiltThemes(themes);
      const russLyon = themes.find(t => t.tenantId === 'russ-lyon');
      if (russLyon) {
        setLiveTokens(russLyon.tokens);
        setSavedTokens(russLyon.tokens);
      }
    });
  }, []);

  // Apply live tokens when editing
  useEffect(() => {
    if (!editMode) {
      // Remove override, revert to saved theme
      const el = document.getElementById('component-library-live-tokens');
      if (el) el.remove();
      return;
    }
    const styleId = 'component-library-live-tokens';
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = `:root {\n${Object.entries(liveTokens)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join('\n')}\n}`;
  }, [editMode, liveTokens]);

  async function handleSave(themeName: string) {
    setSaving(true);
    try {
      await saveTheme(themeName, liveTokens);
      setSavedTokens(liveTokens);
      // Update the ThemeProvider style tag too
      const providerEl = document.getElementById('platform-theme-tokens') as HTMLStyleElement | null;
      if (providerEl) {
        providerEl.textContent = `:root {\n${Object.entries(liveTokens)
          .map(([k, v]) => `  --${k}: ${v};`)
          .join('\n')}\n}`;
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error('Failed to save theme:', e);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setLiveTokens(DEFAULT_TOKENS);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--brand-surface)' }}>
      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* TopBar */}
        <div style={{
          height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: '1px solid var(--color-border)', background: 'white',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>
              Component Library
            </span>
            {editMode && (
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--brand-accent)', marginLeft: 8, letterSpacing: '0.06em' }}>
                EDITING
              </span>
            )}
            {saveSuccess && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#15803D', marginLeft: 12 }}>
                ✓ Saved
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant={editMode ? 'default' : 'outline'}
              onClick={() => setEditMode(!editMode)}
              style={{ fontSize: 11 }}
            >
              {editMode ? 'Exit Edit' : 'Edit Theme'}
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} style={{ fontSize: 11 }}>
              ← Back
            </Button>
          </div>
        </div>

        {/* Preview Grid */}
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {/* 1. Color Tokens */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>Color Tokens</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  ['Primary', 'var(--brand-primary)'],
                  ['Primary Dark', 'var(--brand-primary-dark)'],
                  ['Accent', 'var(--brand-accent)'],
                  ['Surface', 'var(--brand-surface)'],
                  ['Surface Alt', 'var(--brand-surface-alt)'],
                  ['Dark', 'var(--brand-dark)'],
                  ['Sidebar', 'var(--brand-sidebar)'],
                  ['Border', 'var(--color-border)'],
                ].map(([label, color]) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '100%', paddingBottom: '100%', borderRadius: 'var(--brand-radius)',
                      background: color, border: '1px solid rgba(0,0,0,0.1)',
                    }} />
                    <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 4, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 2. Typography */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>Typography</CardTitle></CardHeader>
            <CardContent>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--brand-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Display Heading
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: 'var(--brand-primary)', marginBottom: 12 }}>
                Subheading Level
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--brand-primary)', marginBottom: 8, lineHeight: 1.5 }}>
                Body text using DM Sans. The quick brown fox jumps over the lazy dog.
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>
                Caption text — secondary information style
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--brand-primary)', background: 'var(--brand-surface-alt)', padding: '4px 8px', borderRadius: 'var(--brand-radius)' }}>
                monospace: const theme = &#123;&#125;;
              </div>
            </CardContent>
          </Card>

          {/* 3. Buttons */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>Buttons</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button disabled>Disabled</Button>
              </div>
            </CardContent>
          </Card>

          {/* 4. Badges */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>Status Badges</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {ALL_STATUSES.map(s => <StatusBadge key={s} status={s} />)}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <RushBadge />
                <Badge>Default Badge</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>

          {/* 5. Inputs */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>Form Inputs</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Input placeholder="Text input..." />
                <Textarea placeholder="Textarea..." rows={2} />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flyer">Flyer</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="brochure">Brochure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 6. Cards */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>Cards & KPI Tiles</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <KPITile label="Active" value={7} accent="var(--brand-primary)" barPct={70} signal="7 in pipeline" target="Target <5" />
                <KPITile label="Rush" value={2} accent="#DC2626" barPct={66} signal="2 active" target="Watch closely" />
              </div>
              <GlassCard glow style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)' }}>Glass Card with Glow</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>Uses --brand-glow-opacity and --brand-card-blur</div>
              </GlassCard>
            </CardContent>
          </Card>

          {/* 7. Tabs */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>Tabs</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <div style={{ fontSize: 11, color: '#9CA3AF', padding: '8px 0' }}>Overview content panel</div>
                </TabsContent>
                <TabsContent value="details">
                  <div style={{ fontSize: 11, color: '#9CA3AF', padding: '8px 0' }}>Details content panel</div>
                </TabsContent>
                <TabsContent value="activity">
                  <div style={{ fontSize: 11, color: '#9CA3AF', padding: '8px 0' }}>Activity content panel</div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 8. Dialog */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>Dialog</CardTitle></CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Example Dialog</DialogTitle>
                    <DialogDescription>
                      This dialog inherits all brand tokens — border radius, colors, and typography.
                    </DialogDescription>
                  </DialogHeader>
                  <div style={{ padding: '12px 0', fontSize: 12, color: '#9CA3AF' }}>
                    Dialog content area. Forms and confirmation flows go here.
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* 9. SLA Indicators */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>SLA Indicators</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <SLAIndicator deadline={new Date(Date.now() + 259200000).toISOString()} />
                  <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>3d left</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <SLAIndicator deadline={new Date(Date.now() + 7200000).toISOString()} />
                  <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>2h left</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <SLAIndicator deadline={new Date(Date.now() - 86400000).toISOString()} />
                  <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>Overdue</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <SLAIndicator deadline={null} />
                  <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>No deadline</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 10. RequestCard */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>Request Card</CardTitle></CardHeader>
            <CardContent>
              <RequestCard
                request={MOCK_REQUEST_CARD}
                onClick={() => {}}
              />
            </CardContent>
          </Card>

          {/* 11. AppShell Preview — miniaturized sidebar */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>Sidebar Preview</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: 'flex', borderRadius: 'var(--brand-radius)', overflow: 'hidden', border: '1px solid var(--color-border)', height: 200 }}>
                <div style={{
                  width: 160,
                  background: 'linear-gradient(180deg, var(--brand-sidebar) 0%, var(--brand-dark) 100%)',
                  padding: '12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--brand-accent)', marginBottom: 8 }}>Russ Lyon</div>
                  {['Dashboard', 'Requests', 'Queue', 'Reports'].map((label, i) => (
                    <div key={label} style={{
                      fontSize: 9, padding: '5px 8px', borderRadius: 2, color: i === 0 ? '#F9F6F1' : 'rgba(255,255,255,0.45)',
                      background: i === 0 ? 'linear-gradient(90deg, var(--brand-accent-muted), transparent)' : 'transparent',
                      borderLeft: i === 0 ? '2px solid var(--brand-accent)' : '2px solid transparent',
                      fontWeight: i === 0 ? 600 : 400,
                    }}>{label}</div>
                  ))}
                </div>
                <div style={{ flex: 1, background: 'var(--brand-surface)', padding: 10 }}>
                  <div style={{ fontSize: 8, color: '#9CA3AF', marginBottom: 8 }}>Content area</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        height: 28, background: 'white', borderRadius: 'var(--brand-radius)',
                        border: '1px solid var(--color-border)',
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 12. Effect Preview */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 13 }}>Effect Preview</CardTitle></CardHeader>
            <CardContent>
              <div style={{ display: 'flex', gap: 12 }}>
                <GlassCard style={{ flex: 1, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 4 }}>Standard Card</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF' }}>No glow effect</div>
                </GlassCard>
                <GlassCard glow style={{ flex: 1, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 4 }}>Glow Card</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF' }}>
                    glow-opacity: {liveTokens['brand-glow-opacity']}
                  </div>
                  <div style={{ fontSize: 9, color: '#9CA3AF' }}>
                    card-blur: {liveTokens['brand-card-blur']}
                  </div>
                </GlassCard>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{
                  padding: 12,
                  borderRadius: 'var(--brand-radius)',
                  border: '1px solid var(--color-border)',
                  background: 'white',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--brand-primary)', marginBottom: 4 }}>
                    Current border-radius: <strong style={{ fontFamily: 'var(--font-mono)' }}>{liveTokens['brand-radius']}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[12, 24, 40].map(size => (
                      <div key={size} style={{
                        width: size, height: size,
                        background: 'var(--brand-accent)',
                        borderRadius: 'var(--brand-radius)',
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Token Editor — only visible in edit mode */}
      {editMode && (
        <TokenEditor
          tokens={liveTokens}
          onChange={setLiveTokens}
          onSave={handleSave}
          onReset={handleReset}
          prebuiltThemes={prebuiltThemes}
          onApplyPrebuilt={(theme) => setLiveTokens(theme.tokens)}
          saving={saving}
        />
      )}
    </div>
  );
}
