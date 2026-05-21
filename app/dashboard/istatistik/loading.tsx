export default function IstatistikLoading() {
  return (
    <div className="space-y-5 max-w-7xl animate-pulse">
      {/* Header */}
      <div>
        <div className="h-6 w-40 rounded-lg bg-gray-200 mb-1.5" />
        <div className="h-3.5 w-64 rounded-lg bg-gray-100" />
      </div>

      {/* Tab bar */}
      <div className="h-9 w-72 rounded-xl bg-gray-100" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border p-4 h-28">
            <div className="w-9 h-9 rounded-xl bg-gray-100 mb-3" />
            <div className="h-5 w-20 rounded-lg bg-gray-100 mb-1.5" />
            <div className="h-3 w-14 rounded-lg bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5 h-64">
            <div className="h-4 w-40 rounded-lg bg-gray-100 mb-3" />
            <div className="h-3 w-28 rounded-lg bg-gray-100 mb-6" />
            <div className="flex items-end gap-2 h-32">
              {[60, 80, 50, 100, 70, 30, 0].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-gray-100" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5 h-48">
            <div className="h-4 w-36 rounded-lg bg-gray-100 mb-3" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-24 rounded-lg bg-gray-100 mb-1.5" />
                  <div className="h-1.5 rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5 h-72">
            <div className="h-4 w-36 rounded-lg bg-gray-100 mb-6" />
            <div className="w-32 h-32 rounded-full border-8 border-gray-100 mx-auto mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-1.5 rounded-full bg-gray-100" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5 h-48">
            <div className="h-4 w-32 rounded-lg bg-gray-100 mb-3" />
            <div className="space-y-2.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-50 border border-border" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
