import arcjet, { tokenBucket } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadToS3, buildS3Key, deleteFromS3 } from "@/lib/storage/s3";
import {
  validateMimeType,
  validateFileSize,
  UploadMetadataSchema,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/validators/document";
import { safeLog } from "@/lib/utils";
import { getServerConfig } from "@/lib/config";

// ─── Arcjet rate limiter ──────────────────────────────────────────────────────
// Applied only on POST (upload) — list (GET) is cheaper and not abuse-prone.
// Token bucket: 5 uploads per user per minute, burst of 10.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _aj: any = null;

function getAj() {
  const key = getServerConfig().ARCJET_KEY;
  if (!key) return null;
  if (!_aj) {
    _aj = arcjet({
      key,
      rules: [
        tokenBucket({
          mode: "LIVE",
          refillRate: 5,   // 5 uploads refilled per interval
          interval: 60,   // per 60 seconds
          capacity: 10,   // burst up to 10
        }),
      ],
    });
  }
  return _aj;
}

// ─── GET /api/documents ───────────────────────────────────────────────────────
// Returns the authenticated user's documents ordered by upload date (newest first).

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
      include: {
        _count: { select: { extractedFields: true } },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[GET /api/documents]", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// ─── POST /api/documents ──────────────────────────────────────────────────────
// Accepts multipart/form-data with fields:
//   file         — the file blob (required)
//   documentType — DocumentType enum value (optional, defaults to OTHER)
//   taxYearId    — CUID of an existing TaxYear owned by this user (optional)

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Apply rate limiting on upload — skip when ARCJET_KEY is not configured
  const aj = getAj();
  if (aj) {
    const decision = await aj.protect(req, { requested: 1 });
    if (decision.isDenied()) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait a moment before trying again." },
        { status: 429 }
      );
    }
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  // ── Validate file ──────────────────────────────────────────────────────────

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!validateMimeType(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a PDF, JPEG, or PNG." },
      { status: 400 }
    );
  }

  if (!validateFileSize(file.size)) {
    return NextResponse.json(
      { error: `File too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` },
      { status: 400 }
    );
  }

  // ── Validate metadata ──────────────────────────────────────────────────────

  const metadataParsed = UploadMetadataSchema.safeParse({
    documentType: formData.get("documentType") || undefined,
    taxYearId: formData.get("taxYearId") || undefined,
  });

  if (!metadataParsed.success) {
    return NextResponse.json(
      { error: "Invalid metadata", details: metadataParsed.error.flatten() },
      { status: 400 }
    );
  }

  const { documentType, taxYearId } = metadataParsed.data;

  // If taxYearId supplied, ensure it belongs to this user
  if (taxYearId) {
    const taxYear = await prisma.taxYear.findFirst({
      where: { id: taxYearId, userId },
    });
    if (!taxYear) {
      return NextResponse.json({ error: "Tax year not found" }, { status: 404 });
    }
  }

  // ── Upload to S3 ───────────────────────────────────────────────────────────

  const s3Key = buildS3Key(userId, file.name);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  let uploadResult: { key: string; bucket: string };
  try {
    uploadResult = await uploadToS3({
      key: s3Key,
      body: fileBuffer,
      contentType: file.type,
    });
  } catch (error) {
    console.error("[POST /api/documents] S3 upload error:", error);
    return NextResponse.json({ error: "Failed to upload file. Please try again." }, { status: 500 });
  }

  // ── Persist document record ────────────────────────────────────────────────

  let document;
  try {
    document = await prisma.document.create({
      data: {
        userId,
        originalFilename: file.name,
        s3Key: uploadResult.key,
        s3Bucket: uploadResult.bucket,
        mimeType: file.type,
        sizeBytes: file.size,
        documentType,
        taxYearId: taxYearId ?? null,
        status: "UPLOADED",
      },
      include: {
        _count: { select: { extractedFields: true } },
      },
    });
  } catch (error) {
    console.error("[POST /api/documents] DB error:", error);
    // Best-effort S3 cleanup — do not block on the response
    deleteFromS3({ key: uploadResult.key }).catch(() => {});
    return NextResponse.json({ error: "Failed to save document record." }, { status: 500 });
  }

  safeLog("[POST /api/documents] Document created:", { id: document.id, name: file.name });

  return NextResponse.json({ document }, { status: 201 });
}
