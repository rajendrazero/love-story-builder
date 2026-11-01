import assert from 'node:assert/strict'
import test from 'node:test'
import { upsertDevVar } from '../scripts/gmail-oauth.mjs'

test('upserts a dev variable without changing other values or line endings', () => {
  const contents = 'EMAIL_PROVIDER=gmail\r\nGOOGLE_OAUTH_REFRESH_TOKEN=old-token\r\n'

  assert.equal(
    upsertDevVar(contents, 'GOOGLE_OAUTH_REFRESH_TOKEN', 'new-token'),
    'EMAIL_PROVIDER=gmail\r\nGOOGLE_OAUTH_REFRESH_TOKEN=new-token\r\n',
  )
})

test('appends a dev variable while preserving whether the file ends with a newline', () => {
  assert.equal(upsertDevVar('EMAIL_PROVIDER=gmail', 'GOOGLE_OAUTH_REFRESH_TOKEN', 'token'), 'EMAIL_PROVIDER=gmail\nGOOGLE_OAUTH_REFRESH_TOKEN=token')
  assert.equal(upsertDevVar('EMAIL_PROVIDER=gmail\n', 'GOOGLE_OAUTH_REFRESH_TOKEN', 'token'), 'EMAIL_PROVIDER=gmail\nGOOGLE_OAUTH_REFRESH_TOKEN=token\n')
})

test('rejects duplicate variable definitions and newline injection', () => {
  assert.throws(
    () => upsertDevVar('TOKEN=first\nTOKEN=second\n', 'TOKEN', 'new'),
    /lebih dari satu/,
  )
  assert.throws(() => upsertDevVar('', 'TOKEN', 'value\nINJECTED=true'), /tidak valid/)
})
