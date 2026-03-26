"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Sparkles,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  CalendarDays,
  HardDrive,
  Cpu,
} from "lucide-react";
import type { DocumentStatus, DocumentType } from "@prisma/client";
import {
  ExtractedFieldsTable,
  type ExtractedFieldData,
} from "@/components/documents/extracted-fields-table";
import { DOCUMENT_TYPE_LABELS } from "@/lib/validators/document";
import { formatFileSize, formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocumentDetail {
  id: string;
  originalFilename: string;
  documentType: DocumentType;
  status: DocumentStatus;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  processedAt: string | null;
  rawText: string | null;
  ocrEngine: string | null;
  signedUrl: string | null;
  extractedFields: ExtractedFieldData[];
  _count: { extractedFields: number };
}

// ─── Status display config ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DocumentStatus,
  {
    label: string;
    description: string;
    badgeClass: string;
    Icon: React.ElementType;
    spin?: boolean;
  }
> = {
  UPLOADED: {
    label: "Uploaded",
    description: "Ready for extraction",
    badgeClass: "bg-slate-100 dark:bg-muted text-slate-600 dark:text-foreground/70 border-slate-200 dark:border-border",
    Icon: Clock,
  },
  PROCESSING: {
    label: "Processing",
    description: "Extracting fields…",
    badgeClass: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    Icon: Loader2,
    spin: true,
  },
  EXTRACTED: {
    label: "Extracted",
    description: "Fields extracted successfully",
    badgeClass: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    Icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    description: "Extraction failed",
    badgeClass: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900",
    Icon: AlertCircle,
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    description: "Partial extraction — please verify fields",
    badgeClass: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    Icon: AlertCircle,
  },
};

// ─── Page component ───────────────────────────────────────────────────────────

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractMessage, setExtractMessage] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}`);
      if (res.status === 404) throw new Error("Document not found.");
      if (!res.ok) throw new Error("Failed to load document.");
      const { document: doc } = await res.json();
      setDocument(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  useEffect(() => {
    if (document?.status !== "PROCESSING") return;
    const timer = setInterval(fetchDocument, 3000);
    return () => clearInterval(timer);
  }, [document?.status, fetchDocument]);

  const handleExtract = useCallback(async () => {
    if (!document) return;
    setIsExtracting(true);
    setExtractMessage(null);
    setDocument((prev) => (prev ? { ...prev, status: "PROCESSING" } : prev));

    try {
      const res = await fetch(`/api/documents/${id}/extract`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setDocument((prev) => (prev ? { ...prev, status: "FAILED" } : prev));
        setExtractMessage(data.error ?? "Extraction failed.");
      } else {
        setExtractMessage(data.message ?? null);
        await fetchDocument();
      }
    } catch {
      setDocument((prev) => (prev ? { ...prev, status: "FAILED" } : prev));
      setExtractMessage("Extraction failed. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  }, [document, id, fetchDocument]);

  const handleFieldUpdate = useCallback((updated: ExtractedFieldData) => {
    setDocument((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        extractedFields: prev.extractedFields.map((f) =>
          f.id === updated.id ? updated : f
        ),
      };
    });
  }, []);

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col">
        <div className="page-header">
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-4 p-6">
          <div className="h-36 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────
  if (error || !document) {
    return (
      <div className="flex flex-col">
        <div className="page-header">
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Documents
          </Link>
        </div>
        <div className="p-6">
          <div className="ts-card flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm font-medium text-foreground">
              {error ?? "Document not found."}
            </p>
            <button
              onClick={() => { setIsLoading(true); fetchDocument(); }}
              className="btn-secondary flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[document.status];
  const canExtract =
    document.status === "UPLOADED" ||
    document.status === "FAILED" ||
    document.status === "NEEDS_REVIEW";
  const hasFields =
    (document.status === "EXTRACTED" || document.status === "NEEDS_REVIEW") &&
    document.extractedFields.length > 0;
  const extractedCount = document.extractedFields.filter((f) => f.fieldValue !== null).length;
  const highConfidenceCount = document.extractedFields.filter((f) => f.confidence >= 0.8).length;

  return (
    <div className="flex flex-col">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link
            href="/documents"
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Back to Documents"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground leading-tight">
              {document.originalFilename}
            </h1>
            <p className="text-xs text-muted-foreground">
              {DOCUMENT_TYPE_LABELS[document.documentType]}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">

        {/* ── Document info card ──────────────────────────────────── */}
        <div className="ts-card overflow-hidden">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">

            {/* File info */}
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-3 min-w-0">
                <div>
                  <p className="font-semibold text-foreground truncate">
                    {document.originalFilename}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {DOCUMENT_TYPE_LABELS[document.documentType]}
                  </p>
                </div>

                {/* Meta pills */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HardDrive className="h-3.5 w-3.5 text-muted-foreground/50" />
                    {formatFileSize(document.sizeBytes)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/50" />
                    {formatDate(document.uploadedAt, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {document.processedAt && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Processed {formatDate(document.processedAt, { month: "short", day: "numeric" })}
                    </span>
                  )}
                  {document.ocrEngine && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground/50" />
                      {document.ocrEngine === "TEXTRACT" ? "AWS Textract" : "Text extraction"}
                    </span>
                  )}
                </div>

                {/* Status badge */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.badgeClass}`}
                >
                  <statusCfg.Icon
                    className={`h-3.5 w-3.5 ${statusCfg.spin ? "animate-spin" : ""}`}
                  />
                  {statusCfg.label}
                  <span className="font-normal opacity-70">— {statusCfg.description}</span>
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex shrink-0 items-start gap-2">
              {document.signedUrl && (
                <a
                  href={document.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center gap-1.5 text-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              )}

              {canExtract && (
                <button
                  onClick={handleExtract}
                  disabled={isExtracting || document.status === "PROCESSING"}
                  className="btn-primary inline-flex items-center gap-1.5 text-sm disabled:opacity-60"
                >
                  {isExtracting || document.status === "PROCESSING" ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Extracting…</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5" />{document.status === "FAILED" ? "Retry Extraction" : "Extract Fields"}</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Extract feedback banner */}
          {extractMessage && (
            <div
              className={`border-t px-5 py-3 text-sm ${
                document.status === "FAILED"
                  ? "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400"
                  : "border-border bg-muted/50 text-muted-foreground"
              }`}
            >
              {extractMessage}
            </div>
          )}

          {/* Field count summary */}
          {hasFields && (
            <div className="border-t border-border bg-muted/30 px-5 py-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{extractedCount}</span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">{document.extractedFields.length}</span>{" "}
                fields extracted
                {highConfidenceCount > 0 && (
                  <> · <span className="font-medium text-emerald-600 dark:text-emerald-500">{highConfidenceCount} high confidence</span></>
                )}
              </p>
            </div>
          )}
        </div>

        {/* ── Extracted fields / status panels ──────────────────── */}
        {document.status === "PROCESSING" ? (
          <ProcessingState />
        ) : hasFields ? (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <h2 className="text-base font-semibold text-foreground shrink-0">
                  {DOCUMENT_TYPE_LABELS[document.documentType]} · {document.extractedFields.length} fields extracted
                </h2>
                {(() => {
                  const confirmed = document.extractedFields.filter((f) => f.source === "USER_PROVIDED").length;
                  const toReview  = document.extractedFields.filter((f) => f.confidence < 0.8 && f.source !== "USER_PROVIDED").length;
                  return (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {confirmed > 0 && (
                        <span className="rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {confirmed} confirmed
                        </span>
                      )}
                      {toReview > 0 && (
                        <span className="rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                          {toReview} to review
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={handleExtract}
                disabled={isExtracting}
                className="shrink-0 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                title="Re-run extraction"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isExtracting ? "animate-spin" : ""}`} />
                Re-extract
              </button>
            </div>

            <ExtractionDisclaimerBanner />

            <ExtractedFieldsTable
              documentId={document.id}
              documentType={document.documentType}
              fields={document.extractedFields}
              onFieldUpdate={handleFieldUpdate}
            />
          </section>
        ) : document.status === "UPLOADED" ? (
          <UploadedEmptyState onExtract={handleExtract} isExtracting={isExtracting} />
        ) : document.status === "FAILED" ? (
          <FailedState onRetry={handleExtract} isRetrying={isExtracting} />
        ) : null}

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProcessingState() {
  return (
    <div className="ts-card flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
        <Loader2 className="h-7 w-7 animate-spin text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Extracting fields</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The AI is reading your document. This usually takes 10–30 seconds.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Processing
      </div>
    </div>
  );
}

function UploadedEmptyState({ onExtract, isExtracting }: { onExtract: () => void; isExtracting: boolean }) {
  return (
    <div className="ts-card flex flex-col items-center gap-5 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 dark:bg-blue-950">
        <Sparkles className="h-7 w-7 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Ready to extract</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Click below to have AI read this document and automatically extract all structured fields.
        </p>
      </div>
      <button onClick={onExtract} disabled={isExtracting} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
        {isExtracting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Extracting…</>) : (<><Sparkles className="h-4 w-4" /> Extract Fields</>)}
      </button>
    </div>
  );
}

function FailedState({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="ts-card flex flex-col items-center gap-4 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
        <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Extraction failed</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Something went wrong during extraction. This can happen with low-quality scans or unsupported formats.
        </p>
      </div>
      <button onClick={onRetry} disabled={isRetrying} className="btn-secondary inline-flex items-center gap-2 disabled:opacity-60">
        {isRetrying ? (<><Loader2 className="h-4 w-4 animate-spin" /> Retrying…</>) : (<><RefreshCw className="h-4 w-4" /> Try Again</>)}
      </button>
    </div>
  );
}

function ExtractionDisclaimerBanner() {
  return (
    <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 px-4 py-3">
      <p className="text-xs text-amber-700 dark:text-amber-400/90">
        <span className="font-semibold">Review all extracted values carefully.</span>{" "}
        AI extraction may contain errors, especially with scanned or low-quality documents.
        Click the edit icon on any field to correct a value — corrected fields are marked as verified.
      </p>
    </div>
  );
}
