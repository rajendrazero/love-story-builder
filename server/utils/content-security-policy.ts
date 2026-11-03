export interface RenderedHtmlSegments {
  head: string[]
  body: string[]
  bodyAppend: string[]
}

export function createCspNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
}

export function createContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://challenges.cloudflare.com https://api.cloudinary.com",
    "frame-src 'self' https://challenges.cloudflare.com",
    "media-src 'self' data: blob: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join('; ')
}

export function addInlineScriptNonces(html: RenderedHtmlSegments, nonce: string): void {
  const addNonce = (chunk: string) => chunk.replace(
    /<script\b([^>]*)>/gi,
    (tag, attributes: string) => {
      if (/(?:^|\s)(?:src|nonce)\s*=/.test(attributes)) return tag
      return `<script nonce="${nonce}"${attributes}>`
    },
  )

  html.head = html.head.map(addNonce)
  html.body = html.body.map(addNonce)
  html.bodyAppend = html.bodyAppend.map(addNonce)
}
