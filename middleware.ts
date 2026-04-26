import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const user = req.auth?.user as any
  const role = user?.role as string | undefined

  // Redirect authenticated users away from login
  if (user && pathname === '/auth/login')
    return NextResponse.redirect(new URL('/dashboard', req.url))

  // Protect app routes
  const isProtected = ['/dashboard', '/project', '/admin'].some(p => pathname.startsWith(p))
  if (!user && isProtected) {
    const url = new URL('/auth/login', req.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Admin-only
  if (pathname.startsWith('/admin') && role !== 'admin')
    return NextResponse.redirect(new URL('/dashboard', req.url))

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
