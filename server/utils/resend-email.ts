interface ResendEmail {
  apiKey: string
  from: string
  to: string
  subject: string
  text: string
}

interface ResendErrorResponse {
  message?: unknown
  name?: unknown
}

function getResendErrorMessage(body: string): string {
  if (!body) return ''

  try {
    const parsed: unknown = JSON.parse(body)
    if (typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
      const { message, name } = parsed as ResendErrorResponse
      if (typeof message === 'string') {
        return typeof name === 'string' ? `${name}: ${message}` : message
      }
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
  }

  return body.slice(0, 500)
}

export async function sendResendEmail(email: ResendEmail, fetcher: typeof fetch = fetch): Promise<void> {
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${email.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: email.from,
      to: [email.to],
      subject: email.subject,
      text: email.text,
    }),
  })

  if (!response.ok) {
    const providerMessage = getResendErrorMessage(await response.text())
    throw new Error(
      `Resend menolak pengiriman email (HTTP ${response.status})${providerMessage ? `: ${providerMessage}` : '.'}`,
    )
  }
}
