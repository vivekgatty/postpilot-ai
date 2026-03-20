// Two-column skeleton: left form panel + right post cards
function Pulse({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className ?? ''}`} />
}

function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E4E0] p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Pulse className="h-5 w-24 rounded-full" />
        <Pulse className="h-4 w-16" />
      </div>
      <div className="space-y-2">
        <Pulse className="h-3.5 w-full" />
        <Pulse className="h-3.5 w-[92%]" />
        <Pulse className="h-3.5 w-[96%]" />
        <Pulse className="h-3.5 w-[85%]" />
        <Pulse className="h-3.5 w-[78%]" />
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Pulse className="h-7 w-16 rounded-lg" />
        <Pulse className="h-7 w-24 rounded-lg" />
        <Pulse className="h-7 w-20 rounded-lg ml-auto" />
      </div>
    </div>
  )
}

export default function GenerateLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-20">

      {/* Left panel skeleton */}
      <div className="w-full lg:w-[380px] lg:flex-shrink-0 space-y-5">
        <div className="space-y-2">
          <Pulse className="h-7 w-56" />
          <Pulse className="h-4 w-44" />
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <Pulse className="h-4 w-48" />
          <Pulse className="h-28 w-full rounded-xl" />
          <Pulse className="h-3 w-36" />
        </div>

        {/* Tone selector */}
        <div className="space-y-2">
          <Pulse className="h-4 w-12" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Pulse key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Niche */}
        <div className="space-y-2">
          <Pulse className="h-4 w-12" />
          <Pulse className="h-10 w-full rounded-xl" />
        </div>

        {/* Button */}
        <Pulse className="h-12 w-full rounded-xl" />
      </div>

      {/* Right panel — 3 post card skeletons */}
      <div className="flex-1 min-w-0 space-y-4">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  )
}
