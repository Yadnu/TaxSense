"use client";

/**
 * Global error boundary for the root layout.
 *
 * Catches unhandled runtime errors that bubble up past all nested error.tsx
 * boundaries. This is a last-resort fallback — it renders outside of the
 * normal layout tree so it must include its own <html> and <body> tags.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to server-side error monitoring (e.g. Sentry) in production
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 font-sans text-slate-100 antialiased">
        <div className="flex max-w-md flex-col items-center gap-6 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 ring-1 ring-red-500/30">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-slate-400">
              An unexpected error occurred. This has been noted and we&apos;ll
              look into it.
            </p>
            {error.digest && (
              <p className="mt-1 font-mono text-xs text-slate-600">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
