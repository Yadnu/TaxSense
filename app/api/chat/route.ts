import arcjet, { tokenBucket } from "@arcjet/next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { generateRAGResponse, generateChatTitle } from "@/lib/rag/generate";
import { getServerConfig } from "@/lib/config";
import { checkGuardrails, checkOutputGuardrails } from "@/lib/guardrails";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _aj: any = null;

function getAj() {
  const key = getServerConfig().ARCJET_KEY;
  if (!key) return null;
  if (!_aj) {
    _aj = arcjet({
      key,
      rules: [
        tokenBucket({ mode: "LIVE", refillRate: 10, interval: 60, capacity: 20 }),
      ],
    });
  }
  return _aj;
}

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
  locale: z.enum(["en", "es"]).default("en"),
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

// ─── Token budget utilities ──────────────────────────────────────────────────

/** Rough token estimate: ~4 characters per token (GPT/Llama convention). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

type HistoryMessage = { role: "user" | "assistant"; content: string };

/**
 * Trims a chat-history array so the total estimated token count stays within
 * `maxTokens`. Drops the OLDEST messages first to preserve recent context.
 * Any individual message that exceeds `maxMsgTokens` has its content truncated
 * before the budget check so one enormous message never blocks everything else.
 */
function trimChatHistory(
  history: HistoryMessage[],
  maxTokens: number,
  maxMsgTokens = 1_500,
): HistoryMessage[] {
  if (history.length === 0) return history;

  // Hard-cap individual messages that are excessively long.
  const maxChars = maxMsgTokens * 4;
  const capped = history.map((m) =>
    m.content.length > maxChars
      ? { ...m, content: m.content.slice(0, maxChars) + " …[truncated]" }
      : m,
  );

  // Walk from newest → oldest, keeping messages while we have budget.
  let used = 0;
  const kept: HistoryMessage[] = [];
  for (let i = capped.length - 1; i >= 0; i--) {
    // +6 tokens for role/formatting overhead per message
    const t = estimateTokens(capped[i].content) + 6;
    if (used + t > maxTokens) break;
    kept.unshift(capped[i]);
    used += t;
  }

  return kept;
}

// ─── Guardrail refusal helper ────────────────────────────────────────────────

/**
 * Builds a minimal AI SDK data-stream response from a static string.
 * The Vercel AI SDK useChat client expects the `text/plain; X-Vercel-AI-Data-Stream: v1`
 * wire format; this helper writes the three required lines without calling an LLM.
 */
