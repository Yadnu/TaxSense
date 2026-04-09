/**
 * Dashboard segment loading state.
 *
 * Shown by Next.js while any dashboard page is fetching its initial data.
 * Uses animated skeletons that match the approximate layout of the dashboard
 * home page so the transition feels seamless.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col">
      {/* Page header skeleton */}
      <div className="page-header">
        <div className="space-y-1.5">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-56 animate-pulse rounded bg-muted/60" />
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Stat cards row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="stat-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 animate-pulse rounded bg-muted/70" />
                <div className="h-8 w-8 animate-pulse rounded-lg bg-muted/50" />
              </div>
              <div className="mt-2 h-7 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-28 animate-pulse rounded bg-muted/50" />
            </div>
          ))}
        </div>

        {/* Chart + progress side-by-side */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="ts-card p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-48 animate-pulse rounded bg-muted/60" />
              </div>
            </div>
            <div className="h-48 animate-pulse rounded-lg bg-muted/40" />
          </div>

          <div className="ts-card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="space-y-1">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted/60" />
              </div>
            </div>
            <div className="divide-y divide-border">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-5 w-5 animate-pulse rounded-full bg-muted/50" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
