import Anthropic from "@anthropic-ai/sdk";
import type { DocumentType } from "@prisma/client";
import {
  buildVisionExtractionPrompt,
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
  const promptText = buildVisionExtractionPrompt(documentType);

  const response = await client.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 8192,
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
