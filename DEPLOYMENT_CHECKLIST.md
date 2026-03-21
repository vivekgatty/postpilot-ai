# PostPika Deployment Checklist

Complete every item below before and after going live at https://postpika.com.

---

## 1 · Vercel — Environment Variables

Confirm all variables are set for the **Production** environment (not just Preview).

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase project Settings → API (secret, never expose) |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `RAZORPAY_KEY_ID` | From Razorpay Dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | From Razorpay Dashboard → API Keys (secret) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same value as `RAZORPAY_KEY_ID` — safe to expose |
| `RAZORPAY_WEBHOOK_SECRET` | Set when creating the webhook in Razorpay |
| `RAZORPAY_PLAN_STARTER` | Plan ID from Razorpay Dashboard → Subscriptions → Plans |
| `RAZORPAY_PLAN_PRO` | Plan ID from Razorpay Dashboard → Subscriptions → Plans |
| `RAZORPAY_PLAN_AGENCY` | Plan ID from Razorpay Dashboard → Subscriptions → Plans |
| `RESEND_API_KEY` | From resend.com → API Keys |
| `FROM_EMAIL` | e.g. `PostPika <hello@postpika.com>` — domain must be verified in Resend |
| `NEXT_PUBLIC_APP_URL` | `https://postpika.com` (no trailing slash) |
| `CRON_SECRET` | Any random 32-character string — used to authenticate the Vercel cron job at `/api/cron/audit-reminders`. Generate one at: `openssl rand -hex 16` |

> **Tip:** In Vercel → Project → Settings → Environment Variables, set each variable's scope to **Production** (and optionally Preview). Do not set `SUPABASE_SERVICE_ROLE_KEY` in Preview/Development scopes.

---

## 2 · Supabase — Auth URL Configuration

**Supabase Dashboard → Authentication → URL Configuration**

| Field | Value |
|---|---|
| Site URL | `https://postpika.com` |
| Redirect URLs (add) | `https://postpika.com/api/auth/callback` |

Also add `http://localhost:3000/api/auth/callback` if you haven't already, so local dev continues to work.

---

## 3 · Supabase — Storage Bucket

**Supabase Dashboard → Storage**

- Create a bucket named `avatars` (public read access).
- Set bucket policy to allow authenticated users to upload to their own folder (`{user_id}/avatar.*`).

Example RLS policy for insert:
```sql
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 4 · Razorpay — Webhook

**Razorpay Dashboard → Webhooks → Add New Webhook**

| Field | Value |
|---|---|
| Webhook URL | `https://postpika.com/api/billing/webhook` |
| Secret | The value you set as `RAZORPAY_WEBHOOK_SECRET` |
| Active events | ✅ `subscription.activated` |
| | ✅ `subscription.charged` |
| | ✅ `subscription.cancelled` |
| | ✅ `subscription.expired` |
| | ✅ `subscription.paused` |
| | ✅ `payment.failed` |

> After saving, copy the auto-generated secret into `RAZORPAY_WEBHOOK_SECRET` on Vercel if you haven't yet.

---

## 5 · Razorpay — Subscription Plans

**Razorpay Dashboard → Subscriptions → Plans**

Create three plans and copy their Plan IDs into Vercel env vars:

| Plan | Interval | Env var |
|---|---|---|
| Starter | Monthly | `RAZORPAY_PLAN_STARTER` |
| Pro | Monthly | `RAZORPAY_PLAN_PRO` |
| Agency | Monthly | `RAZORPAY_PLAN_AGENCY` |

---

## 6 · Google Cloud Console — OAuth Redirect URI

**Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client**

Add to **Authorised redirect URIs**:
```
https://postpika.com/api/auth/callback
```

Keep `http://localhost:3000/api/auth/callback` for local development.

---

## 7 · LinkedIn Developer — OAuth Redirect URL

**LinkedIn Developer Portal → Your App → Auth → OAuth 2.0 Settings**

Add to **Authorized redirect URLs**:
```
https://postpika.com/api/auth/callback
https://postpika.com/api/linkedin/callback
http://localhost:3000/api/linkedin/callback
```

---

## 11 · Content Planner — LinkedIn Direct Posting

### New Environment Variables (add to Vercel → Production)

| Variable | Notes |
|---|---|
| `LINKEDIN_CLIENT_ID` | From LinkedIn Developer App → Auth tab |
| `LINKEDIN_CLIENT_SECRET` | From LinkedIn Developer App → Auth tab (keep secret, never expose) |
| `LINKEDIN_REDIRECT_URI` | Must be set to: `https://postpika.com/api/linkedin/callback` |

> `CRON_SECRET` already exists from the audit feature. The same secret is now used for both cron jobs (`/api/cron/audit-reminders` and `/api/cron/linkedin-publisher`).

### Local Development

Add to `.env.local`:
```
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback
```

