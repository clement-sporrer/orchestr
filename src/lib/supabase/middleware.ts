import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/settings') ||
                          request.nextUrl.pathname.startsWith('/clients') ||
                          request.nextUrl.pathname.startsWith('/missions') ||
                          request.nextUrl.pathname.startsWith('/candidates') ||
                          request.nextUrl.pathname.startsWith('/pools') ||
                          request.nextUrl.pathname.startsWith('/tasks') ||
                          request.nextUrl.pathname.startsWith('/import')

  // Auth routes - redirect to dashboard if already authenticated
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/reset-password')

  // Portal routes - public access with token
  const isPortalRoute = request.nextUrl.pathname.startsWith('/candidate/') ||
                       request.nextUrl.pathname.startsWith('/client/')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Portal routes don't need authentication - they use tokens
  if (isPortalRoute) {
    return supabaseResponse
  }

  return supabaseResponse
}

