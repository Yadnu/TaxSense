-- Migration: update_embedding_dimensions
-- Switches the KnowledgeChunk embedding column from OpenAI's 1536 dimensions
-- to sentence-transformers/all-MiniLM-L6-v2's 384 dimensions.
-- Any previously ingested embeddings are dropped (column recreated).

-- Drop the old HNSW index and column
DROP INDEX IF EXISTS "KnowledgeChunk_embedding_hnsw_idx";
ALTER TABLE "KnowledgeChunk" DROP COLUMN IF EXISTS "embedding";

-- Re-add with 384 dimensions
ALTER TABLE "KnowledgeChunk" ADD COLUMN "embedding" vector(384);

-- Recreate HNSW index for cosine similarity search
CREATE INDEX "KnowledgeChunk_embedding_hnsw_idx"
  ON "KnowledgeChunk"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
