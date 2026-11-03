const localHostnames = new Set(['localhost', '127.0.0.1'])

function isLocalOrigin(url: URL): boolean {
  return isLocalAuthHostname(url.hostname)
}

export function isLocalAuthHostname(hostname: string): boolean {
  return localHostnames.has(hostname)
}

export function isValidAuthBaseURL(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || (url.protocol === 'http:' && isLocalOrigin(url)))
      && Boolean(url.hostname)
      && !url.username
      && !url.password
      && url.pathname === '/'
      && !url.search
      && !url.hash
  } catch {
    return false
  }
}

export interface AuthOriginConfig {
  baseURL: string
  trustedOrigins: string[]
  allowedHostnames: string[]
}

export function resolveAuthOrigins(configuredBaseURL: string | undefined, requestOrigin: string): AuthOriginConfig {
  const requestURL = new URL(requestOrigin)
  if (configuredBaseURL && !isValidAuthBaseURL(configuredBaseURL)) {
    throw new TypeError('BETTER_AUTH_URL must be a valid HTTPS origin or a local development origin.')
  }
  if (!configuredBaseURL && !isLocalOrigin(requestURL)) {
    throw new TypeError('BETTER_AUTH_URL is required for public requests.')
  }

  const configuredURL = configuredBaseURL ? new URL(configuredBaseURL) : undefined
  if (configuredURL && isLocalOrigin(configuredURL) && !isLocalOrigin(requestURL)) {
    throw new TypeError('A local BETTER_AUTH_URL may only be used for local requests.')
  }

  const isLocalRequest = isLocalOrigin(requestURL)
  const isLocalConfiguration = configuredURL ? isLocalOrigin(configuredURL) : isLocalRequest
  const useRequestOrigin = isLocalRequest
    && isLocalConfiguration
    && (!configuredURL || requestURL.protocol === configuredURL.protocol)
  const baseURL = useRequestOrigin ? requestURL.origin : configuredURL?.origin ?? requestURL.origin
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
    allowedHostnames: isLocalConfiguration
      ? [...localHostnames]
      : [configuredURL?.hostname ?? requestURL.hostname],
  }
}
