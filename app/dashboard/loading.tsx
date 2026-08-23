// Route-level Suspense fallback for every page under /dashboard. Only
// fires while a server component's data fetch is in flight (the
// server-fetched pages: atlas/[subjectId], atlas/[subjectId]/[topicId],
// atlas, journey, settings, insights, insights/weekly-review, profile,
// upgrade) — client-wrapper pages render instantly and show their own
// component-level skeleton instead.
export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="h-7 w-40 rounded-lg bg-gray-100 animate-pulse" />
      <div className="h-24 rounded-2xl bg-white border border-border animate-pulse" />
      <div className="h-48 rounded-2xl bg-white border border-border animate-pulse" />
      <div className="h-32 rounded-2xl bg-white border border-border animate-pulse" />
    </div>
  )
}
