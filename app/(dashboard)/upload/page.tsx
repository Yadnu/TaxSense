"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { UploadZone } from "@/components/documents/upload-zone";
import type { DocumentCardData } from "@/components/documents/document-card";

export default function UploadPage() {
  const router   = useRouter();
  const [uploaded, setUploaded] = useState<DocumentCardData | null>(null);

  function handleUploadSuccess(doc: DocumentCardData) {
    setUploaded(doc);
    setTimeout(() => router.push("/documents"), 2000);
  }

  return (
    <div className="flex flex-col">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link
            href="/documents"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to documents
          </Link>
        </div>
        <h1 className="mt-1 text-lg font-semibold text-foreground">Upload a Document</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Upload a tax document to extract its fields automatically.
        </p>
      </div>

      <div className="max-w-2xl p-6">

        {uploaded ? (
          <div className="ts-card flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Upload successful!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                <strong>{uploaded.originalFilename}</strong> has been uploaded. Redirecting to your
                documents…
              </p>
            </div>
          </div>
        ) : (
          <UploadZone onUploadSuccess={handleUploadSuccess} />
        )}

      </div>
    </div>
  );
}
