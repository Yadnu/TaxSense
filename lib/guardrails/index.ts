/**
 * Guardrails pipeline — runs every user message through five sequential
 * checks before it reaches the RAG retrieval and LLM generation steps.
 *
 * Order matters:
 *   1. Jailbreak detection  — cheapest check, catches adversarial intent first.
 *   2. URL injection        — sync regex; blocks SSRF / data-URI payloads.
 *   3. PII redaction        — always runs; safe to mutate the message regardless.
 *   4. Toxicity detection   — keyword fast-path, LLM only as fallback.
 *   5. Topic classification — skipped when the message was already blocked;
 *                             uses keyword fast-path, LLM only as fallback.
 *
 * The pipeline is designed to be non-blocking on PII: redaction is applied and
 * the (sanitised) message continues processing.  Only jailbreak attempts,
 * URL injections, toxicity, and clearly off-topic queries result in an
 * `allowed: false` response.
 *
 * Per-user daily quota is checked separately in the route handler (requires
 * database access) before this pipeline is invoked.
 */

import { detectJailbreak } from "./jailbreak";
import { detectUrlInjection } from "./injection";
import { detectAndRedactPII } from "./pii";
import { detectToxicity } from "./toxicity";
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

const REFUSAL_URL_INJECTION =
  "For security reasons, I can't process messages that contain URLs or file paths. " +
  "Please describe your tax question in plain text and I'll be happy to help.";

const REFUSAL_TOXICITY =
  "I'm not able to help with that. I'm here to assist with US federal and " +
  "California state tax questions. If you're going through a difficult time, " +
  "please reach out to the Crisis Text Line (text HOME to 741741) or call 988. " +
  "Otherwise, feel free to ask a tax question and I'll do my best to help.";

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

  // ── Stage 2: URL / SSRF injection detection ──────────────────────────────
  const injectionResult = detectUrlInjection(userMessage);
  if (injectionResult.detected) {
    flags.push(`injection:${injectionResult.patternName ?? "url"}`);
    return {
      allowed: false,
      redactedMessage: userMessage,
      reason: `URL/SSRF injection pattern detected: ${injectionResult.patternName}`,
      refusalResponse: REFUSAL_URL_INJECTION,
      flags,
    };
  }

  // ── Stage 3: PII redaction ────────────────────────────────────────────────
  // Always runs — even if the message is later blocked for other reasons the
  // redacted copy is what gets logged, never the raw PII.
  const piiResult = detectAndRedactPII(userMessage);
  if (piiResult.hasRedactions) {
    flags.push(...piiResult.flags);
  }
  const processedMessage = piiResult.redactedText;

  // ── Stage 4: Toxicity detection ───────────────────────────────────────────
  const toxicityResult = await detectToxicity(processedMessage);
  if (toxicityResult.classification === "toxic") {
    flags.push(`toxicity:${toxicityResult.patternName ?? "unknown"}`);
    return {
      allowed: false,
      redactedMessage: processedMessage,
      reason: `Toxic content detected: ${toxicityResult.patternName}`,
      refusalResponse: REFUSAL_TOXICITY,
      flags,
    };
  }

  // ── Stage 5: Topic classification ─────────────────────────────────────────
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
export type { InjectionDetectionResult } from "./injection";
export type { ToxicityResult } from "./toxicity";
export type { TopicResult } from "./topic";
export type { OutputGuardrailResult } from "./output";
export { checkOutputGuardrails } from "./output";
export { checkDailyQuota, DAILY_MESSAGE_LIMIT } from "./quota";
