import { describe, expect, it } from "vitest";
import { getFormSpecificInstructions } from "@/lib/ai/prompts/extraction";

describe("getFormSpecificInstructions", () => {
  it("includes W-2 box guidance", () => {
    const t = getFormSpecificInstructions("W2");
    expect(t).toContain("W-2");
    expect(t).toContain("Box");
  });

  it("includes 1040 line guidance", () => {
    expect(getFormSpecificInstructions("FORM_1040")).toContain("1040");
    expect(getFormSpecificInstructions("FORM_1040")).toContain("Line");
  });

  it("includes 1099 variant guidance", () => {
    const t = getFormSpecificInstructions("FORM_1099_NEC");
    expect(t).toContain("1099");
    expect(t).toContain("form_subtype");
  });

  it("includes Form 1098 mortgage guidance", () => {
    const t = getFormSpecificInstructions("FORM_1098");
    expect(t).toContain("1098");
    expect(t).toContain("lender");
  });

  it("includes Form 1095-A/B/C guidance", () => {
    const t = getFormSpecificInstructions("FORM_1095");
    expect(t).toContain("1095");
    expect(t).toContain("form_subtype");
  });

  it("includes receipt and bank statement guidance", () => {
    expect(getFormSpecificInstructions("RECEIPT")).toContain("Receipt");
    expect(getFormSpecificInstructions("BANK_STATEMENT")).toContain("Bank statement");
  });

  it("includes OTHER document guidance", () => {
    expect(getFormSpecificInstructions("OTHER")).toContain("Other");
    expect(getFormSpecificInstructions("OTHER")).toContain("document_title");
  });

  it("returns guidance for FORM_1099_INT same family as NEC", () => {
    expect(getFormSpecificInstructions("FORM_1099_INT")).toContain("form_subtype");
  });
});
