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
  text: 'Halo,\n\nVerifikasi alamat emailmu melalui tautan berikut:\n\nhttps://example.com/verify?token=abc&source=email\n\nJika tautan tidak bisa dibuka, salin dan tempel URL tersebut ke browser.',
}

function decodeBase64(value) {
  const binary = atob(value.replace(/\s/g, '').padEnd(Math.ceil(value.replace(/\s/g, '').length / 4) * 4, '='))
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)))
}

function decodeBase64Url(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  return decodeBase64(base64)
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
  const boundary = message.match(/boundary="([^"]+)"/)?.[1]
  assert.ok(boundary)
  const parts = message
    .split(`--${boundary}`)
    .slice(1, -1)
    .map((part) => {
      const [headers, body] = part.trim().split('\r\n\r\n')
      return { headers, body: decodeBase64(body) }
    })
  assert.match(parts[0].headers, /Content-Type: text\/plain; charset=UTF-8/)
  assert.equal(parts[0].body, email.text)
  assert.match(parts[1].headers, /Content-Type: text\/html; charset=UTF-8/)
  assert.match(parts[1].body, /Selamanya/)
  assert.match(parts[1].body, /Verifikasi alamat email/)
  assert.match(parts[1].body, /href="https:\/\/example\.com\/verify\?token=abc&amp;source=email"/)
  assert.match(parts[1].body, /Tim Selamanya/)
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

test('escapes email content before rendering it as HTML', async () => {
  let rawMessage = ''
  await sendGmailEmail({ ...email, text: 'Halo <script>alert("x")</script> & selamat datang.' }, async (url, options) => {
    if (url === 'https://oauth2.googleapis.com/token') {
      return Response.json({ access_token: 'short-lived-access-token' })
    }
    rawMessage = decodeBase64Url(JSON.parse(options.body).raw)
    return Response.json({ id: 'gmail-message-id' })
  })

  const boundary = rawMessage.match(/boundary="([^"]+)"/)?.[1]
  assert.ok(boundary)
  const htmlPart = rawMessage.split(`--${boundary}`)[2]
  assert.ok(htmlPart)
  const html = decodeBase64(htmlPart.trim().split('\r\n\r\n')[1])
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; selamat datang\./)
  assert.doesNotMatch(html, /<script>/)
})