function createRefusalStreamResponse(text: string): Response {
  const encoder = new TextEncoder();
  const tokenCount = Math.ceil(text.length / 4);

  const stream = new ReadableStream({
    start(controller) {
      // Text chunk
      controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
      // Step finish
      controller.enqueue(
        encoder.encode(
          `e:${JSON.stringify({
            finishReason: "stop",
            usage: { promptTokens: 0, completionTokens: tokenCount },
          })}\n`,
        ),
      );
      // Done
      controller.enqueue(
        encoder.encode(
          `d:${JSON.stringify({
            finishReason: "stop",
            usage: { promptTokens: 0, completionTokens: tokenCount },
          })}\n`,
        ),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
    },
  });
}

// ─── POST /api/chat ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aj = getAj();
  if (aj) {
    const decision = await aj.protect(req, { requested: 1 });
    if (decision.isDenied()) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
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

  const { messages, sessionId: existingSessionId, locale } = parsed.data;

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

  // ── Input guardrails ──────────────────────────────────────────────────────
  // Runs before any DB work or RAG calls so blocked/redacted messages never
  // reach the retrieval or generation pipeline.
  const guardrail = await checkGuardrails(userQuery);

  if (guardrail.flags.length > 0) {
    // Log every guardrail event; use warn so it surfaces in aggregated logs.
    console.warn("[/api/chat][guardrails]", {
      userId,
      allowed: guardrail.allowed,
      flags: guardrail.flags,
      reason: guardrail.reason,
    });
  }

  if (!guardrail.allowed) {
    // Return the canned response in AI SDK data-stream format so useChat
    // renders it as a normal assistant message without frontend changes.
    return createRefusalStreamResponse(guardrail.refusalResponse!);
  }

  // The message text forwarded to RAG — raw when no PII was found, redacted
  // otherwise.  All downstream code uses this variable, never `userQuery`.
  const safeQuery = guardrail.redactedMessage;

  // ── User upsert ───────────────────────────────────────────────────────────
  // Normally created via the Clerk webhook; this upsert covers local dev.
  const clerkUser = await currentUser();
  if (clerkUser) {
    const email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
    if (email) {
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email,
          firstName: clerkUser.firstName ?? undefined,
          lastName: clerkUser.lastName ?? undefined,
          imageUrl: clerkUser.imageUrl ?? undefined,
        },
      });
    }
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
  // Always store the redacted version so the database never contains raw PII
  // that was typed into chat.
  await prisma.chatMessage.create({
    data: { sessionId, role: "USER", content: safeQuery },
  });

  const isNewSession = !existingSessionId;

  // Build chat history from prior messages (all except the latest user turn).
  // Drop any leading assistant messages (e.g. the client-side greeting) so
  // the conversation always starts with a user turn — required by most LLMs.
  const rawHistory = messages
    .slice(0, -1)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: extractTextContent(m.content),
    }))
    .reduce<HistoryMessage[]>(
      (acc, msg) => {
        if (acc.length === 0 && msg.role === "assistant") return acc;
        return [...acc, msg];
      },
      [],
    );

  // Trim history to stay within the model's token budget.
  // Groq llama-3.3-70b-versatile: 12 000-token request limit.
  // Budget: 8 000 tokens total for prompt input (leaves ~4 000 for response).
  //   ├─ System prompt (instructions + RAG chunks): ~4 000 tokens (capped in generate.ts)
  //   └─ Chat history:                              ~3 500 tokens
  const HISTORY_TOKEN_BUDGET = 3_500;
  const chatHistory = trimChatHistory(rawHistory, HISTORY_TOKEN_BUDGET);

  // ── Generate streaming RAG response ──────────────────────────────────────
  try {
    const { stream } = await generateRAGResponse({
      query: safeQuery,
      chatHistory,
      locale,
      onFinish: async ({ text, sources }) => {
        // ── Output guardrails ──────────────────────────────────────────────
        // Check the full response text for accidental PII leakage.
        // Since we're streaming, the client has already received the text;
        // we redact before DB persistence and emit a warning for the audit trail.
        const outputGuardrail = checkOutputGuardrails(text);
        if (outputGuardrail.hasLeakedPII) {
          console.warn("[/api/chat][output-guardrails] PII detected in LLM response", {
            userId,
            sessionId,
            flags: outputGuardrail.flags,
          });
        }

        // Persist assistant message — wrapped so a DB failure never
        // propagates into the AI SDK stream and surfaces as a client error.
        try {
          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: "ASSISTANT",
              content: outputGuardrail.redactedText,
              sources: sources.map((s) => ({
                chunkId: s.id,
                title: s.title,
                source: s.source,
                excerpt: s.content.slice(0, 250),
              })),
            },
          });
        } catch (dbErr) {
          console.error("[/api/chat] Failed to persist assistant message:", dbErr);
        }

        // Auto-generate a title for newly created sessions
        if (isNewSession) {
          try {
            const title = await generateChatTitle(safeQuery, locale);
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
      // #region agent log — capture actual stream error for debugging
      getErrorMessage: (error) => {
        console.error("[/api/chat] LLM stream error:", error);
        return error instanceof Error ? error.message : String(error);
      },
      // #endregion
    });
  } catch (error) {
    console.error("[/api/chat] RAG generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
