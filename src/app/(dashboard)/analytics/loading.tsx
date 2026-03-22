export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-7 w-28 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="h-3 bg-gray-100 rounded w-28 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="h-4 w-48 bg-gray-200 rounded mb-5" />
          <div className="flex items-end gap-4 h-44 justify-around px-4">
            {[60, 90, 40, 75].map((h, i) => (
              <div key={i} className="flex-1 bg-gray-100 rounded" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="h-4 w-32 bg-gray-200 rounded mb-5" />
          <div className="flex items-center justify-center h-44">
            <div className="w-36 h-36 rounded-full border-[20px] border-gray-100" />
          </div>
        </div>
      </div>
    </div>
  )
}
