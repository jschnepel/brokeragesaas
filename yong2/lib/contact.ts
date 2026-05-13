import { Resend } from 'resend';
import { type Attribution } from './analytics/attribution';
import { type LeadScore, bandLabel } from './analytics/lead-score';

export type ContactMessage = {
  name: string;
  email: string;
  phone: string;
  interest: 'Buying' | 'Selling' | 'Both';
  message: string;
};

export type EnrichedContext = {
  score: LeadScore;
  attribution: Attribution | null;
  session: {
    id: string | null;
    pageCount: number;
    stepN: number;
    activeMs: number;
    totalMs: number;
    maxScrollPct: number;
    landingPath: string | null;
    exitPath: string | null;
  };
  anonId: string | null;
  /**
   * Compliance audit trail captured at submission. Persisted into the email
   * body verbatim so the lead record itself doubles as a TCPA + CAN-SPAM
   * defensible-paper-trail. Future RDS leads-table writes should mirror
   * these fields one-to-one.
   */
  consent: {
    disclosureText: string;
    smsOptIn: boolean;
    capturedAt: string;
    ip: string;
    userAgent: string;
  };
};

export async function sendContactMessage(
  msg: ContactMessage,
  ctx?: EnrichedContext,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? 'no-reply@yong-choi.com';
  if (!apiKey || !to) {
    throw new Error('RESEND_API_KEY and CONTACT_TO_EMAIL are required');
  }
  const resend = new Resend(apiKey);
  const subject = buildSubject(msg, ctx);
  const text = buildBody(msg, ctx);
  await resend.emails.send({
    from,
    to,
    replyTo: msg.email,
    subject,
    text,
  });
}

/**
 * Compose a subject line that gives Yong instant priority signal:
 *   `[Score 84 / Hot] John Smith — google/cpc — Buying — viewed 6 listings`
 * Falls back to the original format when no score context is available.
 */
export function buildSubject(msg: ContactMessage, ctx?: EnrichedContext): string {
  if (!ctx) {
    return `Website inquiry — ${msg.name} (${msg.interest})`;
  }
  const band = ctx.score.band.toUpperCase();
  const total = ctx.score.total;
  const sourceTag = formatSourceTag(ctx.attribution);
  const engagement =
    ctx.session.pageCount > 0
      ? ` · ${ctx.session.pageCount} pages, ${(ctx.session.activeMs / 60_000).toFixed(1)}m active`
      : '';
  return `[${band} ${total}] ${msg.name} — ${sourceTag} — ${msg.interest}${engagement}`;
}

function formatSourceTag(attr: Attribution | null): string {
  if (!attr) return 'unknown source';
  const t = attr.first;
  if (t.channel === 'direct') return 'direct';
  if (t.source && t.medium) return `${t.source}/${t.medium}`;
  if (t.source) return t.source;
  return t.channel;
}

export function buildBody(msg: ContactMessage, ctx?: EnrichedContext): string {
  const lines: string[] = [];
  lines.push(`From: ${msg.name} <${msg.email}>`);
  lines.push(`Phone: ${msg.phone}`);
  lines.push(`Interest: ${msg.interest}`);
  lines.push('');
  lines.push(msg.message);

  if (!ctx) return lines.join('\n');

  lines.push('');
  lines.push('---');
  lines.push(`LEAD SCORE: ${ctx.score.total} / 100  (${bandLabel(ctx.score.band)})`);
  lines.push('');
  lines.push('Score breakdown:');
  for (const s of ctx.score.breakdown) {
    const filled = s.points > 0 ? '+' : ' ';
    lines.push(
      `  ${filled} ${s.points.toString().padStart(2)} / ${s.max.toString().padStart(2)}  ${s.label}  — ${s.evidence}`,
    );
  }

  if (ctx.attribution) {
    lines.push('');
    lines.push('Attribution:');
    lines.push(`  First touch:  ${describeTouch(ctx.attribution.first)}`);
    lines.push(`  Last touch:   ${describeTouch(ctx.attribution.last)}`);
  }

  lines.push('');
  lines.push('Session:');
  lines.push(`  Anon ID:      ${ctx.anonId ?? '(no consent)'}`);
  lines.push(`  Session ID:   ${ctx.session.id ?? '(no consent)'}`);
  lines.push(`  Pages viewed: ${ctx.session.pageCount}`);
  lines.push(`  Steps:        ${ctx.session.stepN}`);
  lines.push(
    `  Active time:  ${(ctx.session.activeMs / 60_000).toFixed(1)} min  (of ${(ctx.session.totalMs / 60_000).toFixed(1)} min total)`,
  );
  lines.push(`  Max scroll:   ${ctx.session.maxScrollPct}%`);
  lines.push(`  Landing:      ${ctx.session.landingPath ?? '(unknown)'}`);
  lines.push(`  Exit:         ${ctx.session.exitPath ?? '(unknown)'}`);

  lines.push('');
  lines.push('Consent (audit trail):');
  lines.push(`  Captured at:  ${ctx.consent.capturedAt}`);
  lines.push(`  IP:           ${ctx.consent.ip}`);
  lines.push(`  User agent:   ${ctx.consent.userAgent}`);
  lines.push(`  SMS opt-in:   ${ctx.consent.smsOptIn ? 'YES' : 'no'}`);
  lines.push(`  Disclosure:   ${ctx.consent.disclosureText}`);
  return lines.join('\n');
}

function describeTouch(t: Attribution['first']): string {
  const parts: string[] = [];
  parts.push(t.channel);
  if (t.source) parts.push(t.source);
  if (t.medium) parts.push(t.medium);
  if (t.campaign) parts.push(`campaign=${t.campaign}`);
  if (t.referrer) parts.push(`ref=${t.referrer}`);
  parts.push(`landing=${t.landing}`);
  parts.push(`@${new Date(t.ts).toISOString()}`);
  return parts.join(' · ');
}
