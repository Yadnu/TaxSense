import { createAnthropic } from "@ai-sdk/anthropic";
import { getServerConfig } from "@/lib/config";

/**
 * Returns an Anthropic client instance configured with the validated API key.
 * Called lazily so validation runs at request time, not module load time.
 */
export function getAnthropicClient() {
  const { ANTHROPIC_API_KEY } = getServerConfig();
  return createAnthropic({ apiKey: ANTHROPIC_API_KEY });
}

/** Primary model for chat and document extraction. */
export const CLAUDE_MODEL = "claude-3-5-sonnet-20241022" as const;

/** Lighter model for quick classification tasks. */
export const CLAUDE_HAIKU_MODEL = "claude-3-haiku-20240307" as const;
