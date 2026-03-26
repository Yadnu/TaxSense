import { generateText } from "ai";
import { getChatModel } from "@/lib/ai/client";
import {
  buildExtractionSystemPrompt,
  buildExtractionUserPrompt,
} from "@/lib/ai/prompts/extraction";
import {
  LLMExtractionOutputSchema,
  type ExtractedFieldResult,
} from "@/types/extraction";
import type { DocumentType } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FieldMapperOptions {
  /** Maximum tokens for the extraction response. Default: 4096. */
  maxTokens?: number;
  /** Temperature for generation. Default: 0.1 (near-deterministic). */
  temperature?: number;
}

export interface FieldMapperResult {
  /** Validated extracted fields. Empty array if extraction failed. */
  fields: ExtractedFieldResult[];
  /** Whether the LLM call succeeded. */
  success: boolean;
  /** Error message if extraction failed. */
  error?: string;
  /** Raw LLM output text (for debugging / audit). */
  rawOutput?: string;
}

// ─── Main extraction function ─────────────────────────────────────────────────

/**
 * Extracts structured tax form fields from OCR text using the LLM.
 *
 * Pipeline:
 * 1. Build a document-type-specific extraction prompt (from lib/ai/prompts/extraction.ts).
 * 2. Send OCR text to the configured LLM (Groq / Anthropic via getChatModel()).
 * 3. Parse and validate the JSON response with Zod.
 * 4. Return only fields that have either a non-null value or positive confidence.
 *
 * The LLM is instructed to return structured JSON only — no prose. Temperature
 * is set near-zero to maximise deterministic extraction behaviour.
 */
export async function mapFieldsFromOCRText(
  ocrText: string,
  documentType: DocumentType,
  options: FieldMapperOptions = {}
): Promise<FieldMapperResult> {
  const { maxTokens = 4096, temperature = 0.1 } = options;

  if (!ocrText || ocrText.trim().length < 20) {
    return {
      fields: [],
      success: false,
      error: "OCR text is too short or empty to extract fields.",
    };
  }

  const systemPrompt = buildExtractionSystemPrompt(documentType);
  const userPrompt = buildExtractionUserPrompt(ocrText);

  let rawOutput = "";

  try {
    const { text } = await generateText({
      model: getChatModel(),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens,
      temperature,
    });

    rawOutput = text;

    // Strip markdown code fences that some models add despite instructions
    const jsonText = stripMarkdownCodeFences(text);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return {
        fields: [],
        success: false,
        error: `LLM returned non-JSON output. Raw: ${text.slice(0, 200)}`,
        rawOutput,
      };
    }

    const validated = LLMExtractionOutputSchema.safeParse(parsed);
    if (!validated.success) {
      const issues = validated.error.flatten().fieldErrors;
      return {
        fields: [],
        success: false,
        error: `Zod validation failed: ${JSON.stringify(issues)}`,
        rawOutput,
      };
    }

    // Keep only fields that have a value or non-zero confidence; drop pure nulls
    const fields = validated.data.fields.filter(
      (f) => f.fieldValue !== null || f.confidence > 0
    );

    return { fields, success: true, rawOutput };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      fields: [],
      success: false,
      error: `LLM call failed: ${message}`,
      rawOutput,
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strips markdown code fences (```json ... ```) that models sometimes add
 * even when instructed to return raw JSON only.
 */
function stripMarkdownCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}
