import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { getServerConfig } from "@/lib/config";

export const EMBEDDING_MODEL = "text-embedding-3-small" as const;
export const EMBEDDING_DIMENSIONS = 1536 as const;

/**
 * Max texts per batch for embedMany — stays well within OpenAI rate limits.
 * text-embedding-3-small supports up to 2048 inputs per request, but we keep
 * batches small to respect token limits.
 */
const BATCH_SIZE = 100;

function getEmbeddingModel() {
  // Validate that OPENAI_API_KEY is set before making any API calls.
  getServerConfig();
  return openai.embedding(EMBEDDING_MODEL);
}

/**
 * Generates a single embedding vector for the given text.
 * Returns a 1536-dimensional float array (text-embedding-3-small).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const { embedding } = await embed({ model, value: text });
  return embedding;
}

/**
 * Generates embeddings for multiple texts, batching requests to avoid
 * hitting API rate limits.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const model = getEmbeddingModel();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const { embeddings } = await embedMany({ model, values: batch });
    results.push(...embeddings);
  }

  return results;
}
