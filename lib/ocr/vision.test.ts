import { describe, expect, it } from "vitest";
import {
  buildVisionExtractionPrompt,
  parseVisionModelJson,
  stripJsonFence,
  visionMediaBlock,
} from "@/lib/ocr/vision";

describe("visionMediaBlock", () => {
  const b64 = Buffer.from("x").toString("base64");

  it("uses application/pdf document block for PDF and unknown MIME types", () => {
    const pdf = visionMediaBlock(b64, "application/pdf");
    expect(pdf).toMatchObject({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: b64 },
    });

    const fallback = visionMediaBlock(b64, "application/octet-stream");
    expect(fallback).toMatchObject({ type: "document" });
  });

  it("uses image/jpeg for jpeg and jpg MIME types", () => {
    for (const mime of ["image/jpeg", "image/jpg", "IMAGE/JPEG"]) {
      const block = visionMediaBlock(b64, mime);
      expect(block).toMatchObject({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: b64 },
      });
    }
  });

  it("uses image/png for png MIME type", () => {
    const block = visionMediaBlock(b64, "image/png");
    expect(block).toMatchObject({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: b64 },
    });
  });
});

describe("buildVisionExtractionPrompt", () => {
  it("embeds document type label and enum key", () => {
    const p = buildVisionExtractionPrompt("FORM_1098");
    expect(p).toContain("Form 1098");
    expect(p).toContain("[FORM_1098]");
  });

  it("lists expected snake_case keys for Form 1098", () => {
    const p = buildVisionExtractionPrompt("FORM_1098");
    expect(p).toContain("mortgage_interest_received");
    expect(p).toContain("lender_name");
    expect(p).toContain("Each key maps to this human meaning");
  });

  it("includes form-specific instructions for new document types", () => {
    expect(buildVisionExtractionPrompt("FORM_1095")).toContain("1095");
    expect(buildVisionExtractionPrompt("RECEIPT")).toContain("Merchant");
    expect(buildVisionExtractionPrompt("BANK_STATEMENT")).toContain("Institution");
    expect(buildVisionExtractionPrompt("OTHER")).toContain("document_title");
  });

  it("includes many 1040 field names for structured extraction", () => {
    const p = buildVisionExtractionPrompt("FORM_1040");
    expect(p).toContain("adjusted_gross_income");
    expect(p).toContain("first_name");
  });

  it("includes W-2 employer and wage keys", () => {
    const p = buildVisionExtractionPrompt("W2");
    expect(p).toContain("employer_ein");
    expect(p).toContain("wages_tips_other_compensation");
  });
});

describe("stripJsonFence and parseVisionModelJson", () => {
  it("strips markdown json fences", () => {
    const inner = `{"a":"1"}`;
    expect(stripJsonFence(`\`\`\`json\n${inner}\n\`\`\``)).toBe(inner);
  });

  it("parses raw JSON object", () => {
    expect(parseVisionModelJson('{"x":"y"}')).toEqual({ x: "y" });
  });

  it("parses JSON inside fences and normalizes non-string values", () => {
    expect(parseVisionModelJson("```json\n{\"n\":42}\n```")).toEqual({ n: "42" });
  });

  it("throws when content is a JSON array", () => {
    expect(() => parseVisionModelJson("[1,2]")).toThrow("Expected JSON object");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseVisionModelJson("not json")).toThrow();
  });
});
