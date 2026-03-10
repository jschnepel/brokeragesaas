import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MessageService } from "@/services";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await params;
  const messages = await MessageService.getByRequest(requestId);

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      senderName: m.sender_name ?? "Unknown",
      senderRole: m.sender_role ?? "agent",
      body: m.body,
      createdAt: m.created_at,
      senderId: m.sender_id,
    }))
  );
}

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

  if (!body || typeof body !== "string" || body.trim().length === 0) {
    return NextResponse.json({ error: "Message body required" }, { status: 400 });
  }

  const m = await MessageService.send(requestId, session.user.id, body.trim());

  return NextResponse.json({
    id: m.id,
    senderName: m.sender_name ?? "Unknown",
    senderRole: m.sender_role ?? "agent",
    body: m.body,
    createdAt: m.created_at,
    senderId: m.sender_id,
  });
}
