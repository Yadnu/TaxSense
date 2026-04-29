import fs from "fs";
import path from "path";

/**
 * Extracts plain text from a PDF file using pdf-parse.
 * Returns the raw text content suitable for chunking.
 */
export async function extractTextFromPdf(filePath: string): Promise<string> {
  // Use require() rather than dynamic import: pdf-parse is a CommonJS module
  // and its ESM shim does not reliably export a `.default` in all Node versions.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (
    buf: Buffer
  ) => Promise<{ text: string; numpages: number }>;
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return cleanPdfText(data.text);
}

/**
 * Infers a human-readable title from the PDF filename, falling back to the
 * raw filename if no better guess is available. The real title is often buried
 * deep in the PDF metadata; using the filename is more reliable for IRS docs.
 */
export function titleFromPdfFilename(filePath: string): string {
  const base = path.basename(filePath, ".pdf");
  // Convert kebab/snake case to title case: "irs-pub-17" → "Irs Pub 17"
  return base
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Cleans up common PDF extraction artifacts:
 * - Collapses excessive blank lines
 * - Removes form-feed characters
 * - Normalises Unicode ligatures (ﬁ → fi, etc.)
 * - Removes page-number-only lines
 */
function cleanPdfText(raw: string): string {
  return raw
    .replace(/\f/g, "\n")                           // form feeds → newlines
    .replace(/\uFB01/g, "fi")                       // ﬁ ligature
    .replace(/\uFB02/g, "fl")                       // ﬂ ligature
    .replace(/\uFB03/g, "ffi")
    .replace(/\uFB04/g, "ffl")
    .replace(/^\s*\d+\s*$/gm, "")                  // page-number-only lines
    .replace(/\n{3,}/g, "\n\n")                     // collapse blank lines
    .trim();
}
