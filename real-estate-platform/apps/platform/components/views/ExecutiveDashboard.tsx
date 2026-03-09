'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { KPITile, SectionHeader, StatusBadge, RushBadge } from '@/components/primitives';
import { fadeIn, springGentle } from '@/lib/motion';
import {
  BACKLOG_TREND,
  DEMAND_BY_OFFICE,
  CYCLE_TIME_BY_MATERIAL,
  STAFFING_MODEL,
  REVISION_DATA,
  ACTIVITY_FEED,
  slaCountdown,
} from '@/lib/mock-data';
import type { RequestDTO } from '@/app/actions/intake';

interface ExecutiveDashboardProps {
  user: { id: string; name: string; initials: string; role: string };
  requests: RequestDTO[];
  designers: { id: string; name: string }[];
  onSelectRequest?: (req: RequestDTO) => void;
}

export function ExecutiveDashboard({ user, requests, designers, onSelectRequest }: ExecutiveDashboardProps) {
  const allReqs = requests;
  const open = allReqs.filter(r => !['completed', 'cancelled'].includes(r.status));
  const inReview = allReqs.filter(r => r.status === 'review' || r.status === 'in_review');
  const rushActive = allReqs.filter(r => r.isRush && !['completed', 'cancelled'].includes(r.status));
  const breached = allReqs.filter(r => r.slaBreached);

  const queueDepth = BACKLOG_TREND[BACKLOG_TREND.length - 1].depth;
  const mtdIntake = BACKLOG_TREND.slice(-4).reduce((s, w) => s + w.intake, 0);
  const mtdComplete = BACKLOG_TREND.slice(-4).reduce((s, w) => s + w.completed, 0);
  const avgWaitDays = (CYCLE_TIME_BY_MATERIAL.reduce((s, r) => s + r.waitDays, 0) / CYCLE_TIME_BY_MATERIAL.length).toFixed(1);

  const [trendPeriod, setTrendPeriod] = useState('6M');

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

  const byDesigner = designers.map(d => ({
    name: d.name,
    active: allReqs.filter(r => r.designerName === d.name && !['completed', 'cancelled'].includes(r.status)).length,
    capacity: 5,
  }));

  return (
    <div style={{ padding: '4px 0 40px' }}>
      {/* Header */}
      <motion.div {...fadeIn} style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--brand-accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Marketing · Executive Overview</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--brand-primary)', letterSpacing: '-0.02em' }}>
            Operations Report
          </span>
          <Link href="/component-library" style={{ fontSize: 11, color: 'var(--brand-accent)', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.04em' }}>
            Component Library →
          </Link>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <motion.div {...fadeIn} transition={{ ...springGentle, delay: 0.05 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <ExecKPICard label="Current Queue Depth" value={queueDepth} sub="open requests in backlog" accent="#DC2626" delta="12 vs last month" deltaDir="bad" />
        <ExecKPICard label="MTD Intake" value={mtdIntake} sub={`vs ${mtdComplete} completed`} accent="var(--brand-primary)" delta="8% vs last month" deltaDir="bad" />
        <ExecKPICard label="Avg Queue Wait" value={`${avgWaitDays}d`} sub="submission → first assigned" accent="#D97706" delta="0.4d vs last month" deltaDir="bad" />
        <ExecKPICard label="Team Utilization" value="186%" sub="2 designers, 3.7 FTE needed" accent="#DC2626" />
      </motion.div>

      {/* Backlog Trend */}
      <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>Backlog Trend</div>
          <div style={{ display: 'flex', background: 'var(--brand-surface-alt)', borderRadius: 3, padding: 2, gap: 1 }}>
            {['3M', '6M', '1Y'].map(p => (
              <button key={p} onClick={() => setTrendPeriod(p)} style={{
                background: trendPeriod === p ? 'white' : 'transparent',
                color: trendPeriod === p ? 'var(--brand-primary)' : '#9CA3AF',
                border: 'none', borderRadius: 2, padding: '3px 12px',
                fontSize: 10, fontWeight: trendPeriod === p ? 700 : 500,
                cursor: 'pointer', boxShadow: trendPeriod === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>{p}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 9, color: '#9CA3AF' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, background: 'var(--brand-primary)' }} />Intake</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, background: 'var(--brand-accent)' }} />Completed</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 2, background: '#DC2626' }} />Depth</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
            {BACKLOG_TREND.map(w => {
              const max = Math.max(...BACKLOG_TREND.map(x => Math.max(x.intake, x.completed)));
              return (
                <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 90 }}>
                    <div style={{ width: 6, background: 'var(--brand-primary)', height: `${(w.intake / max) * 100}%`, borderRadius: '1px 1px 0 0' }} />
                    <div style={{ width: 6, background: 'var(--brand-accent)', height: `${(w.completed / max) * 100}%`, borderRadius: '1px 1px 0 0' }} />
                  </div>
                  <div style={{ fontSize: 6, color: '#9CA3AF', marginTop: 3, transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>
                    {w.week.replace(' ', '')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Demand + Cycle Time side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Demand by Office */}
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>Demand by Office</div>
          </div>
          <div style={{ padding: '14px 18px' }}>
            {DEMAND_BY_OFFICE.map(d => {
              const maxYtd = Math.max(...DEMAND_BY_OFFICE.map(x => x.ytd));
              return (
                <div key={d.office} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--brand-primary)' }}>{d.office}</span>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>{d.ytd} YTD · {d.mom} this mo</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--brand-surface-alt)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.ytd / maxYtd) * 100}%`, background: 'var(--brand-primary)', borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cycle Time by Material */}
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>Cycle Time by Material</div>
          </div>
          <div style={{ padding: '14px 18px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Material', 'Wait', 'Production', 'Review', 'Total'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CYCLE_TIME_BY_MATERIAL.map(r => (
                  <tr key={r.material} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px', fontWeight: 600, color: 'var(--brand-primary)' }}>{r.material}</td>
                    <td style={{ padding: '8px', color: '#9CA3AF' }}>{r.waitDays}d</td>
                    <td style={{ padding: '8px', color: '#9CA3AF' }}>{r.prodDays}d</td>
                    <td style={{ padding: '8px', color: '#9CA3AF' }}>{r.reviewDays}d</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: r.total > 8 ? '#DC2626' : 'var(--brand-primary)' }}>{r.total}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Revision Cost */}
      <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>Revision Cost Analysis</div>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Material', 'Revision Rate', 'Avg Rounds', 'Hours Lost/mo'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REVISION_DATA.map(r => (
                <tr key={r.material} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px', fontWeight: 600, color: 'var(--brand-primary)' }}>{r.material}</td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: 'var(--brand-surface-alt)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${r.revRate}%`, background: r.revRate > 30 ? '#DC2626' : r.revRate > 20 ? '#D97706' : '#15803D', borderRadius: 3 }} />
                      </div>
                      <span style={{ color: r.revRate > 30 ? '#DC2626' : '#9CA3AF' }}>{r.revRate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px', color: '#9CA3AF' }}>{r.avgRounds}</td>
                  <td style={{ padding: '8px', fontWeight: 700, color: r.hrsLost > 10 ? '#DC2626' : '#9CA3AF' }}>{r.hrsLost}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staffing Model */}
      <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>Staffing Model</div>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Material', 'Avg Hours', 'Monthly Vol', 'Total Hours', 'FTE Needed'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAFFING_MODEL.map(r => (
                <tr key={r.material} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px', fontWeight: 600, color: 'var(--brand-primary)' }}>{r.material}</td>
                  <td style={{ padding: '8px', color: '#9CA3AF' }}>{r.avgHrs}h</td>
                  <td style={{ padding: '8px', color: '#9CA3AF' }}>{r.monthlyVol}</td>
                  <td style={{ padding: '8px', color: '#9CA3AF' }}>{r.totalHrs}h</td>
                  <td style={{ padding: '8px', fontWeight: 700, color: r.designerSlots > 2 ? '#DC2626' : 'var(--brand-primary)' }}>{r.designerSlots}</td>
                </tr>
              ))}
              <tr style={{ background: 'var(--brand-surface-alt)' }}>
                <td style={{ padding: '8px', fontWeight: 700, color: 'var(--brand-primary)' }}>Total</td>
                <td style={{ padding: '8px' }} />
                <td style={{ padding: '8px', fontWeight: 700, color: 'var(--brand-primary)' }}>{STAFFING_MODEL.reduce((s, r) => s + r.monthlyVol, 0)}</td>
                <td style={{ padding: '8px', fontWeight: 700, color: 'var(--brand-primary)' }}>{STAFFING_MODEL.reduce((s, r) => s + r.totalHrs, 0)}h</td>
                <td style={{ padding: '8px', fontWeight: 700, color: '#DC2626' }}>{STAFFING_MODEL.reduce((s, r) => s + r.designerSlots, 0).toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-column: All Requests + Activity | Designer Workload */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* All Requests */}
        <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <SectionHeader title="All Requests" count={allReqs.length} />
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'var(--brand-surface-alt)', position: 'sticky', top: 0 }}>
                  {['Request', 'Type', 'Designer', 'Status', 'SLA'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allReqs.map((req, i) => {
                  const sla = slaCountdown(req.slaDeadline);
                  return (
                    <tr key={req.id} onClick={() => onSelectRequest?.(req)} style={{
                      cursor: 'pointer', borderBottom: i < allReqs.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    >
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{req.title}</span>
                          {req.isRush && <RushBadge />}
                        </div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{req.requesterName}</div>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#9CA3AF' }}>{req.materialType}</td>
                      <td style={{ padding: '8px 12px', color: req.designerName ? '#9CA3AF' : '#D97706', fontWeight: req.designerName ? 400 : 700 }}>{req.designerName || 'Unassigned'}</td>
                      <td style={{ padding: '8px 12px' }}><StatusBadge status={req.status as 'submitted' | 'in_progress'} /></td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: sla.urgent ? '#DC2626' : '#9CA3AF' }}>{sla.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Designer Workload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <SectionHeader title="Designer Workload" />
            </div>
            {byDesigner.map((d, i) => {
              const pct = Math.min(100, (d.active / d.capacity) * 100);
              const color = pct >= 100 ? '#DC2626' : pct >= 60 ? '#D97706' : '#15803D';
              return (
                <div key={d.name} style={{ padding: '14px 18px', borderBottom: i < byDesigner.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-primary)' }}>{d.name}</span>
                    <span style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 300, color }}>{d.active}<span style={{ fontSize: 11, color: '#9CA3AF' }}>/{d.capacity}</span></span>
                  </div>
                  <div style={{ height: 6, background: 'var(--brand-surface-alt)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Activity */}
          <div style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <SectionHeader title="Recent Activity" />
            </div>
            {ACTIVITY_FEED.slice(0, 5).map((a, i) => (
              <div key={a.id} style={{
                padding: '8px 18px', display: 'flex', gap: 8, alignItems: 'flex-start',
                borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: 'var(--brand-primary)' }}>
                    <strong>{a.actor}</strong> {a.action}
                  </div>
                  <div style={{ fontSize: 9, color: '#C4B9AA' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecKPICard({ label, value, sub, accent, delta, deltaDir }: {
  label: string; value: string | number; sub: string; accent: string; delta?: string; deltaDir?: 'good' | 'bad';
}) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--brand-radius)',
      padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 96,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9CA3AF' }}>{label}</div>
      <div>
        <div style={{ fontSize: 30, fontFamily: 'var(--font-display)', fontWeight: 300, color: accent, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{sub}</div>
          {delta && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: deltaDir === 'bad' ? '#DC2626' : '#15803D',
              background: deltaDir === 'bad' ? '#FEF2F2' : '#F0FDF4',
              padding: '1px 6px', borderRadius: 2,
            }}>{delta}</span>
          )}
        </div>
      </div>
    </div>
  );
}
