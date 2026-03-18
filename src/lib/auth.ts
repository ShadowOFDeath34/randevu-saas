import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false // Security: prevent account linking
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              tenant: true,
              staff: true
            }
          })

          if (!user || !user.passwordHash) {
            return null
          }

          if (!user.isActive) {
            throw new Error('Hesabiniz pasife alinmis')
          }

          // Tenant aktiflik kontrolu
          if (user.tenant && user.tenant.status !== 'active') {
            throw new Error('Isletmeniz pasife alinmis')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            tenantSlug: user.tenant?.slug || '',
            staffId: user.staff?.id || null
          }
        } catch (error) {
          console.error('Auth error:', error)
          throw error
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile: _profile }) {
      // Google OAuth ile giris kontrolu
      if (account?.provider === 'google') {
        if (!user.email) {
          return false
        }

        try {
          // Kullanici veritabaninda var mi?
          const dbUser = await db.user.findUnique({
            where: { email: user.email },
            include: { tenant: true, staff: true }
          })

          if (!dbUser) {
            console.error('Google auth: Kullanici bulunamadi', { email: user.email })
            return '/login?error=user_not_found'
          }

          if (!dbUser.isActive) {
            console.error('Google auth: Hesap pasif', { email: user.email })
            return '/login?error=account_inactive'
          }

          if (dbUser.tenant && dbUser.tenant.status !== 'active') {
            console.error('Google auth: Tenant pasif', { email: user.email })
            return '/login?error=tenant_inactive'
          }

          // Kullanici bilgilerini token'a ekle
          user.id = dbUser.id
          user.role = dbUser.role
          user.tenantId = dbUser.tenantId
          user.tenantSlug = dbUser.tenant?.slug || ''
          user.staffId = dbUser.staff?.id || null

          return true
        } catch (error) {
          console.error('Google auth error:', error)
          return '/login?error=auth_error'
        }
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.tenantSlug = user.tenantSlug
        token.staffId = user.staffId
      }

      // Session update trigger'i
      if (trigger === 'update' && session) {
        token.name = session.name
        token.email = session.email
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
        session.user.tenantSlug = token.tenantSlug as string
        session.user.staffId = token.staffId as string | null
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 saat
    updateAge: 60 * 60 // 1 saatte bir yenile
  },
  jwt: {
    maxAge: 8 * 60 * 60 // 8 saat
  }
})
