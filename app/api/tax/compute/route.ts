import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeTaxSummary } from "@/lib/tax/engine";
import type { FilingStatus } from "@/lib/tax/types";
import type { TaxInput } from "@/lib/tax/types";

// Maps Prisma FilingStatus enum values (SCREAMING_SNAKE_CASE) to engine values (lowercase)
const FILING_STATUS_MAP: Record<string, FilingStatus> = {
  SINGLE:                      'single',
  MARRIED_FILING_JOINTLY:      'married_filing_jointly',
  MARRIED_FILING_SEPARATELY:   'married_filing_separately',
  HEAD_OF_HOUSEHOLD:           'head_of_household',
  QUALIFYING_SURVIVING_SPOUSE: 'married_filing_jointly', // closest equivalent
  // lowercase pass-through (already in engine format)
  single:                      'single',
  married_filing_jointly:      'married_filing_jointly',
  married_filing_separately:   'married_filing_separately',
  head_of_household:           'head_of_household',
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    documentId: string;
    filingStatus: string;
    overrides?: Partial<TaxInput>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { documentId, filingStatus: filingStatusRaw, overrides } = body;

  if (!documentId || typeof documentId !== "string") {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  const filingStatus: FilingStatus = FILING_STATUS_MAP[filingStatusRaw] ?? 'single';

  try {
    // Verify document belongs to the authenticated user
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { id: true, status: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Fetch all extracted fields for this document
    const extractedFields = await prisma.extractedField.findMany({
      where: { documentId },
      select: { fieldName: true, fieldValue: true },
    });

    // Convert ExtractedField rows to Record<string, string>
    const rawFields: Record<string, string> = {};
    for (const field of extractedFields) {
      if (field.fieldValue !== null) {
        rawFields[field.fieldName] = field.fieldValue;
      }
    }

    // Run the tax computation engine (pure, synchronous)
    const summary = computeTaxSummary(rawFields, filingStatus, overrides);

    // Extract the resolved state code from raw fields for the UI
    const stateCode =
      (rawFields.state ?? rawFields.state_code ?? rawFields.employer_state ?? '')
        .trim()
        .toUpperCase()
        .slice(0, 2) || 'CA';

    // Upsert the computed summary against the document
    await prisma.taxComputationResult.upsert({
      where: { documentId },
      create: {
        documentId,
        summary: summary as object,
      },
      update: {
        summary: summary as object,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, summary, stateCode }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/tax/compute]", err);
    const message = err instanceof Error ? err.message : "Tax computation failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
