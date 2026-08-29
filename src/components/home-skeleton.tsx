export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading your timeline">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-border bg-parchment p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-2.5 w-20 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
          <div className="mt-4 h-16 w-full rounded-xl bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function RailSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="w-40 shrink-0 animate-pulse rounded-2xl border border-border bg-parchment p-3">
          <div className="h-40 w-full rounded-lg bg-muted" />
          <div className="mt-2 h-3 w-3/4 rounded bg-muted" />
          <div className="mt-1.5 h-2.5 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
