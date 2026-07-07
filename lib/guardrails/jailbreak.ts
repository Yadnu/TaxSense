/**
 * Jailbreak and prompt-injection detection for user chat messages.
 *
 * Checks for common patterns used to:
 *  - Override or ignore the system prompt
 *  - Extract the system prompt or reveal the underlying model/provider
 *  - Unlock "unrestricted" behaviour (DAN-style)
 *  - Inject raw prompt syntax (e.g. XML/markdown role tags)
 *
 * All checks are pure regex — no API calls, zero latency.
 */

export interface JailbreakDetectionResult {
  detected: boolean;
  /** Slug identifying the matched pattern, e.g. "ignore_instructions". */
  patternName?: string;
}

interface JailbreakPattern {
  name: string;
  pattern: RegExp;
}

const PATTERNS: JailbreakPattern[] = [
  // "ignore / disregard / forget previous instructions"
  {
    name: "ignore_instructions",
    pattern:
      /\b(ignore|disregard|discard|bypass|override)\b.{0,30}\b(previous|prior|all|your|the)\b.{0,30}\b(instructions?|prompts?|rules?|guidelines?|constraints?|context)\b/i,
  },

  // "forget your system prompt / training / rules"
  {
    name: "forget_instructions",
    pattern:
      /\bforget\b.{0,30}\b(your|the|all|previous|prior)\b.{0,30}\b(instructions?|prompts?|rules?|training|context|guidelines?)\b/i,
  },

  // "pretend you have no rules / are a different AI"
  {
    name: "pretend_no_rules",
    pattern:
      /\bpretend\b.{0,40}\b(you\s+have\s+no\s+rules?|you('re|\s+are)\s+(a\s+)?(different|new|unrestricted|uncensored)|there\s+are\s+no\s+rules?)\b/i,
  },

  // Requests to reveal the system prompt verbatim
  {
    name: "reveal_system_prompt",
    pattern:
      /\b(reveal|show|print|output|repeat|share|display|give\s+me)\b.{0,30}\b(your\s+)?(system\s+prompt|system\s+message|initial\s+prompt|base\s+prompt|hidden\s+prompt)\b/i,
  },

  // Requests to identify the underlying model or provider
  {
    name: "reveal_model",
    pattern:
      /\b(what|which|tell\s+me)\b.{0,40}\b(llm|model|ai\s+model|underlying\s+model|base\s+model|language\s+model|provider|api|anthropic|openai|groq|claude|llama|gpt)\b.{0,30}\b(are\s+you|is\s+this|running|using|built\s+on|powered\s+by)\b/i,
  },

  // DAN and "do anything now" jailbreaks
  {
    name: "dan",
    pattern: /\b(DAN|do\s+anything\s+now|jailbreak\s+mode|developer\s+mode)\b/i,
  },

  // "You are now a [different / unrestricted / uncensored] AI"
  {
    name: "role_override",
    pattern:
      /\byou\s+are\s+now\s+(a\s+)?(different|new|unrestricted|uncensored|unfiltered|evil|opposite|rogue)\s+(ai|assistant|model|bot|version)\b/i,
  },

  // Raw prompt-injection syntax: <system>, ###INSTRUCTIONS, [JAILBREAK], etc.
  {
    name: "prompt_injection_syntax",
    pattern:
      /(system\s*:|<\s*\/?system\s*>|###\s*instruction|<\s*\/?prompt\s*>|\[\s*(jailbreak|unlock|override|bypass)\s*\])/i,
  },

  // Asking the model to act "without restrictions" or "no limits"
  {
    name: "act_without_restrictions",
    pattern:
      /\b(act|respond|behave|answer|write|reply)\b.{0,30}\b(without\s+(any\s+)?(restrictions?|limits?|filters?|guidelines?|rules?)|as\s+if\s+you\s+have\s+no\s+(restrictions?|rules?))\b/i,
  },
];

/**
 * Runs all jailbreak patterns against `input`.
 * Returns on the *first* match to keep latency constant and avoid leaking
 * which patterns exist (single-pattern response is indistinguishable from
 * a pattern that wasn't matched).
 */
export function detectJailbreak(input: string): JailbreakDetectionResult {
  for (const { name, pattern } of PATTERNS) {
    if (pattern.test(input)) {
      return { detected: true, patternName: name };
    }
  }
  return { detected: false };
}
