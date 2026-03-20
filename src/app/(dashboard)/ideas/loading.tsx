function Pulse({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className ?? ''}`} />
}

function IdeaCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E4E0] p-5 flex flex-col gap-3">
      {/* Day badge */}
      <Pulse className="h-6 w-20 rounded-full" />
      {/* Title */}
      <div className="space-y-1.5">
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-4/5" />
      </div>
      {/* Hook lines */}
      <div className="space-y-1">
        <Pulse className="h-3 w-16" />
        <Pulse className="h-3 w-full" />
        <Pulse className="h-3 w-3/4" />
      </div>
      {/* Why it works */}
      <Pulse className="h-3 w-full" />
      <Pulse className="h-3 w-2/3" />
      {/* CTA */}
      <Pulse className="h-4 w-28 mt-auto" />
    </div>
  )
}

export default function IdeasLoading() {
  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <Pulse className="h-7 w-28" />
        <Pulse className="h-4 w-56" />
      </div>

      {/* Controls card */}
      <div className="bg-white rounded-2xl border border-[#E5E4E0] p-5 space-y-4">
        <Pulse className="h-3 w-20" />
        <Pulse className="h-12 w-full rounded-xl" />
        <Pulse className="h-12 w-full rounded-xl" />
      </div>

      {/* 7 idea card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <IdeaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
