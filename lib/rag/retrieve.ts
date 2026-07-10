import prisma from "@/lib/db";
import { generateEmbedding } from "@/lib/ai/embeddings";
import {
  RAG_TOP_K,
  RAG_MIN_SIMILARITY,
  RAG_LOW_CONFIDENCE_THRESHOLD,
} from "@/lib/ai/prompts/constants";

export interface RetrievedChunk {
  id: string;
  source: string;
  title: string;
  content: string;
  chunkIndex: number;
  metadata: unknown;
  similarity: number;
}

/**
 * Result returned by {@link retrieveRelevantChunks}.
 *
 * `lowConfidence` is `true` when the best chunk's similarity score is above
 * the RAG_MIN_SIMILARITY floor but below RAG_LOW_CONFIDENCE_THRESHOLD (0.45),
 * signalling that the knowledge base has only a weak match for the query.
 * Callers should surface an additional disclaimer in this case.
 */
export interface RetrievalResult {
  chunks: RetrievedChunk[];
  lowConfidence: boolean;
}

/**
 * Retrieves the most semantically relevant knowledge chunks for a given query
 * using pgvector cosine similarity search.
 *
 * Returns chunks ordered by descending similarity, filtered to those above
 * RAG_MIN_SIMILARITY, together with a `lowConfidence` flag that is set when
 * the best match falls below RAG_LOW_CONFIDENCE_THRESHOLD.
 */
export async function retrieveRelevantChunks(
  query: string,
  topK: number = RAG_TOP_K
): Promise<RetrievalResult> {
  const embedding = await generateEmbedding(query);
  if (!embedding) return { chunks: [], lowConfidence: true }; // No embedding model — skip retrieval

  const vectorStr = `[${embedding.join(",")}]`;

  // Use $queryRawUnsafe with a parameterised query. The vector literal is
  // constructed from a trusted number[] so injection is not a concern.
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      source: string;
      title: string;
      content: string;
      chunkIndex: number;
      metadata: unknown;
      similarity: number;
    }>
  >(
    `
    SELECT
      id,
      source,
      title,
      content,
      "chunkIndex",
      metadata,
      1 - (embedding <=> '${vectorStr}'::vector) AS similarity
    FROM "KnowledgeChunk"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> '${vectorStr}'::vector
    LIMIT $1
    `,
    topK
  );

  const chunks = rows.filter((row: RetrievedChunk) => row.similarity >= RAG_MIN_SIMILARITY);

  // rows are ordered most-similar-first; chunks[0] is the best match after filtering.
  const bestSimilarity = chunks[0]?.similarity ?? 0;
  const lowConfidence = bestSimilarity < RAG_LOW_CONFIDENCE_THRESHOLD;

  return { chunks, lowConfidence };
}
