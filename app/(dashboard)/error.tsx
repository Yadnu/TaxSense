"use client";

/**
 * Dashboard error boundary.
 *
 * Catches errors thrown by any page inside app/(dashboard)/ that are not
 * handled by a more specific nested error.tsx. Renders within the dashboard
 * layout (sidebar + header remain visible), keeping the app navigable.
 */

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex flex-col">
      {/* Minimal page header so the error fits the dashboard chrome */}
      <div className="page-header">
        <h1 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>

        <div className="space-y-1.5">
          <p className="font-semibold text-foreground">
            This page ran into a problem
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred while loading this page. Refreshing
            usually fixes it.
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-xs text-muted-foreground/40">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
