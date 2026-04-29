"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, CheckCircle2, RefreshCw } from "lucide-react";
import { UploadZone } from "@/components/documents/upload-zone";
import { DocumentCard, type DocumentCardData } from "@/components/documents/document-card";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const { documents: docs } = await res.json();
      setDocuments(docs);
    } catch {
      setError("Could not load your documents. Please try refreshing.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUploadSuccess = useCallback((newDoc: DocumentCardData) => {
    setDocuments((prev) => [newDoc, ...prev]);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return (
    <div className="flex flex-col">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="text-lg font-semibold text-foreground">Upload Documents</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Upload your tax documents. Supported formats: W-2, 1099s, receipts, bank statements.
        </p>
      </div>

      <div className="space-y-6 p-6">

        {/* ── Upload section ───────────────────────────────────────── */}
        <UploadZone onUploadSuccess={handleUploadSuccess} />

        {/* ── Document list ────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              Uploaded documents
              {!isLoading && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {documents.length}
                </span>
              )}
            </h2>

            {error && (
              <button
                onClick={() => { setIsLoading(true); fetchDocuments(); }}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="ts-card divide-y divide-border overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-32 animate-pulse rounded bg-muted/60" />
                  </div>
                  <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="ts-card flex flex-col items-center gap-3 py-14 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="ts-card flex flex-col items-center gap-3 py-14 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm font-medium text-muted-foreground">No documents uploaded yet</p>
              <p className="text-xs text-muted-foreground/60">
                Use the upload area above to add your first document.
              </p>
            </div>
          ) : (
            <div className="ts-card divide-y divide-border overflow-hidden">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </section>

        {/* ── Help section ─────────────────────────────────────────── */}
        <section className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/30 p-4">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">What documents do I need?</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {[
              "W-2 from each employer",
              "1099-NEC for freelance income",
              "1099-INT for bank interest",
              "1099-DIV for dividends",
              "1098 for mortgage interest",
              "Receipts for business expenses",
            ].map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                {item}
              </li>
            ))}
          </ul>
        </section>

      </div>
    </div>
  );
}
