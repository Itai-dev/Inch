import { NextResponse, type NextRequest } from 'next/server'

/**
 * DOT. URLs (`/dot/…`) map straight onto `app/[site]`.
 * Everything else is INCH”: `/apply` is served from `/inch/apply`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/dot' || pathname.startsWith('/dot/')) return
  const url = request.nextUrl.clone()
  url.pathname = `/inch${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!api|studio|_next|.*\\..*).*)'],
}
