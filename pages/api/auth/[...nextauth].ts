import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from '../../../lib/supabase'

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshAccessToken(token: any) {
  try {
    const url = 'https://oauth2.googleapis.com/token'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)

    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

/**
 * Quick ping to Google Calendar API to verify the token actually works.
 */
async function validateGoogleToken(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Wait for a freshly issued Google token to become usable.
 * Google sometimes takes 1-3s to activate a new token after OAuth consent.
 */
async function waitForTokenActivation(
  accessToken: string,
  maxAttempts = 3,
  delayMs = 1500
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await validateGoogleToken(accessToken)) return true;
    if (i < maxAttempts - 1) await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile: _profile }) {
      try {
        if (account?.provider === 'google' && user?.email) {
          // Check if user exists in Supabase
          const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single()

          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error checking existing user:', fetchError)
            return true // Allow sign in even if Supabase fails
          }

          if (existingUser) {
            // Update last login time for existing user
            await supabaseAdmin
              .from('users')
              .update({ 
                last_login_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('email', user.email)
          } else {
            // Create new user record
            const { error: insertError } = await supabaseAdmin
              .from('users')
              .insert({
                email: user.email,
                name: user.name || '',
                image: user.image || '',
                tier: 'free',
                first_login_at: new Date().toISOString(),
                last_login_at: new Date().toISOString()
              })

            if (insertError) {
              console.error('Error creating user:', insertError)
              // Don't block sign in if Supabase fails
            }
          }
        }
        return true
      } catch (error) {
        console.error('SignIn callback error:', error)
        return true // Allow sign in even if tracking fails
      }
    },
    async jwt({ token, account }) {
      try {
        // If this is the first time (account exists), store the tokens
        if (account) {
          token.accessToken = account.access_token
          token.refreshToken = account.refresh_token
          token.expiresAt = account.expires_at

          // Block until the token is actually usable by Google Calendar API
          // This adds ~1-4s to the OAuth redirect but prevents the error screen entirely
          const isValid = await waitForTokenActivation(account.access_token as string);

          if (!isValid && account.refresh_token) {
            console.warn('Token not activated after retries, forcing refresh...');
            const refreshed = await refreshAccessToken({ refreshToken: account.refresh_token });
            if (!refreshed.error) {
              token.accessToken = refreshed.accessToken;
              token.expiresAt = refreshed.expiresAt;
              token.refreshToken = refreshed.refreshToken;
            }
          }

          return token
        }

        // Refresh 5 minutes before expiry instead of after
        if (Date.now() < ((token.expiresAt as number) - 300) * 1000) {
          return token
        }

        // Token has expired, try to refresh it
        console.log('Token expired, attempting refresh...')
        const refreshedTokens = await refreshAccessToken(token)
        
        if (refreshedTokens.error) {
          console.error('Failed to refresh token:', refreshedTokens.error)
          // Return the old token, but mark it as expired
          return { ...token, error: "RefreshAccessTokenError" }
        }

        return refreshedTokens
      } catch (error) {
        console.error('JWT callback error:', error)
        return { ...token, error: "RefreshAccessTokenError" }
      }
    },
    async session({ session, token }) {
      try {
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.error = token.error as string
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    },
  },
  pages: {
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days — matches session
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.debug('NextAuth Debug:', code, metadata)
    }
  },
}

export default NextAuth(authOptions)