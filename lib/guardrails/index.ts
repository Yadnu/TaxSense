/**
 * Guardrails pipeline — runs every user message through three sequential
 * checks before it reaches the RAG retrieval and LLM generation steps.
 *
 * Order matters:
 *   1. Jailbreak detection  — cheapest check, catches adversarial intent first.
 *   2. PII redaction        — always runs; safe to mutate the message regardless.
 *   3. Topic classification — skipped when the message was already blocked;
 *                             uses keyword fast-path, LLM only as fallback.
 *
 * The pipeline is designed to be non-blocking on PII: redaction is applied and
 * the (sanitised) message continues processing.  Only jailbreak attempts and
 * clearly off-topic queries result in an `allowed: false` response.
 */

import { detectJailbreak } from "./jailbreak";
import { detectAndRedactPII } from "./pii";
import { classifyTopic } from "./topic";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuardrailsResult {
  /** When false, callers must return `refusalResponse` and skip RAG entirely. */
  allowed: boolean;
  /**
   * The message text that should be forwarded to the RAG pipeline.  Always
   * equals the original message unless PII was detected, in which case
   * redaction tokens replace the sensitive substrings.
   */
  redactedMessage: string;
  /**
   * Human-readable explanation for why the message was blocked.
   * Undefined when `allowed` is true.
   */
  reason?: string;
  /**
   * A pre-built streaming-compatible refusal text suitable for returning to
   * the client verbatim.  Undefined when `allowed` is true.
   */
  refusalResponse?: string;
  /**
   * All flags raised during the pipeline, even when `allowed` is true.
   * Examples: ["pii:ssn"], ["jailbreak:dan"], ["topic:off_topic"].
   */
  flags: string[];
}

// ─── Canned responses ─────────────────────────────────────────────────────────

const REFUSAL_JAILBREAK =
  "I can't process that request. " +
  "I'm TaxSense — your US federal and California state tax assistant. " +
  "Let me know if you have a tax question I can help with.";

const REFUSAL_OFF_TOPIC =
  "I can only help with US federal and California state tax questions — " +
  "things like filing deadlines, deductions, credits, tax forms, or tax brackets. " +
  "What tax topic can I help you with?";

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * Runs the three-stage input guardrail pipeline and returns a structured
 * result describing what was found and whether the message may proceed.
 *
 * @param userMessage - Raw message text submitted by the user.
 */
export async function checkGuardrails(
  userMessage: string,
): Promise<GuardrailsResult> {
  const flags: string[] = [];

  // ── Stage 1: Jailbreak detection ────────────────────────────────────────────
  const jailbreakResult = detectJailbreak(userMessage);
  if (jailbreakResult.detected) {
    flags.push(`jailbreak:${jailbreakResult.patternName ?? "unknown"}`);
    return {
      allowed: false,
      redactedMessage: userMessage,
      reason: `Jailbreak pattern detected: ${jailbreakResult.patternName}`,
      refusalResponse: REFUSAL_JAILBREAK,
      flags,
    };
  }

  // ── Stage 2: PII redaction ────────────────────────────────────────────────
  // Always runs — even if the message is later blocked for other reasons the
  // redacted copy is what gets logged, never the raw PII.
  const piiResult = detectAndRedactPII(userMessage);
  if (piiResult.hasRedactions) {
    flags.push(...piiResult.flags);
  }
  const processedMessage = piiResult.redactedText;

  // ── Stage 3: Topic classification ─────────────────────────────────────────
  const topicResult = await classifyTopic(processedMessage);

  if (topicResult.classification === "off_topic") {
    flags.push("topic:off_topic");
    return {
      allowed: false,
      redactedMessage: processedMessage,
      reason: `Off-topic query (classified via ${topicResult.method})`,
      refusalResponse: REFUSAL_OFF_TOPIC,
      flags,
    };
  }

  // All checks passed (message may be on-topic, uncertain, or a short
  // conversational turn — all proceed to the RAG pipeline).
  return {
    allowed: true,
    redactedMessage: processedMessage,
    flags,
  };
}

// Re-export sub-module types so callers can import from a single path.
export type { PIIDetectionResult } from "./pii";
export type { JailbreakDetectionResult } from "./jailbreak";
export type { TopicResult } from "./topic";
export type { OutputGuardrailResult } from "./output";
export { checkOutputGuardrails } from "./output";
