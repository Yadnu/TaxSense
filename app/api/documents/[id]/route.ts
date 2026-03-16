import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFromS3, getSignedDownloadUrl } from "@/lib/storage/s3";

// ─── GET /api/documents/[id] ──────────────────────────────────────────────────
// Returns the document with its extracted fields and a short-lived signed URL.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: { id, userId },
    include: {
      extractedFields: {
        orderBy: [{ fieldGroup: "asc" }, { fieldName: "asc" }],
      },
      _count: { select: { extractedFields: true } },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Generate a 15-minute signed URL for direct download
  let signedUrl: string | null = null;
  try {
    signedUrl = await getSignedDownloadUrl({
      key: document.s3Key,
      bucket: document.s3Bucket,
    });
  } catch (error) {
    console.error("[GET /api/documents/[id]] Signed URL generation failed:", error);
  }

  return NextResponse.json({ document: { ...document, signedUrl } });
}

// ─── DELETE /api/documents/[id] ───────────────────────────────────────────────
// Removes the document from S3 and cascades deletion in the database.

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: { id, userId },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Delete from S3 — non-fatal: we still clean up the DB record
  try {
    await deleteFromS3({ key: document.s3Key, bucket: document.s3Bucket });
  } catch (error) {
    console.error("[DELETE /api/documents/[id]] S3 delete error:", error);
  }

  // Delete DB record (cascades to ExtractedField)
  await prisma.document.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
