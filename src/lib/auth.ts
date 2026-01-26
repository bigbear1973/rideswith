import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { Resend } from 'resend';
import { prisma } from './prisma';
import type { Adapter } from 'next-auth/adapters';

// Log environment status on startup
console.log('[Auth] RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);
console.log('[Auth] EMAIL_FROM:', process.env.EMAIL_FROM || 'not set, using default');
console.log('[Auth] AUTH_URL:', process.env.AUTH_URL || 'https://rideswith.com');

const resend = new Resend(process.env.RESEND_API_KEY);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'database',
  },
  providers: [
    {
      id: 'email',
      name: 'Email',
      type: 'email',
      maxAge: 24 * 60 * 60, // 24 hours
      sendVerificationRequest: async ({ identifier: email, url }) => {
        console.log('[Auth] sendVerificationRequest called for:', email);
        console.log('[Auth] Verification URL:', url);

        if (!process.env.RESEND_API_KEY) {
          console.error('[Auth] RESEND_API_KEY is not configured!');
          throw new Error('Email service not configured');
        }

        const fromEmail = process.env.EMAIL_FROM || 'RidesWith <onboarding@resend.dev>';
        console.log('[Auth] Sending from:', fromEmail);

        try {
          const result = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: 'Sign in to RidesWith',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="max-width: 500px; margin: 40px auto; padding: 20px;">
                  <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <h1 style="color: #16a34a; margin: 0 0 20px 0; font-size: 28px;">🚴 RidesWith</h1>
                    <p style="color: #333; font-size: 16px; margin: 0 0 30px 0;">
                      Click the button below to sign in to your account.
                    </p>
                    <a href="${url}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Sign in to RidesWith
                    </a>
                    <p style="color: #888; font-size: 14px; margin: 30px 0 0 0;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                  </div>
                  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                    This link expires in 24 hours.
                  </p>
                </div>
              </body>
              </html>
            `,
          });

          console.log('[Auth] Resend API response:', JSON.stringify(result, null, 2));

          if (result.error) {
            console.error('[Auth] Resend error:', result.error);
            throw new Error(result.error.message);
          }

          console.log('[Auth] Magic link email sent successfully to:', email, 'ID:', result.data?.id);
        } catch (error) {
          console.error('[Auth] Failed to send magic link email:', error);
          throw error;
        }
      },
      options: {},
    },
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      // Use custom domain if AUTH_URL is set, otherwise use baseUrl
      const targetBase = process.env.AUTH_URL || 'https://rideswith.com';

      // If the url is relative, prepend the target base
      if (url.startsWith('/')) {
        return `${targetBase}${url}`;
      }

      // If the url is on the old railway domain, redirect to custom domain
      if (url.includes('rideswith-production.up.railway.app')) {
        return url.replace('https://rideswith-production.up.railway.app', targetBase);
      }

      // If the url is on same origin or target base, allow it
      if (url.startsWith(baseUrl) || url.startsWith(targetBase)) {
        return url;
      }

      // Default to target base
      return targetBase;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
