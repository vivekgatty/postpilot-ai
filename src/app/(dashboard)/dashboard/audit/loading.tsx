export default function AuditLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-32 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="h-5 w-20 bg-gray-100 rounded" />
      </div>

      {/* Score card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-12 w-20 bg-gray-200 rounded-xl" />
        </div>

        {/* Dimension bars */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between mb-1">
              <div className="h-3 w-28 bg-gray-100 rounded" />
              <div className="h-3 w-8 bg-gray-100 rounded" />
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div className="h-2 bg-gray-200 rounded-full" style={{ width: `${40 + i * 10}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Actions card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="h-4 w-28 bg-gray-200 rounded mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0 mt-0.5" />
            <div className="flex-1 h-4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
