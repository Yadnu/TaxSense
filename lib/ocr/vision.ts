import type { ContentBlockParam } from "@anthropic-ai/sdk/resources";
import type { DocumentType } from "@prisma/client";
import { getFormSpecificInstructions } from "@/lib/ai/prompts/extraction";
import { DOCUMENT_TYPE_LABELS } from "@/lib/validators/document";
import { getFieldDefsForDocType } from "@/types/extraction";

export function stripJsonFence(s: string): string {
  const t = s.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  return fence ? fence[1].trim() : t;
}

/** Anthropic vision/document block for PDF or raster images. */
export function visionMediaBlock(base64: string, mimeType: string): ContentBlockParam {
  const mt = mimeType.toLowerCase();
  if (mt === "image/jpeg" || mt === "image/jpg") {
    return {
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: base64 },
    };
  }
  if (mt === "image/png") {
    return {
      type: "image",
      source: { type: "base64", media_type: "image/png", data: base64 },
    };
  }
  return {
    type: "document",
    source: {
      type: "base64",
      media_type: "application/pdf",
      data: base64,
    },
  };
}

export function buildVisionExtractionPrompt(documentType: DocumentType): string {
  const label = DOCUMENT_TYPE_LABELS[documentType];
  const defs = getFieldDefsForDocType(documentType);
  const formHints = getFormSpecificInstructions(documentType).trim();

  const keySection =
    defs.length > 0
      ? `Use these snake_case JSON keys when the document contains that information (omit a key if not applicable):
${defs.map((d) => d.name).join(", ")}

Each key maps to this human meaning for your reference:
${defs.map((d) => `  - ${d.name}: ${d.label}`).join("\n")}`
      : `Use descriptive snake_case keys for visible label/value pairs. Do not invent data.`;

  return `You are extracting structured data from a scanned or PDF document.

Document type (user-selected): ${label} [${documentType}]

${keySection}
${formHints ? `\n${formHints}\n` : ""}
GLOBAL RULES:
- Return ONLY one JSON object. Keys must be snake_case; values must be strings.
- Omit keys that do not apply to this document. Use "" only when the field exists on the form but is visibly blank.
- Do not guess or hallucinate values not visible on the document.
- Strip $ and commas from dollar amounts (e.g. 12345.67). Preserve SSN/EIN/TIN formatting as printed.
- Return raw JSON only — no markdown, no code fences, no commentary.`;
}

/** Parses model output into a flat string record (coerces non-strings). */
export function parseVisionModelJson(raw: string): Record<string, string> {
  const cleaned = stripJsonFence(raw).replace(/```json|```/g, "").trim();
  const fields = JSON.parse(cleaned) as Record<string, unknown>;
  if (fields === null || typeof fields !== "object" || Array.isArray(fields)) {
    throw new Error("Expected JSON object");
  }
  const stringFields: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === "string") stringFields[k] = v;
    else if (v != null) stringFields[k] = String(v);
  }
  return stringFields;
}
