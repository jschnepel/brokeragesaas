import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FileService } from "@/services/file";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/vnd.adobe.photoshop",
  "application/postscript",
  "application/illustrator",
]);

function isAcceptedType(mimeType: string): boolean {
  return ACCEPTED_TYPES.has(mimeType) || mimeType.startsWith("image/");
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = request.nextUrl.searchParams.get("requestId");
  if (!requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }

  const files = await FileService.getByRequest(requestId);

  return NextResponse.json(
    files.map((f) => ({
      id: f.id,
      fileName: f.file_name,
      fileType: f.file_name.split(".").pop() ?? "",
      url: f.file_url,
      uploadedBy: f.uploader_name ?? "Unknown",
      uploadedAt: f.created_at,
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const requestId = formData.get("requestId") as string | null;
  const file = formData.get("file") as File | null;

  if (!requestId || !file) {
    return NextResponse.json(
      { error: "requestId and file are required" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 5MB limit" },
      { status: 400 }
    );
  }

  if (!isAcceptedType(file.type)) {
    return NextResponse.json(
      { error: "File type not accepted. Upload images, PDFs, or design files." },
      { status: 400 }
    );
  }

  // Convert file to base64 data URL for DB storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  const row = await FileService.create({
    request_id: requestId,
    file_name: file.name,
    file_url: dataUrl,
    uploaded_by: session.user.id,
  });

  return NextResponse.json({
    id: row.id,
    fileName: row.file_name,
    fileType: row.file_name.split(".").pop() ?? "",
    url: row.file_url,
    uploadedBy: row.uploader_name ?? "Unknown",
    uploadedAt: row.created_at,
  });
}
