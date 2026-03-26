import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { downloadFromS3 } from "@/lib/storage/s3";
import { mapFieldsFromOCRText } from "@/lib/ocr/field-mapper";
import { isSupportedDocType } from "@/types/extraction";

// ─── POST /api/documents/[id]/extract ────────────────────────────────────────
// Triggers the OCR + field extraction pipeline for a document.
//
// Pipeline:
// 1. Fetch document (ownership check).
// 2. Download from S3, extract plain text (pdf-parse for PDFs).
// 3. Store raw text on Document.rawText and update status → PROCESSING.
// 4. Run LLM field extraction via mapFieldsFromOCRText().
// 5. Persist ExtractedField records (upsert by fieldName).
// 6. Update Document status → EXTRACTED (or FAILED on error).

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // ── 1. Fetch & validate document ownership ──────────────────────────────
  const document = await prisma.document.findFirst({
    where: { id, userId },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.status === "PROCESSING") {
    return NextResponse.json(
      { error: "Extraction already in progress." },
      { status: 409 }
    );
  }

  // Mark as processing
  await prisma.document.update({
    where: { id },
    data: { status: "PROCESSING" },
  });

  try {
    // ── 2. Obtain raw text (re-use stored rawText or extract from S3) ─────
    let rawText = document.rawText ?? "";

    if (!rawText) {
      rawText = await extractRawText(document.s3Key, document.s3Bucket, document.mimeType);

      if (rawText) {
        await prisma.document.update({
          where: { id },
          data: { rawText, ocrEngine: "TESSERACT" },
        });
      }
    }

    if (!rawText || rawText.trim().length < 20) {
      await prisma.document.update({
        where: { id },
        data: { status: "FAILED" },
      });
      return NextResponse.json(
        { error: "Could not extract text from this document. Please ensure it is a readable PDF or image." },
        { status: 422 }
      );
    }

    // ── 3. Check document type support ────────────────────────────────────
    if (!isSupportedDocType(document.documentType)) {
      // Still store raw text but skip structured extraction
      await prisma.document.update({
        where: { id },
        data: { status: "NEEDS_REVIEW" },
      });
      return NextResponse.json({
        message: "Text extracted but structured field extraction is not supported for this document type.",
        extractedCount: 0,
      });
    }

    // ── 4. LLM field extraction ───────────────────────────────────────────
    const { fields, success, error: mapError } = await mapFieldsFromOCRText(
      rawText,
      document.documentType
    );

    if (!success || fields.length === 0) {
      await prisma.document.update({
        where: { id },
        data: { status: "NEEDS_REVIEW" },
      });
      return NextResponse.json({
        message: mapError ?? "No fields could be extracted. Manual review required.",
        extractedCount: 0,
      });
    }

    // ── 5. Persist extracted fields ───────────────────────────────────────
    // Delete existing fields first, then insert fresh results
    await prisma.extractedField.deleteMany({ where: { documentId: id } });

    await prisma.extractedField.createMany({
      data: fields.map((f) => ({
        documentId: id,
        fieldName: f.fieldName,
        fieldValue: f.fieldValue,
        confidence: f.confidence,
        pageNumber: f.pageNumber ?? null,
        fieldGroup: f.fieldGroup,
        source: "LLM_INFERENCE" as const,
      })),
    });

    // ── 6. Mark document as extracted ─────────────────────────────────────
    await prisma.document.update({
      where: { id },
      data: {
        status: "EXTRACTED",
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Extraction complete.",
      extractedCount: fields.length,
    });
  } catch (err) {
    console.error("[POST /api/documents/[id]/extract]", err);

    // Roll back status to FAILED on unexpected error
    await prisma.document.update({
      where: { id },
      data: { status: "FAILED" },
    }).catch(() => {});

    return NextResponse.json(
      { error: "Extraction failed. Please try again." },
      { status: 500 }
    );
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Downloads a document from S3 and extracts its plain text.
 * Supports PDF files via pdf-parse; images return empty string (OCR not yet
 * implemented — Tesseract / Textract pipeline is a separate module).
 */
async function extractRawText(
  s3Key: string,
  s3Bucket: string,
  mimeType: string
): Promise<string> {
  try {
    const buffer = await downloadFromS3({ key: s3Key, bucket: s3Bucket });

    if (mimeType === "application/pdf") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(buffer);
      return cleanText(data.text);
    }

    // Images (JPEG/PNG): return empty — full Tesseract OCR is in lib/ocr/tesseract.ts
    return "";
  } catch (err) {
    console.error("[extractRawText] Failed to download or parse file:", err);
    return "";
  }
}

function cleanText(raw: string): string {
  return raw
    .replace(/\f/g, "\n")
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl")
    .replace(/^\s*\d+\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
