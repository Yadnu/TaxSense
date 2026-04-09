import { auth } from "@clerk/nextjs/server";
import type { FieldSource } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { inferOcrDocumentType, runOcrPipeline } from "@/lib/ocr";
import { downloadFromS3 } from "@/lib/storage/s3";
import { getFieldDefsForDocType } from "@/types/extraction";

function fieldGroupFor(fieldName: string, documentType: string): string | null {
  const defs = getFieldDefsForDocType(documentType);
  return defs.find((d) => d.name === fieldName)?.group ?? null;
}

export async function POST(
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

  if (document.status === "PROCESSING") {
    return NextResponse.json(
      { error: "Extraction already in progress." },
      { status: 409 }
    );
  }

  await prisma.document.update({
    where: { id },
    data: { status: "PROCESSING" },
  });

  try {
    const buffer = await downloadFromS3({
      key: document.s3Key,
      bucket: document.s3Bucket,
    });

    const ocrDocType = inferOcrDocumentType(document.originalFilename, document.documentType);

    const { fields, rawText, usedClaude } = await runOcrPipeline(buffer, id, ocrDocType, {
      mimeType: document.mimeType,
    });

    const source: FieldSource = usedClaude ? "LLM_INFERENCE" : "OCR";
    const confidence = usedClaude ? 0.82 : 0.88;

    await prisma.document.update({
      where: { id },
      data: {
        rawText,
        ocrEngine: "TESSERACT",
      },
    });

    await prisma.extractedField.deleteMany({ where: { documentId: id } });

    const entries = Object.entries(fields).filter(([, v]) => v.trim().length > 0);
    if (entries.length > 0) {
      await prisma.extractedField.createMany({
        data: entries.map(([fieldName, fieldValue]) => ({
          documentId: id,
          fieldName,
          fieldValue,
          confidence,
          pageNumber: null,
          fieldGroup: fieldGroupFor(fieldName, document.documentType),
          source,
        })),
      });
    }

    const status =
      entries.length === 0 ? ("NEEDS_REVIEW" as const) : ("EXTRACTED" as const);

    await prisma.document.update({
      where: { id },
      data: {
        status,
        processedAt: entries.length > 0 ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, fields }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/documents/[id]/extract]", err);

    await prisma.document
      .update({
        where: { id },
        data: { status: "FAILED" },
      })
      .catch(() => {});

    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
