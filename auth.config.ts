import { prisma } from '@/lib/db';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const authConfig = {
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        try {
          // Find user by username
          const user = await prisma.user.findUnique({
            where: {
              username: credentials.username as string,
              isActive: true
            }
          });
          if (!user) {
            return null;
          }
          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!isPasswordValid) {
            return null;
          }
          return {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            email: user.email,
            phone: user.phone,
            currency: user.currency,
            profileImage: user.profileImage,
            myReferralCode: user.myReferralCode
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register'
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Initial sign-in: populate token from auth result
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.phone = user.phone;
        token.username = user.username;
        token.role = user.role;
        token.profileImage = user.profileImage;
        token.myReferralCode = user.myReferralCode;
      } else if (trigger === 'update' || (!token.role && token.id)) {
        // Token refresh: re-read role from DB to catch role changes
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              role: true,
              isActive: true,
              name: true,
              username: true,
              phone: true,
              profileImage: true,
              myReferralCode: true
            }
          });
          if (freshUser && freshUser.isActive) {
            token.role = freshUser.role;
            token.name = freshUser.name;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.phone = token.phone as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.profileImage = token.profileImage as string;
        session.user.myReferralCode = token.myReferralCode as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
} satisfies NextAuthConfig;

export default authConfig;
