export function createRequestId(cloudflareRay: string | undefined): string {
  const candidate = cloudflareRay?.trim()
  return candidate && /^[\w-]{1,100}$/.test(candidate)
    ? candidate
    : crypto.randomUUID()
}
