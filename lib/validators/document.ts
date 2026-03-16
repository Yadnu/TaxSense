import { z } from "zod";
import { DocumentType } from "@prisma/client";

// ─── File constraints ─────────────────────────────────────────────────────────

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

/** 20 MB upper limit on document uploads */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

// ─── Document type labels (DocumentType enum → display string) ────────────────

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  W2: "W-2",
  FORM_1040: "Form 1040",
  FORM_1040_NR: "Form 1040-NR",
  FORM_1099: "1099",
  FORM_1099_NEC: "1099-NEC",
  FORM_1099_INT: "1099-INT",
  FORM_1099_DIV: "1099-DIV",
  FORM_1099_MISC: "1099-MISC",
  FORM_1099_R: "1099-R",
  FORM_1098: "Form 1098",
  FORM_1095: "Form 1095",
  RECEIPT: "Receipt",
  BANK_STATEMENT: "Bank Statement",
  OTHER: "Other",
};

// ─── Zod schemas ──────────────────────────────────────────────────────────────

/** Validates the optional metadata fields sent alongside the file upload. */
export const UploadMetadataSchema = z.object({
  documentType: z.nativeEnum(DocumentType).default("OTHER"),
  taxYearId: z.string().cuid("Invalid tax year ID").optional(),
});

export type UploadMetadata = z.infer<typeof UploadMetadataSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function validateMimeType(mimeType: string): mimeType is AcceptedMimeType {
  return ACCEPTED_MIME_TYPES.includes(mimeType as AcceptedMimeType);
}

export function validateFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}
