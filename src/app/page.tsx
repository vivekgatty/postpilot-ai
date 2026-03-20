'use client'

import { useState } from 'react'
import Link        from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar      from '@/components/layout/Navbar'
import PricingTable from '@/components/features/PricingTable'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero mockup  (styled divs mirroring the real generate screen UI)
// ─────────────────────────────────────────────────────────────────────────────

function HeroMockup() {
  return (
    <div className="relative mx-auto max-w-xl">
      {/* Glow */}
      <div className="absolute -inset-6 bg-gradient-to-br from-[#1D9E75]/20 to-transparent
                      rounded-3xl blur-2xl pointer-events-none" />

      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* Window bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-3 text-xs text-gray-400 font-mono">postpika.com/generate</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Topic input */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Your topic
            </p>
            <div className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0A2540] bg-white">
              Why I turned down a ₹50L job offer to build my startup
              <span className="inline-block w-0.5 h-4 bg-[#1D9E75] ml-0.5 animate-pulse align-middle" />
            </div>
            <p className="text-right text-xs text-[#1D9E75] mt-1 font-medium">18 words · ready</p>
          </div>

          {/* Tone chips */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Tone
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Storytelling', active: true,  color: 'bg-[#E1F5EE] border-[#1D9E75] text-[#1D9E75]'   },
                { label: 'Professional', active: false, color: 'bg-white border-gray-200 text-gray-500'          },
                { label: 'Inspirational', active: false, color: 'bg-white border-gray-200 text-gray-500'         },
              ].map(t => (
                <span
                  key={t.label}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${t.color}`}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <div className="w-full py-2.5 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold
                          text-center cursor-default select-none">
            ✦ Generate 3 variations
          </div>

          {/* Post preview card */}
          <div className="border border-[#1D9E75]/30 rounded-xl p-4 bg-[#F9FFFE]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#7F77DD] bg-purple-50 px-2 py-0.5 rounded-full">
                Variation 1
              </span>
              <span className="text-xs text-gray-400">847 chars</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
              6 months ago, I was handed an offer letter. ₹50 lakhs per annum.
              Director title. Stock options. My parents were ecstatic. I said no.
              Here&apos;s the real reason — and what happened next... 🧵
            </p>
            <div className="flex gap-2 mt-3">
              <span className="flex-1 py-1.5 bg-[#1D9E75] text-white text-xs font-semibold rounded-lg text-center">
                Save draft
              </span>
              <span className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs font-semibold rounded-lg">
                Copy
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ Accordion
// ─────────────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Is there really a free plan?',
    a: 'Yes — 5 AI post generations per month, forever free. No credit card required to sign up.',
  },
  {
    q: 'Do I get GST invoices?',
    a: 'Absolutely. Every Razorpay payment automatically generates a GST-compliant invoice sent to your email.',
  },
  {
    q: 'What happens when I hit my generation limit?',
    a: "You can upgrade to a paid plan at any time to continue generating. Alternatively, your limit resets on the 1st of every month — free.",
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes, one click from Settings. No lock-in periods. You keep full access until the end of your current billing period.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'All major UPI apps (GPay, PhonePe, Paytm), debit/credit cards, and net banking — all via Razorpay.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 group"
      >
        <span className="text-sm font-semibold text-[#0A2540] group-hover:text-[#1D9E75] transition-colors">
          {q}
        </span>
        <span className={`text-[#1D9E75] text-xl font-light flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-500 leading-relaxed">
          {a}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-5 bg-gradient-to-b from-[#F0FDF9]/60 to-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div>
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 bg-[#E1F5EE] text-[#1D9E75] text-xs font-bold
                            px-3.5 py-1.5 rounded-full mb-6">
              🇮🇳 Built for Indian LinkedIn creators
            </div>

            <h1 className="text-5xl lg:text-[56px] font-bold text-[#0A2540] leading-[1.12] mb-5
                           tracking-tight">
              Write viral LinkedIn posts{' '}
              <span className="text-[#1D9E75]">in 30 seconds</span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              PostPika generates 3 ready-to-publish LinkedIn post variations for Indian founders,
              consultants, and professionals. Your personal brand, on autopilot.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#178a63]
                           text-white font-semibold text-base px-6 py-3.5 rounded-xl transition-all
                           active:scale-[0.98] shadow-lg shadow-[#1D9E75]/25"
              >
                Start free — no card needed →
              </Link>
              <button
                onClick={() => scrollTo('how-it-works')}
                className="inline-flex items-center justify-center gap-2 border border-gray-200
                           text-gray-600 hover:text-[#0A2540] hover:border-gray-300 font-semibold
                           text-base px-6 py-3.5 rounded-xl transition-all"
              >
                See how it works ↓
              </button>
            </div>

            {/* Social proof micro */}
            <div className="flex items-center gap-3 mt-7">
              <div className="flex -space-x-2">
                {['#1D9E75','#0A2540','#7F77DD','#EF9F27'].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white"
                       style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-[#0A2540]">1,000+</span> Indian professionals posting consistently
              </p>
            </div>
          </div>

          {/* Right mockup */}
          <div className="lg:block">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ─────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 py-7 bg-gray-50/60">
        <div className="max-w-6xl mx-auto px-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-center mb-5">
            Trusted by professionals from India&apos;s fastest-growing companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {['Razorpay','CRED','Zepto','Meesho','Groww','PhonePe','Swiggy','Zomato'].map(name => (
              <span key={name} className="text-sm font-bold text-gray-300 hover:text-gray-400
                                          transition-colors cursor-default tracking-wide">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-3">
              How it works
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0A2540]">
              From idea to post in under a minute
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line desktop */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)]
                            h-px bg-gradient-to-r from-[#1D9E75]/30 via-[#1D9E75] to-[#1D9E75]/30" />

            {[
              {
                step: '01',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                ),
                title: 'Type your idea',
                desc: 'Describe your topic, story or opinion in a sentence or two.',
              },
              {
                step: '02',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
                    <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
                    <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
                    <line x1="17" y1="16" x2="23" y2="16"/>
                  </svg>
                ),
                title: 'Pick your tone',
                desc: 'Choose from 5 expert-trained AI voices — professional, story, controversial, educational or inspiring.',
              },
              {
                step: '03',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 3l1.09 3.26L16.5 7l-2.52 2.02.79 3.25L12 10.5l-2.77 1.77.79-3.25L7.5 7l3.41-.74z"/>
                    <path d="M5 17l.73 2.18L8 20l-1.68 1.35.53 2.17L5 22.33l-1.85 1.19.53-2.17L2 20l2.27-.82z"/>
                    <path d="M19 17l.73 2.18L22 20l-1.68 1.35.53 2.17L19 22.33l-1.85 1.19.53-2.17L16 20l2.27-.82z"/>
                  </svg>
                ),
                title: 'Get 3 variations',
                desc: 'Copy, save as draft or schedule straight to your content calendar.',
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-[#E1F5EE] flex items-center justify-center
                                text-[#1D9E75] mb-5 relative">
                  {item.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#1D9E75]
                                   text-white text-[10px] font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0A2540] mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-5 bg-[#F9FFFE]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-3">Features</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0A2540]">
              Everything you need to post consistently
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '✦',
                title: 'AI post generator',
                desc: 'Turn a rough idea into a polished, scroll-stopping LinkedIn post in seconds.',
              },
              {
                icon: '🎭',
                title: '5 tone styles',
                desc: 'Professional, storytelling, controversial, educational, and inspirational — each tuned for Indian context.',
              },
              {
                icon: '🗓',
                title: 'Content calendar',
                desc: 'Schedule posts visually and never miss the best time to publish.',
              },
              {
                icon: '💡',
                title: 'Idea Lab',
                desc: '7 fresh, niche-specific LinkedIn post ideas generated for you every week.',
              },
              {
                icon: '₹',
                title: 'INR pricing',
                desc: 'No USD confusion, no conversion fees. Pay in rupees via UPI, cards or net banking.',
              },
              {
                icon: '🧾',
                title: 'GST auto-invoices',
                desc: 'Every payment auto-generates a GST-compliant invoice — sent to your inbox immediately.',
              },
            ].map(f => (
              <div key={f.title}
                   className="bg-white rounded-2xl border border-gray-100 p-6
                              hover:border-[#1D9E75]/30 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#E1F5EE] flex items-center justify-center
                                text-[#1D9E75] text-lg font-bold mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#0A2540] mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-3">Pricing</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0A2540] mb-3">
              Simple, honest pricing
            </h2>
            <p className="text-gray-500">Start free. Upgrade when ready.</p>
          </div>

          <PricingTable
            currentPlan="free"
            onUpgrade={(planId) => router.push(`/signup?plan=${planId}`)}
            loading={false}
          />

          <p className="text-center text-xs text-gray-400 mt-6">
            All prices in INR · GST invoices auto-generated · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-[#0A2540]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl font-bold text-white">
              Real results from real creators
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'Went from 300 to 12,000 LinkedIn followers in 4 months. PostPika is the only tool I open every morning.',
                name: 'Arjun Mehta',
                role: 'Founder @TechStartup',
                city: 'Pune',
                initial: 'A',
                color: '#1D9E75',
              },
              {
                quote: 'I used to spend Sunday nights writing posts. Now I\'m done in 20 minutes on Monday morning.',
                name: 'Priya Sharma',
                role: 'Strategy Consultant',
                city: 'Mumbai',
                initial: 'P',
                color: '#7F77DD',
              },
              {
                quote: 'My LinkedIn inbound pipeline has 3x\'d since I started posting consistently with PostPika.',
                name: 'Rahul Nair',
                role: 'VP Sales',
                city: 'Bangalore',
                initial: 'R',
                color: '#EF9F27',
              },
            ].map(t => (
              <div key={t.name}
                   className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>

                <p className="text-white/90 text-sm leading-relaxed mb-5 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center
                                  text-white text-sm font-bold flex-shrink-0"
                       style={{ backgroundColor: t.color }}>
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/50">{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-[#0A2540]">Questions? We&apos;ve got answers.</h2>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 px-6 divide-y divide-gray-100">
            {FAQ_ITEMS.map(item => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-[#0A2540] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#1D9E75]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#1D9E75]/10 blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-4">
            Join 1,000+ Indian professionals
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-5">
            Start building your LinkedIn presence today
          </h2>
          <p className="text-white/60 mb-8">
            5 free generations every month. No credit card. Cancel anytime.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#1D9E75] hover:bg-[#178a63]
                       text-white font-bold text-base px-8 py-4 rounded-xl transition-all
                       active:scale-[0.98] shadow-xl shadow-[#1D9E75]/30"
          >
            Start free →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center
                        justify-between gap-5">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#1D9E75"/>
              <path d="M8 20V10l6 4 6-4v10" stroke="white" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="14" cy="9" r="2" fill="white"/>
            </svg>
            <span className="text-sm font-bold text-[#0A2540]">PostPika</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-[#0A2540] transition-colors">Privacy</Link>
            <Link href="/terms"   className="hover:text-[#0A2540] transition-colors">Terms</Link>
            <a href="mailto:hello@postpika.com"
               className="hover:text-[#0A2540] transition-colors">
              hello@postpika.com
            </a>
          </div>

          {/* Made in India */}
          <p className="text-sm text-gray-400">
            Made with love in India 🇮🇳
          </p>
        </div>
      </footer>
    </div>
  )
}
