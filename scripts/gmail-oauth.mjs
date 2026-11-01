import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const DEV_VARS_PATH = '.dev.vars'
const CALLBACK_HOST = '127.0.0.1'
const CALLBACK_PORT = 53682
const CALLBACK_URL = `http://${CALLBACK_HOST}:${CALLBACK_PORT}/`
const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send'

function readDevVar(contents, key) {
  const matches = contents.match(new RegExp(`^[ \\t]*${key}[ \\t]*=.*$`, 'gm')) ?? []
  if (matches.length > 1) {
    throw new Error(`Ada lebih dari satu konfigurasi ${key} di ${DEV_VARS_PATH}.`)
  }
  if (matches.length === 0) return ''

  const value = matches[0].slice(matches[0].indexOf('=') + 1).trim()
  if (
    value.length >= 2
    && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1)
  }
  return value
}

export function upsertDevVar(contents, key, value) {
  if (!/^[A-Z0-9_]+$/.test(key) || /[\r\n]/.test(value)) {
    throw new Error('Nama variabel atau nilai konfigurasi tidak valid.')
  }

  const linePattern = new RegExp(`^[ \\t]*${key}[ \\t]*=.*$`, 'gm')
  const matches = [...contents.matchAll(linePattern)]
  if (matches.length > 1) {
    throw new Error(`Ada lebih dari satu konfigurasi ${key} di ${DEV_VARS_PATH}.`)
  }

  const newline = contents.includes('\r\n') ? '\r\n' : '\n'
  if (matches.length === 1) {
    const match = matches[0]
    return contents.slice(0, match.index) + `${key}=${value}` + contents.slice(match.index + match[0].length)
  }

  const separator = contents.length > 0 && !contents.endsWith('\n') ? newline : ''
  const ending = contents.endsWith('\n') ? newline : ''
  return `${contents}${separator}${key}=${value}${ending}`
}

function waitForAuthorizationCode(server, expectedState) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Waktu tunggu persetujuan OAuth habis.')), 5 * 60 * 1000)

    server.on('request', (request, response) => {
      const callback = new URL(request.url ?? '/', CALLBACK_URL)
      if (callback.pathname !== '/') {
        response.writeHead(404).end()
        return
      }

      if (callback.searchParams.get('state') !== expectedState) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('State OAuth tidak valid.')
        clearTimeout(timeout)
        reject(new Error('State OAuth tidak valid; callback ditolak.'))
        return
      }

      const providerError = callback.searchParams.get('error')
      if (providerError) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
          .end('Persetujuan Google dibatalkan atau ditolak. Kamu dapat menutup halaman ini.')
        clearTimeout(timeout)
        reject(new Error('Persetujuan Google dibatalkan atau ditolak.'))
        return
      }

      const code = callback.searchParams.get('code')
      if (!code) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Authorization code tidak ditemukan.')
        clearTimeout(timeout)
        reject(new Error('Google tidak mengembalikan authorization code.'))
        return
      }

      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      }).end('Persetujuan berhasil. Kamu dapat menutup halaman ini dan kembali ke terminal.')
      clearTimeout(timeout)
      resolve(code)
    })
  })
}

async function exchangeAuthorizationCode(code, clientId, clientSecret) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: CALLBACK_URL,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error(`Google menolak pertukaran authorization code (HTTP ${response.status}). Periksa OAuth client dan redirect URI.`)
  }

  const token = await response.json()
  if (typeof token.refresh_token !== 'string' || token.refresh_token.length === 0) {
    throw new Error('Google tidak mengembalikan refresh token. Pastikan access_type=offline dan prompt=consent, lalu coba lagi.')
  }
  return token.refresh_token
}

async function main() {
  const contents = await readFile(DEV_VARS_PATH, 'utf8')
  const clientId = readDevVar(contents, 'GOOGLE_OAUTH_CLIENT_ID')
  const clientSecret = readDevVar(contents, 'GOOGLE_OAUTH_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error(`Isi GOOGLE_OAUTH_CLIENT_ID dan GOOGLE_OAUTH_CLIENT_SECRET di ${DEV_VARS_PATH} terlebih dahulu.`)
  }

  const state = randomBytes(32).toString('base64url')
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(CALLBACK_PORT, CALLBACK_HOST, resolve)
  })

  try {
    const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authorizationUrl.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: CALLBACK_URL,
      response_type: 'code',
      scope: GMAIL_SEND_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      state,
    }).toString()

    console.log('Buka URL berikut, lalu setujui akses Gmail:')
    console.log(authorizationUrl.toString())
    console.log(`Menunggu callback lokal di ${CALLBACK_URL} (maksimal 5 menit)...`)

    const code = await waitForAuthorizationCode(server, state)
    const refreshToken = await exchangeAuthorizationCode(code, clientId, clientSecret)
    const latestContents = await readFile(DEV_VARS_PATH, 'utf8')
    await writeFile(DEV_VARS_PATH, upsertDevVar(latestContents, 'GOOGLE_OAUTH_REFRESH_TOKEN', refreshToken), 'utf8')
    console.log(`Refresh token tersimpan di ${DEV_VARS_PATH}. Nilainya tidak ditampilkan.`)
  } finally {
    server.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Gagal memperoleh refresh token: ${error.message}`)
    process.exitCode = 1
  })
}
