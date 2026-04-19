import { describe, expect, it } from "vitest";
import type { DocumentType } from "@prisma/client";
import {
  BANK_STATEMENT_FIELD_DEFS,
  FIELD_GROUP_LABELS,
  FIELD_GROUP_ORDER,
  FORM_1095_FIELD_DEFS,
  FORM_1098_FIELD_DEFS,
  OTHER_FIELD_DEFS,
  RECEIPT_FIELD_DEFS,
  getFieldDefsForDocType,
  getFieldLabel,
  isSupportedDocType,
} from "@/types/extraction";

function fieldGroupFor(fieldName: string, documentType: string): string | null {
  const defs = getFieldDefsForDocType(documentType);
  return defs.find((d) => d.name === fieldName)?.group ?? null;
}

describe("getFieldDefsForDocType", () => {
  it("returns W-2 definitions", () => {
    const defs = getFieldDefsForDocType("W2");
    expect(defs.length).toBeGreaterThan(10);
    expect(defs.some((d) => d.name === "employer_ein")).toBe(true);
  });

  it("returns Form 1040 and 1040-NR definitions", () => {
    expect(getFieldDefsForDocType("FORM_1040").length).toBeGreaterThan(20);
    expect(getFieldDefsForDocType("FORM_1040_NR").length).toBeGreaterThan(10);
  });

  it("returns 1099 definitions for all 1099 enum variants", () => {
    const variants: DocumentType[] = [
      "FORM_1099",
      "FORM_1099_NEC",
      "FORM_1099_INT",
      "FORM_1099_DIV",
      "FORM_1099_MISC",
      "FORM_1099_R",
    ];
    for (const v of variants) {
      const defs = getFieldDefsForDocType(v);
      expect(defs.some((d) => d.name === "payer_name")).toBe(true);
      expect(defs.some((d) => d.name === "form_subtype")).toBe(true);
    }
  });

  it("returns Form 1098 mortgage field definitions", () => {
    expect(getFieldDefsForDocType("FORM_1098")).toEqual(FORM_1098_FIELD_DEFS);
    expect(FORM_1098_FIELD_DEFS.map((d) => d.name)).toContain("mortgage_interest_received");
    expect(FORM_1098_FIELD_DEFS.map((d) => d.name)).toContain("lender_name");
  });

  it("returns Form 1095 health coverage definitions", () => {
    expect(getFieldDefsForDocType("FORM_1095")).toEqual(FORM_1095_FIELD_DEFS);
    expect(FORM_1095_FIELD_DEFS.some((d) => d.name === "form_subtype")).toBe(true);
    expect(FORM_1095_FIELD_DEFS.some((d) => d.name === "issuer_name")).toBe(true);
  });

  it("returns receipt and bank statement definitions", () => {
    expect(getFieldDefsForDocType("RECEIPT")).toEqual(RECEIPT_FIELD_DEFS);
    expect(RECEIPT_FIELD_DEFS.map((d) => d.name)).toContain("merchant_name");
    expect(RECEIPT_FIELD_DEFS.map((d) => d.name)).toContain("total");

    expect(getFieldDefsForDocType("BANK_STATEMENT")).toEqual(BANK_STATEMENT_FIELD_DEFS);
    expect(BANK_STATEMENT_FIELD_DEFS.map((d) => d.name)).toContain("ending_balance");
  });

  it("returns OTHER catch-all definitions", () => {
    expect(getFieldDefsForDocType("OTHER")).toEqual(OTHER_FIELD_DEFS);
    expect(OTHER_FIELD_DEFS.map((d) => d.name)).toContain("document_title");
  });
});

describe("isSupportedDocType", () => {
  it("marks all structured types including newly added ones", () => {
    const types: DocumentType[] = [
      "W2",
      "FORM_1040",
      "FORM_1040_NR",
      "FORM_1099",
      "FORM_1099_NEC",
      "FORM_1098",
      "FORM_1095",
      "RECEIPT",
      "BANK_STATEMENT",
      "OTHER",
    ];
    for (const t of types) {
      expect(isSupportedDocType(t)).toBe(true);
    }
  });
});

describe("getFieldLabel", () => {
  it("resolves labels for new 1098 fields", () => {
    expect(getFieldLabel("mortgage_interest_received", "FORM_1098")).toBe(
      "Mortgage Interest Received"
    );
  });

  it("prettifies unknown field names as fallback", () => {
    expect(getFieldLabel("custom_field_xyz", "FORM_1098")).toContain("Custom");
  });
});

describe("FIELD_GROUP_LABELS and FIELD_GROUP_ORDER", () => {
  it("includes labels for new extraction groups", () => {
    expect(FIELD_GROUP_LABELS.lender_info).toBeDefined();
    expect(FIELD_GROUP_LABELS.borrower_info).toBeDefined();
    expect(FIELD_GROUP_LABELS.loan_detail).toBeDefined();
    expect(FIELD_GROUP_LABELS.coverage).toBeDefined();
    expect(FIELD_GROUP_LABELS.merchant_info).toBeDefined();
    expect(FIELD_GROUP_LABELS.statement_period).toBeDefined();
    expect(FIELD_GROUP_LABELS.summary).toBeDefined();
  });

  it("assigns order numbers to new groups", () => {
    for (const g of ["lender_info", "merchant_info", "summary", "statement_period"]) {
      expect(FIELD_GROUP_ORDER[g]).toBeTypeOf("number");
    }
  });
});

describe("field group resolution (API extract route parity)", () => {
  it("maps 1098 fields to lender and loan groups", () => {
    expect(fieldGroupFor("lender_name", "FORM_1098")).toBe("lender_info");
    expect(fieldGroupFor("mortgage_interest_received", "FORM_1098")).toBe("loan_detail");
  });

  it("maps receipt totals to totals group", () => {
    expect(fieldGroupFor("total", "RECEIPT")).toBe("totals");
  });

  it("returns null for unknown field names (route falls back to other)", () => {
    expect(fieldGroupFor("not_a_real_field", "W2")).toBeNull();
  });
});
