/**
 * Seed script for intake demo data.
 * Run: cd packages/database && DATABASE_URL="..." node -e "require('./src/seed-intake.ts')"
 * Or via: npx tsx packages/database/src/seed-intake.ts
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

// ─── Agent IDs ───────────────────────────────────────────────────────────────
const YONG_ID   = 'a0000000-0000-0000-0000-000000000001';
const LEX_ID    = 'a0000000-0000-0000-0000-000000000002';
const DAVID_ID  = 'a0000000-0000-0000-0000-000000000003';
const MARCUS_ID = 'a0000000-0000-0000-0000-000000000004';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3600000).toISOString();
}
function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString();
}
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Upsert Agents ───────────────────────────────────────────────────
    await client.query(`
      INSERT INTO agents (id, name, email, role, brokerage_name, tier, active)
      VALUES
        ($1, 'Yong Choi',   'yong@demo.local',   'agent',             'Russ Lyon Sothebys', 'premium', true),
        ($2, 'Lex Baum',    'lex@demo.local',     'marketing_manager', 'Russ Lyon Sothebys', 'premium', true),
        ($3, 'David Kim',   'david@demo.local',   'executive',         'Russ Lyon Sothebys', 'premium', true),
        ($4, 'Marcus Webb',  'marcus@demo.local',  'designer',          'Russ Lyon Sothebys', 'premium', true)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        active = EXCLUDED.active
    `, [YONG_ID, LEX_ID, DAVID_ID, MARCUS_ID]);
    console.log('Agents upserted');

    // ── 2. Material Types ──────────────────────────────────────────────────
    // intake_material_type table may not exist — create if needed
    await client.query(`
      CREATE TABLE IF NOT EXISTS intake_material_type (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        standard_days INT NOT NULL DEFAULT 7,
        rush_days INT NOT NULL DEFAULT 3,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    const materialTypes = ['Flyer', 'Social Pack', 'Email Campaign', 'Video Script', 'Brochure', 'Report', 'Signage', 'Other'];
    for (const mt of materialTypes) {
      await client.query(`INSERT INTO intake_material_type (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [mt]);
    }
    console.log('Material types seeded');

    // ── 3. Clear existing intake data (safe re-run) ────────────────────────
    await client.query('DELETE FROM intake_messages');
    await client.query('DELETE FROM intake_files');
    await client.query('DELETE FROM intake_status_log');
    await client.query('DELETE FROM intake_requests');
    console.log('Cleared existing intake data');

    // ── 4. Intake Requests ─────────────────────────────────────────────────
    interface ReqSeed {
      title: string;
      material_type: string;
      status: string;
      is_rush: boolean;
      assigned_to: string | null;
      sla_deadline: string | null;
      created_at: string;
      brief: string;
    }

    const requests: ReqSeed[] = [
      { title: '16020 N Horseshoe Dr — Open House Flyer', material_type: 'Flyer', status: 'submitted', is_rush: false, assigned_to: null, sla_deadline: hoursFromNow(48), created_at: daysAgo(1), brief: 'Open house Saturday 10am-2pm. Clean flyer with address prominent. Pull MLS photos.' },
      { title: 'Desert Mountain Spring Social Pack', material_type: 'Social Pack', status: 'in_progress', is_rush: false, assigned_to: MARCUS_ID, sla_deadline: hoursFromNow(24), created_at: daysAgo(3), brief: '6 Instagram posts for Spring event March 15th. RL brand primary, Desert Mountain secondary colors.' },
      { title: 'Q1 Market Report — Scottsdale Luxury', material_type: 'Report', status: 'completed', is_rush: false, assigned_to: LEX_ID, sla_deadline: null, created_at: daysAgo(14), brief: 'Comprehensive Q1 luxury market report covering all Scottsdale submarkets.' },
      { title: 'Silverleaf Listing — Email Campaign', material_type: 'Email Campaign', status: 'assigned', is_rush: true, assigned_to: MARCUS_ID, sla_deadline: hoursFromNow(48), created_at: daysAgo(2), brief: 'Email blast for new Silverleaf listing. $4.2M, 5BR/6BA. Target luxury buyer list.' },
      { title: '7220 E Crimson Canyon — Brochure', material_type: 'Brochure', status: 'awaiting_materials', is_rush: false, assigned_to: LEX_ID, sla_deadline: hoursFromNow(24), created_at: daysAgo(5), brief: '8-page property brochure. Need professional photos from photographer before starting.' },
      { title: 'Estancia Club Social Pack', material_type: 'Social Pack', status: 'in_review', is_rush: true, assigned_to: MARCUS_ID, sla_deadline: hoursFromNow(6), created_at: daysAgo(4), brief: '4 posts + 2 stories for Estancia Club listings. Warm, aspirational tone.' },
      { title: 'The Boulders Open House Signage', material_type: 'Signage', status: 'cancelled', is_rush: false, assigned_to: null, sla_deadline: null, created_at: daysAgo(10), brief: 'Open house cancelled by client. No longer needed.' },
      { title: 'DC Ranch Spring Mailer', material_type: 'Flyer', status: 'completed', is_rush: false, assigned_to: LEX_ID, sla_deadline: null, created_at: daysAgo(20), brief: 'Direct mail flyer for DC Ranch spring campaign. 8.5x11 print-ready.' },
      { title: 'Troon North Video Script', material_type: 'Video Script', status: 'submitted', is_rush: true, assigned_to: null, sla_deadline: hoursFromNow(48), created_at: daysAgo(1), brief: '60-second listing video script. Aerial shots + interior walkthrough narration.' },
      { title: 'Paradise Valley Estate — Brochure', material_type: 'Brochure', status: 'in_progress', is_rush: false, assigned_to: MARCUS_ID, sla_deadline: hoursFromNow(-2), created_at: daysAgo(7), brief: 'Luxury estate brochure. $8.5M property. Need editorial quality layout.' },
      { title: 'North Scottsdale Luxury Report Q2', material_type: 'Report', status: 'completed', is_rush: false, assigned_to: LEX_ID, sla_deadline: null, created_at: daysAgo(25), brief: 'Q2 market trends for North Scottsdale luxury segment. Data viz focus.' },
      { title: 'Gainey Ranch Open House Flyer', material_type: 'Flyer', status: 'submitted', is_rush: false, assigned_to: null, sla_deadline: hoursFromNow(48), created_at: daysAgo(1), brief: 'Standard open house flyer. Sunday 11am-3pm. Pull MLS photos.' },
      { title: 'Whisper Rock Listing Social Pack', material_type: 'Social Pack', status: 'assigned', is_rush: true, assigned_to: MARCUS_ID, sla_deadline: hoursFromNow(48), created_at: daysAgo(2), brief: 'New listing social content. $3.8M, golf course views. 4 posts + carousel.' },
      { title: 'McDowell Mountain Ranch Email', material_type: 'Email Campaign', status: 'in_review', is_rush: false, assigned_to: LEX_ID, sla_deadline: hoursFromNow(6), created_at: daysAgo(6), brief: 'Monthly newsletter for McDowell Mountain Ranch community. Market stats + new listings.' },
      { title: 'Pinnacle Peak Estate — Flyer', material_type: 'Flyer', status: 'completed', is_rush: false, assigned_to: MARCUS_ID, sla_deadline: null, created_at: daysAgo(18), brief: 'Just listed flyer for Pinnacle Peak estate. Twilight hero photo.' },
      { title: 'Desert Highlands Listing Brochure', material_type: 'Brochure', status: 'in_progress', is_rush: true, assigned_to: MARCUS_ID, sla_deadline: hoursFromNow(-2), created_at: daysAgo(4), brief: 'Rush brochure for Desert Highlands listing. $5.1M. Client needs by Friday.' },
      { title: 'Arcadia Luxury Video Script', material_type: 'Video Script', status: 'awaiting_materials', is_rush: true, assigned_to: LEX_ID, sla_deadline: hoursFromNow(24), created_at: daysAgo(3), brief: '90-second script for Arcadia modern. Waiting on drone footage from photographer.' },
      { title: 'Carefree Canyon Social Pack', material_type: 'Social Pack', status: 'submitted', is_rush: false, assigned_to: null, sla_deadline: hoursFromNow(48), created_at: daysAgo(1), brief: 'Social media content for Carefree Canyon listing. Earth tones, desert vibe.' },
      { title: 'Scottsdale Waterfront Open House', material_type: 'Flyer', status: 'in_review', is_rush: false, assigned_to: MARCUS_ID, sla_deadline: hoursFromNow(6), created_at: daysAgo(5), brief: 'Open house flyer for waterfront property. Saturday 10am-1pm.' },
      { title: 'Moon Valley Estate — Email Campaign', material_type: 'Email Campaign', status: 'cancelled', is_rush: false, assigned_to: null, sla_deadline: null, created_at: daysAgo(12), brief: 'Cancelled — listing went under contract before campaign launched.' },
    ];

    const requestIds: string[] = [];
    for (const req of requests) {
      const r = await client.query(
        `INSERT INTO intake_requests (requester_id, title, material_type, brief, is_rush, status, assigned_to, sla_deadline, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
         RETURNING id`,
        [YONG_ID, req.title, req.material_type, req.brief, req.is_rush, req.status, req.assigned_to, req.sla_deadline, req.created_at]
      );
      requestIds.push(r.rows[0].id);
    }
    console.log(`Seeded ${requestIds.length} requests`);

    // ── 5. Status Logs ─────────────────────────────────────────────────────
    const statusFlows: Record<string, string[]> = {
      submitted: ['submitted'],
      assigned: ['submitted', 'assigned'],
      in_progress: ['submitted', 'assigned', 'in_progress'],
      in_review: ['submitted', 'assigned', 'in_progress', 'in_review'],
      awaiting_materials: ['submitted', 'assigned', 'in_progress', 'awaiting_materials'],
      completed: ['submitted', 'assigned', 'in_progress', 'in_review', 'completed'],
      cancelled: ['submitted', 'cancelled'],
    };

    for (let i = 0; i < requests.length; i++) {
      const flow = statusFlows[requests[i].status] || ['submitted'];
      let prevStatus: string | null = null;
      for (let j = 0; j < flow.length; j++) {
        const changedBy = flow[j] === 'submitted' ? YONG_ID : (requests[i].assigned_to || LEX_ID);
        await client.query(
          `INSERT INTO intake_status_log (request_id, old_status, new_status, changed_by, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [requestIds[i], prevStatus, flow[j], changedBy, new Date(new Date(requests[i].created_at).getTime() + j * 3600000).toISOString()]
        );
        prevStatus = flow[j];
      }
    }
    console.log('Status logs seeded');

    // ── 6. Messages ────────────────────────────────────────────────────────
    const messageRequests = [0, 1, 3, 5, 8, 9, 12, 13, 15, 16, 18]; // indices of active requests

    const messageTemplates: Array<{ sender: string; body: string }>[] = [
      // req 0: 16020 N Horseshoe Dr
      [
        { sender: YONG_ID, body: 'Open house this Saturday. Need flyer by Thursday latest.' },
        { sender: LEX_ID, body: "Got it, I'll get this assigned today. What photos should we use?" },
        { sender: YONG_ID, body: 'Pull from MLS. The front exterior and pool shots are best.' },
        { sender: LEX_ID, body: 'Perfect. Standard Russ Lyon template or custom layout?' },
        { sender: YONG_ID, body: 'Standard template is fine. Just make the address and time prominent.' },
        { sender: LEX_ID, body: 'Will do. Expect a draft by tomorrow afternoon.' },
      ],
      // req 1: Desert Mountain Spring Social Pack
      [
        { sender: YONG_ID, body: 'Hi, I need this for the Spring event on March 15th. Can we do 6 posts total?' },
        { sender: LEX_ID, body: 'Got it. Assigning to Marcus. Marcus, please confirm you can hit the 15th.' },
        { sender: MARCUS_ID, body: 'Confirmed. Starting on the carousel post first. Will have a draft by EOD tomorrow.' },
        { sender: YONG_ID, body: "Perfect. I've uploaded reference photos to the files section." },
        { sender: MARCUS_ID, body: "Received. One question — should we use the community's brand colors or Russ Lyon's?" },
        { sender: YONG_ID, body: 'Mix both. RL brand primary, Desert Mountain secondary.' },
        { sender: MARCUS_ID, body: 'Makes sense. Draft coming tomorrow morning.' },
        { sender: LEX_ID, body: "Great. Yong, I'll notify you when the draft is ready for review." },
      ],
      // req 3: Silverleaf Email Campaign
      [
        { sender: YONG_ID, body: 'Just listed at $4.2M. Need the email blast out ASAP — this is rush.' },
        { sender: MARCUS_ID, body: 'On it. Pulling the listing data now. What subject line do you want?' },
        { sender: YONG_ID, body: 'Something like "New to Market: Silverleaf Estate — $4.2M". Keep it clean.' },
        { sender: MARCUS_ID, body: "Got it. I'll have the HTML template ready by tonight." },
        { sender: YONG_ID, body: 'Great. Target the luxury buyer list from last quarter.' },
        { sender: LEX_ID, body: "I'll review before it goes out. Marcus, CC me on the draft." },
      ],
      // req 5: Estancia Club Social Pack
      [
        { sender: MARCUS_ID, body: "Draft is uploaded for review. 4 posts + 2 stories as requested." },
        { sender: YONG_ID, body: 'Looking now. The carousel looks great. Can we make the CTA more prominent on post 3?' },
        { sender: MARCUS_ID, body: 'Sure, updating now. Anything else?' },
        { sender: YONG_ID, body: 'Story 2 needs the event date added. Otherwise looks perfect.' },
        { sender: MARCUS_ID, body: 'Done. Updated files are in the thread.' },
        { sender: LEX_ID, body: 'Looks good from my end. Yong, approve when ready.' },
      ],
      // req 8: Troon North Video Script
      [
        { sender: YONG_ID, body: 'Need a 60-second script for the Troon North listing. Rush please.' },
        { sender: LEX_ID, body: 'Noted. This is a beautiful property — the aerial shots should lead.' },
        { sender: YONG_ID, body: 'Agreed. Interior walkthrough for the second half. Highlight the views.' },
      ],
      // req 9: Paradise Valley Estate
      [
        { sender: YONG_ID, body: 'This is an $8.5M property. Brochure needs to feel ultra-premium.' },
        { sender: MARCUS_ID, body: 'Understood. Going with the editorial layout. Full bleed images throughout.' },
        { sender: YONG_ID, body: 'Love it. Use the twilight exterior shot for the cover.' },
        { sender: MARCUS_ID, body: "Pulling photos now. I'll have the first 4 pages by tomorrow." },
        { sender: LEX_ID, body: 'FYI this one is SLA-critical. Please prioritize.' },
        { sender: MARCUS_ID, body: 'Noted. Making it my top priority today.' },
      ],
      // req 12: Whisper Rock
      [
        { sender: YONG_ID, body: 'New listing just went live. Golf course views are the selling point.' },
        { sender: LEX_ID, body: 'Assigning to Marcus. This is rush — need content by end of week.' },
        { sender: MARCUS_ID, body: 'Got it. Starting the carousel concept now.' },
        { sender: YONG_ID, body: 'The sunset photo from the back patio is incredible. Lead with that.' },
      ],
      // req 13: McDowell Mountain Ranch Email
      [
        { sender: YONG_ID, body: 'Monthly newsletter time. Focus on the 3 new listings this month.' },
        { sender: LEX_ID, body: 'Draft is ready for your review. Added market stats section at the top.' },
        { sender: YONG_ID, body: 'Looks good. Can we add the upcoming open house dates too?' },
        { sender: LEX_ID, body: 'Updated. Check the bottom section now.' },
        { sender: YONG_ID, body: 'Perfect. Approve to send.' },
      ],
      // req 15: Desert Highlands
      [
        { sender: YONG_ID, body: 'Rush brochure for Desert Highlands. $5.1M listing, client is anxious.' },
        { sender: MARCUS_ID, body: "Starting now. I'll work through the evening to hit the deadline." },
        { sender: YONG_ID, body: 'Appreciate it. The architectural photos are already uploaded.' },
        { sender: MARCUS_ID, body: 'Got them. The infinity pool shot is stunning. Using it for the centerfold.' },
        { sender: LEX_ID, body: 'This is SLA-breached. Marcus, what ETA on the first draft?' },
        { sender: MARCUS_ID, body: 'First 8 pages done. Full draft by end of today.' },
      ],
      // req 16: Arcadia Luxury Video Script
      [
        { sender: YONG_ID, body: 'Need the video script but still waiting on drone footage. Rush once we have it.' },
        { sender: LEX_ID, body: "Understood. I'll start the script outline so we're ready to go." },
        { sender: YONG_ID, body: 'Great. Photographer says footage arrives tomorrow.' },
        { sender: LEX_ID, body: "Draft outline attached. We can finalize once we see the footage angles." },
      ],
      // req 18: Scottsdale Waterfront
      [
        { sender: MARCUS_ID, body: 'Draft flyer uploaded. Used the lakefront photo as hero.' },
        { sender: YONG_ID, body: 'Looks great. Can we bump up the font size on the open house time?' },
        { sender: MARCUS_ID, body: 'Updated. Also added QR code to the virtual tour.' },
        { sender: YONG_ID, body: 'Love it. Sending to Lex for final review.' },
        { sender: LEX_ID, body: 'Reviewed — approved. Clean work, Marcus.' },
      ],
    ];

    for (let mi = 0; mi < messageRequests.length; mi++) {
      const reqIdx = messageRequests[mi];
      const msgs = messageTemplates[mi];
      for (let j = 0; j < msgs.length; j++) {
        await client.query(
          `INSERT INTO intake_messages (request_id, sender_id, body, created_at)
           VALUES ($1, $2, $3, $4)`,
          [requestIds[reqIdx], msgs[j].sender, msgs[j].body, hoursAgo(48 - j * 4 - mi * 2)]
        );
      }
    }
    console.log('Messages seeded');

    // ── 7. Files ───────────────────────────────────────────────────────────
    const unsplashUrls = [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ];

    const fileRequests = [1, 3, 5, 9, 12, 15, 16, 18]; // active requests with files
    for (let fi = 0; fi < fileRequests.length; fi++) {
      const reqIdx = fileRequests[fi];
      const numFiles = fi < 4 ? 2 : 1;
      for (let f = 0; f < numFiles; f++) {
        const url = unsplashUrls[(fi + f) % unsplashUrls.length];
        await client.query(
          `INSERT INTO intake_files (request_id, file_name, file_url, uploaded_by, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [requestIds[reqIdx], `reference-photo-${fi + 1}-${f + 1}.jpg`, url, YONG_ID, daysAgo(2)]
        );
      }
    }
    console.log('Files seeded');

    await client.query('COMMIT');
    console.log('\nSeed complete!');

    // ── 8. Verify counts ───────────────────────────────────────────────────
    const counts = await pool.query(`
      SELECT 'agents' as t, count(*)::int FROM agents
      UNION ALL SELECT 'intake_requests', count(*)::int FROM intake_requests
      UNION ALL SELECT 'intake_messages', count(*)::int FROM intake_messages
      UNION ALL SELECT 'intake_files', count(*)::int FROM intake_files
      UNION ALL SELECT 'intake_status_log', count(*)::int FROM intake_status_log
    `);
    console.log('\nRow counts:');
    counts.rows.forEach((r: { t: string; count: number }) => console.log(`  ${r.t}: ${r.count}`));

  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => { console.error('Seed failed:', e); process.exit(1); });
