/*
  Warnings:

  - You are about to drop the column `embedding` on the `KnowledgeChunk` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "KnowledgeChunk_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "KnowledgeChunk" DROP COLUMN "embedding";
