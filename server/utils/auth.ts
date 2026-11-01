import { betterAuth } from 'better-auth'
import { captcha, username } from 'better-auth/plugins'
import { createError } from 'h3'
import { getRequestURL, type H3Event } from 'h3'
import { resolveAuthOrigins } from './auth-origin'
import { seedUserRole } from './admin-role'
import { getAppEnv, requireDatabase } from './cloudflare'
import { sendGmailEmail } from './gmail-email'
import { logOperationalError } from './observability'

async function sendEmail(
  env: ReturnType<typeof getAppEnv>,
  to: string,
  subject: string,
  text: string,
) {
  const sender = env.GMAIL_SENDER_EMAIL?.trim()
  const clientId = env.GOOGLE_OAUTH_CLIENT_ID?.trim()
  const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()
  const refreshToken = env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim()
  if (!sender || !clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail belum dikonfigurasi. Isi GMAIL_SENDER_EMAIL dan kredensial OAuth Gmail.')
  }
  await sendGmailEmail({ sender, clientId, clientSecret, refreshToken, to, subject, text })
}

function isValidAuthURL(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:')
      && Boolean(url.hostname)
      && !url.username
      && !url.password
  } catch {
    return false
  }
}

export function createAuth(event: H3Event) {
  const env = getAppEnv(event)
  const secret = env.BETTER_AUTH_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Autentikasi belum dikonfigurasi. Atur BETTER_AUTH_SECRET dengan nilai acak minimal 32 karakter.',
    })
  }
  const turnstileSecret = env.TURNSTILE_SECRET_KEY?.trim()
  if (!turnstileSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Pemeriksaan keamanan login belum dikonfigurasi. Atur TURNSTILE_SECRET_KEY.',
    })
  }
  const configuredAuthURL = env.BETTER_AUTH_URL?.trim()
  if (configuredAuthURL && !isValidAuthURL(configuredAuthURL)) {
    throw createError({
      statusCode: 503,
      statusMessage: 'BETTER_AUTH_URL harus berupa alamat HTTP atau HTTPS yang valid.',
    })
  }

  const authOrigins = resolveAuthOrigins(configuredAuthURL, getRequestURL(event).origin)
  const { baseURL, allowedHostnames, trustedOrigins } = authOrigins
  const sendLink = async (email: string, subject: string, url: string, event: H3Event) => {
    try {
      const isVerification = subject.includes('verifikasi')
      const text = isVerification
        ? `Halo,\n\nTerima kasih telah membuat akun Selamanya. Verifikasi alamat emailmu dengan membuka tautan berikut:\n\n${url}\n\nJika tombol atau tautan tidak bisa dibuka, salin dan tempel URL tersebut ke browser.\n\nJika kamu tidak merasa membuat akun Selamanya, abaikan email ini.`
        : `Halo,\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun Selamanya. Gunakan tautan berikut untuk membuat kata sandi baru:\n\n${url}\n\nJika tombol atau tautan tidak bisa dibuka, salin dan tempel URL tersebut ke browser.\n\nJika kamu tidak meminta pengaturan ulang kata sandi, abaikan email ini. Kata sandimu tidak akan berubah.`
      await sendEmail(env, email, subject, text)
    } catch (error) {
      logOperationalError(event, 'auth.email_delivery_failed', error, {
        provider: 'gmail',
        purpose: subject.includes('verifikasi') ? 'verification' : 'password_reset',
      }, [
        env.GOOGLE_OAUTH_CLIENT_SECRET,
        env.GOOGLE_OAUTH_REFRESH_TOKEN,
        env.BETTER_AUTH_SECRET,
        env.TURNSTILE_SECRET_KEY,
      ])
      throw new Error('Email belum dapat dikirim. Periksa konfigurasi provider email dan coba lagi.')
    }
  }

  return betterAuth({
    appName: 'Selamanya',
    database: requireDatabase(event),
    secret,
    baseURL,
    trustedOrigins,
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
        usernameValidator: value => /^[a-zA-Z0-9_.]+$/.test(value),
      }),
      captcha({
        provider: 'cloudflare-turnstile',
        secretKey: turnstileSecret,
        allowedHostnames,
        endpoints: [
          '/sign-up/email',
          '/sign-in/email',
          '/sign-in/username',
          '/request-password-reset',
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
        await sendLink(user.email, 'Atur ulang sandi Selamanya', url, event)
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendLink(user.email, 'Verifikasi akun Selamanya', url, event)
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await seedUserRole(requireDatabase(event), user.id, user.email, env.ADMIN_EMAILS)
          },
        },
      },
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip'],
      },
      useSecureCookies: new URL(baseURL).protocol === 'https:',
    },
  })
}
