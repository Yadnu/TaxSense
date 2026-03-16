import prisma from "@/lib/db";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { RAG_TOP_K, RAG_MIN_SIMILARITY } from "@/lib/ai/prompts/constants";

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
 * Retrieves the most semantically relevant knowledge chunks for a given query
 * using pgvector cosine similarity search.
 *
 * Returns chunks ordered by descending similarity, filtered to those above
 * RAG_MIN_SIMILARITY to exclude weakly-relevant results.
 */
export async function retrieveRelevantChunks(
  query: string,
  topK: number = RAG_TOP_K
): Promise<RetrievedChunk[]> {
  const embedding = await generateEmbedding(query);

  // Build the vector literal string from the embedding array.
  // Safe: embedding is a number[] from the OpenAI API.
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

  return rows.filter((row: RetrievedChunk) => row.similarity >= RAG_MIN_SIMILARITY);
}
