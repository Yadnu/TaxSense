/**
 * CLI script: Ingest tax knowledge files into the vector database.
 *
 * Usage:
 *   npm run ingest                              # Ingest all files in knowledge/
 *   npm run ingest -- --file knowledge/irs-pub-17-income.md  # Single file
 *   npm run ingest -- --dry-run                 # Preview chunks without inserting
 *
 * Requirements:
 *   - DATABASE_URL, HUGGINGFACE_API_KEY in .env or .env.local
 *   - pgvector extension enabled in your PostgreSQL database
 *   - Embedding column must exist on KnowledgeChunk (run: prisma migrate deploy)
 */

import path from "path";
import fs from "fs";

// Load .env.local first, then .env, BEFORE any app imports that read process.env.
// Dynamic imports below ensure env is loaded before modules initialise.
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const projectRoot = path.resolve(__dirname, "..");
loadEnvFile(path.join(projectRoot, ".env.local"));
loadEnvFile(path.join(projectRoot, ".env"));

// ─── CLI argument parsing ─────────────────────────────────────────────────────

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const fileArgIndex = args.indexOf("--file");
const targetFile = fileArgIndex !== -1 ? args[fileArgIndex + 1] : null;

const KNOWLEDGE_DIR = path.join(projectRoot, "knowledge");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function printSeparator() {
  console.log("─".repeat(60));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🧠 TaxSense Knowledge Ingestion");
  printSeparator();

  // Dynamic imports happen AFTER env variables are loaded above.
  const { chunkText, extractTitle } = await import("../lib/rag/chunker");
  const { ingestFile, ingestKnowledgeDirectory } = await import("../lib/rag/ingest");
  const { extractTextFromPdf, titleFromPdfFilename } = await import("../lib/rag/pdf");
  const { extractTextFromEpub, titleFromEpub } = await import("../lib/rag/epub");
  const dbModule = await import("../lib/db");
  const db = dbModule.default;

  // ── Dry run: preview chunks without writing to DB ──────────────────────────
  if (isDryRun) {
    console.log("⚠️  DRY RUN — no data will be written to the database.\n");

    const files = targetFile
      ? [path.resolve(targetFile)]
      : fs
          .readdirSync(KNOWLEDGE_DIR)
          .filter((f) => {
            const ext = path.extname(f).toLowerCase();
            return [".md", ".txt", ".pdf", ".epub"].includes(ext) && f.toLowerCase() !== "readme.md";
          })
          .map((f) => path.join(KNOWLEDGE_DIR, f));

    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
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
        title = extractTitle(rawContent, path.basename(filePath, ext));
      }

      const chunks = chunkText(rawContent);

      console.log(`\n📄 File: ${path.basename(filePath)}`);
      console.log(`   Title: ${title}`);
      console.log(`   Chunks: ${chunks.length}`);
      printSeparator();

      for (const chunk of chunks) {
        const preview = chunk.content.slice(0, 200).replace(/\n/g, "\n  ");
        const ellipsis = chunk.content.length > 200 ? "…" : "";
        console.log(`\n  [Chunk ${chunk.chunkIndex}] ~${chunk.tokenCount} tokens`);
        console.log(`  ${preview}${ellipsis}`);
      }
    }

    console.log("\n✅ Dry run complete.\n");
    return;
  }

  // ── Live ingestion ─────────────────────────────────────────────────────────
  const startTime = Date.now();

  try {
    if (targetFile) {
      const resolvedPath = path.resolve(targetFile);
      console.log(`📄 Ingesting single file: ${path.basename(resolvedPath)}\n`);

      const result = await ingestFile(resolvedPath);

      printSeparator();
      console.log(`✅ Done: "${result.title}"`);
      console.log(`   Source:  ${result.source}`);
      console.log(`   Created: ${result.chunksCreated} chunks`);
      console.log(`   Deleted: ${result.chunksDeleted} previous chunks`);
    } else {
      console.log(`📚 Ingesting all files from: ${KNOWLEDGE_DIR}\n`);

      const summary = await ingestKnowledgeDirectory(KNOWLEDGE_DIR);

      printSeparator();
      console.log(`\n📊 Summary:`);
      console.log(`   Files processed: ${summary.filesProcessed}`);
      console.log(`   Total chunks:    ${summary.totalChunks}`);

      for (const r of summary.results) {
        console.log(`\n   ✅ ${r.source}`);
        console.log(`      Title:   ${r.title}`);
        console.log(`      Chunks:  ${r.chunksCreated} created, ${r.chunksDeleted} deleted`);
      }

      for (const e of summary.errors) {
        console.log(`\n   ❌ ${e.source}`);
        console.log(`      Error:   ${e.error}`);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`\n⏱️  Total time: ${formatDuration(elapsed)}`);
    console.log("🎉 Knowledge ingestion complete!\n");
  } catch (err) {
    console.error("\n❌ Ingestion failed:", err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
