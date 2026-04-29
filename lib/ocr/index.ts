import Anthropic from "@anthropic-ai/sdk";
import type { DocumentType } from "@prisma/client";
import {
  buildDocumentTypeDetectionPrompt,
  buildVisionExtractionPrompt,
  parseDetectedDocumentType,
  parseVisionModelJson,
  visionMediaBlock,
} from "@/lib/ocr/vision";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export { buildVisionExtractionPrompt, parseVisionModelJson, visionMediaBlock } from "@/lib/ocr/vision";

export async function runOcrPipeline(
  fileBuffer: Buffer,
  documentId: string,
  documentType: DocumentType,
  options?: { mimeType?: string }
): Promise<{ fields: Record<string, string>; rawText: string; usedClaude: boolean }> {
  const mimeType = options?.mimeType?.trim() || "application/pdf";
  console.info("[OCR] Starting LLM extraction for document:", documentId, documentType, mimeType);

  const base64 = fileBuffer.toString("base64");
  const mediaBlock = visionMediaBlock(base64, mimeType);

  // Step 1: Detect document type from the file content
  const detectionResponse = await client.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 64,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [mediaBlock, { type: "text", text: buildDocumentTypeDetectionPrompt() }],
      },
    ],
  });

  const detectionRaw =
    detectionResponse.content
      .filter((b) => b.type === "text")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b: any) => b.text as string)
      .join("") ?? "";

  const detectedType = parseDetectedDocumentType(detectionRaw);
  console.info("[OCR] Detected type:", detectedType, "| User-selected:", documentType);

  // Step 2: Extract fields using the detected type's strict schema
  const promptText = buildVisionExtractionPrompt(detectedType);

  const response = await client.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 8192,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [mediaBlock, { type: "text", text: promptText }],
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

  try {
    const fields = parseVisionModelJson(raw);
    console.info("[OCR] Fields extracted:", Object.keys(fields).length);
    return { fields, rawText: raw, usedClaude: true };
  } catch {
    console.error("[OCR] Failed to parse LLM response as JSON:", raw);
    throw new Error("LLM returned invalid JSON");
  }
}
