export default function CarouselLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-pulse">
      {/* Page title */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-72 bg-gray-100 rounded" />
      </div>

      {/* Tab switcher */}
      <div className="h-9 w-56 bg-gray-100 rounded-xl" />

      {/* Feature cards */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 h-20" />
        ))}
      </div>

      {/* Preview thumbnails */}
      <div className="flex items-center justify-center gap-4">
        <div className="w-40 h-40 bg-gray-200 rounded-xl" />
        <div className="w-40 h-40 bg-gray-200 rounded-xl" />
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}
