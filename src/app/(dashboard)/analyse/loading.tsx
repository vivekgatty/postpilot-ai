export default function AnalyseLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">

      {/* Page title */}
      <div className="mb-5 space-y-2">
        <div className="h-7 w-40 bg-gray-200 rounded-lg" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
      </div>

      {/* Tab bar */}
      <div className="h-9 w-72 bg-gray-100 rounded-xl mb-6" />

      {/* Two-column skeleton */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">

        {/* Left — textarea skeleton */}
        <div className="lg:w-[40%] space-y-4">
          <div className="h-4 w-24 bg-gray-100 rounded" />
          <div className="h-52 w-full bg-gray-100 rounded-xl" />
          <div className="h-4 w-16 bg-gray-100 rounded ml-auto" />
          <div className="h-10 w-full bg-gray-200 rounded-xl" />
          {/* Suggestion card skeletons */}
          {[0, 1, 2].map(i => (
            <div key={i} className="h-12 w-full bg-gray-100 rounded-xl" />
          ))}
        </div>

        {/* Right — radar + bars skeleton */}
        <div className="lg:w-[60%] space-y-4">
          {/* Score circle */}
          <div
            className="rounded-2xl p-6 space-y-6"
            style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-48 bg-gray-100 rounded" />
              </div>
              {/* Circle skeleton */}
              <div className="w-20 h-20 rounded-full bg-gray-200" />
            </div>

            {/* Radar placeholder */}
            <div className="w-full h-48 rounded-xl bg-gray-100" />

            {/* Dimension bars */}
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full" />
                  <div className="h-3 w-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Timing card skeleton */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
          >
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-64 bg-gray-100 rounded" />
          </div>
        </div>

      </div>
    </div>
  )
}
