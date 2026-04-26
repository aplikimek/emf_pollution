import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { upsertGoogleUser } from '@/lib/store'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return false
      try {
        await upsertGoogleUser({
          googleId: account.providerAccountId,
          email:    user.email!,
          name:     user.name  ?? user.email!.split('@')[0],
          image:    user.image ?? null,
        })
        return true
      } catch (e) {
        console.error('signIn error:', e)
        return false
      }
    },

    async jwt({ token, account }) {
      if (account?.provider === 'google') {
        // Enrich token with our user data
        const { getUserByGoogleId } = await import('@/lib/store')
        const dbUser = await getUserByGoogleId(account.providerAccountId)
        if (dbUser) {
          token.userId = dbUser.id
          token.role   = dbUser.role
          token.dbName = dbUser.name
        }
      }
      return token
    },

    async session({ session, token }) {
      if (token.userId) {
        (session.user as any).id   = token.userId
        ;(session.user as any).role = token.role
        ;(session.user as any).dbName = token.dbName
      }
      return session
    },
  },

  pages: { signIn: '/auth/login' },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
})

// ── Typed helpers ─────────────────────────────────────────────
export interface SessionUser {
  id:     string
  email:  string
  name:   string
  image:  string | null
  role:   'admin' | 'editor' | 'viewer'
}

export async function getServerUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user) return null
  const u = session.user as any
  return {
    id:    u.id    ?? '',
    email: u.email ?? '',
    name:  u.dbName ?? u.name ?? u.email ?? '',
    image: u.image ?? null,
    role:  u.role  ?? 'viewer',
  }
}
