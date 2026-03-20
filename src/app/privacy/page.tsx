import Link from 'next/link'
import { BRAND } from '@/lib/constants'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="px-8 py-5 border-b border-gray-100">
        <Link href="/" className="text-[#1D9E75] text-2xl font-bold">{BRAND.name}</Link>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16 prose prose-gray">
        <h1 className="text-3xl font-bold text-[#0A2540] mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 2025</p>
        <p className="text-gray-600">
          {BRAND.name} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your personal
          information. This policy explains what data we collect, how we use it, and your rights.
        </p>
        <h2 className="text-xl font-semibold text-[#0A2540] mt-8 mb-3">Data We Collect</h2>
        <p className="text-gray-600">
          We collect your email address, name, and usage data when you create an account.
          Payment information is processed by Razorpay and we do not store card details.
        </p>
        <h2 className="text-xl font-semibold text-[#0A2540] mt-8 mb-3">How We Use Your Data</h2>
        <p className="text-gray-600">
          Your data is used to provide the PostPika service, including generating personalised
          LinkedIn content, managing your subscription, and sending transactional emails.
        </p>
        <h2 className="text-xl font-semibold text-[#0A2540] mt-8 mb-3">Contact</h2>
        <p className="text-gray-600">
          For privacy concerns, contact us at privacy@postpika.com
        </p>
      </main>
    </div>
  )
}
