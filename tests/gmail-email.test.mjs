import assert from 'node:assert/strict'
import test from 'node:test'
import { sendGmailEmail } from '../server/utils/gmail-email.ts'

const email = {
  clientId: 'oauth-client-id',
  clientSecret: 'oauth-client-secret',
  refreshToken: 'oauth-refresh-token',
  sender: 'sender@gmail.com',
  to: 'recipient@gmail.com',
  subject: 'Aktivasi akun ♡',
  text: 'Klik tautan untuk mengaktifkan akun.',
}

function decodeBase64Url(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)))
}

test('refreshes Google OAuth token and sends a UTF-8 activation message', async () => {
  const requests = []
  await sendGmailEmail(email, async (url, options) => {
    requests.push({ url, options })
    if (url === 'https://oauth2.googleapis.com/token') {
      return Response.json({ access_token: 'short-lived-access-token' })
    }
    return Response.json({ id: 'gmail-message-id' })
  })

  assert.equal(requests.length, 2)
  assert.equal(requests[0].url, 'https://oauth2.googleapis.com/token')
  assert.equal(requests[0].options.method, 'POST')
  assert.equal(requests[0].options.headers['Content-Type'], 'application/x-www-form-urlencoded')
  assert.equal(requests[0].options.body.get('refresh_token'), email.refreshToken)
  assert.equal(requests[1].url, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send')
  assert.equal(requests[1].options.headers.Authorization, 'Bearer short-lived-access-token')

  const raw = JSON.parse(requests[1].options.body).raw
  const message = decodeBase64Url(raw)
  assert.match(message, /From: Selamanya <sender@gmail\.com>/)
  assert.match(message, /To: recipient@gmail\.com/)
  assert.match(message, /Subject: =\?UTF-8\?B\?/)
  const encodedBody = message.split('\r\n\r\n').at(-1).replace(/\s/g, '')
  const bodyBytes = atob(encodedBody)
  const decodedBody = new TextDecoder().decode(Uint8Array.from(bodyBytes, char => char.charCodeAt(0)))
  assert.equal(decodedBody, email.text)
})

test('reports Google OAuth errors without leaking client credentials', async () => {
  await assert.rejects(
    sendGmailEmail(email, async () => Response.json({
      error: 'invalid_grant',
      error_description: 'Token has been expired or revoked.',
    }, { status: 400 })),
    (error) => {
      assert.match(error.message, /HTTP 400/)
      assert.match(error.message, /expired or revoked/i)
      assert.doesNotMatch(error.message, /oauth-client-secret|oauth-refresh-token/)
      return true
    },
  )
})

test('rejects line breaks in message headers before requesting OAuth credentials', async () => {
  let requestCount = 0
  await assert.rejects(
    sendGmailEmail({ ...email, to: 'recipient@gmail.com\r\nBcc: attacker@example.com' }, async () => {
      requestCount++
      return Response.json({ access_token: 'token' })
    }),
    /Header email To tidak valid/,
  )
  assert.equal(requestCount, 0)
})
