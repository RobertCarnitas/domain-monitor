export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth routes)
     * - auth (sign-in/error pages)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
