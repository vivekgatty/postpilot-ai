export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[540px] animate-pulse">
        {/* Logo placeholder */}
        <div className="flex justify-center mb-8">
          <div className="h-8 w-32 bg-gray-200 rounded" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-9">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-2 rounded-full ${i === 0 ? 'w-8 bg-gray-300' : 'w-2 bg-gray-100'}`} />
            ))}
          </div>

          {/* Title + subtitle */}
          <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded mx-auto mb-8" />

          {/* Fields */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="mb-4">
              <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          ))}

          {/* Button */}
          <div className="h-11 bg-gray-200 rounded-xl mt-6" />
        </div>
      </div>
    </div>
  )
}
