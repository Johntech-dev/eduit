// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

// Middleware to protect admin routes
export function middleware(request: NextRequest) {
  // Only apply to admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Get the token from cookie
    const token = request.cookies.get('adminAuthToken')?.value

    // If there's no token and the path isn't the login page, redirect to login
    if (!token && request.nextUrl.pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // If there is a token, verify it
    if (token) {
      try {
        // Verify the token
        verify(
          token, 
          process.env.JWT_SECRET || 'fallback-secret-please-change-in-production'
        )
        
        // If on login page and token is valid, redirect to admin dashboard
        if (request.nextUrl.pathname === '/admin/login') {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      } catch (error) {
        // If token verification fails, clear the cookie and redirect to login
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.delete('adminAuthToken')
        return response
      }
    }
  }

  return NextResponse.next()
}

// Configure matcher for middleware
export const config = {
  matcher: ['/admin/:path*']
}