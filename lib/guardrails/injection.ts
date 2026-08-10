/**
 * URL and SSRF injection detection for user chat messages.
 *
 * Blocks messages that contain raw protocol references that could be used to:
 *  - Trigger server-side request forgery via prompt injection (LLM fetches a URL)
 *  - Exfiltrate data by tricking the model into including external content
 *  - Embed base64 payloads (data: URIs) to bypass other content checks
 *  - Access local filesystem paths (file://, UNC paths)
 *
 * All checks are pure regex — no API calls, zero latency.
 */

export interface InjectionDetectionResult {
  detected: boolean;
  /** Slug identifying the matched pattern. */
  patternName?: string;
}

interface InjectionPattern {
  name: string;
  pattern: RegExp;
}

const PATTERNS: InjectionPattern[] = [
  // Standard web URLs — http:// and https://
  {
    name: "url_http",
    pattern: /https?:\/\//i,
  },

  // FTP references
  {
    name: "url_ftp",
    pattern: /ftp:\/\//i,
  },

  // Local filesystem access
  {
    name: "url_file",
    pattern: /file:\/\//i,
  },

  // Data URIs (e.g. data:text/html, data:image/png;base64,...)
  // The MIME-type suffix prevents false positives on words ending with "data:"
  {
    name: "url_data",
    pattern: /\bdata:[a-z][a-z0-9!#$&\-^_]+\//i,
  },

  // Windows UNC paths — \\server\share
  {
    name: "url_unc",
    pattern: /\\\\[\w.\-]+\\/,
  },
];

/**
 * Runs all injection patterns against `input`.
 * Returns on the first match to avoid leaking which patterns exist.
 */
export function detectUrlInjection(input: string): InjectionDetectionResult {
  for (const { name, pattern } of PATTERNS) {
    if (pattern.test(input)) {
      return { detected: true, patternName: name };
    }
  }
  return { detected: false };
}
