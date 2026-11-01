export function createError(options) {
  return Object.assign(new Error(options.statusMessage), options)
}

export function defineEventHandler(handler) {
  return handler
}

export function getRouterParam(event, name) {
  return event.context.params?.[name]
}

export async function readBody(event) {
  if (Object.hasOwn(event.context, 'body')) return event.context.body
  return event.request.json()
}

export function setResponseHeader(event, name, value) {
  event.context.responseHeaders.set(name, String(value))
}

export function getHeader(event, name) {
  return event.request.headers.get(name) ?? undefined
}

export function getRequestHeaders(event) {
  return Object.fromEntries(event.request.headers)
}

export function getRequestURL(event) {
  return new URL(event.request.url)
}

export function toWebRequest(event) {
  return event.request
}
