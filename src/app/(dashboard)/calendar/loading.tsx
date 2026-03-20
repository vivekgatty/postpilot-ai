function Pulse({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className ?? ''}`} />
}

export default function CalendarLoading() {
  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Pulse className="h-7 w-44" />
          <Pulse className="h-4 w-56" />
        </div>
        <Pulse className="h-8 w-16 rounded-lg" />
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-[#E5E4E0] p-6 space-y-5">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <Pulse className="h-8 w-8 rounded-full" />
          <Pulse className="h-5 w-36" />
          <Pulse className="h-8 w-8 rounded-full" />
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1">
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <div key={i} className="h-4 flex items-center justify-center">
              <Pulse className="h-3 w-4" />
            </div>
          ))}
        </div>

        {/* Calendar grid — 7 × 5 */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Pulse key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
