import Link from 'next/link'
import type { Metadata } from 'next'
import { BRAND } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Privacy Policy — PostPika',
  description: 'How PostPika collects, uses, and protects your personal data.',
}

const sections = [
  { id: 'what-we-collect',   label: '1. What We Collect' },
  { id: 'how-we-use',        label: '2. How We Use Your Data' },
  { id: 'data-storage',      label: '3. Data Storage & Security' },
  { id: 'third-parties',     label: '4. Third-Party Services' },
  { id: 'retention',         label: '5. Data Retention' },
  { id: 'your-rights',       label: '6. Your Rights' },
  { id: 'cookies',           label: '7. Cookies' },
  { id: 'governing-law',     label: '8. Governing Law' },
  { id: 'contact',           label: '9. Contact Us' },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="px-8 py-5 border-b border-gray-100">
        <Link href="/" className="text-[#1D9E75] text-2xl font-bold">
          {BRAND.name}
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <h1 className="text-4xl font-bold text-[#0A2540] mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-2">Last updated: March 2026</p>
        <p className="text-gray-500 text-sm mb-10">
          Operated by <span className="font-medium text-gray-700">Eduloom Technologies OPC PVT LTD</span>, Bangalore, India
        </p>

        <p className="text-gray-600 leading-relaxed mb-10">
          {BRAND.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting
          your personal information. This Privacy Policy explains what data we collect, why we collect it,
          how it is used and stored, and what rights you have over it. By creating an account or using
          our service at <span className="font-medium">postpika.com</span>, you agree to the practices
          described in this policy.
        </p>

        {/* Table of Contents */}
        <nav className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-14">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Table of Contents
          </p>
          <ol className="space-y-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-[#1D9E75] hover:underline text-sm font-medium"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-14 text-gray-600 leading-relaxed">

          {/* 1 */}
          <section id="what-we-collect">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">1. What We Collect</h2>
            <p className="mb-4">
              We collect only the information necessary to provide the PostPika service.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">Account Data</h3>
            <p className="mb-4">
              When you sign up, we collect your <span className="font-medium">full name</span>,{' '}
              <span className="font-medium">email address</span>,{' '}
              <span className="font-medium">LinkedIn profile URL</span> (if you provide it for
              personalisation), and your <span className="font-medium">profile photo</span> (if
              imported from LinkedIn OAuth or uploaded manually).
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">Usage Data</h3>
            <p className="mb-4">
              We collect data about how you use the platform — such as posts generated, tones selected,
              drafts saved, and feature interactions. This helps us improve the product and understand
              which features are most useful.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">Payment Data</h3>
            <p>
              All payments are processed by <span className="font-medium">Razorpay</span>. We never
              see, receive, or store your card number, CVV, UPI PIN, or any other sensitive payment
              credentials. We only store your Razorpay subscription ID and the plan you are subscribed
              to, which is necessary to manage your access level.
            </p>
          </section>

          {/* 2 */}
          <section id="how-we-use">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">2. How We Use Your Data</h2>

            <h3 className="font-semibold text-[#0A2540] mb-2">Service Delivery</h3>
            <p className="mb-4">
              Your account data, niche, tone preferences, and LinkedIn URL are used to personalise
              AI-generated LinkedIn posts to your voice and professional context.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">AI Processing via Anthropic</h3>
            <p className="mb-4">
              Post generation requests are processed through the{' '}
              <span className="font-medium">Anthropic API</span> (Claude). Your prompts and context
              are transmitted to Anthropic&rsquo;s servers for inference. Per Anthropic&rsquo;s API
              usage policy, <span className="font-medium">data sent via the API is not used to
              train their models</span>. We do not send your name, email, or any identifying
              information to Anthropic — only the content context needed to generate the post.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">Billing</h3>
            <p className="mb-4">
              Your email and subscription details are shared with <span className="font-medium">Razorpay</span> to
              manage recurring billing, process payments, and issue receipts.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">Transactional Email</h3>
            <p>
              We use <span className="font-medium">Resend</span> to send you transactional emails
              such as account confirmations, billing receipts, and important service updates.
              We do not send marketing emails without your explicit opt-in.
            </p>
          </section>

          {/* 3 */}
          <section id="data-storage">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">3. Data Storage &amp; Security</h2>
            <p className="mb-4">
              Your data is stored in a <span className="font-medium">Supabase PostgreSQL</span> database
              hosted on <span className="font-medium">AWS ap-southeast-1 (Singapore)</span>. Static
              assets and the application itself are served via the <span className="font-medium">Vercel
              edge network</span>, which uses global CDN infrastructure.
            </p>
            <p className="mb-4">
              We implement industry-standard security measures including encrypted connections (TLS),
              row-level security on the database, and access controls that limit which services can
              read your data. Passwords are never stored — authentication is handled via secure
              email magic links or OAuth.
            </p>
            <p>
              <span className="font-medium">We do not sell, rent, or trade your personal data to
              any third party</span> for marketing, advertising, or any other commercial purpose.
            </p>
          </section>

          {/* 4 */}
          <section id="third-parties">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">4. Third-Party Services</h2>
            <p className="mb-4">
              PostPika relies on the following sub-processors to deliver its service. Each operates
              under its own privacy policy, and we encourage you to review them:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left font-semibold text-[#0A2540] py-3 px-4 border border-gray-200">Service</th>
                    <th className="text-left font-semibold text-[#0A2540] py-3 px-4 border border-gray-200">Provider</th>
                    <th className="text-left font-semibold text-[#0A2540] py-3 px-4 border border-gray-200">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['AI Generation', 'Anthropic', 'Processes post generation prompts'],
                    ['Payments', 'Razorpay', 'Subscription billing and payment processing'],
                    ['Email', 'Resend', 'Transactional email delivery'],
                    ['Database', 'Supabase', 'Stores account and post data'],
                    ['Hosting', 'Vercel', 'Serves the web application'],
                  ].map(([service, provider, purpose]) => (
                    <tr key={service} className="border-b border-gray-100">
                      <td className="py-3 px-4 border border-gray-200 font-medium text-[#0A2540]">{service}</td>
                      <td className="py-3 px-4 border border-gray-200">{provider}</td>
                      <td className="py-3 px-4 border border-gray-200 text-gray-500">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              We share only the minimum data required with each sub-processor and do not permit
              them to use your data for their own marketing or advertising purposes.
            </p>
          </section>

          {/* 5 */}
          <section id="retention">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">5. Data Retention</h2>
            <p className="mb-4">
              We retain your personal data for as long as your account is active. If you cancel
              your subscription, your data is retained for <span className="font-medium">90 days
              post-cancellation</span> to allow for reactivation or dispute resolution.
            </p>
            <p>
              After 90 days of account closure, all personal data — including your profile, saved
              posts, and generation history — is permanently deleted from our databases. Anonymised
              aggregate usage statistics (with no link to your identity) may be retained for
              product analytics.
            </p>
          </section>

          {/* 6 */}
          <section id="your-rights">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">6. Your Rights</h2>
            <p className="mb-4">
              You have the following rights with respect to your personal data:
            </p>
            <ul className="space-y-3 list-none pl-0">
              {[
                ['Access', 'Request a copy of the personal data we hold about you.'],
                ['Correction', 'Ask us to correct inaccurate or incomplete data.'],
                ['Deletion', 'Request that we delete your account and all associated personal data.'],
                ['Portability', 'Request your data in a machine-readable format.'],
                ['Objection', 'Object to our processing of your data in specific circumstances.'],
              ].map(([right, desc]) => (
                <li key={right} className="flex gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-xs flex items-center justify-center font-bold">✓</span>
                  <span><span className="font-semibold text-[#0A2540]">{right}:</span> {desc}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6">
              To exercise any of these rights, email us at{' '}
              <a href="mailto:hello@postpika.com" className="text-[#1D9E75] hover:underline font-medium">
                hello@postpika.com
              </a>{' '}
              with the subject line &ldquo;Data Request&rdquo;. We will respond within{' '}
              <span className="font-medium">30 days</span>.
            </p>
          </section>

          {/* 7 */}
          <section id="cookies">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">7. Cookies</h2>
            <p className="mb-4">
              PostPika uses cookies <span className="font-medium">only for authentication</span>.
              When you sign in, a secure session cookie is set to keep you logged in across page
              visits. This cookie is strictly necessary for the service to function.
            </p>
            <p>
              We do <span className="font-medium">not</span> use advertising cookies, cross-site
              tracking cookies, analytics cookies, or any cookies that build a profile of your
              browsing behaviour outside of PostPika. We do not use Google Analytics or any
              third-party tracking pixel.
            </p>
          </section>

          {/* 8 */}
          <section id="governing-law">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">8. Governing Law</h2>
            <p>
              This Privacy Policy is governed by and construed in accordance with the{' '}
              <span className="font-medium">laws of India</span>, including the Information
              Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 (as
              applicable). Any disputes arising from this policy shall be subject to the exclusive
              jurisdiction of the courts of <span className="font-medium">Bangalore, Karnataka, India</span>.
            </p>
          </section>

          {/* 9 */}
          <section id="contact">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">9. Contact Us</h2>
            <p className="mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or
              the handling of your personal data, please contact us:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-1 text-sm">
              <p className="font-semibold text-[#0A2540]">Eduloom Technologies OPC PVT LTD</p>
              <p className="text-gray-500">Bangalore, Karnataka, India</p>
              <p>
                <a href="mailto:hello@postpika.com" className="text-[#1D9E75] hover:underline font-medium">
                  hello@postpika.com
                </a>
              </p>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              We aim to respond to all privacy-related enquiries within 30 days of receipt.
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-wrap gap-6 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-[#1D9E75]">Terms of Service</Link>
          <Link href="/" className="hover:text-[#1D9E75]">Back to PostPika</Link>
        </div>
      </main>
    </div>
  )
}
