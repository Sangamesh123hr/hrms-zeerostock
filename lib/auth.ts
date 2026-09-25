// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'

type AuthSessionUser = {
  id?: string
  role?: string
  department?: string | null
  image?: string | null
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          return null
        }

        try {
          const normalizedEmail = credentials.email.toLowerCase().trim()
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          })

          if (!user || !user.otp || !user.otpExpiresAt) {
            return null
          }

          if (new Date() > user.otpExpiresAt) {
            throw new Error('OTP has expired')
          }

          if (user.otp !== credentials.otp.trim()) {
            throw new Error('Invalid OTP')
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { otp: null, otpExpiresAt: null },
          })

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department || 'General',
            image: user.image && user.image.length < 2000 ? user.image : null,
          }
        } catch (error) {
          console.error('NextAuth authorize error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const typedUser = user as AuthSessionUser | undefined
      const typedToken = token as typeof token & AuthSessionUser

      if (trigger === 'update' && session && typeof session === 'object') {
        const updatedSession = session as { image?: string | null; user?: { image?: string | null } }
        const updatedImage = updatedSession.user?.image ?? updatedSession.image

        if (updatedImage !== undefined) {
          typedToken.image = updatedImage
        }
      }

      if (typedUser) {
        typedToken.role = typedUser.role
        typedToken.id = typedUser.id
        typedToken.department = typedUser.department
        typedToken.image = typedUser.image
      }

      return typedToken
    },
    async session({ session, token }) {
      const typedToken = token as typeof token & AuthSessionUser

      if (session.user) {
        ;(session.user as AuthSessionUser).role = typedToken.role
        ;(session.user as AuthSessionUser).id = typedToken.id
        ;(session.user as AuthSessionUser).department = typedToken.department
        ;(session.user as AuthSessionUser).image = typedToken.image
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'super-secret-key-123',
}