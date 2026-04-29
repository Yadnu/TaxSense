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

// ─── Step 1: Document type detection ─────────────────────────────────────────

const DETECTABLE_TYPES = [
  "W2",
  "FORM_1099_NEC",
  "FORM_1099_INT",
  "FORM_1099_DIV",
  "FORM_1099_MISC",
  "FORM_1099_R",
  "FORM_1040",
  "FORM_1040_NR",
  "FORM_1098",
  "FORM_1095",
  "RECEIPT",
  "BANK_STATEMENT",
  "OTHER",
] as const;

/**
 * First-pass prompt asking the model to identify the document type only.
 * Returns a tiny JSON payload — use max_tokens: 64 for this call.
 */
export function buildDocumentTypeDetectionPrompt(): string {
  return `Examine this tax document and identify its type.

Respond with ONLY this JSON object:
{"documentType": "<TYPE>"}

<TYPE> must be exactly one of:
"W2", "FORM_1099_NEC", "FORM_1099_INT", "FORM_1099_DIV", "FORM_1099_MISC",
"FORM_1099_R", "FORM_1040", "FORM_1040_NR", "FORM_1098", "FORM_1095",
"RECEIPT", "BANK_STATEMENT", "OTHER"

Return only valid JSON matching the schema above. No explanation, no markdown, no extra fields.`;
}

/** Parses the detection response and returns a valid DocumentType (falls back to "OTHER"). */
export function parseDetectedDocumentType(raw: string): DocumentType {
  try {
    const cleaned = stripJsonFence(raw).trim();
    const parsed = JSON.parse(cleaned) as { documentType?: string };
    if (parsed.documentType && (DETECTABLE_TYPES as readonly string[]).includes(parsed.documentType)) {
      return parsed.documentType as DocumentType;
    }
  } catch {
    // fall through to default
  }
  return "OTHER" as DocumentType;
}

// ─── Step 2: Strict per-type schema templates ─────────────────────────────────

/**
 * Returns the strict JSON schema template for the given document type.
 * W-2 uses the camelCase field names required by the extraction spec.
 * All other types use the existing snake_case field definitions.
 * Every field in the template is null — the model must fill them all in.
 * tax_year is excluded from all schemas; it is always hardcoded to 2026.
 */
function buildStrictSchemaTemplate(documentType: DocumentType): Record<string, string | null> {
  if (documentType === "W2") {
    return {
      documentType: "W2",
      employerEIN: null,
      employerName: null,
      employeeSSN: null,
      wagesBox1: null,
      federalWithheldBox2: null,
      socialSecurityWagesBox3: null,
      socialSecurityWithheldBox4: null,
      medicareWagesBox5: null,
      medicareWithheldBox6: null,
      stateBox15: null,
      stateWagesBox16: null,
      stateWithheldBox17: null,
    };
  }

  const defs = getFieldDefsForDocType(documentType);
  const schema: Record<string, string | null> = { documentType };
  for (const d of defs) {
    // tax_year is always 2026 — never read from the document
    if (d.name !== "tax_year") {
      schema[d.name] = null;
    }
  }
  return schema;
}

// ─── Step 2: Extraction prompt ────────────────────────────────────────────────

export function buildVisionExtractionPrompt(documentType: DocumentType): string {
  const label = DOCUMENT_TYPE_LABELS[documentType] ?? documentType.replace(/_/g, " ");
  const schema = buildStrictSchemaTemplate(documentType);
  const schemaJson = JSON.stringify(schema, null, 2);
  const formHints = getFormSpecificInstructions(documentType).trim();

  return `You are extracting structured data from a tax document.

Document type: ${label} [${documentType}]

Return a JSON object with EXACTLY the following fields. Set any field not found in the document to null. Do not add, rename, or omit any fields.

${schemaJson}

EXTRACTION RULES:
- Return ALL fields listed in the schema above, even if the value is null.
- Strip $ signs and commas from dollar amounts (e.g. "$12,345.67" → 12345.67).
- Preserve SSN and EIN formatting as printed (e.g. "123-45-6789").
- Do not guess or hallucinate values not visible in the document.
- Tax year is always 2026 — do not read or return any tax year value from the document.
${formHints ? `\n${formHints}` : ""}
Return only valid JSON matching the schema above. No explanation, no markdown, no extra fields.`;
}

// ─── JSON parser ──────────────────────────────────────────────────────────────

/** Parses model output into a flat string record (coerces non-strings; skips nulls). */
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
