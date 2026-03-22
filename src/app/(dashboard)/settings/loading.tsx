export default function SettingsLoading() {
  return (
    <div className="max-w-3xl animate-pulse">
      {/* Page title */}
      <div className="h-7 bg-gray-200 rounded w-24 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-64 mb-8" />

      {/* Section cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="h-5 bg-gray-200 rounded w-28 mb-4" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="flex gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className="h-4 w-28 bg-gray-100 rounded flex-shrink-0" />
              <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
            </div>
          ))}
          <div className="flex justify-end mt-5">
            <div className="h-9 w-28 bg-gray-200 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
