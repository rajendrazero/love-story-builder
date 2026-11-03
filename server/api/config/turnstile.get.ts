import { defineEventHandler, setResponseHeader } from 'h3'
import { getAppEnv } from '../../utils/cloudflare'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const configuredSiteKey = getAppEnv(event).NUXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  const runtimeSiteKey = useRuntimeConfig(event).public.turnstileSiteKey
  const siteKey = configuredSiteKey || String(runtimeSiteKey || '').trim()
  return { siteKey }
})
