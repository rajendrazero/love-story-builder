import { betterAuth } from 'better-auth'
import { captcha, username } from 'better-auth/plugins'
import { createError } from 'h3'
import { getRequestURL, type H3Event } from 'h3'
import { getAppEnv, requireDatabase } from './cloudflare'

async function sendEmail(
  env: ReturnType<typeof getAppEnv>,
  to: string,
  subject: string,
  text: string,
) {
  const apiKey = env.RESEND_API_KEY?.trim()
  const from = env.EMAIL_FROM?.trim()
  if (!apiKey || !from) {
    throw new Error('Email belum dikonfigurasi. Isi RESEND_API_KEY dan EMAIL_FROM.')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  })
  if (!response.ok) {
    throw new Error(`Layanan email menolak pengiriman (HTTP ${response.status}).`)
  }
}

export function createAuth(event: H3Event) {
  const env = getAppEnv(event)
  const secret = env.BETTER_AUTH_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET harus diatur dengan nilai acak minimal 32 karakter.')
  }
  const turnstileSecret = env.TURNSTILE_SECRET_KEY?.trim()
  if (!turnstileSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Pemeriksaan keamanan login belum dikonfigurasi. Atur TURNSTILE_SECRET_KEY.',
    })
  }

  const baseURL = env.BETTER_AUTH_URL?.trim() || getRequestURL(event).origin
  const allowedHostname = new URL(baseURL).hostname
  const sendLink = async (email: string, subject: string, url: string) => {
    await sendEmail(env, email, subject, `Buka tautan berikut untuk melanjutkan:\n\n${url}\n\nJika kamu tidak meminta ini, abaikan email ini.`)
  }

  return betterAuth({
    appName: 'Selamanya',
    database: requireDatabase(event),
    secret,
    baseURL,
    trustedOrigins: [baseURL],
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
        usernameValidator: value => /^[a-zA-Z0-9_.]+$/.test(value),
      }),
      captcha({
        provider: 'cloudflare-turnstile',
        secretKey: turnstileSecret,
        allowedHostnames: [allowedHostname],
        endpoints: [
          '/sign-up/email',
          '/sign-in/email',
          '/sign-in/username',
          '/request-password-reset',
          '/reset-password',
          '/send-verification-email',
        ],
      }),
    ],
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      storage: 'database',
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-in/username': { window: 60, max: 5 },
        '/sign-up/email': { window: 3600, max: 5 },
        '/request-password-reset': { window: 3600, max: 3 },
        '/reset-password': { window: 3600, max: 5 },
        '/send-verification-email': { window: 3600, max: 3 },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendLink(user.email, 'Atur ulang sandi Selamanya', url)
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendLink(user.email, 'Verifikasi akun Selamanya', url)
      },
    },
    advanced: {
      useSecureCookies: new URL(baseURL).protocol === 'https:',
    },
  })
}
