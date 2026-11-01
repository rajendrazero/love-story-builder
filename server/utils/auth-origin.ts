const localHostnames = new Set(['localhost', '127.0.0.1'])

function isLocalOrigin(url: URL): boolean {
  return localHostnames.has(url.hostname)
}

export interface AuthOriginConfig {
  baseURL: string
  trustedOrigins: string[]
  allowedHostnames: string[]
}

export function resolveAuthOrigins(configuredBaseURL: string | undefined, requestOrigin: string): AuthOriginConfig {
  const requestURL = new URL(requestOrigin)
  const configuredURL = new URL(configuredBaseURL || requestURL.origin)
  const isLocalRequest = isLocalOrigin(requestURL)
  const isLocalConfiguration = isLocalOrigin(configuredURL)
  const useRequestOrigin = isLocalRequest
    && isLocalConfiguration
    && requestURL.protocol === configuredURL.protocol
  const baseURL = useRequestOrigin ? requestURL.origin : configuredURL.origin
  const base = new URL(baseURL)
  const localOrigins = isLocalConfiguration
    ? [...localHostnames].map((hostname) => {
        const origin = new URL(base)
        origin.hostname = hostname
        return origin.origin
      })
    : []

  return {
    baseURL,
    trustedOrigins: [...new Set([baseURL, ...localOrigins])],
    allowedHostnames: isLocalConfiguration ? [...localHostnames] : [configuredURL.hostname],
  }
}
