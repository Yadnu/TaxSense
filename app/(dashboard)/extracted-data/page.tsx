"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, RefreshCw, FileQuestion } from "lucide-react";
import type { DocumentType, DocumentStatus } from "@prisma/client";
import {
  ExtractedFieldsTable,
  type ExtractedFieldData,
} from "@/components/documents/extracted-fields-table";
import { DOCUMENT_TYPE_LABELS } from "@/lib/validators/document";

interface DocListItem {
  id: string;
  originalFilename: string;
  documentType: DocumentType;
  status: DocumentStatus;
  _count: { extractedFields: number };
}

interface DocumentDetail {
  id: string;
  originalFilename: string;
  documentType: DocumentType;
  extractedFields: ExtractedFieldData[];
}

export default function ExtractedDataPage() {
  const [docs, setDocs] = useState<DocListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadDocumentList = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const { documents } = await res.json();
      const withFields = (documents as DocListItem[]).filter(
        (d) => d._count.extractedFields > 0
      );
      setDocs(withFields);
      setSelectedId((prev) => {
        if (prev && withFields.some((d) => d.id === prev)) return prev;
        return withFields[0]?.id ?? null;
      });
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Could not load documents.");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocumentList();
  }, [loadDocumentList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);

    fetch(`/api/documents/${selectedId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load document");
        return res.json();
      })
      .then(({ document: doc }) => {
        if (cancelled) return;
        setDetail({
          id: doc.id,
          originalFilename: doc.originalFilename,
          documentType: doc.documentType,
          extractedFields: doc.extractedFields ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const handleFieldUpdate = useCallback((updated: ExtractedFieldData) => {
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            extractedFields: prev.extractedFields.map((f) =>
              f.id === updated.id ? updated : f
            ),
          }
        : null
    );
  }, []);

  return (
    <div className="flex flex-col">
      <div className="page-header">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Extracted Data Review</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Review the data extracted from your documents. Correct any errors before proceeding.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadDocumentList()}
            disabled={listLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {listError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {listError}
          </div>
        )}

        {listLoading && !docs.length ? (
          <div className="ts-card space-y-3 p-8">
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="h-32 animate-pulse rounded-lg bg-muted/60" />
          </div>
        ) : !docs.length ? (
          <div className="ts-card flex flex-col items-center gap-3 py-16 text-center">
            <FileQuestion className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No extracted fields yet</p>
            <p className="max-w-sm text-xs text-muted-foreground/80">
              Upload a document on the Documents page, run <span className="font-medium">Extract</span>, then
              return here — your extracted fields will appear in this list.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label htmlFor="doc-select" className="field-label mb-0 shrink-0">
                Viewing document:
              </label>
              <div className="relative max-w-md">
                <select
                  id="doc-select"
                  value={selectedId ?? ""}
                  onChange={(e) => setSelectedId(e.target.value || null)}
                  className="field-input appearance-none pr-8"
                >
                  {docs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.originalFilename} ({DOCUMENT_TYPE_LABELS[d.documentType]}) ·{" "}
                      {d._count.extractedFields} fields
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              </div>
            </div>

            {detailLoading && (
              <div className="ts-card p-8">
                <div className="h-64 animate-pulse rounded-lg bg-muted/60" />
              </div>
            )}

            {!detailLoading && detail && (
              <>
                <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 px-4 py-3">
                  <p className="text-xs text-amber-800 dark:text-amber-400/90">
                    <span className="font-semibold">Review all extracted values carefully.</span> AI
                    extraction may contain errors. Use the edit icon to correct a value — corrected
                    fields are marked as verified.
                  </p>
                </div>

                <div className="ts-card overflow-hidden p-5">
                  <div className="mb-4 border-b border-border pb-4">
                    <h2 className="section-title">{detail.originalFilename}</h2>
                    <p className="section-caption">
                      {DOCUMENT_TYPE_LABELS[detail.documentType]} · {detail.extractedFields.length}{" "}
                      fields
                    </p>
                  </div>

                  <ExtractedFieldsTable
                    key={detail.id}
                    documentId={detail.id}
                    documentType={detail.documentType}
                    fields={detail.extractedFields}
                    onFieldUpdate={handleFieldUpdate}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
