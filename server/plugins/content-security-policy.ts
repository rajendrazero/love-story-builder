import { defineNitroPlugin } from 'nitropack/runtime'
import { addInlineScriptNonces } from '../utils/content-security-policy'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nonce = event.context.cspNonce
    if (typeof nonce !== 'string') return
    addInlineScriptNonces(html, nonce)
  })
})
