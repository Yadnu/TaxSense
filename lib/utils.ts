import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Class Name Helper ────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── PII Masking ──────────────────────────────────────────────────────────────

const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // SSN: 123-45-6789 or 123456789
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "***-**-****" },
  { pattern: /\b\d{9}\b/g, replacement: "*********" },

  // Email addresses
  {
    pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    replacement: "[email redacted]",
  },

  // US phone numbers: (123) 456-7890, 123-456-7890, 123.456.7890, +11234567890
  {
    pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    replacement: "[phone redacted]",
  },

  // EIN: 12-3456789
  { pattern: /\b\d{2}-\d{7}\b/g, replacement: "**-*******" },
];

/**
 * Redacts PII (SSN, EIN, email, phone) from a string before logging.
 * Use this wrapper around any log output that may contain extracted form data.
 */
export function maskPII(input: string): string {
  return PII_PATTERNS.reduce(
    (text, { pattern, replacement }) => text.replace(pattern, replacement),
    input
  );
}

/**
 * Safe console.log that automatically masks PII in string arguments.
 * Use in production API routes instead of bare console.log.
 */
export function safeLog(...args: unknown[]): void {
  const sanitized = args.map((arg) => {
    if (typeof arg === "string") return maskPII(arg);
    if (typeof arg === "object" && arg !== null) {
      try {
        return JSON.parse(maskPII(JSON.stringify(arg)));
      } catch {
        return arg;
      }
    }
    return arg;
  });
  console.log(...sanitized);
}

// ─── Formatters ───────────────────────────────────────────────────────────────

/**
 * Format a Date (or ISO string) into a human-readable local date string.
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", options).format(d);
}

/**
 * Format a file size in bytes into a human-readable string (KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/**
 * Truncate a string to a maximum length, appending "…" if truncated.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/**
 * Convert a confidence score (0–1) to a display label and color variant.
 */
export function confidenceLabel(score: number): {
  label: string;
  variant: "success" | "warning" | "destructive";
} {
  if (score >= 0.8) return { label: "High", variant: "success" };
  if (score >= 0.5) return { label: "Medium", variant: "warning" };
  return { label: "Low", variant: "destructive" };
}

