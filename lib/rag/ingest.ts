import fs from "fs";
import path from "path";
import prisma from "@/lib/db";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { chunkText, extractTitle } from "./chunker";
import { extractTextFromPdf, titleFromPdfFilename } from "./pdf";
import { extractTextFromEpub, titleFromEpub } from "./epub";

export interface IngestResult {
  source: string;
  title: string;
  chunksCreated: number;
  chunksDeleted: number;
}

export interface IngestSummary {
  filesProcessed: number;
  totalChunks: number;
  results: IngestResult[];
  errors: Array<{ source: string; error: string }>;
}

/**
 * Ingests a single markdown/text file into the knowledge base.
 *
 * Process:
 * 1. Read the file and extract title from its first `#` heading.
 * 2. Chunk the content (512-token windows, 64-token overlap).
 * 3. Generate embeddings for all chunks in batches.
 * 4. Delete existing chunks for this source (idempotent re-ingestion).
 * 5. Insert new KnowledgeChunk rows.
 * 6. Update embeddings via raw SQL (Prisma has no native vector type).
 */
export async function ingestFile(filePath: string): Promise<IngestResult> {
  const ext = path.extname(filePath).toLowerCase();
  const source = path.basename(filePath, ext);

  let rawContent: string;
  let title: string;

  if (ext === ".pdf") {
    rawContent = await extractTextFromPdf(filePath);
    title = titleFromPdfFilename(filePath);
  } else if (ext === ".epub") {
    rawContent = await extractTextFromEpub(filePath);
    title = await titleFromEpub(filePath);
  } else {
    rawContent = fs.readFileSync(filePath, "utf-8");
    title = extractTitle(rawContent, source);
  }

  // Chunk the content
  const chunks = chunkText(rawContent, {
    metadata: { filePath: filePath, fileName: path.basename(filePath) },
  });

  if (chunks.length === 0) {
    return { source, title, chunksCreated: 0, chunksDeleted: 0 };
  }

  // Generate embeddings for all chunk contents
  const contents = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(contents);

  if (!embeddings) {
    throw new Error(
      "HUGGINGFACE_API_KEY is not configured. Set it in .env to run ingestion."
    );
  }

  // Delete existing chunks for this source (idempotent re-ingestion)
  const deleted = await prisma.knowledgeChunk.deleteMany({ where: { source } });

  // Insert new chunks (Prisma createMany for the non-vector fields)
  await prisma.knowledgeChunk.createMany({
    data: chunks.map((chunk) => ({
      source,
      title,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      tokenCount: chunk.tokenCount,
      metadata: (chunk.metadata ?? {}) as Record<string, string>,
    })),
  });

  // Fetch the newly created chunk IDs (ordered by chunkIndex)
  const created = await prisma.knowledgeChunk.findMany({
    where: { source },
    orderBy: { chunkIndex: "asc" },
    select: { id: true },
  });

  // Update each chunk's embedding via raw SQL (pgvector type not supported by Prisma)
  for (let i = 0; i < created.length; i++) {
    const vectorStr = `[${embeddings[i].join(",")}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE "KnowledgeChunk" SET embedding = '${vectorStr}'::vector WHERE id = $1`,
      created[i].id
    );
  }

  return {
    source,
    title,
    chunksCreated: created.length,
    chunksDeleted: deleted.count,
  };
}

/**
 * Ingests all markdown and text files in the knowledge directory.
 * Skips README.md by convention.
 */
export async function ingestKnowledgeDirectory(
  knowledgeDir: string
): Promise<IngestSummary> {
  const supportedExtensions = [".md", ".txt", ".pdf", ".epub"];

  const files = fs
    .readdirSync(knowledgeDir)
    .filter((f) => {
      const ext = path.extname(f).toLowerCase();
      const base = path.basename(f).toLowerCase();
      return supportedExtensions.includes(ext) && base !== "readme.md";
    })
    .map((f) => path.join(knowledgeDir, f));

  const results: IngestResult[] = [];
  const errors: Array<{ source: string; error: string }> = [];

  for (const filePath of files) {
    const source = path.basename(filePath);
    try {
      const result = await ingestFile(filePath);
      results.push(result);
    } catch (err) {
      errors.push({
        source,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    filesProcessed: files.length,
    totalChunks: results.reduce((sum, r) => sum + r.chunksCreated, 0),
    results,
    errors,
  };
}
