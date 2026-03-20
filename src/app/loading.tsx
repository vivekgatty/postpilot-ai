export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center">
      <svg
        className="animate-spin"
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Loading"
        role="status"
      >
        <circle
          cx="20" cy="20" r="16"
          stroke="#E5E4E0"
          strokeWidth="4"
        />
        <path
          d="M20 4 A16 16 0 0 1 36 20"
          stroke="#1D9E75"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
