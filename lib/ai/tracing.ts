/**
 * LangSmith tracing utilities.
 *
 * LangSmith is enabled when LANGSMITH_TRACING=true AND a LANGSMITH_API_KEY is
 * present in the environment.  When disabled every export here is a transparent
 * pass-through with no performance overhead.
 *
 * How it works
 * ────────────
 * `wrapAISDK` from `langsmith/experimental/vercel` wraps the Vercel AI SDK's
 * `generateText`, `streamText`, and `generateObject` functions so that every
 * call is automatically recorded as a LangSmith LLM run — including the model
 * name, messages, output text, token usage, and wall-clock latency.
 *
 * `traceable` wraps pipeline functions (retrieval, the full RAG chain) as
 * "chain" or "retriever" parent spans, letting you see the full request trace
 * end-to-end in the LangSmith UI.
 *
 * Usage
 * ─────
 * 1. Import `generateText` / `streamText` from THIS module instead of "ai"
 *    in any file that makes LLM calls.
 * 2. Wrap pipeline entry-points with `traceable`.
 *
 * Environment variables (set in .env):
 *   LANGSMITH_TRACING=true          — master on/off switch
 *   LANGSMITH_API_KEY=lsv2_...      — your LangSmith API key
 *   LANGSMITH_PROJECT=taxsense      — project name in the LangSmith UI
 */

import * as ai from "ai";
import { wrapAISDK } from "langsmith/experimental/vercel";
export { traceable } from "langsmith/traceable";

/**
 * Returns `true` when the runtime environment has LangSmith tracing enabled.
 */
export function isTracingEnabled(): boolean {
  return (
    process.env.LANGSMITH_TRACING === "true" &&
    Boolean(process.env.LANGSMITH_API_KEY)
  );
}

// Conditionally apply LangSmith instrumentation to the AI SDK.
// When tracing is off this is a reference to the original `ai` module — zero cost.
const tracedAI = isTracingEnabled() ? wrapAISDK(ai) : ai;

/**
 * `generateText` from the Vercel AI SDK, optionally wrapped with LangSmith
 * tracing.  Use this everywhere in place of `import { generateText } from "ai"`.
 */
export const generateText = tracedAI.generateText;

/**
 * `streamText` from the Vercel AI SDK, optionally wrapped with LangSmith
 * tracing.  Use this everywhere in place of `import { streamText } from "ai"`.
 */
export const streamText = tracedAI.streamText;
