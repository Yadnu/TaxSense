-- Migration: add_pgvector
-- Adds the 1536-dimensional embedding column to KnowledgeChunk and creates
-- an HNSW index for fast approximate cosine similarity search.
-- Runs after the init migration which already created the KnowledgeChunk table
-- and enabled the pgvector extension.

-- Add embedding column (OpenAI text-embedding-3-small produces 1536 dimensions)
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- HNSW index for approximate nearest-neighbour search using cosine distance.
-- m=16: max edges per node (higher = better recall, more memory)
-- ef_construction=64: search width during index build (higher = better quality, slower build)
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_embedding_hnsw_idx"
  ON "KnowledgeChunk"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
