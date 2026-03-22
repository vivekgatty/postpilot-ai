export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Heading */}
      <div>
        <div className="h-7 w-56 bg-gray-200 rounded mb-1" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
              <div className="h-7 w-14 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent posts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-14 bg-gray-100 rounded" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0">
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-1/3 bg-gray-100 rounded" />
              </div>
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-8 bg-gray-100 rounded-xl" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded-full" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
