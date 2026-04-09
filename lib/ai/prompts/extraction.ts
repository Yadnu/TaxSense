import type { DocumentType } from "@prisma/client";
import { getFieldDefsForDocType, type FieldDef } from "@/types/extraction";

// ─── Form display names ────────────────────────────────────────────────────────

const FORM_DISPLAY_NAMES: Partial<Record<DocumentType, string>> = {
  W2:            "W-2 Wage and Tax Statement",
  FORM_1040:     "Form 1040 (U.S. Individual Income Tax Return)",
  FORM_1040_NR:  "Form 1040-NR (U.S. Nonresident Alien Income Tax Return)",
  FORM_1099:     "Form 1099",
  FORM_1099_NEC: "Form 1099-NEC (Nonemployee Compensation)",
  FORM_1099_INT: "Form 1099-INT (Interest Income)",
  FORM_1099_DIV: "Form 1099-DIV (Dividends and Distributions)",
  FORM_1099_MISC:"Form 1099-MISC (Miscellaneous Information)",
  FORM_1099_R:   "Form 1099-R (Distributions from Pensions and Annuities)",
};

function getFormDisplayName(documentType: DocumentType): string {
  return FORM_DISPLAY_NAMES[documentType] ?? documentType.replace(/_/g, " ");
}

// ─── Form-specific extraction guidance ────────────────────────────────────────

function getFormSpecificInstructions(documentType: DocumentType): string {
  switch (documentType) {
    case "W2":
      return `
FORM-SPECIFIC GUIDANCE (W-2):
- Box numbers (1–20) are printed on the form. Use box numbers to identify fields.
- Employer information is at the top-left (boxes a–e). Employee info is in the middle.
- Employee SSN is usually formatted as XXX-XX-XXXX — preserve this format.
- All income and withholding amounts (boxes 1–20) are dollar values.
- Strip $ signs and commas: "$12,345.67" → "12345.67".
- Box 12 may contain coded entries (e.g., "D 5000.00") — ignore the letter code, extract the value.
- If multiple W-2 copies appear on the page, extract from the first complete copy.`;

    case "FORM_1040":
      return `
FORM-SPECIFIC GUIDANCE (Form 1040):
- Line numbers appear in the left margin (e.g., "1z", "2b", "11", "35a").
- Use line numbers to identify fields precisely.
- Filing status: one checkbox will be marked (Single, MFJ, MFS, HoH, or QSS).
- Dollar amounts appear in right-aligned columns — extract without $ or commas.
- If a line is blank or has a dash, set fieldValue to null.
- Lines with "(Loss)" may be negative — include the minus sign.`;

    case "FORM_1040_NR":
      return `
FORM-SPECIFIC GUIDANCE (Form 1040-NR):
- This is for nonresident aliens. Look for country of citizenship and visa type fields.
- Two income sections exist: "effectively connected" income and NEC income (Schedule NEC).
- Tax treaty information (country + article number) may appear in the top section.
- Dates (entered/left US) may be in various formats — extract as-is.
- Dollar amounts appear in right-aligned columns — extract without $ or commas.`;

    case "FORM_1099":
    case "FORM_1099_NEC":
    case "FORM_1099_INT":
    case "FORM_1099_DIV":
    case "FORM_1099_MISC":
    case "FORM_1099_R":
      return `
FORM-SPECIFIC GUIDANCE (Form 1099):
- First, identify the specific 1099 variant from the form title/header (NEC, INT, DIV, MISC, R).
- Extract it as "form_subtype" (e.g., "NEC", "INT").
- The payer's name, address, and TIN are at the top; recipient info is below.
- Box labels and amounts vary by variant — use position and labels to identify box numbers.
- Map box amounts to box_1_amount through box_8_amount in order of appearance.
- Dollar amounts should be extracted without $ or commas.
- Account number (if present) is not a required field — skip it.`;

    default:
      return "";
  }
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

/**
 * Builds the system prompt for LLM-based structured field extraction.
 *
 * The prompt instructs the model to:
 * 1. Extract only fields from the predefined list for the given form type.
 * 2. Return valid JSON conforming to the LLMExtractionOutputSchema.
 * 3. Set confidence scores based on OCR clarity (not hallucinate values).
 */
export function buildExtractionSystemPrompt(documentType: DocumentType): string {
  const formName = getFormDisplayName(documentType);
  const fields = getFieldDefsForDocType(documentType);

  const fieldList = fields
    .map((f: FieldDef) => {
      const refs: string[] = [];
      if (f.boxNumber) refs.push(`Box ${f.boxNumber}`);
      if (f.lineNumber) refs.push(`Line ${f.lineNumber}`);
      const refStr = refs.length > 0 ? ` [${refs.join(", ")}]` : "";
      return `  - fieldName: "${f.name}", fieldGroup: "${f.group}", label: "${f.label}"${refStr}`;
    })
    .join("\n");

  const formInstructions = getFormSpecificInstructions(documentType);

  return `You are a tax document data extractor specializing in ${formName} forms.

Your task: extract structured field values from OCR text and return them as JSON.

═══════════════════════════════════════════════════════
REQUIRED RESPONSE FORMAT — return ONLY this JSON, nothing else:
{
  "fields": [
    {
      "fieldName": "<exact snake_case name from the list below>",
      "fieldValue": "<extracted string, or null if not found>",
      "confidence": <float 0.0–1.0>,
      "pageNumber": <integer page number, or null>,
      "fieldGroup": "<group name from the list below>"
    }
  ]
}
═══════════════════════════════════════════════════════

CONFIDENCE SCORING:
- 1.0  = value is clearly and unambiguously present in the text
- 0.75–0.99 = value is present with minor OCR noise or slight uncertainty
- 0.5–0.74 = value might be correct but OCR was poor or context is ambiguous
- 0.1–0.49 = very uncertain — partial characters or inferred from position
- 0.0  = field NOT found (set fieldValue to null)

EXTRACTION RULES:
1. Extract ONLY fields from the list below. Do not add extra fields.
2. Include ALL fields in the response, even if fieldValue is null.
3. NEVER guess, infer, or calculate values not explicitly in the OCR text.
4. Strip currency symbols and commas: "$12,345.67" → "12345.67".
5. Preserve SSN / EIN formatting (e.g., "123-45-6789").
6. For negative values (losses), include the minus sign: "-1234.56".
7. Return ONLY valid JSON — no markdown, no prose, no code blocks.
${formInstructions}

═══════════════════════════════════════════════════════
FIELDS TO EXTRACT (${fields.length} fields):
${fieldList}
═══════════════════════════════════════════════════════`;
}

/**
 * Builds the user message containing the OCR text to extract from.
 * The system prompt provides instructions; this message provides the raw data.
 */
export function buildExtractionUserPrompt(ocrText: string): string {
  const trimmed = ocrText.trim();
  return `Extract all available fields from the following OCR text and return JSON:

---BEGIN OCR TEXT---
${trimmed}
---END OCR TEXT---`;
}
