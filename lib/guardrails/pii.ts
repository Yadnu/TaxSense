/**
 * PII detection and redaction for user-submitted chat messages.
 *
 * Designed for a tax assistant context:
 *  - Formatted SSNs (XXX-XX-XXXX) are always redacted; unformatted 9-digit
 *    strings are skipped to avoid false positives on large dollar amounts,
 *    EINs already caught by their own pattern, and other numeric data.
 *  - EINs (XX-XXXXXXX) are redacted because they are employer tax IDs and
 *    not necessary in free-form chat.
 *  - Credit card numbers (Visa / MC / Amex / Discover) are always redacted.
 *  - Phone numbers and email addresses are always redacted.
 *
 * NOTE: This module only processes text the *user types into chat*. Extracted
 * fields from uploaded documents (W-2s, 1099s, etc.) live in the DB and are
 * referenced by ID — they are never re-injected as raw PII into the user's
 * chat turn, so there is no risk of double-redacting legitimate document data.
 */

export interface PIIDetectionResult {
  redactedText: string;
  /** Flags raised, e.g. ["pii:ssn", "pii:email"]. */
  flags: string[];
  hasRedactions: boolean;
}

interface PIIPattern {
  name: string;
  pattern: RegExp;
  replacement: string;
}

const PATTERNS: PIIPattern[] = [
  // SSN: 123-45-6789 (formatted only — avoids false positives on large numbers)
  {
    name: "ssn",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[SSN redacted]",
  },

  // Credit cards — match by issuer prefix to minimise false positives:
  //   Visa (4...), Mastercard (51-55...), Amex (34/37...), Discover (6011/65...)
  //   Also catches space/hyphen-separated groups: 4111 1111 1111 1111
  {
    name: "credit_card",
    pattern:
      /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:\d{4}[-\s]){3}\d{4})\b/g,
    replacement: "[card number redacted]",
  },

  // US phone numbers: (123) 456-7890 | 123-456-7890 | 123.456.7890 | +11234567890
  {
    name: "phone",
    pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    replacement: "[phone redacted]",
  },

  // Email addresses
  {
    name: "email",
    pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    replacement: "[email redacted]",
  },

  // EIN: 12-3456789 (distinct from SSN — two digits then seven)
  {
    name: "ein",
    pattern: /\b\d{2}-\d{7}\b/g,
    replacement: "[EIN redacted]",
  },
];

/**
 * Scans `input` for PII, replaces each match with a human-readable token, and
 * returns the redacted string plus an array of flag names for every type found.
 */
export function detectAndRedactPII(input: string): PIIDetectionResult {
  const flags: string[] = [];
  let redactedText = input;

  for (const { name, pattern, replacement } of PATTERNS) {
    const before = redactedText;
    // Reset lastIndex before each call so /g patterns don't skip matches
    pattern.lastIndex = 0;
    redactedText = redactedText.replace(pattern, replacement);
    if (redactedText !== before) {
      flags.push(`pii:${name}`);
    }
  }

  return {
    redactedText,
    flags,
    hasRedactions: flags.length > 0,
  };
}
