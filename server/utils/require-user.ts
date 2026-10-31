import { createError, getRequestHeaders, type H3Event } from 'h3'
import { createAuth } from './auth'

export async function requireUser(event: H3Event) {
  const headers = new Headers()
  for (const [name, value] of Object.entries(getRequestHeaders(event))) {
    if (value) headers.set(name, value)
  }
  const session = await createAuth(event).api.getSession({
    headers,
  })
  if (!session?.user || !session.user.emailVerified) {
    throw createError({ statusCode: 401, statusMessage: 'Masuk dengan email yang sudah diverifikasi untuk melanjutkan.' })
  }
  return session.user
}
