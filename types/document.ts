/**
 * Shared TypeScript types for tax documents and extracted fields.
 *
 * These types mirror the Prisma-generated models but add runtime-friendly
 * representations (e.g. ISO date strings instead of Date objects) suitable
 * for JSON serialisation across API boundaries.
 */

import type {
  DocumentType,
  DocumentStatus,
  OcrEngine,
  FieldSource,
} from "@prisma/client";

// ─── Document ─────────────────────────────────────────────────────────────────

/**
 * Lightweight document summary returned by GET /api/documents.
 * Contains only the metadata needed to render a document card.
 */
export interface DocumentSummary {
  id: string;
  originalFilename: string;
  documentType: DocumentType;
  status: DocumentStatus;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string; // ISO 8601
  processedAt: string | null;
  taxYearId: string | null;
  _count: {
    extractedFields: number;
  };
}

/**
 * Full document detail returned by GET /api/documents/[id].
 * Includes extracted fields and a short-lived signed S3 URL.
 */
export interface DocumentDetail extends DocumentSummary {
  s3Key: string;
  s3Bucket: string;
  rawText: string | null;
  ocrEngine: OcrEngine | null;
  /** Short-lived pre-signed S3 URL for direct download/preview. */
  signedUrl: string | null;
  extractedFields: ExtractedFieldRecord[];
}

// ─── Extracted fields ─────────────────────────────────────────────────────────

/**
 * A single structured field extracted from a tax document.
 * Stored as an `ExtractedField` row in the database.
 */
export interface ExtractedFieldRecord {
  id: string;
  documentId: string;
  fieldName: string;
  /** String representation of the extracted value; null if not found. */
  fieldValue: string | null;
  /**
   * Confidence score in the range [0, 1].
   * - ≥ 0.8: high confidence (green)
   * - 0.5 – 0.79: medium confidence (amber)
   * - < 0.5: low confidence (red)
   */
  confidence: number;
  /** 1-based page number the field was found on. */
  pageNumber: number | null;
  /** Logical grouping for display (e.g. "personal_info", "income"). */
  fieldGroup: string | null;
  /** How the field was obtained. */
  source: FieldSource;
  extractedAt: string; // ISO 8601
}

/**
 * Payload used when a user manually corrects an extracted field value.
 * Sent to PATCH /api/documents/[id]/fields/[fieldId].
 */
export interface FieldUpdatePayload {
  fieldValue: string;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Response body returned by POST /api/documents after a successful upload.
 */
export interface UploadResponse {
  document: DocumentSummary;
}

// ─── Extraction ───────────────────────────────────────────────────────────────

/**
 * Response body returned by POST /api/documents/[id]/extract.
 */
export interface ExtractionResponse {
  message: string;
  extractedCount: number;
}
