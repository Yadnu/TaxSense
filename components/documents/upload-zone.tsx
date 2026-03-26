"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { DocumentType } from "@prisma/client";
import {
  DOCUMENT_TYPE_LABELS,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/validators/document";
import { formatFileSize } from "@/lib/utils";
import type { DocumentCardData } from "./document-card";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onUploadSuccess?: (document: DocumentCardData) => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; filename: string }
  | { status: "success"; filename: string }
  | { status: "error"; message: string };

const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][];

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("OTHER");
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      // ── Client-side validation ───────────────────────────────────────────
      if (!ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
        setUploadState({
          status: "error",
          message: "Unsupported file type. Please upload a PDF, JPEG, or PNG.",
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setUploadState({
          status: "error",
          message: `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`,
        });
        return;
      }

      setUploadState({ status: "uploading", filename: file.name });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      try {
        const res = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Upload failed (HTTP ${res.status})`);
        }

        const { document } = await res.json();
        setUploadState({ status: "success", filename: file.name });
        onUploadSuccess?.(document);

        // Reset to idle after a brief success display
        setTimeout(() => setUploadState({ status: "idle" }), 3000);
      } catch (err) {
        setUploadState({
          status: "error",
          message: err instanceof Error ? err.message : "Upload failed. Please try again.",
        });
      }
    },
    [documentType, onUploadSuccess]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const isUploading = uploadState.status === "uploading";

  return (
    <section className="ts-card p-6">
      <h2 className="section-title mb-4">Add new document</h2>

      {/* Document type selector */}
      <div className="mb-4">
        <label htmlFor="doc-type" className="field-label">
          Document type
        </label>
        <select
          id="doc-type"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          className="field-input max-w-xs"
          disabled={isUploading}
        >
          {DOCUMENT_TYPE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragEnter={() => !isUploading && setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !isUploading && inputRef.current?.click()}
        className={[
          "dropzone",
          dragging && !isUploading ? "border-primary bg-primary/5" : "",
          isUploading ? "cursor-not-allowed opacity-60" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Uploading {uploadState.filename}…
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Please wait</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 ring-1 ring-blue-500/20">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag &amp; drop a file here, or{" "}
                <span className="text-primary underline underline-offset-2">browse</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG · Max 20 MB</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={onFileInput}
        className="sr-only"
      />

      {/* Success message */}
      {uploadState.status === "success" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            <strong>{uploadState.filename}</strong> uploaded successfully.
          </span>
        </div>
      )}

      {/* Error message */}
      {uploadState.status === "error" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{uploadState.message}</span>
          <button
            onClick={() => setUploadState({ status: "idle" })}
            aria-label="Dismiss error"
            className="opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
