/**
 * Loading skeleton for the documents list page.
 * Shown while the page component fetches document data.
 */
export default function DocumentsLoading() {
  return (
    <div className="flex flex-col">
      <div className="page-header">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-3.5 w-64 animate-pulse rounded bg-muted/60" />
      </div>

      <div className="space-y-6 p-6">
        {/* Upload zone placeholder */}
        <div className="h-36 animate-pulse rounded-xl border-2 border-dashed border-border bg-muted/20" />

        {/* Document list placeholder */}
        <div>
          <div className="mb-3 h-4 w-36 animate-pulse rounded bg-muted" />
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
        </div>
      </div>
    </div>
  );
}
