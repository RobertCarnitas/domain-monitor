import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Supports exact emails (user@example.com) and domain wildcards (@example.com)
const ALLOWED_ENTRIES = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

function isEmailAllowed(email: string): boolean {
  const lower = email.toLowerCase()
  for (const entry of ALLOWED_ENTRIES) {
    if (entry.startsWith('@')) {
      // Domain wildcard: @autovitalsinc.com matches any email at that domain
      if (lower.endsWith(entry)) return true
    } else {
      // Exact email match
      if (lower === entry) return true
    }
  }
  return false
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user }) {
      // If no ALLOWED_EMAILS configured, allow all Google accounts
      if (ALLOWED_ENTRIES.length === 0) return true
      // Check if user's email matches an allowed entry
      if (user.email && isEmailAllowed(user.email)) {
        return true
      }
      return '/auth/error?error=AccessDenied'
    },
    async session({ session }) {
      return session
    },
  },
})

export { handler as GET, handler as POST }
