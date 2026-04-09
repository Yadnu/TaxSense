import Anthropic from "@anthropic-ai/sdk";
import type { DocumentType } from "@prisma/client";

export type OcrDocumentType = "W2" | "W9" | "1099" | "UNKNOWN";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function inferOcrDocumentType(
  originalFilename: string,
  documentType: DocumentType
): OcrDocumentType {
  const n = originalFilename.toLowerCase();
  const dt = String(documentType);

  if (n.includes("w2") || documentType === "W2") return "W2";
  if (n.includes("w9") || dt.includes("W9")) return "W9";
  if (n.includes("1099") || dt.includes("1099")) return "1099";
  return "UNKNOWN";
}

function stripJsonFence(s: string): string {
  const t = s.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  return fence ? fence[1].trim() : t;
}

export async function runOcrPipeline(
  fileBuffer: Buffer,
  documentId: string,
  documentType: OcrDocumentType = "UNKNOWN",
  options?: { mimeType?: string }
): Promise<{ fields: Record<string, string>; rawText: string; usedClaude: boolean }> {
  console.info("[OCR] Starting LLM extraction for document:", documentId);
  void options;

  const base64Pdf = fileBuffer.toString("base64");

  const response = await client.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Pdf,
            },
          },
          {
            type: "text",
            text: `This is a ${documentType} tax form. Extract every field and value you can find.
Return ONLY a valid JSON object with snake_case keys and string values.
No explanation, no markdown, no code fences. Just the raw JSON object.

For a W2, include fields like:
employer_name, employer_ein, employer_address,
employee_name, employee_ssn, employee_address,
wages_tips_other, federal_tax_withheld,
social_security_wages, social_security_tax_withheld,
medicare_wages, medicare_tax_withheld,
state, state_wages, state_tax_withheld,
tax_year

Extract whatever is present. Do not guess or hallucinate missing values.
Use empty string "" for fields that are present but blank.
Omit fields that do not exist in this document.`,
          },
        ],
      },
    ],
  });

  const raw =
    response.content
      .filter((b) => b.type === "text")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b: any) => b.text as string)
      .join("") ?? "";

  console.info("[OCR] LLM raw response length:", raw.length);

  let fields: Record<string, string> = {};
  try {
    const cleaned = stripJsonFence(raw).replace(/```json|```/g, "").trim();
    fields = JSON.parse(cleaned);
    console.info("[OCR] Fields extracted:", Object.keys(fields).length);
  } catch {
    console.error("[OCR] Failed to parse LLM response as JSON:", raw);
    throw new Error("LLM returned invalid JSON");
  }

  return { fields, rawText: raw, usedClaude: true };
}