### LinkedIn Developer App Setup

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) → Your App → Auth
2. Add both redirect URLs:
   ```
   http://localhost:3000/api/linkedin/callback
   https://postpika.com/api/linkedin/callback
   ```
3. Ensure the following OAuth 2.0 scopes are enabled under **Products**:
   - `Sign In with LinkedIn using OpenID Connect` → grants `openid`, `profile`, `email`
   - `Share on LinkedIn` → grants `w_member_social`

### New Supabase Tables (run SQL before deploying)

The following 6 tables must exist before the planner feature works:
- `content_pillars` — user content pillar definitions
- `planner_settings` — per-user planner configuration
- `planned_posts` — AI-generated and manually created planned posts
- `content_bank` — saved ideas and hooks
- `linkedin_connections` — OAuth tokens for direct LinkedIn posting
- `linkedin_publish_queue` — scheduled posts queue for the cron job

These were provided and run separately in the Supabase SQL Editor.

### Cron Job

A new Vercel cron job runs every 5 minutes at `/api/cron/linkedin-publisher`. It processes the `linkedin_publish_queue` table. The CRON_SECRET header is required (same as audit reminders).

---

## 8 · Resend — Domain Verification

**resend.com → Domains**

- Verify `postpika.com` by adding the DNS records Resend provides.
- Set `FROM_EMAIL=PostPika <hello@postpika.com>` on Vercel once verified.
- Without verification, emails will fail or land in spam.

---

## 9 · Supabase — Brand Audit Tables (run before deploying)

Run the following SQL in the Supabase SQL Editor to create the brand audit tables:

```sql
-- brand_audits table
CREATE TABLE brand_audits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  linkedin_url        TEXT NOT NULL,
  linkedin_username   TEXT NOT NULL,
  full_name           TEXT,
  profile_photo_url   TEXT,
  email               TEXT,
  answers             JSONB NOT NULL DEFAULT '{}',
  sample_post_content TEXT,
  sample_post_url     TEXT,
  total_score         INTEGER NOT NULL DEFAULT 0,
  tier_key            TEXT,
  tier_label          TEXT,
  level_name          TEXT,
  level_key           TEXT,
  scores              JSONB,
  ai_top_actions      JSONB,
  ai_content_quality  JSONB,
  share_token         TEXT NOT NULL UNIQUE,
  is_unlocked         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- audit_improvement_emails table
CREATE TABLE audit_improvement_emails (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id       UUID NOT NULL REFERENCES brand_audits(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  scheduled_for  TIMESTAMPTZ NOT NULL,
  sent           BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brand_audits_linkedin_url ON brand_audits(linkedin_url);
CREATE INDEX idx_brand_audits_share_token  ON brand_audits(share_token);
CREATE INDEX idx_brand_audits_email        ON brand_audits(email);
CREATE INDEX idx_brand_audits_user_id      ON brand_audits(user_id);
CREATE INDEX idx_audit_improvement_sent    ON audit_improvement_emails(sent, scheduled_for);

-- RLS: public read by share_token (unlocked only)
ALTER TABLE brand_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read unlocked audits by share_token"
  ON brand_audits FOR SELECT
  USING (is_unlocked = TRUE);

CREATE POLICY "Service role has full access to brand_audits"
  ON brand_audits FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

ALTER TABLE audit_improvement_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role has full access to audit_improvement_emails"
  ON audit_improvement_emails FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);
```

> **Note:** The API routes use `createClient()` (anon key with SSR). For writes in unauthenticated contexts, you may need to use the service role key. If inserts fail, switch the route to use `createServiceClient()` with `SUPABASE_SERVICE_ROLE_KEY`.

---

## 10 · Post-Deploy Smoke Tests

After deploying to production, manually verify:

- [ ] `https://postpika.com` loads the landing page
- [ ] Sign-up flow → email confirmation → onboarding redirect works
- [ ] Google OAuth → redirects to `/api/auth/callback` → dashboard
- [ ] LinkedIn OAuth → redirects to `/api/auth/callback` → dashboard
- [ ] Generate a post (tests Anthropic API key + Supabase writes)
- [ ] Save a post → appears in My Posts
- [ ] Schedule a post → appears in Calendar
- [ ] Upgrade flow → Razorpay checkout opens → subscription created
- [ ] Razorpay test webhook fires → plan upgraded in profile
- [ ] Avatar upload → image updates in sidebar
- [ ] Settings → cancel subscription → status shows cancelled
- [ ] Email delivery: welcome email arrives after subscription activated

---

## 10 · DNS & HTTPS

- [ ] `postpika.com` A/CNAME points to Vercel
- [ ] `www.postpika.com` redirects to `postpika.com` (or vice-versa — be consistent)
- [ ] SSL certificate auto-provisioned by Vercel (check Dashboard → Domains)

---

*Last updated: pre-launch audit — March 2026*
