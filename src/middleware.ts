import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that require an authenticated session
const PROTECTED_DASHBOARD_PREFIX = '/dashboard'

// Additional dashboard-like paths nested under the (dashboard) route group
const PROTECTED_PATHS = [
  '/dashboard',
  '/generate',
  '/calendar',
  '/posts',
  '/ideas',
  '/analytics',
  '/settings',
  '/onboarding',
]

// API routes that are exempt from auth checks
const PUBLIC_API_PATHS = [
  '/api/auth/callback',
  '/api/billing/webhook',
]

// Auth pages — authenticated users should be bounced away from these
const AUTH_PAGES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  // Must be mutable so the cookie setter below can replace it
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Forward updated cookies to the request first …
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // … then recreate the response so cookies are also set there
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: always call getUser() — never getSession() — in middleware.
  // This refreshes the session token on every request (PKCe / JWT refresh).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── 1. Protect /dashboard/* paths ──────────────────────────────────────────
  const isDashboardPath = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  if (!user && isDashboardPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // ── 2. Protect /api/* (except public API routes) ────────────────────────────
  const isApiPath = pathname.startsWith('/api/')
  const isPublicApiPath = PUBLIC_API_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  if (!user && isApiPath && !isPublicApiPath) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 3. Bounce authenticated users away from /login and /signup ──────────────
  const isAuthPage = AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/generate'
    return NextResponse.redirect(url)
  }

  // Always return the (possibly cookie-refreshed) supabase response
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Run on every path EXCEPT:
     *  - _next/static  (static assets)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - public/       (files in /public folder — images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|public/).*)',
  ],
}
