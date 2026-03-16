import { streamText, generateText } from "ai";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/ai/client";
import {
  buildChatSystemPrompt,
  buildTitleGenerationPrompt,
} from "@/lib/ai/prompts/chat-system";
import { retrieveRelevantChunks, RetrievedChunk } from "./retrieve";
import { RAG_TOP_K } from "@/lib/ai/prompts/constants";

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RAGGenerateOptions {
  query: string;
  chatHistory?: ChatHistoryMessage[];
  topK?: number;
  /** Called when the full streamed response is available. Sources are injected automatically. */
  onFinish?: (event: { text: string; sources: RetrievedChunk[] }) => Promise<void> | void;
}

export interface RAGGenerateResult {
  /** Vercel AI SDK streamText result — call `.toDataStreamResponse()` in the API route. */
  stream: ReturnType<typeof streamText>;
  /** Knowledge chunks retrieved for this query (for citation display). */
  sources: RetrievedChunk[];
}

/**
 * Core RAG generation function.
 *
 * 1. Embeds the user query and retrieves the top-K most relevant knowledge chunks.
 * 2. Builds the system prompt with grounding context.
 * 3. Streams a response via Anthropic Claude.
 *
 * Returns the AI SDK stream object and the retrieved sources so the API route
 * can persist citations alongside the assistant message.
 */
export async function generateRAGResponse(
  options: RAGGenerateOptions
): Promise<RAGGenerateResult> {
  const { query, chatHistory = [], topK = RAG_TOP_K, onFinish } = options;

  // Retrieve relevant knowledge chunks
  const sources = await retrieveRelevantChunks(query, topK);

  // Build the grounding system prompt
  const systemPrompt = buildChatSystemPrompt(sources);

  const anthropic = getAnthropicClient();

  // Stream the response
  const stream = streamText({
    model: anthropic(CLAUDE_MODEL),
    system: systemPrompt,
    messages: [
      ...chatHistory,
      { role: "user" as const, content: query },
    ],
    maxTokens: 2048,
    temperature: 0.2, // Low temperature for factual tax information
    onFinish: onFinish
      ? async ({ text }) => {
          await onFinish({ text, sources });
        }
      : undefined,
  });

  return { stream, sources };
}

/**
 * Generates a short conversation title from the first user message.
 * Used to auto-label new chat sessions.
 */
export async function generateChatTitle(firstMessage: string): Promise<string> {
  const anthropic = getAnthropicClient();

  const { text } = await generateText({
    model: anthropic(CLAUDE_MODEL),
    system: buildTitleGenerationPrompt(),
    prompt: firstMessage,
    maxTokens: 20,
  });

  return text.trim().replace(/['"]/g, "").slice(0, 60);
}
