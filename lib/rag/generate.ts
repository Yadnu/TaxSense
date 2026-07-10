import { streamText, generateText } from "ai";
import { getChatModel } from "@/lib/ai/client";
import {
  buildChatSystemPrompt,
  buildTitleGenerationPrompt,
} from "@/lib/ai/prompts/chat-system";
import { retrieveRelevantChunks, RetrievedChunk } from "./retrieve";
import { RAG_TOP_K } from "@/lib/ai/prompts/constants";
import type { ChatLocale } from "@/types/chat";

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RAGGenerateOptions {
  query: string;
  chatHistory?: ChatHistoryMessage[];
  topK?: number;
  /** Assistant reply language (prompts + disclaimer). Default `en`. */
  locale?: ChatLocale;
  /**
   * Called when the full streamed response is available. Sources, confidence
   * flag, and grounding score are injected automatically.
   *
   * `groundingScore` is a 0–1 value from a post-generation LLM check that
   * measures how well the response is supported by the retrieved chunks.
   * A value of `-1` means the grounding check itself failed.
   */
  onFinish?: (event: {
    text: string;
    sources: RetrievedChunk[];
    lowConfidence: boolean;
    groundingScore: number;
  }) => Promise<void> | void;
}

export interface RAGGenerateResult {
  /** Vercel AI SDK streamText result — call `.toDataStreamResponse()` in the API route. */
  stream: ReturnType<typeof streamText>;
  /** Knowledge chunks retrieved for this query (for citation display). */
  sources: RetrievedChunk[];
  /**
   * True when the best retrieved chunk's similarity is above RAG_MIN_SIMILARITY
   * but below RAG_LOW_CONFIDENCE_THRESHOLD (0.45), indicating a weak knowledge
   * base match. Callers should surface an additional disclaimer.
   */
  lowConfidence: boolean;
}

/**
 * Runs a fast post-generation grounding check by asking the LLM to score
 * (0–1) how well the response text is supported by the source chunks.
 *
 * Uses a very short completion (~10 tokens) to stay cheap and fast.
 * Returns -1 if the check fails or cannot be parsed.
 */
async function checkGrounding(
  responseText: string,
  sources: RetrievedChunk[],
): Promise<number> {
  if (sources.length === 0) return 0;

  // Use top-3 sources with trimmed excerpts to keep the prompt small.
  const sourceExcerpts = sources
    .slice(0, 3)
    .map((s, i) => `[${i + 1}] ${s.title}: ${s.content.slice(0, 250)}`)
    .join("\n\n");

  try {
    const { text } = await generateText({
      model: getChatModel(),
      system:
        "You are a grounding evaluator. Given source excerpts and a response, output ONLY a single decimal number 0.0–1.0 representing how well the response is supported by the sources. 1.0 = fully grounded in sources, 0.0 = not grounded at all. No explanation, just the number.",
      prompt: `SOURCES:\n${sourceExcerpts}\n\nRESPONSE:\n${responseText.slice(0, 800)}`,
      maxTokens: 10,
      temperature: 0,
    });

    const match = text.trim().match(/[\d.]+/);
    const score = match ? parseFloat(match[0]) : NaN;
    return Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : -1;
  } catch {
    return -1;
  }
}

/**
 * Core RAG generation function.
 *
 * 1. Embeds the user query and retrieves the top-K most relevant knowledge chunks.
 * 2. Builds the system prompt with grounding context.
 * 3. Streams a response via Anthropic Claude.
 *
 * Returns the AI SDK stream object, the retrieved sources, and a `lowConfidence`
 * flag so the API route can persist citations and surface appropriate disclaimers.
 */
export async function generateRAGResponse(
  options: RAGGenerateOptions
): Promise<RAGGenerateResult> {
  const {
    query,
    chatHistory = [],
    topK = RAG_TOP_K,
    locale = "en",
    onFinish,
  } = options;

  // Retrieve relevant knowledge chunks with confidence signal
  const { chunks: sources, lowConfidence } = await retrieveRelevantChunks(query, topK);

  // Cap each chunk's content so the system prompt stays within ~4 000 tokens
  // (~16 000 chars). With RAG_TOP_K=5, ~3 000 chars per chunk ≈ 750 tokens each
  // → 5 × 750 + ~500 for instructions = ~4 250 tokens total for the system prompt.
  const MAX_CHUNK_CHARS = 3_000;
  const cappedSources = sources.map((s) =>
    s.content.length > MAX_CHUNK_CHARS
      ? { ...s, content: s.content.slice(0, MAX_CHUNK_CHARS) + " …[truncated]" }
      : s,
  );

  // Build the grounding system prompt
  const systemPrompt = buildChatSystemPrompt(cappedSources, locale);

  // Stream the response
  const stream = streamText({
    model: getChatModel(),
    system: systemPrompt,
    messages: [
      ...chatHistory,
      { role: "user" as const, content: query },
    ],
    maxTokens: 2048,
    temperature: 0.2, // Low temperature for factual tax information
    onFinish: onFinish
      ? async ({ text }) => {
          // Run the grounding check after full generation so we have the complete text.
          const groundingScore = await checkGrounding(text, cappedSources);
          await onFinish({ text, sources: cappedSources, lowConfidence, groundingScore });
        }
      : undefined,
  });

  return { stream, sources: cappedSources, lowConfidence };
}

/**
 * Generates a short conversation title from the first user message.
 * Used to auto-label new chat sessions.
 */
export async function generateChatTitle(
  firstMessage: string,
  locale: ChatLocale = "en",
): Promise<string> {
  const { text } = await generateText({
    model: getChatModel(),
    system: buildTitleGenerationPrompt(locale),
    prompt: firstMessage,
    maxTokens: 20,
  });

  return text.trim().replace(/['"]/g, "").slice(0, 60);
}
