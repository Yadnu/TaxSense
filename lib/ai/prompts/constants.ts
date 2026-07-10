import type { ChatLocale } from "@/types/chat";

/**
 * Standard disclaimer appended to every AI-generated tax response.
 * Required for all user-facing outputs from TaxSense AI features.
 */
export const TAX_DISCLAIMER = `---
**Disclaimer:** This is AI-generated information for educational purposes only. It is not professional tax, legal, or financial advice. Tax laws change frequently and individual circumstances vary. Please consult a qualified tax professional or CPA before making any tax decisions. For authoritative guidance, visit [IRS.gov](https://www.irs.gov) or [ftb.ca.gov](https://www.ftb.ca.gov).`;

/** Spanish equivalent of {@link TAX_DISCLAIMER}. */
export const TAX_DISCLAIMER_ES = `---
**Aviso legal:** Esta información generada por IA es solo con fines educativos. No constituye asesoramiento fiscal, legal ni financiero profesional. Las leyes tributarias cambian con frecuencia y las circunstancias de cada persona varían. Consulte a un profesional tributario calificado o CPA antes de tomar decisiones fiscales. Para orientación oficial, visite [IRS.gov](https://www.irs.gov) o [ftb.ca.gov](https://www.ftb.ca.gov).`;

/** Extend with `hi` when adding Hindi. */
export const TAX_DISCLAIMER_BY_LOCALE: Record<ChatLocale, string> = {
  en: TAX_DISCLAIMER,
  es: TAX_DISCLAIMER_ES,
};

/**
 * Short inline disclaimer for use in banners and tooltips.
 */
export const TAX_DISCLAIMER_SHORT =
  "AI-generated information only — not professional tax advice. Consult a qualified tax professional.";

/**
 * The AI assistant persona name.
 */
export const ASSISTANT_NAME = "TaxSense";

/**
 * Number of knowledge chunks to retrieve for each RAG query.
 */
export const RAG_TOP_K = 5;

/**
 * Minimum cosine similarity score (0–1) for a chunk to be included
 * in the context. Chunks below this threshold are filtered out.
 */
export const RAG_MIN_SIMILARITY = 0.3;

/**
 * Similarity score below which retrieval is considered low-confidence.
 * Chunks are still included (they exceed the RAG_MIN_SIMILARITY floor) but
 * the response is flagged so callers can attach an additional disclaimer and
 * emit a guardrail audit event.
 */
export const RAG_LOW_CONFIDENCE_THRESHOLD = 0.45;

/**
 * Disclaimer appended to persisted assistant messages when the best retrieved
 * chunk similarity falls between RAG_MIN_SIMILARITY and
 * RAG_LOW_CONFIDENCE_THRESHOLD, indicating the knowledge base may not have
 * closely matched the user's query.
 */
export const LOW_CONFIDENCE_DISCLAIMER =
  "\n\n> **Note:** The knowledge sources retrieved for this response had low relevance scores. This answer may be incomplete or imprecise — please verify with a qualified tax professional or visit [IRS.gov](https://www.irs.gov) for authoritative guidance.";
