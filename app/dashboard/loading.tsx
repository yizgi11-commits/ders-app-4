// Route-level Suspense fallback for every page under /dashboard. Only
// fires while a server component's data fetch is in flight (the
// server-fetched pages: atlas/[subjectId], atlas/[subjectId]/[topicId],
// atlas, journey, settings, insights, insights/weekly-review, profile,
// upgrade) — client-wrapper pages render instantly and show their own
// component-level skeleton instead.
//
// Geometry mirrors the common page shape: title, a one-line stats row,
// then 48px divider rows.
export default function DashboardLoading() {
  return (
    <div className="max-w-3xl mx-auto" aria-busy="true" aria-label="Yükleniyor">
      <div className="h-7 w-40 rounded-md skeleton-shimmer" />
      <div className="h-4 w-[200px] rounded-sm skeleton-shimmer mt-3" />
      <div className="mt-10 space-y-0">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 flex items-center gap-3 border-b border-border">
            <div className="size-4 rounded-sm skeleton-shimmer" />
            <div className="h-3.5 flex-1 max-w-[60%] rounded-sm skeleton-shimmer" />
            <div className="h-3.5 w-12 ml-auto rounded-sm skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}
