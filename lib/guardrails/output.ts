/**
 * Output guardrails — scans an LLM-generated response for accidental PII
 * leakage before the text is persisted to the database.
 *
 * Because TaxSense streams responses to the client, by the time `onFinish`
 * fires the user has already received the full text.  This module therefore
 * focuses on two things:
 *
 *  1. Producing a redacted copy of the response for DB persistence, so
 *     historical messages stored server-side are always PII-free.
 *  2. Surfacing audit-ready flags that callers can write to the audit log
 *     so the security team can investigate any patterns of leakage.
 *
 * The same PII patterns used for input guardrails are applied here, with
 * identical redaction tokens so log diffing is consistent.
 */

import { detectAndRedactPII } from "./pii";

export interface OutputGuardrailResult {
  /** Whether any PII was found in the response. */
  hasLeakedPII: boolean;
  /** Response text with any detected PII replaced by redaction tokens. */
  redactedText: string;
  /** PII type flags, e.g. ["pii:ssn", "pii:email"]. */
  flags: string[];
}

/**
 * Scans an LLM response text for PII patterns and returns a redacted copy
 * alongside any raised flags.
 *
 * Callers should:
 *  - Persist `redactedText` to the database instead of the raw `text`.
 *  - Log `flags` to the audit trail when `hasLeakedPII` is true.
 */
export function checkOutputGuardrails(text: string): OutputGuardrailResult {
  const { redactedText, flags, hasRedactions } = detectAndRedactPII(text);

  return {
    hasLeakedPII: hasRedactions,
    redactedText,
    flags,
  };
}
