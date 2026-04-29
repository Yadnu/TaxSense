"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  RefreshCw,
  FileText,
  ChevronDown,
  Info,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaxSummaryPanel } from "@/components/tax/TaxSummaryPanel";
import type { TaxResult } from "@/lib/tax/types";
import type { DocumentSummary } from "@/types/document";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilingStatusOption = {
  value: string;
  label: string;
};

const FILING_STATUS_OPTIONS: FilingStatusOption[] = [
  { value: "single", label: "Single" },
  { value: "married_filing_jointly", label: "Married Filing Jointly" },
  { value: "married_filing_separately", label: "Married Filing Separately" },
  { value: "head_of_household", label: "Head of Household" },
];

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted/60 ${className}`}
      aria-hidden="true"
    />
  );
}

function SummaryPanelSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TaxBreakdownPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [filingStatus, setFilingStatus] = useState<string>("single");
  const [summary, setSummary] = useState<TaxResult | null>(null);
  const [stateCode, setStateCode] = useState<string>("");
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasComputed, setHasComputed] = useState(false);

  // ── Fetch user's documents ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch("/api/documents");
        if (!res.ok) throw new Error("Failed to load documents");
        const data = await res.json();
        const docs: DocumentSummary[] = Array.isArray(data)
          ? data
          : (data.documents ?? []);
        // Only show documents that have been extracted
        const extracted = docs.filter(
          (d) => d.status === "EXTRACTED" || d.status === "NEEDS_REVIEW",
        );
        setDocuments(extracted);
        if (extracted.length > 0) {
          setSelectedDocId(extracted[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        setIsLoadingDocs(false);
      }
    }
    fetchDocuments();
  }, []);

  // ── Run computation ───────────────────────────────────────────────────────
  const runComputation = useCallback(async () => {
    if (!selectedDocId) return;
    setIsComputing(true);
    setError(null);
    try {
      const res = await fetch("/api/tax/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDocId, filingStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Computation failed");
      }
      setSummary(data.summary as TaxResult);
      if (data.stateCode) setStateCode(data.stateCode as string);
      setHasComputed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tax computation failed");
    } finally {
      setIsComputing(false);
    }
  }, [selectedDocId, filingStatus]);

  // ── Auto-compute when document and filing status are ready ────────────────
  useEffect(() => {
    if (selectedDocId && !isLoadingDocs) {
      runComputation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocId, filingStatus, isLoadingDocs]);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);
  const filingStatusLabel =
    FILING_STATUS_OPTIONS.find((o) => o.value === filingStatus)?.label ??
    "Single";

  return (
    <div className="flex flex-col">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Tax Breakdown
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Tax Year 2026 · {filingStatusLabel}
              {selectedDoc ? ` · ${selectedDoc.originalFilename}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-warning">
              <AlertCircle className="h-3 w-3" />
              Estimated — review all values
            </span>
          </div>
        </div>

        {/* ── Selectors ──────────────────────────────────────────────── */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Document selector */}
          {isLoadingDocs ? (
            <Skeleton className="h-8 w-52 rounded-lg" />
          ) : documents.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              No extracted documents found
            </div>
          ) : (
            <Select value={selectedDocId} onValueChange={(v) => { if (v) setSelectedDocId(v); }}>
              <SelectTrigger className="h-8 w-auto max-w-[260px]">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Select document">
                  <span className="truncate">
                    {selectedDoc?.originalFilename ?? "Select document"}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <span className="flex flex-col">
                      <span className="font-medium">{doc.originalFilename}</span>
                      <span className="text-xs text-muted-foreground">
                        {doc.documentType.replace(/_/g, " ")}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Filing status selector */}
          <Select value={filingStatus} onValueChange={(v) => { if (v) setFilingStatus(v); }}>
            <SelectTrigger className="h-8 w-auto">
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Filing status" />
            </SelectTrigger>
            <SelectContent>
              {FILING_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Recompute button */}
          {hasComputed && (
            <button
              type="button"
              onClick={runComputation}
              disabled={isComputing || !selectedDocId}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isComputing ? "animate-spin" : ""}`}
              />
              {isComputing ? "Computing…" : "Recompute"}
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* ── Error state ──────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Computation error
              </p>
              <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ── No documents empty state ──────────────────────────────────── */}
        {!isLoadingDocs && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">
              No extracted documents
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload and extract a tax document (W-2, 1099-NEC, etc.) to
              compute your tax summary.
            </p>
          </div>
        )}

        {/* ── Disclaimer ───────────────────────────────────────────────── */}
        {(isComputing || summary) && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Estimated figures only.</span>{" "}
              Calculations are based on extracted document data, 2026 projected
              brackets, and standard deduction assumptions. Consult a licensed
              CPA or tax professional before filing.
            </p>
          </div>
        )}

        {/* ── Loading skeleton ──────────────────────────────────────────── */}
        {(isLoadingDocs || (isComputing && !summary)) && (
          <SummaryPanelSkeleton />
        )}

        {/* ── Computed summary ──────────────────────────────────────────── */}
        {summary && !isLoadingDocs && (
          <div className={isComputing ? "pointer-events-none opacity-60 transition-opacity" : ""}>
            <TaxSummaryPanel summary={summary} stateCode={stateCode || undefined} />
          </div>
        )}
      </div>
    </div>
  );
}
