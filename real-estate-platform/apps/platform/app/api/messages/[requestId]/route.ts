import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MessageService } from "@/services";

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
  const after = request.nextUrl.searchParams.get("after") ?? undefined;

  const messages = await MessageService.getByRequest(requestId, after);
  return NextResponse.json(messages);
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

  const message = await MessageService.send(requestId, session.user.id, body.trim());
  return NextResponse.json(message, { status: 201 });
}
