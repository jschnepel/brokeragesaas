'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { KPITile, SectionHeader, StatusBadge, RushBadge, SLAIndicator } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { fadeIn, springGentle } from '@/lib/motion';
import {
  MMD_VOLUME_12W,
  MMD_SLA_TREND,
  MMD_MATERIAL_BREAKDOWN,
  MMD_COMMS,
  MMD_CALENDAR,
  TURNAROUND_BY_TYPE,
  slaCountdown,
} from '@/lib/mock-data';
import type { RequestDTO } from '@/app/actions/intake';
import { assignRequest, updateRequestStatus } from '@/app/actions/intake';

interface ManagerDashboardProps {
  user: { id: string; name: string; initials: string; role: string };
  requests: RequestDTO[];
  designers: { id: string; name: string }[];
  onSelectRequest?: (req: RequestDTO) => void;
}

export function ManagerDashboard({ user, requests, designers, onSelectRequest }: ManagerDashboardProps) {
  const allReqs = requests;
  const open = allReqs.filter(r => !['completed', 'cancelled'].includes(r.status));
  const unassigned = allReqs.filter(r => !r.designerName && !['completed', 'cancelled'].includes(r.status));
  const inReview = allReqs.filter(r => r.status === 'review' || r.status === 'in_review');
  const breached = allReqs.filter(r => r.slaBreached);
  const rushActive = allReqs.filter(r => r.isRush && !['completed', 'cancelled'].includes(r.status));
  const completed = allReqs.filter(r => r.status === 'completed');
  const needsAttn = allReqs.filter(r =>
    !['completed', 'cancelled'].includes(r.status) &&
    (r.slaBreached || !r.designerName)
  );

  const [triageActions, setTriageActions] = useState<Record<string, string>>({});
  const [assignMap, setAssignMap] = useState<Record<string, string>>({});
  const [chartTab, setChartTab] = useState<'volume' | 'sla' | 'type'>('volume');
  const [isPending, startTransition] = useTransition();

  const currentSLA = MMD_SLA_TREND[MMD_SLA_TREND.length - 1].rate;

  const byDesigner = designers.map(d => ({
    name: d.name,
    active: allReqs.filter(r => r.designerName === d.name && !['completed', 'cancelled'].includes(r.status)).length,
    breached: allReqs.filter(r => r.designerName === d.name && r.slaBreached).length,
  }));
  byDesigner.push({ name: 'Unassigned', active: unassigned.length, breached: 0 });

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

  function handleQuickApprove(req: RequestDTO) {
    const designerId = assignMap[req.id];
    if (!designerId) return;
    startTransition(async () => {
      await assignRequest(req.id, designerId);
      setTriageActions(prev => ({ ...prev, [req.id]: 'approved' }));
    });
  }
  function handleQuickReject(req: RequestDTO) {
    startTransition(async () => {
      await updateRequestStatus(req.id, 'cancelled');
      setTriageActions(prev => ({ ...prev, [req.id]: 'rejected' }));
    });
  }
  function undoAction(id: string) {
    setTriageActions(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  return (
    <div style={{ padding: '4px 0 40px' }}>
      {/* Greeting */}
      <motion.div {...fadeIn} style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300, color: 'var(--brand-primary)', letterSpacing: '-0.01em' }}>
          Good {greeting}, {user.name.split(' ')[0]}.
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
          {open.length} open request{open.length !== 1 ? 's' : ''}
          {unassigned.length > 0 && <> · <strong style={{ color: '#D97706' }}>{unassigned.length} unassigned</strong></>}
          {breached.length > 0 && <> · <strong style={{ color: '#DC2626' }}>{breached.length} SLA breached</strong></>}
          <span style={{ color: '#D1C9BC' }}> · </span>
          <Link href="/component-library" style={{ fontSize: 12, color: 'var(--brand-accent)', fontWeight: 600, textDecoration: 'none' }}>
            Component Library
          </Link>
        </div>
      </motion.div>

      {/* Row 1: Charts + Needs Attention | Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Left: Charts + Needs Attention */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Charts Panel */}
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>
                {chartTab === 'volume' ? 'Queue Volume — 12 Weeks' : chartTab === 'sla' ? 'SLA Compliance — 6 Months' : 'Requests by Type'}
              </div>
              <div style={{ display: 'flex', gap: 2, background: 'var(--brand-surface-alt)', padding: 2 }}>
                {[['volume', 'Volume'], ['sla', 'SLA'], ['type', 'By Type']].map(([k, l]) => (
                  <button key={k} onClick={() => setChartTab(k as 'volume' | 'sla' | 'type')} style={{
                    fontSize: 9, fontWeight: 700, padding: '3px 10px', border: 'none', cursor: 'pointer',
                    background: chartTab === k ? 'white' : 'transparent',
                    color: chartTab === k ? 'var(--brand-primary)' : '#9CA3AF',
                    boxShadow: chartTab === k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ padding: '16px 20px 14px' }}>
              {chartTab === 'volume' && (
                <>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    {[['var(--brand-primary)', 'Submitted'], ['var(--brand-accent)', 'Completed']].map(([c, l]) => (
                      <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#9CA3AF' }}>
                        <div style={{ width: 8, height: 8, background: c }} />{l}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90 }}>
                    {MMD_VOLUME_12W.map(w => {
                      const max = Math.max(...MMD_VOLUME_12W.map(x => Math.max(x.submitted, x.completed)));
                      return (
                        <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 70 }}>
                            <div style={{ width: 8, background: 'var(--brand-primary)', height: `${(w.submitted / max) * 100}%`, borderRadius: '1px 1px 0 0' }} />
                            <div style={{ width: 8, background: 'var(--brand-accent)', height: `${(w.completed / max) * 100}%`, borderRadius: '1px 1px 0 0' }} />
                          </div>
                          <div style={{ fontSize: 7, color: '#9CA3AF', marginTop: 4 }}>{w.week}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {chartTab === 'sla' && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
                  {MMD_SLA_TREND.map(m => (
                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 300, color: m.rate >= 90 ? '#15803D' : '#DC2626', marginBottom: 4 }}>{m.rate}%</div>
                      <div style={{ width: '100%', height: 50, background: 'var(--brand-surface-alt)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${m.rate}%`, background: m.rate >= 90 ? '#15803D' : '#DC2626', borderRadius: '2px 2px 0 0', opacity: 0.2 }} />
                      </div>
                      <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 4 }}>{m.month}</div>
                    </div>
                  ))}
                </div>
              )}
              {chartTab === 'type' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {MMD_MATERIAL_BREAKDOWN.map(m => {
                    const maxCount = Math.max(...MMD_MATERIAL_BREAKDOWN.map(x => x.count));
                    return (
                      <div key={m.type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 80, fontSize: 10, color: 'var(--brand-primary)', fontWeight: 500 }}>{m.type}</div>
                        <div style={{ flex: 1, height: 12, background: 'var(--brand-surface-alt)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(m.count / maxCount) * 100}%`, background: m.color, borderRadius: 2 }} />
                        </div>
                        <div style={{ width: 24, fontSize: 11, fontWeight: 700, color: 'var(--brand-primary)', textAlign: 'right' }}>{m.count}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Needs Attention */}
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>Needs Attention</div>
              {needsAttn.length > 0 && (
                <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: 2 }}>{needsAttn.length}</span>
              )}
            </div>
            {needsAttn.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 11 }}>All requests on track</div>
            ) : (
              <div style={{ maxHeight: 176, overflowY: 'auto' }}>
                {needsAttn.map((req, i) => {
                  const sla = slaCountdown(req.slaDeadline);
                  const borderColor = req.slaBreached ? '#EF4444' : !req.designerName ? '#F59E0B' : '#E5E7EB';
                  return (
                    <div key={req.id} onClick={() => onSelectRequest?.(req)} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px',
                      borderBottom: i < needsAttn.length - 1 ? '1px solid var(--color-border)' : 'none',
                      borderLeft: `3px solid ${borderColor}`, cursor: 'pointer', transition: 'background 0.1s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</span>
                          {req.isRush && <RushBadge />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: '#9CA3AF' }}>{req.materialType}</span>
                          <span style={{ fontSize: 10, color: '#D1C9BC' }}>·</span>
                          <span style={{ fontSize: 10, color: req.designerName ? '#9CA3AF' : '#D97706', fontWeight: req.designerName ? 400 : 700 }}>
                            {req.designerName || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <StatusBadge status={req.status as 'submitted' | 'in_progress'} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: sla.urgent ? '#DC2626' : '#9CA3AF', minWidth: 52, textAlign: 'right' }}>{sla.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Calendar */}
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>Upcoming</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {MMD_CALENDAR.map((ev, i) => {
              const isToday = ev.date.toDateString() === new Date().toDateString();
              return (
                <div key={`${ev.id}-${ev.title}`} style={{
                  padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'flex-start',
                  borderBottom: i < MMD_CALENDAR.length - 1 ? '1px solid var(--color-border)' : 'none',
                  background: isToday ? '#FFFBEB' : 'white',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: ev.color,
                    flexShrink: 0, marginTop: 4,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)' }}>{ev.title}</div>
                    <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1 }}>
                      {isToday ? 'Today' : ev.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {ev.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: KPIs | Designer Capacity | Quick Triage */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* KPIs 2x2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10 }}>
          <KPITile label="Open Requests" value={open.length} accent="var(--brand-primary)" barPct={Math.min(100, (open.length / 10) * 100)} signal={open.length > 8 ? '⚠ High volume' : '✓ Manageable'} target="Target <10" />
          <KPITile label="SLA Compliance" value={`${currentSLA}%`} accent="#15803D" barPct={currentSLA} signal="↑ 3% MoM" target="Target ≥90%" />
          <KPITile label="Rush Active" value={rushActive.length} accent="#B45309" barPct={Math.min(100, (rushActive.length / 5) * 100)} signal={rushActive.length > 0 ? `${rushActive.length} active` : '✓ None'} target="Watch closely" />
          <KPITile label="Completed MTD" value={completed.length} accent="var(--brand-accent)" barPct={Math.min(100, (completed.length / 20) * 100)} signal={`${completed.length} this month`} target="Goal 20/mo" />
        </div>

        {/* Designer Capacity */}
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>Designer Capacity</div>
          </div>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ flex: 1, borderRight: '1px solid var(--color-border)', overflowY: 'auto' }}>
              {byDesigner.map((d, i) => {
                const pct = Math.min(100, (d.active / 5) * 100);
                const sc = d.name === 'Unassigned' ? '#9CA3AF' : d.active >= 5 ? '#DC2626' : d.active >= 3 ? '#D97706' : '#15803D';
                const sl = d.name === 'Unassigned' ? 'pool' : d.active >= 5 ? 'overloaded' : d.active >= 3 ? 'busy' : 'available';
                return (
                  <div key={d.name} style={{ padding: '10px 12px', borderBottom: i < byDesigner.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--brand-primary)' }}>{d.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: sc }} />
                          <span style={{ fontSize: 8, color: sc, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sl}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 300, color: sc, lineHeight: 1 }}>{d.active}</div>
                        <div style={{ fontSize: 8, color: '#9CA3AF' }}>active</div>
                      </div>
                    </div>
                    {d.name !== 'Unassigned' && (
                      <div style={{ height: 3, background: 'var(--brand-surface-alt)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: sc, borderRadius: 2, transition: 'width 0.4s ease' }} />
                      </div>
                    )}
                    {d.breached > 0 && <div style={{ fontSize: 8, fontWeight: 700, color: '#DC2626', marginTop: 3 }}>⚠ {d.breached} breached</div>}
                  </div>
                );
              })}
            </div>
            {/* Avg Turnaround */}
            <div style={{ width: 160, flexShrink: 0, padding: '12px 10px', background: '#FDFAF5', overflowY: 'auto' }}>
              <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>Avg / Type</div>
              {TURNAROUND_BY_TYPE.map(t => (
                <div key={t.type} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: 'var(--brand-primary)', fontWeight: 500 }}>{t.type}</span>
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 300, color: t.days > 5 ? '#DC2626' : t.days > 3 ? '#D97706' : 'var(--brand-primary)', lineHeight: 1 }}>
                      {t.days}<span style={{ fontSize: 8, color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>d</span>
                    </span>
                  </div>
                  <div style={{ height: 2, background: '#F0EDE8', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(t.days / 7) * 100}%`, background: t.days > 5 ? '#DC2626' : t.days > 3 ? '#D97706' : 'var(--brand-primary)', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Triage */}
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>Quick Triage</div>
            {unassigned.length > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, background: '#FFFBEB', color: '#D97706', padding: '2px 5px', borderRadius: 2 }}>{unassigned.length}</span>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {unassigned.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 11 }}>No unassigned</div>
            ) : unassigned.slice(0, 4).map((req, i, arr) => {
              const action = triageActions[req.id];
              const designer = assignMap[req.id] || '';
              return (
                <div key={req.id} style={{
                  padding: '9px 12px', borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                  background: action === 'approved' ? '#F0FDF4' : action === 'rejected' ? '#FEF2F2' : 'white', transition: 'background 0.2s',
                }}>
                  {action ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: action === 'approved' ? '#15803D' : '#DC2626' }}>
                          {action === 'approved' ? '✓ Approved' : '✕ Rejected'}
                        </div>
                        <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{req.title}</div>
                      </div>
                      <button onClick={() => undoAction(req.id)} style={{ fontSize: 9, color: '#9CA3AF', background: 'none', border: '1px solid var(--color-border)', padding: '2px 6px', cursor: 'pointer' }}>Undo</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--brand-primary)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</div>
                      <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 5 }}>{req.materialType}{req.isRush ? ' · RUSH' : ''}</div>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <select
                          value={designer}
                          onChange={e => setAssignMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                          style={{
                            flex: 1, fontSize: 9, border: '1px solid var(--color-border)', padding: '3px 4px',
                            background: 'white', color: designer ? 'var(--brand-primary)' : '#9CA3AF',
                            fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer',
                          }}
                        >
                          <option value="">Assign…</option>
                          {designers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <button onClick={() => handleQuickApprove(req)} disabled={!designer || isPending} style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 7px', border: 'none',
                          cursor: designer && !isPending ? 'pointer' : 'not-allowed',
                          background: designer ? 'var(--brand-primary)' : '#E5E1D8',
                          color: designer ? 'white' : '#C4B9AA',
                        }}>✓</button>
                        <button onClick={() => handleQuickReject(req)} disabled={isPending} style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 5px',
                          background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5', cursor: isPending ? 'not-allowed' : 'pointer',
                        }}>✕</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Messages | Active Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent Messages */}
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <SectionHeader title="Recent Messages" />
          </div>
          {MMD_COMMS.map((msg, i) => (
            <div key={msg.id} style={{
              padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'flex-start',
              borderBottom: i < MMD_COMMS.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'var(--brand-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--brand-primary)' }}>{msg.initials}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)' }}>{msg.from}</span>
                  <span style={{ fontSize: 9, color: '#C4B9AA', fontFamily: 'var(--font-mono)' }}>{msg.time}</span>
                </div>
                <div style={{ fontSize: 10, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.subject}</div>
              </div>
              {msg.unread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-accent)', flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))}
        </div>

        {/* Active Queue */}
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <SectionHeader title="Active Queue" count={open.length} />
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {open.map((req, i) => {
              const sla = slaCountdown(req.slaDeadline);
              return (
                <div key={req.id} onClick={() => onSelectRequest?.(req)} style={{
                  padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: i < open.length - 1 ? '1px solid var(--color-border)' : 'none',
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</span>
                      {req.isRush && <RushBadge />}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{req.designerName || 'Unassigned'} · {req.materialType}</div>
                  </div>
                  <StatusBadge status={req.status as 'submitted' | 'in_progress'} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: sla.urgent ? '#DC2626' : '#9CA3AF', minWidth: 52, textAlign: 'right' }}>{sla.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
