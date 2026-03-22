# PostPika

AI-powered LinkedIn content platform for Indian professionals. Generate 3 scroll-stopping post variations in seconds, track your posting streak, repurpose long-form content, build carousels, and grow your personal brand on LinkedIn.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database & Auth**: Supabase (PostgreSQL + SSR auth)
- **AI**: Anthropic Claude (post generation, analysis, repurposing)
- **Payments**: Razorpay (subscriptions)
- **Email**: Resend
- **LinkedIn Integration**: OAuth 2.0 — direct post scheduling
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values. All variables are documented in `DEPLOYMENT_CHECKLIST.md`.

Required variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_WEBHOOK_SECRET
RAZORPAY_PLAN_STARTER
RAZORPAY_PLAN_PRO
RAZORPAY_PLAN_AGENCY
RESEND_API_KEY
FROM_EMAIL
NEXT_PUBLIC_APP_URL
LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET
LINKEDIN_REDIRECT_URI
CRON_SECRET
```

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

Deployed on **Vercel** with **Supabase** as the backend.

1. Push to the `main` branch — Vercel auto-deploys.
2. Set all environment variables in Vercel → Project → Settings → Environment Variables (Production scope).
3. Configure Supabase Auth redirect URLs and Razorpay webhook as described in `DEPLOYMENT_CHECKLIST.md`.
4. Cron jobs are configured in `vercel.json` and run automatically on Vercel.
