import { createAnthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { LanguageModel } from "ai";
import { getServerConfig } from "@/lib/config";

export function getAnthropicClient() {
  const { ANTHROPIC_API_KEY } = getServerConfig();
  return createAnthropic({ apiKey: ANTHROPIC_API_KEY });
}

export function getGroqClient() {
  const { GROQ_API_KEY } = getServerConfig();
  return createGroq({ apiKey: GROQ_API_KEY });
}

/** Primary model for chat and document extraction. */
export const CLAUDE_MODEL = "claude-3-5-sonnet-20241022" as const;

/** Lighter model for quick classification tasks. */
export const CLAUDE_HAIKU_MODEL = "claude-3-haiku-20240307" as const;

/** Groq-hosted model for chat — fast and free-tier friendly. */
export const GROQ_MODEL = "llama-3.3-70b-versatile" as const;

/**
 * Returns the best available chat model based on configured API keys.
 * Prefers Groq when GROQ_API_KEY is set, falls back to Claude.
 */
export function getChatModel(): LanguageModel {
  const { GROQ_API_KEY, ANTHROPIC_API_KEY } = getServerConfig();
  if (GROQ_API_KEY) return getGroqClient()(GROQ_MODEL);
  if (ANTHROPIC_API_KEY) return getAnthropicClient()(CLAUDE_MODEL);
  throw new Error("No AI provider configured. Set GROQ_API_KEY or ANTHROPIC_API_KEY in .env");
}
