import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { generateRAGResponse, generateChatTitle } from "@/lib/rag/generate";

// ─── Request schema ─────────────────────────────────────────────────────────
// The Vercel AI SDK useChat hook sends { messages, id, ...customBody }
// Content can be a string (text) or an array of parts (multimodal).

const MessageSchema = z
  .object({
    role: z.enum(["user", "assistant", "system", "data"]),
    content: z.union([z.string(), z.array(z.unknown())]),
  })
  .passthrough();

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  sessionId: z.string().optional(),
  id: z.string().optional(), // AI SDK sends a per-chat UUID; we use our own sessionId
});

function extractTextContent(content: string | unknown[]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p): p is { type: string; text: string } =>
        typeof p === "object" && p !== null && (p as Record<string, unknown>).type === "text"
      )
      .map((p) => p.text)
      .join("");
  }
  return "";
}

// ─── POST /api/chat ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { messages, sessionId: existingSessionId } = parsed.data;

  // The last message must be from the user
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "Last message must be from user" },
      { status: 400 }
    );
  }

  const userQuery = extractTextContent(lastMessage.content);
  if (!userQuery.trim()) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  // ── Session management ────────────────────────────────────────────────────
  let sessionId: string;

  if (existingSessionId) {
    const session = await prisma.chatSession.findFirst({
      where: { id: existingSessionId, userId },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    sessionId = session.id;
  } else {
    const session = await prisma.chatSession.create({ data: { userId } });
    sessionId = session.id;
  }

  // ── Persist user message ──────────────────────────────────────────────────
  await prisma.chatMessage.create({
    data: { sessionId, role: "USER", content: userQuery },
  });

  const isNewSession = !existingSessionId;

  // Build chat history from prior messages (all except the latest user turn)
  const chatHistory = messages
    .slice(0, -1)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: extractTextContent(m.content),
    }));

  // ── Generate streaming RAG response ──────────────────────────────────────
  try {
    const { stream } = await generateRAGResponse({
      query: userQuery,
      chatHistory,
      onFinish: async ({ text, sources }) => {
        // Persist assistant message with source citations
        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: "ASSISTANT",
            content: text,
            sources: sources.map((s) => ({
              chunkId: s.id,
              title: s.title,
              source: s.source,
              excerpt: s.content.slice(0, 250),
            })),
          },
        });

        // Auto-generate a title for newly created sessions
        if (isNewSession) {
          try {
            const title = await generateChatTitle(userQuery);
            await prisma.chatSession.update({
              where: { id: sessionId },
              data: { title },
            });
          } catch {
            // Title generation is non-critical; swallow errors
          }
        }
      },
    });

    return stream.toDataStreamResponse({
      headers: { "X-Session-Id": sessionId },
    });
  } catch (error) {
    console.error("[/api/chat] RAG generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
