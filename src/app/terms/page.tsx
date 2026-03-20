import Link from 'next/link'
import type { Metadata } from 'next'
import { BRAND } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Terms of Service — PostPika',
  description: 'Terms and conditions for using the PostPika platform.',
}

const sections = [
  { id: 'service-description', label: '1. Service Description' },
  { id: 'eligibility',         label: '2. Eligibility' },
  { id: 'acceptable-use',      label: '3. Acceptable Use' },
  { id: 'ai-content',          label: '4. AI-Generated Content' },
  { id: 'subscriptions',       label: '5. Subscriptions & Billing' },
  { id: 'ip',                  label: '6. Intellectual Property' },
  { id: 'liability',           label: '7. Limitation of Liability' },
  { id: 'governing-law',       label: '8. Governing Law' },
  { id: 'changes',             label: '9. Changes to These Terms' },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="px-8 py-5 border-b border-gray-100">
        <Link href="/" className="text-[#1D9E75] text-2xl font-bold">
          {BRAND.name}
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <h1 className="text-4xl font-bold text-[#0A2540] mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-2">Last updated: March 2026</p>
        <p className="text-gray-500 text-sm mb-10">
          Operated by <span className="font-medium text-gray-700">Eduloom Technologies OPC PVT LTD</span>, Bangalore, India
        </p>

        <p className="text-gray-600 leading-relaxed mb-10">
          Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using PostPika at{' '}
          <span className="font-medium">postpika.com</span>. By creating an account or using our
          service, you agree to be bound by these Terms. If you do not agree, do not use the service.
          These Terms constitute a legally binding agreement between you and{' '}
          <span className="font-medium">Eduloom Technologies OPC PVT LTD</span>.
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
          <section id="service-description">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">1. Service Description</h2>
            <p className="mb-4">
              PostPika is an AI-powered Software-as-a-Service (SaaS) platform that helps professionals
              generate LinkedIn content. The service uses large language models to draft posts based
              on context, tone preferences, and professional details you provide.
            </p>
            <p>
              PostPika is operated by <span className="font-medium">Eduloom Technologies OPC PVT LTD</span>,
              a company incorporated under the laws of India. The service is accessed through the
              website at <span className="font-medium">postpika.com</span>.
            </p>
          </section>

          {/* 2 */}
          <section id="eligibility">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">2. Eligibility</h2>
            <p className="mb-4">To use PostPika, you must:</p>
            <ul className="space-y-3 list-none pl-0">
              {[
                'Be at least 18 years of age.',
                'Provide accurate, truthful, and complete information when creating your account.',
                'Maintain only one account per person — multiple accounts for the same individual are not permitted.',
                'Have the legal capacity to enter into a binding agreement under the laws of India.',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-xs flex items-center justify-center font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              We reserve the right to suspend or terminate accounts that are found to be in violation
              of the eligibility requirements above.
            </p>
          </section>

          {/* 3 */}
          <section id="acceptable-use">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">3. Acceptable Use</h2>
            <p className="mb-4">
              You agree to use PostPika only for lawful purposes and in a manner consistent with
              LinkedIn&rsquo;s own Terms of Service. The following uses are strictly prohibited:
            </p>
            <ul className="space-y-3 list-none pl-0">
              {[
                ['No spam', 'Do not use PostPika to generate unsolicited bulk messages, connection request spam, or any content designed to deceive recipients.'],
                ['No hate speech', 'Do not generate content that promotes discrimination, hatred, or violence against individuals or groups based on race, religion, gender, caste, sexual orientation, disability, or other protected characteristics.'],
                ['No impersonation', 'Do not generate content that falsely represents you as another person, brand, or organisation, or that is designed to mislead others about your identity.'],
                ['No illegal content', 'Do not generate content that violates any applicable law, including but not limited to defamation, fraud, copyright infringement, or content that violates the Information Technology Act, 2000 (India).'],
                ['No circumvention', 'Do not attempt to reverse-engineer, scrape, or abuse the PostPika platform or its AI backend to extract model weights, prompts, or any proprietary system information.'],
              ].map(([rule, desc]) => (
                <li key={rule as string} className="flex gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-red-50 text-red-400 text-xs flex items-center justify-center font-bold">✕</span>
                  <span><span className="font-semibold text-[#0A2540]">{rule}:</span> {desc as string}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Violation of these policies may result in immediate suspension or permanent termination
              of your account without refund.
            </p>
          </section>

          {/* 4 */}
          <section id="ai-content">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">4. AI-Generated Content</h2>

            <h3 className="font-semibold text-[#0A2540] mb-2">Ownership</h3>
            <p className="mb-4">
              You own the content you generate using PostPika. We do not claim any intellectual
              property rights over posts, drafts, or other outputs created through the platform.
              You are free to publish, edit, or delete generated content as you see fit.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">No Guarantees on Quality or Performance</h3>
            <p className="mb-4">
              AI-generated content is provided as a starting point and drafting aid.{' '}
              <span className="font-medium">PostPika makes no guarantee</span> regarding the quality,
              accuracy, originality, or LinkedIn performance of any generated content. You are solely
              responsible for reviewing, editing, and approving any content before publishing it on
              your LinkedIn profile or elsewhere.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">Your Responsibility</h3>
            <p>
              By publishing AI-generated content, you confirm that you have reviewed it and that it
              accurately represents your views and complies with LinkedIn&rsquo;s platform policies
              and all applicable laws. PostPika is not liable for any consequences arising from
              content you publish.
            </p>
          </section>

          {/* 5 */}
          <section id="subscriptions">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">5. Subscriptions &amp; Billing</h2>

            <h3 className="font-semibold text-[#0A2540] mb-2">Billing Cycle</h3>
            <p className="mb-4">
              Paid plans are billed on a <span className="font-medium">monthly auto-renewing basis</span>.
              Your subscription renews automatically on the same date each month unless cancelled
              before the renewal date. All prices are in Indian Rupees (INR) and inclusive of
              applicable taxes. Payments are processed by Razorpay.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">Refund Policy</h3>
            <p className="mb-4">
              We offer a <span className="font-medium">7-day full refund on your first charge only</span>.
              To request a refund within 7 days of your initial payment, email us at{' '}
              <a href="mailto:hello@postpika.com" className="text-[#1D9E75] hover:underline">
                hello@postpika.com
              </a>{' '}
              with your registered email and payment reference. Refunds will be credited to the
              original payment method within 5–7 business days.
            </p>
            <p className="mb-4">
              Subsequent charges are non-refundable. We do not offer prorated refunds for unused
              portions of a billing period.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">Cancellation</h3>
            <p>
              You may cancel your subscription at any time from the Settings page in your account.
              Cancellation takes effect at the end of the current billing period — you will retain
              access to your paid plan until that date.
            </p>
          </section>

          {/* 6 */}
          <section id="ip">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">6. Intellectual Property</h2>

            <h3 className="font-semibold text-[#0A2540] mb-2">PostPika Platform</h3>
            <p className="mb-4">
              The PostPika platform — including the website, application, design, brand name,
              logo, underlying prompts, and technology — is owned by{' '}
              <span className="font-medium">Eduloom Technologies OPC PVT LTD</span> and protected
              by applicable intellectual property laws. You may not copy, reproduce, distribute,
              or create derivative works from any part of the PostPika platform without our
              explicit written permission.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">User-Generated Content</h3>
            <p>
              Content you create or generate using PostPika remains your intellectual property.
              By using the service, you grant PostPika a limited, non-exclusive, royalty-free
              licence to store and display your content solely for the purpose of operating the
              service (e.g., showing your drafts in your dashboard). This licence does not permit
              us to use your content for marketing or training AI models.
            </p>
          </section>

          {/* 7 */}
          <section id="liability">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">7. Limitation of Liability</h2>

            <h3 className="font-semibold text-[#0A2540] mb-2">Service Provided As-Is</h3>
            <p className="mb-4">
              PostPika is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any
              kind, either express or implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, or non-infringement. We do not
              warrant that the service will be uninterrupted, error-free, or that AI outputs will
              meet your specific expectations.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">Liability Cap</h3>
            <p className="mb-4">
              To the fullest extent permitted by applicable law, the total cumulative liability of
              Eduloom Technologies OPC PVT LTD arising from or relating to these Terms or the
              PostPika service shall not exceed the{' '}
              <span className="font-medium">total fees paid by you in the three (3) months
              immediately preceding the event giving rise to the claim</span>.
            </p>

            <h3 className="font-semibold text-[#0A2540] mb-2">Exclusions</h3>
            <p>
              We are not liable for any indirect, incidental, special, consequential, or punitive
              damages, including loss of profits, data, goodwill, or business opportunities,
              whether based on warranty, contract, tort, or any other legal theory, even if advised
              of the possibility of such damages.
            </p>
          </section>

          {/* 8 */}
          <section id="governing-law">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">8. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the{' '}
              <span className="font-medium">laws of India</span>. Any dispute, claim, or controversy
              arising out of or in connection with these Terms or the use of the PostPika service
              shall be subject to the exclusive jurisdiction of the competent courts located in{' '}
              <span className="font-medium">Bangalore, Karnataka, India</span>. By using PostPika,
              you irrevocably consent to personal jurisdiction in these courts.
            </p>
          </section>

          {/* 9 */}
          <section id="changes">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">9. Changes to These Terms</h2>
            <p className="mb-4">
              We may update these Terms from time to time to reflect changes in our service,
              applicable law, or business practices. For <span className="font-medium">material
              changes</span> — those that meaningfully affect your rights or obligations — we will
              provide at least <span className="font-medium">30 days&rsquo; advance notice via email</span> to
              the address registered on your account.
            </p>
            <p className="mb-4">
              Non-material changes (such as clarifications, typographical corrections, or minor
              administrative updates) may be made without prior notice and will take effect upon
              posting to this page, with the &ldquo;Last updated&rdquo; date revised accordingly.
            </p>
            <p>
              Your continued use of PostPika after the effective date of any updated Terms
              constitutes your acceptance of the revised Terms. If you do not agree to the updated
              Terms, you should cancel your account before the changes take effect.
            </p>
          </section>

          {/* Contact */}
          <section>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-1 text-sm">
              <p className="font-semibold text-[#0A2540]">Questions about these Terms?</p>
              <p className="text-gray-500">Eduloom Technologies OPC PVT LTD</p>
              <p className="text-gray-500">Bangalore, Karnataka, India</p>
              <p>
                <a href="mailto:hello@postpika.com" className="text-[#1D9E75] hover:underline font-medium">
                  hello@postpika.com
                </a>
              </p>
            </div>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-wrap gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-[#1D9E75]">Privacy Policy</Link>
          <Link href="/" className="hover:text-[#1D9E75]">Back to PostPika</Link>
        </div>
      </main>
    </div>
  )
}
