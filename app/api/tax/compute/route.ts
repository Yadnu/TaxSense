import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeTax } from "@/lib/tax/engine";
import type { FilingStatus, TaxInput } from "@/lib/tax/types";

// Maps incoming filing status strings (Prisma enum or old snake_case) → new camelCase
const FILING_STATUS_MAP: Record<string, FilingStatus> = {
  // Prisma enum values
  SINGLE:                      "single",
  MARRIED_FILING_JOINTLY:      "marriedFilingJointly",
  MARRIED_FILING_SEPARATELY:   "marriedFilingSeparately",
  HEAD_OF_HOUSEHOLD:           "headOfHousehold",
  QUALIFYING_SURVIVING_SPOUSE: "marriedFilingJointly",
  // Old snake_case pass-through (from page.tsx filing status selector)
  single:                      "single",
  married_filing_jointly:      "marriedFilingJointly",
  married_filing_separately:   "marriedFilingSeparately",
  head_of_household:           "headOfHousehold",
  // New camelCase pass-through
  marriedFilingJointly:        "marriedFilingJointly",
  marriedFilingSeparately:     "marriedFilingSeparately",
  headOfHousehold:             "headOfHousehold",
};

function parseNum(v: string | undefined): number {
  if (!v) return 0;
  return parseFloat(v.replace(/[$,\s]/g, "")) || 0;
}

function get(rawFields: Record<string, string>, ...keys: string[]): string | undefined {
  return keys.reduce<string | undefined>((acc, k) => acc ?? rawFields[k], undefined);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    documentId: string;
    filingStatus: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { documentId, filingStatus: filingStatusRaw } = body;

  if (!documentId || typeof documentId !== "string") {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  const filingStatus: FilingStatus = FILING_STATUS_MAP[filingStatusRaw] ?? "single";

  try {
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { id: true, status: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const extractedFields = await prisma.extractedField.findMany({
      where: { documentId },
      select: { fieldName: true, fieldValue: true },
    });

    const rawFields: Record<string, string> = {};
    for (const field of extractedFields) {
      if (field.fieldValue !== null) {
        rawFields[field.fieldName] = field.fieldValue;
      }
    }

    // Build structured TaxInput from extracted fields.
    // Checks new camelCase names first, falls back to legacy snake_case names.
    const taxInput: TaxInput = {
      wagesBox1: parseNum(
        get(rawFields, "wagesBox1", "wages_tips_other_compensation", "wages_tips_other"),
      ),
      federalWithheldBox2: parseNum(
        get(rawFields, "federalWithheldBox2", "federal_income_tax_withheld", "federal_tax_withheld"),
      ),
      socialSecurityWithheldBox4: parseNum(
        get(rawFields, "socialSecurityWithheldBox4", "social_security_tax_withheld"),
      ),
      medicareWithheldBox6: parseNum(
        get(rawFields, "medicareWithheldBox6", "medicare_tax_withheld"),
      ),
      stateWithheldBox17: parseNum(
        get(rawFields, "stateWithheldBox17", "state_income_tax", "state_tax_withheld"),
      ),
      state: (
        get(rawFields, "stateBox15", "state", "state_code", "employer_state") ?? "CA"
      ).trim().toUpperCase().slice(0, 2),
      filingStatus,
    };

    const result = computeTax(taxInput);
    const stateCode = result.state.state;

    await prisma.taxComputationResult.upsert({
      where: { documentId },
      create: {
        documentId,
        summary: result as object,
      },
      update: {
        summary: result as object,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, summary: result, stateCode }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/tax/compute]", err);
    const message = err instanceof Error ? err.message : "Tax computation failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
