"use client";

import { useState } from "react";
import Link from "next/link";
import {
  File,
  Trash2,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { DocumentType, DocumentStatus } from "@prisma/client";
import { DOCUMENT_TYPE_LABELS } from "@/lib/validators/document";
import { formatFileSize, formatDate } from "@/lib/utils";

// ─── Shared data shape returned by the API ────────────────────────────────────

export interface DocumentCardData {
  id: string;
  originalFilename: string;
  documentType: DocumentType;
  status: DocumentStatus;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string; // ISO string (serialised from Date by Next.js)
  processedAt: string | null;
  taxYearId: string | null;
  _count: { extractedFields: number };
}

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; className: string; Icon: React.ElementType; spin?: boolean }
> = {
  UPLOADED:     { label: "Uploaded",     className: "badge-neutral", Icon: Clock        },
  PROCESSING:   { label: "Processing",   className: "badge-warning", Icon: Loader2, spin: true },
  EXTRACTED:    { label: "Extracted",    className: "badge-success", Icon: CheckCircle2 },
  FAILED:       { label: "Failed",       className: "badge-error",   Icon: AlertCircle  },
  NEEDS_REVIEW: { label: "Needs Review", className: "badge-warning", Icon: AlertCircle  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface DocumentCardProps {
  document: DocumentCardData;
  onDelete: (id: string) => void;
}

export function DocumentCard({ document: doc, onDelete }: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const cfg = STATUS_CONFIG[doc.status];

  async function handleDelete() {
    if (!confirm(`Delete "${doc.originalFilename}"?\n\nThis action cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error ?? "Delete failed");
      }
      onDelete(doc.id);
    } catch (err) {
      console.error("[DocumentCard] Delete error:", err);
      alert("Failed to delete document. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      {/* File icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
        <File className="h-4 w-4" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{doc.originalFilename}</p>
        <p className="text-xs text-gray-400">
          {DOCUMENT_TYPE_LABELS[doc.documentType]}
          {" · "}
          {formatFileSize(doc.sizeBytes)}
          {" · "}
          {formatDate(doc.uploadedAt, { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Status badge */}
      <span className={cfg.className}>
        <cfg.Icon className={`h-3 w-3 ${cfg.spin ? "animate-spin" : ""}`} />
        {cfg.label}
      </span>

      {/* Review link — only when fields have been extracted */}
      {doc.status === "EXTRACTED" && doc._count.extractedFields > 0 && (
        <Link
          href={`/extracted-data?documentId=${doc.id}`}
          className="flex items-center gap-1 text-xs font-medium text-blue-900 hover:underline"
        >
          Review
          <ChevronRight className="h-3 w-3" />
        </Link>
      )}

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label={`Delete ${doc.originalFilename}`}
        className="ml-1 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
