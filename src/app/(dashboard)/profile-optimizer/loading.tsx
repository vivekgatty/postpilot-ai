export default function ProfileOptimizerLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16 animate-pulse">
      {/* Title */}
      <div className="space-y-2">
        <div className="h-7 w-56 bg-gray-200 rounded-lg" />
        <div className="h-4 w-80 bg-gray-100 rounded" />
      </div>

      {/* Tab switcher */}
      <div className="h-9 w-48 bg-gray-100 rounded-xl" />

      {/* Radar placeholder */}
      <div className="flex items-center justify-center pt-4">
        <div className="w-64 h-64 rounded-full bg-gray-100" />
      </div>

      {/* Dimension bars */}
      <div className="space-y-3">
        {[80, 65, 55, 45, 40, 35, 30, 25, 20].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-gray-200 flex-shrink-0" />
            <div className="w-32 h-3 bg-gray-200 rounded" />
            <div className="flex-1 h-2 rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-gray-200" style={{ width: `${w}%` }} />
            </div>
            <div className="w-10 h-3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* CTA button */}
      <div className="h-12 bg-gray-200 rounded-xl" />
    </div>
  )
}
