function Pulse({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className ?? ''}`} />
}

function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E4E0] p-5 space-y-3">
      {/* Badges row */}
      <div className="flex gap-2">
        <Pulse className="h-4 w-14 rounded-full" />
        <Pulse className="h-4 w-20 rounded-full" />
        <Pulse className="h-4 w-16 rounded-full" />
      </div>
      {/* Content preview */}
      <div className="space-y-2">
        <Pulse className="h-3.5 w-full" />
        <Pulse className="h-3.5 w-[88%]" />
      </div>
      {/* Meta */}
      <div className="flex gap-3">
        <Pulse className="h-3 w-16" />
        <Pulse className="h-3 w-10" />
      </div>
      {/* Actions */}
      <div className="flex gap-1.5 pt-1">
        <Pulse className="h-6 w-12 rounded-lg" />
        <Pulse className="h-6 w-12 rounded-lg" />
        <Pulse className="h-6 w-16 rounded-lg" />
        <Pulse className="h-6 w-16 rounded-lg" />
      </div>
    </div>
  )
}

export default function PostsLoading() {
  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-7 w-28" />
          <div className="flex gap-2">
            <Pulse className="h-5 w-16 rounded-full" />
            <Pulse className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <Pulse className="h-9 w-28 rounded-xl" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3">
        <Pulse className="h-10 w-64 rounded-xl" />
        <Pulse className="h-10 flex-1 rounded-xl" />
        <Pulse className="h-10 w-28 rounded-xl" />
      </div>

      {/* Post cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}
