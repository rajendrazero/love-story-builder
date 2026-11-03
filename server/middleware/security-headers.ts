import { getRequestURL, setResponseHeader, type H3Event } from 'h3'
import { createContentSecurityPolicy, createCspNonce } from '../utils/content-security-policy'

export default defineEventHandler((event: H3Event) => {
  const nonce = createCspNonce()
  event.context.cspNonce = nonce
  setResponseHeader(event, 'Content-Security-Policy', createContentSecurityPolicy(nonce))

  const url = getRequestURL(event)
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return

  setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000')
})
