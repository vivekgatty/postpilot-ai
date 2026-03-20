import Link from 'next/link'
import { BRAND } from '@/lib/constants'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="px-8 py-5 border-b border-gray-100">
        <Link href="/" className="text-[#1D9E75] text-2xl font-bold">{BRAND.name}</Link>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#0A2540] mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 2025</p>
        <p className="text-gray-600 mb-6">
          By using {BRAND.name}, you agree to these terms. Please read them carefully.
        </p>
        <h2 className="text-xl font-semibold text-[#0A2540] mt-8 mb-3">Use of Service</h2>
        <p className="text-gray-600">
          {BRAND.name} provides AI-powered LinkedIn content generation tools.
          You are responsible for the content you publish. Do not use the service
          to generate spam, misinformation, or content that violates LinkedIn&apos;s terms.
        </p>
        <h2 className="text-xl font-semibold text-[#0A2540] mt-8 mb-3">Subscriptions</h2>
        <p className="text-gray-600">
          Paid plans are billed in INR via Razorpay. You can cancel anytime from Settings.
          Refunds are subject to our refund policy.
        </p>
        <h2 className="text-xl font-semibold text-[#0A2540] mt-8 mb-3">Contact</h2>
        <p className="text-gray-600">
          For questions, contact hello@postpika.com
        </p>
      </main>
    </div>
  )
}
