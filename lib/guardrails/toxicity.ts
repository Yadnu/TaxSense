/**
 * Toxicity detection for user chat messages.
 *
 * Two-tier approach mirrors the topic-classification pattern:
 *
 * Tier 1 — Regex fast-path (sync, zero cost)
 *   Matches explicit threats, self-harm content, CSAM references, and
 *   role-play requests for harmful material.  Returns immediately on a match.
 *
 * Tier 2 — LLM classifier (async, ~5 output tokens)
 *   Applied only to longer messages (> CONVERSATIONAL_WORD_LIMIT words) that
 *   didn't trigger Tier 1.  Uses the same fast model as topic classification.
 *   Defaults to "not_toxic" on error so the classifier never incorrectly
 *   silences a legitimate user.
 *
 * Short messages (≤ CONVERSATIONAL_WORD_LIMIT words) that don't match any
 * pattern are passed through; the system prompt grounding handles mild
 * rudeness gracefully without triggering a hard refusal.
 */

import { generateText } from "@/lib/ai/tracing";
import { getChatModel } from "@/lib/ai/client";

export type ToxicityClassification = "toxic" | "not_toxic";

export interface ToxicityResult {
  classification: ToxicityClassification;
  /** Tier-1 pattern name, or "llm" for Tier-2 detections. */
  patternName?: string;
}

// ─── Tier 1: regex patterns ──────────────────────────────────────────────────

interface ToxicityPattern {
  name: string;
  pattern: RegExp;
}

const PATTERNS: ToxicityPattern[] = [
  // Violent threats directed at self or others
  {
    name: "threat_self_other",
    pattern:
      /\b(i('ll|\s+will|\s+am\s+going\s+to)\s+kill|kill\s+yourself|kys\b|go\s+kill\s+yourself|shoot\s+yourself|hang\s+yourself)\b/i,
  },

  // Bomb / mass-casualty threats
  {
    name: "threat_mass_violence",
    pattern:
      /\b(bomb\s+threat|mass\s+shooting|school\s+shooting|shoot\s+up\s+the|blow\s+up\s+the)\b/i,
  },

  // Self-harm and suicide method requests
  {
    name: "self_harm_method",
    pattern:
      /\b(how\s+to\s+(commit\s+)?suicide|methods?\s+(to\s+)?(kill\s+myself|end\s+my\s+life)|how\s+to\s+self.?harm|ways?\s+to\s+hurt\s+myself)\b/i,
  },

  // Child sexual abuse material
  {
    name: "csam",
    pattern: /\b(child\s+porn(ography)?|csam|loli\s+porn|minor\s+porn)\b/i,
  },

  // Requests to generate or roleplay harmful content
  {
    name: "harmful_content_request",
    pattern:
      /\b(write\s+me\s+(porn|a\s+death\s+threat|hate\s+speech)|generate\s+(explicit|porn|a\s+bomb\s+recipe|instructions\s+for)|roleplay\s+as\s+(a\s+murderer|a\s+terrorist|a\s+sex\s+offender))\b/i,
  },
];

const CONVERSATIONAL_WORD_LIMIT = 8;

// ─── Tier 2: LLM classifier ───────────────────────────────────────────────────

const CLASSIFIER_SYSTEM_PROMPT =
  "You detect toxic content in messages sent to a US tax assistant. " +
  'Reply with exactly one word — "yes" if the message contains explicit threats of violence, ' +
  "hate speech targeting protected groups, requests for sexual content, self-harm instructions, " +
  'or requests to generate dangerous or illegal material. Reply "no" for everything else — ' +
  "including rude but non-threatening messages. No explanation.";

async function llmClassifyToxicity(
  message: string,
): Promise<ToxicityClassification> {
  try {
    const { text } = await generateText({
      model: getChatModel(),
      system: CLASSIFIER_SYSTEM_PROMPT,
      prompt: message,
      maxTokens: 5,
      temperature: 0,
    });

    const answer = text.trim().toLowerCase();
    if (answer.startsWith("yes")) return "toxic";
    return "not_toxic";
  } catch {
    // On classifier failure, default to not_toxic so we never incorrectly
    // block a legitimate user.
    return "not_toxic";
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Checks `message` for toxic content.
 *
 * Returns immediately on a Tier-1 regex match.  For longer messages without
 * pattern matches, falls back to an LLM binary classifier.  Short messages
 * that don't trigger patterns are passed through without an LLM call.
 */
export async function detectToxicity(
  message: string,
): Promise<ToxicityResult> {
  // Tier 1: regex fast-path
  for (const { name, pattern } of PATTERNS) {
    if (pattern.test(message)) {
      return { classification: "toxic", patternName: name };
    }
  }

  // Short conversational messages — pass through without LLM call.
  const wordCount = message.trim().split(/\s+/).length;
  if (wordCount <= CONVERSATIONAL_WORD_LIMIT) {
    return { classification: "not_toxic" };
  }

  // Tier 2: LLM classifier for longer messages.
  const classification = await llmClassifyToxicity(message);
  return {
    classification,
    patternName: classification === "toxic" ? "llm" : undefined,
  };
}
