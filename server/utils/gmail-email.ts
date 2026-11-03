interface GmailEmail {
  clientId: string
  clientSecret: string
  refreshToken: string
  sender: string
  to: string
  subject: string
  text: string
}

interface GoogleTokenResponse {
  access_token?: unknown
  error_description?: unknown
}

interface GoogleApiErrorResponse {
  error?: unknown | { message?: unknown }
  error_description?: unknown
}

const providerRequestTimeoutMs = 10_000

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function encodeBase64Url(value: string): string {
  return encodeBase64(value).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function assertSafeHeader(value: string, field: string): void {
  if (/[\r\n]/.test(value)) throw new Error(`Header email ${field} tidak valid.`)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function foldBase64(value: string): string {
  return encodeBase64(value).match(/.{1,76}/g)?.join('\r\n') ?? ''
}

function getActionUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s<>]+/i)
  if (!match) return undefined

  let url: URL
  try {
    url = new URL(match[0])
  } catch {
    throw new Error('Tautan email tidak valid.')
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Protokol tautan email tidak valid.')
  }
  return url.href
}

function getActionLabel(subject: string): string {
  return subject.toLowerCase().includes('verifikasi') ? 'Verifikasi alamat email' : 'Atur ulang kata sandi'
}

function buildHtmlMessage(email: GmailEmail, actionUrl?: string): string {
  const paragraphs = email.text
    .replace(/https?:\/\/[^\s<>]+/i, '')
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p style="margin:0 0 18px;color:#44414a;font-size:16px;line-height:1.6">${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
    .join('')
  const action = actionUrl
    ? `<p style="margin:28px 0;text-align:center"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;border-radius:8px;background:#5045f5;padding:14px 24px;color:#ffffff;font-size:15px;font-weight:700;line-height:1.2;text-decoration:none">${escapeHtml(getActionLabel(email.subject))}</a></p><p style="margin:0 0 18px;color:#77727d;font-size:13px;line-height:1.6">Jika tombol tidak berfungsi, salin dan tempel tautan ini ke browser:<br><a href="${escapeHtml(actionUrl)}" style="color:#5045f5;overflow-wrap:anywhere">${escapeHtml(actionUrl)}</a></p>`
    : ''

  return [
    '<!doctype html>',
    '<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
    '<body style="margin:0;background:#f7f4ed;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">',
    '<div style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden">Pesan penting dari Selamanya.</div>',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8e4dc;border-radius:12px">',
    '<tr><td style="padding:28px 32px 18px;border-bottom:1px solid #eeeae4"><span style="color:#201d28;font-size:20px;font-weight:700;letter-spacing:-.4px">selamanya<span style="color:#5045f5">.</span></span></td></tr>',
    `<tr><td style="padding:30px 32px 12px"><h1 style="margin:0 0 22px;color:#201d28;font-size:24px;line-height:1.3">${escapeHtml(getActionLabel(email.subject))}</h1>${paragraphs}${action}<p style="margin:24px 0 0;color:#44414a;font-size:15px;line-height:1.6">Salam hangat,<br><strong>Tim Selamanya</strong></p></td></tr>`,
    '<tr><td style="padding:18px 32px;border-top:1px solid #eeeae4;color:#77727d;font-size:12px;line-height:1.6">Email otomatis ini dikirim untuk membantu menjaga keamanan akunmu. Mohon jangan membalas email ini.</td></tr>',
    '</table>',
    '</body></html>',
  ].join('')
}

function buildRawMessage(email: GmailEmail): string {
  assertSafeHeader(email.sender, 'From')
  assertSafeHeader(email.to, 'To')
  assertSafeHeader(email.subject, 'Subject')
  const boundary = `----=_Selamanya_${crypto.randomUUID()}`
  const actionUrl = getActionUrl(email.text)
  const html = buildHtmlMessage(email, actionUrl)
  return [
    `From: Selamanya <${email.sender}>`,
    `To: ${email.to}`,
    `Subject: =?UTF-8?B?${encodeBase64(email.subject)}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    foldBase64(email.text),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    foldBase64(html),
    `--${boundary}--`,
    '',
  ].join('\r\n')
}

async function getProviderError(response: Response): Promise<string> {
  const body = await response.text()
  if (!body) return ''

  try {
    const parsed: unknown = JSON.parse(body)
    if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
      const { error, error_description } = parsed as GoogleApiErrorResponse
      if (typeof error_description === 'string') return error_description
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = error.message
        if (typeof message === 'string') return message
      }
      if (typeof error === 'string') return error
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
  }
  return body.slice(0, 500)
}

export async function sendGmailEmail(email: GmailEmail, fetcher: typeof fetch = fetch): Promise<void> {
  const rawMessage = encodeBase64Url(buildRawMessage(email))
  const tokenResponse = await fetcher('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(providerRequestTimeoutMs),
    body: new URLSearchParams({
      client_id: email.clientId,
      client_secret: email.clientSecret,
      refresh_token: email.refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!tokenResponse.ok) {
    const providerMessage = await getProviderError(tokenResponse)
    throw new Error(
      `Google OAuth menolak token Gmail (HTTP ${tokenResponse.status})${providerMessage ? `: ${providerMessage}` : '.'}`,
    )
  }

  const token: unknown = await tokenResponse.json()
  if (typeof token !== 'object' || token === null || !('access_token' in token)) {
    throw new Error('Google OAuth tidak mengembalikan access token Gmail.')
  }
  const accessToken = (token as GoogleTokenResponse).access_token
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new Error('Google OAuth tidak mengembalikan access token Gmail.')
  }

  const sendResponse = await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(providerRequestTimeoutMs),
    body: JSON.stringify({ raw: rawMessage }),
  })
  if (!sendResponse.ok) {
    const providerMessage = await getProviderError(sendResponse)
    throw new Error(
      `Gmail menolak pengiriman email (HTTP ${sendResponse.status})${providerMessage ? `: ${providerMessage}` : '.'}`,
    )
  }
}
