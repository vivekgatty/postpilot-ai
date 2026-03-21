export default function HooksLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-20 animate-pulse">

      {/* Left panel skeleton */}
      <div className="w-full lg:w-[400px] lg:flex-shrink-0 space-y-5">

        {/* Title */}
        <div className="space-y-2">
          <div className="h-7 w-36 bg-gray-100 rounded-lg" />
          <div className="h-4 w-56 bg-gray-100 rounded" />
        </div>

        {/* Textarea */}
        <div className="h-24 bg-gray-100 rounded-xl" />

        {/* Niche select */}
        <div className="h-10 bg-gray-100 rounded-xl" />

        {/* Goal grid */}
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl" />
          ))}
        </div>

        {/* Style pills */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-gray-100 rounded mb-2" />
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-7 w-20 bg-gray-100 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Button */}
        <div className="h-11 bg-gray-100 rounded-xl" />
      </div>

      {/* Right panel skeleton */}
      <div className="flex-1 min-w-0 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E5E4E0] p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 bg-gray-100 rounded-full" />
              <div className="h-3.5 w-20 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
            <div className="flex justify-end">
              <div className="h-7 w-16 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
