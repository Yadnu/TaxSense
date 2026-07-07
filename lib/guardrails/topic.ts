/**
 * Topic classification — determines whether a user message is on-topic for
 * a US federal + California state tax assistant.
 *
 * Two-tier approach to balance accuracy and cost:
 *
 * Tier 1 — Keyword fast-path (sync, zero cost)
 *   Any message containing a tax-related keyword is immediately marked
 *   on-topic and the LLM call is skipped.
 *
 * Tier 2 — LLM classifier (async, ~5 output tokens)
 *   Messages that contain no tax keywords AND exceed a word-count threshold
 *   are sent to the configured chat model (Groq preferred, Claude Haiku
 *   otherwise) with a single yes/no prompt.  This catches phrased questions
 *   that don't mention "tax" explicitly, e.g. "how do I claim my home office?"
 *
 * Short messages (≤ CONVERSATIONAL_WORD_LIMIT words) without keywords are
 * allowed through without an LLM call; the system prompt grounding will steer
 * them back on-topic gracefully.
 */

import { generateText } from "ai";
import { getChatModel } from "@/lib/ai/client";

export type TopicClassification = "on_topic" | "off_topic" | "uncertain";

export interface TopicResult {
  classification: TopicClassification;
  /** How the decision was reached. */
  method: "keyword" | "llm" | "short_message_passthrough";
}

// ─── Tier 1: tax keyword set ──────────────────────────────────────────────────

/** Lower-cased substrings — a match anywhere in the normalised message text. */
const TAX_KEYWORDS: string[] = [
  // Agencies
  "irs",
  "internal revenue service",
  "ftb",
  "franchise tax board",

  // Core tax vocabulary
  "tax",
  "taxes",
  "taxable",
  "taxation",

  // Forms and identifiers
  "w-2",
  "w2",
  "w-4",
  "w4",
  "1099",
  "1040",
  "1065",
  "1120",
  "schedule a",
  "schedule b",
  "schedule c",
  "schedule d",
  "schedule e",
  "k-1",
  "form 941",
  "form 940",
  "form 8949",
  "form 4868",
  "ein",
  "itin",
  "tin",

  // Deductions, credits, and filing
  "deduction",
  "deductible",
  "tax credit",
  "refund",
  "withholding",
  "exemption",
  "filing",
  "file taxes",
  "tax return",
  "tax bracket",
  "tax rate",

  // Income types
  "capital gain",
  "ordinary income",
  "gross income",
  "taxable income",
  "adjusted gross",
  "agi",
  "magi",
  "passive income",
  "qualified dividend",

  // Tax adjustments
  "depreciation",
  "amortization",
  "standard deduction",
  "itemize",
  "itemized deduction",
  "nol",
  "net operating loss",
  "carryover",
  "cost basis",
  "wash sale",
  "amt",
  "alternative minimum",

  // Payroll and employment taxes
  "self-employment tax",
  "se tax",
  "fica",
  "medicare tax",
  "payroll tax",
  "social security tax",
  "estimated tax",
  "quarterly payment",

  // Retirement and savings
  "401(k)",
  "401k",
  "roth ira",
  "traditional ira",
  " ira ",
  "hsa",
  "fsa",
  "pension",

  // Family / dependent credits
  "dependent",
  "child tax credit",
  "earned income",
  "eitc",
  "child care credit",

  // Enforcement / compliance
  "audit",
  "tax extension",
  "penalty",
  "offer in compromise",
  "installment agreement",
  "innocent spouse",
  "tax lien",
  "tax levy",

  // Special taxes
  "estate tax",
  "gift tax",
  "excise tax",
  "sales tax",
  "property tax",

  // California-specific
  "california income tax",
  "ca income tax",
  "prop 13",
  "proposition 13",
  "state disability",
  "sdii",
  "california franchise",

  // Business structures (tax-adjacent)
  "sole proprietor",
  "s-corp",
  "c-corp",
  "pass-through",
  "llc tax",
  "business expense",
  "home office deduction",
  "mileage deduction",
  "section 179",
  "bonus depreciation",
  "qbi",
  "qualified business income",
];

// How many words a message must have before we call the LLM classifier.
// Very short messages ("hi", "hello", "thanks") are let through as
// conversational turns that the system prompt will redirect gracefully.
const CONVERSATIONAL_WORD_LIMIT = 8;

// ─── Tier 2: LLM classifier ───────────────────────────────────────────────────

const CLASSIFIER_SYSTEM_PROMPT =
  "You classify user messages for a US tax assistant. " +
  'Reply with exactly one word — "yes" if the message is about US federal taxes, ' +
  "California state taxes, tax forms, the IRS, deductions, credits, tax filing, " +
  'tax law, or directly related financial topics. Reply "no" for everything else. ' +
  "No explanation.";

async function llmClassify(message: string): Promise<TopicClassification> {
  try {
    const { text } = await generateText({
      model: getChatModel(),
      system: CLASSIFIER_SYSTEM_PROMPT,
      prompt: message,
      maxTokens: 5,
      temperature: 0,
    });

    const answer = text.trim().toLowerCase();
    if (answer.startsWith("yes")) return "on_topic";
    if (answer.startsWith("no")) return "off_topic";
    return "uncertain";
  } catch {
    // If the classifier itself errors, default to uncertain so we don't
    // incorrectly block the user — the system prompt grounding remains active.
    return "uncertain";
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Classifies `message` as on-topic, off-topic, or uncertain for a US tax
 * assistant.  Returns immediately via keyword matching when possible; falls
 * back to a fast LLM call for longer messages without obvious tax keywords.
 */
export async function classifyTopic(message: string): Promise<TopicResult> {
  const normalised = message.toLowerCase();

  // Tier 1: keyword fast-path
  for (const keyword of TAX_KEYWORDS) {
    if (normalised.includes(keyword)) {
      return { classification: "on_topic", method: "keyword" };
    }
  }

  // Short conversational messages (greetings, thanks, etc.) — pass through.
  const wordCount = message.trim().split(/\s+/).length;
  if (wordCount <= CONVERSATIONAL_WORD_LIMIT) {
    return { classification: "uncertain", method: "short_message_passthrough" };
  }

  // Tier 2: LLM classifier for longer messages with no obvious tax signal.
  const classification = await llmClassify(message);
  return { classification, method: "llm" };
}
