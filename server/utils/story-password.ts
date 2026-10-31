import { toHex } from './cloudflare'

export async function hashStoryPassword(password: string): Promise<{ salt: string, hash: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 120_000 },
    key,
    256,
  )
  return { salt: toHex(saltBytes.buffer), hash: toHex(bits) }
}

function fromHex(value: string): ArrayBuffer {
  const buffer = new ArrayBuffer(value.length / 2)
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  }
  return buffer
}

function hashesMatch(actual: string, expected: string): boolean {
  if (actual.length !== expected.length) return false
  let difference = 0
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return difference === 0
}

export async function verifyStoryPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(salt), iterations: 120_000 },
    key,
    256,
  )
  return hashesMatch(toHex(bits), expectedHash)
}
