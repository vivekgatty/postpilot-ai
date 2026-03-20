// Dashboard shell skeleton — sidebar + content area
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F8F8F6]">

      {/* Sidebar skeleton */}
      <div className="fixed inset-y-0 left-0 w-60 bg-[#0A2540] flex flex-col px-4 py-5">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
          <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1.5">
          {[80, 70, 75, 65, 60, 72].map((w, i) => (
            <div
              key={i}
              className="h-9 rounded-lg bg-white/5 animate-pulse"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        {/* Bottom user area */}
        <div className="mt-auto flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-white/10 rounded animate-pulse" />
            <div className="h-2.5 w-3/4 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="pl-60 flex flex-col min-h-screen">

        {/* Topbar skeleton */}
        <header className="h-14 bg-white border-b border-[#E5E4E0] flex items-center justify-between px-6">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-6 w-32 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </header>

        {/* Content skeleton */}
        <main className="flex-1 p-6 space-y-5">
          {/* Page heading */}
          <div className="h-7 w-44 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />

          {/* Stat cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E5E4E0] p-5 space-y-3">
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Content block */}
          <div className="bg-white rounded-2xl border border-[#E5E4E0] p-6 space-y-3">
            {[100, 90, 95, 80, 70].map((w, i) => (
              <div
                key={i}
                className="h-3.5 bg-gray-200 rounded animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
