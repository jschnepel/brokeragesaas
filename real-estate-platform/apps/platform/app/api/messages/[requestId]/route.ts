import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { query, queryOne } from "@platform/database";

interface MessageRow {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name: string;
}

// GET /api/messages/[requestId]?after=<ISO timestamp>
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;
  const after = request.nextUrl.searchParams.get("after");

  let sql = `
    SELECT m.*, a.name AS sender_name
    FROM intake_messages m
    LEFT JOIN agents a ON a.id = m.sender_id
    WHERE m.request_id = $1
  `;
  const sqlParams: unknown[] = [requestId];

  if (after) {
    sql += ` AND m.created_at > $2`;
    sqlParams.push(after);
  }

  sql += " ORDER BY m.created_at ASC";

  const result = await query<MessageRow>(sql, sqlParams);
  return NextResponse.json(result.rows);
}

// POST /api/messages/[requestId]  body: { body: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;
  const { body } = await request.json();

  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json(
      { error: "Message body required" },
      { status: 400 }
    );
  }

  const result = await queryOne<MessageRow>(
    `INSERT INTO intake_messages (request_id, sender_id, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [requestId, session.user.id, body.trim()]
  );

  if (!result) {
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }

  // Fetch sender name
  const withName = await queryOne<MessageRow>(
    `SELECT m.*, a.name AS sender_name
     FROM intake_messages m
     LEFT JOIN agents a ON a.id = m.sender_id
     WHERE m.id = $1`,
    [result.id]
  );

  return NextResponse.json(withName, { status: 201 });
}
