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
      async authorize(credentials, request) {
        console.log('AUTH START - Raw credentials:', credentials)

        // NextAuth v5'te credentials auto-parse edilmiyor, request'ten alıyoruz
        let email: string | undefined
        let password: string | undefined

        // Request body'den form data parse et
        if (request) {
          try {
            const formData = await request.formData?.()
            if (formData) {
              email = formData.get('email') as string
              password = formData.get('password') as string
            }
          } catch (e) {
            console.log('AUTH: formData parse error:', e)
          }
        }

        // Fallback to credentials
        if (!email) email = credentials?.email as string
        if (!password) password = credentials?.password as string

        console.log('AUTH EXTRACTED:', { email: email || 'MISSING', hasPassword: !!password })

        if (!email || !password) {
          console.log('AUTH FAIL: Missing credentials')
          return null
        }

        try {
          console.log('AUTH DB QUERY:', email)
          const user = await db.user.findUnique({
            where: { email: email as string },
            include: {
              tenant: true,
              staff: true
            }
          })

          console.log('AUTH USER FOUND:', { id: user?.id, hasPassword: !!user?.passwordHash, isActive: user?.isActive })

          if (!user || !user.passwordHash) {
            console.log('AUTH FAIL: User not found or no password')
            return null
          }

          if (!user.isActive) {
            console.log('AUTH FAIL: User inactive')
            throw new Error('Hesabiniz pasife alinmis')
          }

          // Tenant aktiflik kontrolu
          console.log('AUTH TENANT:', { status: user.tenant?.status })
          if (user.tenant && user.tenant.status !== 'active') {
            console.log('AUTH FAIL: Tenant inactive')
            throw new Error('Isletmeniz pasife alinmis')
          }

          console.log('AUTH CHECKING PASSWORD...')
          console.log('AUTH PASSWORD INPUT:', password)
          console.log('AUTH PASSWORD HASH:', user.passwordHash?.substring(0, 20) + '...')

          const isPasswordValid = await bcrypt.compare(
            password as string,
            user.passwordHash
          )
          console.log('AUTH PASSWORD RESULT:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('AUTH FAIL: Invalid password')
            return null
          }

          console.log('AUTH SUCCESS:', { id: user.id, email: user.email })
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
          console.error('AUTH ERROR:', error)
          console.error('AUTH ERROR STACK:', (error as Error)?.stack)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
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
