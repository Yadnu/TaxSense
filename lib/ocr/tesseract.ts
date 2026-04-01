import { createWorker } from "tesseract.js";

/**
 * Runs Tesseract.js OCR on an image buffer and returns extracted plain text.
 *
 * Supports: JPEG, PNG, TIFF, BMP, GIF, WebP (any format Tesseract can decode).
 * The worker is created and terminated per call — suitable for Next.js API
 * routes where there is no persistent process to share a long-lived worker.
 *
 * @param imageBuffer - Raw image bytes downloaded from S3
 * @returns Extracted text, or empty string if recognition fails
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  const worker = await createWorker("eng", 1, {
    // Suppress Tesseract's verbose progress logging in production
    logger: () => {},
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(imageBuffer);

    return cleanOcrText(text);
  } finally {
    await worker.terminate();
  }
}

/**
 * Cleans raw Tesseract output for use as LLM extraction input.
 * - Normalises line endings
 * - Collapses runs of blank lines to a single blank line
 * - Fixes common ligature mis-reads (ﬁ → fi, ﬂ → fl)
 * - Strips form-feed characters
 */
function cleanOcrText(raw: string): string {
  return raw
    .replace(/\f/g, "\n")
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
