export async function verifyBootstrapToken(candidate: string | undefined, expected: string | undefined): Promise<boolean> {
  if (!candidate || candidate.length > 512 || !expected || expected.length < 32) return false

  const encoder = new TextEncoder()
  const [candidateHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(candidate)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  const candidateBytes = new Uint8Array(candidateHash)
  const expectedBytes = new Uint8Array(expectedHash)
  let difference = 0
  for (let index = 0; index < expectedBytes.length; index++) {
    difference |= candidateBytes[index]! ^ expectedBytes[index]!
  }
  return difference === 0
}
