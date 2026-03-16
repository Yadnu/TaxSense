/**
 * Text chunker for RAG knowledge ingestion.
 *
 * Uses a character-based approximation for token counting (1 token ≈ 4 chars),
 * which is accurate enough for English tax documents. The chunker splits on
 * paragraph boundaries where possible to preserve semantic coherence.
 *
 * Target: 512-token chunks with 64-token overlap.
 */

const CHARS_PER_TOKEN = 4;
const DEFAULT_CHUNK_TOKENS = 512;
const DEFAULT_OVERLAP_TOKENS = 64;

export interface TextChunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
  metadata?: Record<string, unknown>;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Splits text into overlapping chunks of approximately `chunkTokens` tokens,
 * with `overlapTokens` tokens of overlap between consecutive chunks.
 *
 * Splitting strategy:
 * 1. Split the document into paragraphs (double newline boundaries).
 * 2. Greedily accumulate paragraphs until the chunk size is reached.
 * 3. When the limit is hit, finalise the chunk and backtrack by the overlap amount.
 */
export function chunkText(
  text: string,
  options: {
    chunkTokens?: number;
    overlapTokens?: number;
    metadata?: Record<string, unknown>;
  } = {}
): TextChunk[] {
  const chunkTokens = options.chunkTokens ?? DEFAULT_CHUNK_TOKENS;
  const overlapTokens = options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;
  const chunkChars = chunkTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;

  // Normalise whitespace while preserving paragraph structure.
  const normalised = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  // Split into paragraphs; keep the separator so we can reconstruct spacing.
  const paragraphs = normalised
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return [];

  const chunks: TextChunk[] = [];
  let chunkIndex = 0;
  let paragraphCursor = 0;

  while (paragraphCursor < paragraphs.length) {
    const chunkParagraphs: string[] = [];
    let chunkLength = 0;

    // Accumulate paragraphs until we hit the chunk size.
    let i = paragraphCursor;
    while (i < paragraphs.length) {
      const para = paragraphs[i];
      const paraLength = para.length + 2; // +2 for "\n\n" separator

      // Always include at least one paragraph to avoid infinite loops.
      if (chunkLength > 0 && chunkLength + paraLength > chunkChars) break;

      chunkParagraphs.push(para);
      chunkLength += paraLength;
      i++;
    }

    const content = chunkParagraphs.join("\n\n").trim();

    if (content.length > 0) {
      chunks.push({
        content,
        chunkIndex,
        tokenCount: estimateTokens(content),
        metadata: options.metadata,
      });
      chunkIndex++;
    }

    // If we consumed only one paragraph and it's larger than the chunk size,
    // advance by one to avoid getting stuck.
    if (i === paragraphCursor) {
      paragraphCursor++;
      continue;
    }

    // Backtrack by the overlap amount. Determine how many paragraphs from the
    // end of this chunk represent approximately `overlapChars` of text.
    let overlapLength = 0;
    let overlapParagraphs = 0;
    for (let j = chunkParagraphs.length - 1; j >= 0; j--) {
      const addLength = chunkParagraphs[j].length + 2;
      if (overlapLength + addLength > overlapChars && overlapParagraphs > 0) break;
      overlapLength += addLength;
      overlapParagraphs++;
    }

    // Next chunk starts from (i - overlapParagraphs) to produce the overlap.
    paragraphCursor = Math.max(paragraphCursor + 1, i - overlapParagraphs);
  }

  return chunks;
}

/**
 * Extracts a human-readable title from a markdown document.
 * Looks for the first `# Heading` line; falls back to the filename stem.
 */
export function extractTitle(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}
