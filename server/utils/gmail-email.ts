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

function buildRawMessage(email: GmailEmail): string {
  assertSafeHeader(email.sender, 'From')
  assertSafeHeader(email.to, 'To')
  assertSafeHeader(email.subject, 'Subject')
  const body = encodeBase64(email.text).replace(/.{1,76}/g, '$&\r\n').trim()
  return [
    `From: Selamanya <${email.sender}>`,
    `To: ${email.to}`,
    `Subject: =?UTF-8?B?${encodeBase64(email.subject)}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body,
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
    body: JSON.stringify({ raw: rawMessage }),
  })
  if (!sendResponse.ok) {
    const providerMessage = await getProviderError(sendResponse)
    throw new Error(
      `Gmail menolak pengiriman email (HTTP ${sendResponse.status})${providerMessage ? `: ${providerMessage}` : '.'}`,
    )
  }
}
