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
```

---

## 8 · Resend — Domain Verification

**resend.com → Domains**

- Verify `postpika.com` by adding the DNS records Resend provides.
- Set `FROM_EMAIL=PostPika <hello@postpika.com>` on Vercel once verified.
- Without verification, emails will fail or land in spam.

---

## 9 · Post-Deploy Smoke Tests

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
