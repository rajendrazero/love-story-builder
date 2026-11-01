import { getRequestURL, setResponseHeader, type H3Event } from 'h3'

export default defineEventHandler((event: H3Event) => {
  const url = getRequestURL(event)
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return

  setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000')
})
