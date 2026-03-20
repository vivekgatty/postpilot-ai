import Link from 'next/link'
import { BRAND, PRICING_PLANS } from '@/lib/constants'
import { formatINR } from '@/lib/utils'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-poppins">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-[#1D9E75] text-2xl font-bold">{BRAND.name}</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-[#1D9E75] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#178a64] transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          🇮🇳 Built for Indian professionals
        </div>
        <h1 className="text-5xl font-extrabold text-[#0A2540] leading-tight mb-6">
          LinkedIn content that sounds{' '}
          <span className="text-[#1D9E75]">authentically you</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          PostPika uses AI to generate compelling LinkedIn posts in English, Hindi, and Hinglish —
          tailored for the Indian professional audience.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-[#1D9E75] text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-[#178a64] transition-colors shadow-lg shadow-[#1D9E75]/20"
        >
          Start for free — no credit card needed
        </Link>
      </section>

      {/* Pricing preview */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#0A2540] text-center mb-2">Simple INR pricing</h2>
        <p className="text-gray-500 text-center mb-10">No USD confusion. Pay in rupees.</p>
        <div className="grid grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 ${plan.highlighted ? 'border-[#1D9E75] ring-2 ring-[#1D9E75]' : 'border-gray-100'}`}
            >
              <h3 className="font-bold text-[#0A2540] mb-1">{plan.name}</h3>
              <div className="text-2xl font-extrabold text-[#0A2540] mb-4">
                {plan.price_monthly === 0 ? 'Free' : `${formatINR(plan.price_monthly)}/mo`}
              </div>
              <Link
                href="/signup"
                className={`block text-center text-sm font-medium py-2 rounded-lg transition-colors ${
                  plan.highlighted
                    ? 'bg-[#1D9E75] text-white hover:bg-[#178a64]'
                    : 'border border-gray-200 text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75]'
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-6 mb-3">
          <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-600">Terms</Link>
        </div>
        © {new Date().getFullYear()} {BRAND.name}. Made with ❤️ in India.
      </footer>
    </div>
  )
}
