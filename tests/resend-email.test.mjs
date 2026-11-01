import assert from 'node:assert/strict'
import test from 'node:test'
import { sendResendEmail } from '../server/utils/resend-email.ts'

const email = {
  apiKey: 'test-api-key',
  from: 'Selamanya <noreply@example.com>',
  to: 'recipient@gmail.com',
  subject: 'Verifikasi akun',
  text: 'Buka tautan verifikasi.',
}

test('sends verification email using the configured Resend sender', async () => {
  let requestUrl
  let requestOptions

  await sendResendEmail(email, async (url, options) => {
    requestUrl = url
    requestOptions = options
    return Response.json({ id: 'email-id' })
  })

  assert.equal(requestUrl, 'https://api.resend.com/emails')
  assert.equal(requestOptions.method, 'POST')
  assert.equal(requestOptions.headers.Authorization, 'Bearer test-api-key')
  assert.deepEqual(JSON.parse(requestOptions.body), {
    from: email.from,
    to: [email.to],
    subject: email.subject,
    text: email.text,
  })
})

test('reports the Resend rejection reason without exposing credentials', async () => {
  await assert.rejects(
    sendResendEmail(email, async () => Response.json({
      name: 'validation_error',
      message: 'The sender domain is not verified.',
    }, { status: 403 })),
    (error) => {
      assert.match(error.message, /HTTP 403/)
      assert.match(error.message, /sender domain is not verified/i)
      assert.doesNotMatch(error.message, /test-api-key/)
      return true
    },
  )
})

test('reports non-JSON provider errors with a bounded message', async () => {
  await assert.rejects(
    sendResendEmail(email, async () => new Response('Provider unavailable', { status: 503 })),
    /HTTP 503\): Provider unavailable/,
  )
})
