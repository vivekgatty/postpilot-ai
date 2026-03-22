// Streak page skeleton

export default function StreakLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 animate-pulse">

      {/* Page heading */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gray-200" />
        <div className="h-6 w-36 bg-gray-200 rounded" />
      </div>

      {/* Stat cards row */}
      <div className="flex gap-3">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="flex-1 bg-white rounded-xl border border-gray-100 p-4 space-y-3 shadow-sm"
          >
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Primary streak card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex gap-4">
        <div className="flex-1 space-y-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
          {/* Giant number placeholder */}
          <div className="h-16 w-24 bg-gray-200 rounded-lg" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-2 w-full bg-gray-100 rounded-full" />
          <div className="h-3 w-40 bg-gray-200 rounded" />
        </div>
        <div className="flex flex-col gap-4 w-52">
          {[1, 2].map(i => (
            <div key={i} className="flex-1 bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="h-6 w-8 bg-gray-200 rounded" />
              <div className="h-8 w-12 bg-gray-200 rounded" />
              <div className="h-2.5 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="flex gap-1">
          {/* Week columns */}
          {Array.from({ length: 52 }).map((_, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, di) => (
                <div
                  key={di}
                  className="w-2.5 h-2.5 rounded-sm bg-gray-100"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
