import { HfInference } from "@huggingface/inference";
import { getServerConfig } from "@/lib/config";

export const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2" as const;
export const EMBEDDING_DIMENSIONS = 384 as const;

const BATCH_SIZE = 64;

function getHfClient() {
  const { HUGGINGFACE_API_KEY } = getServerConfig();
  if (!HUGGINGFACE_API_KEY) return null;
  return new HfInference(HUGGINGFACE_API_KEY);
}

function toVector(raw: unknown): number[] {
  // featureExtraction returns number[] (mean-pooled) for sentence-transformers
  if (Array.isArray(raw) && typeof raw[0] === "number") return raw as number[];
  // Some models return number[][] (one vector per token) — take the first row
  if (Array.isArray(raw) && Array.isArray(raw[0])) return raw[0] as number[];
  throw new Error(`Unexpected embedding shape from HuggingFace`);
}

/**
 * Returns null when HUGGINGFACE_API_KEY is not configured — callers should
 * skip embedding-dependent work (e.g. RAG retrieval) in that case.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const hf = getHfClient();
  if (!hf) return null;
  const raw = await hf.featureExtraction({ model: EMBEDDING_MODEL, inputs: text });
  return toVector(raw);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][] | null> {
  const hf = getHfClient();
  if (!hf) return null;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const raw = await hf.featureExtraction({ model: EMBEDDING_MODEL, inputs: batch });
    // Batch input returns number[][]
    results.push(...(raw as number[][]));
  }

  return results;
}
