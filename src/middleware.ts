import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that require an authenticated session
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
  const { pathname } = request.nextUrl

  // Build request headers that include x-pathname so server components
  // (e.g. the dashboard layout) can read the current path via headers().
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // Must be mutable so the cookie setter below can replace it.
  // Seed with our custom request headers so x-pathname persists through
  // any session-cookie refresh that recreates the response.
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Persist refreshed session cookies on the mutable request object
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Recreate the response, keeping our custom request headers so that
          // x-pathname is still available to server components after a refresh.
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: always call getUser() — never getSession() — in middleware.
  // This refreshes the JWT / PKCe token on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── 1. Protect dashboard-side routes ────────────────────────────────────────
  const isDashboardPath = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  if (!user && isDashboardPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // ── 2. Protect /api/* (except public routes) ─────────────────────────────────
  const isApiPath = pathname.startsWith('/api/')
  const isPublicApiPath = PUBLIC_API_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  if (!user && isApiPath && !isPublicApiPath) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 3. Bounce authenticated users away from /login and /signup ───────────────
  const isAuthPage = AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/generate'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|public/).*)',
  ],
}
