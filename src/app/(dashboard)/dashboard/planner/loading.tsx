export default function PlannerLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-40 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-gray-200 rounded-xl" />
          <div className="h-9 w-24 bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="h-4 bg-gray-100 rounded text-center" />
          ))}
        </div>
        {/* Weeks */}
        {Array.from({ length: 5 }).map((_, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
            {Array.from({ length: 7 }).map((_, di) => (
              <div key={di} className="h-20 bg-gray-50 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
