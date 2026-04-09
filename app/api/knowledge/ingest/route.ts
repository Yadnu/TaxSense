import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { ingestFile, ingestKnowledgeDirectory } from "@/lib/rag/ingest";
import { getServerConfig } from "@/lib/config";

/**
 * POST /api/knowledge/ingest
 *
 * Admin endpoint to trigger knowledge base ingestion.
 * Protected by a static bearer token set in KNOWLEDGE_INGEST_SECRET env var.
 *
 * Body (optional):
 *   { "file": "irs-pub-17-income.md" }   — ingest a single file
 *   {}                                    — ingest all files in knowledge/
 *
 * Returns:
 *   { success: true, summary: IngestSummary }
 *
 * This endpoint is intentionally excluded from Clerk auth middleware
 * because it is called by scripts/CI pipelines using a secret token,
 * not by authenticated users.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth: Bearer token ──────────────────────────────────────────────────────
  const ingestSecret = getServerConfig().KNOWLEDGE_INGEST_SECRET;
  if (!ingestSecret) {
    return NextResponse.json(
      { error: "KNOWLEDGE_INGEST_SECRET is not configured on the server." },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token || token !== ingestSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse request body ──────────────────────────────────────────────────────
  let body: { file?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is valid — means ingest all files
  }

  const knowledgeDir = path.join(process.cwd(), "knowledge");

  try {
    if (body.file) {
      // Sanitise the filename to prevent path traversal
      const safeName = path.basename(body.file);
      const filePath = path.join(knowledgeDir, safeName);

      const result = await ingestFile(filePath);

      return NextResponse.json({
        success: true,
        summary: {
          filesProcessed: 1,
          totalChunks: result.chunksCreated,
          results: [result],
          errors: [],
        },
      });
    } else {
      // Ingest all files
      const summary = await ingestKnowledgeDirectory(knowledgeDir);

      return NextResponse.json({ success: true, summary });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[knowledge/ingest] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
