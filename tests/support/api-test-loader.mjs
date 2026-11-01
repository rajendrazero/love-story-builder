import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export function resolve(specifier, context, nextResolve) {
  if (specifier === 'h3') {
    return {
      url: new URL('./h3-test-double.mjs', import.meta.url).href,
      shortCircuit: true,
    }
  }

  if (specifier.endsWith('/require-user') || specifier === './require-user') {
    return {
      url: new URL('./auth-test-double.mjs', import.meta.url).href,
      shortCircuit: true,
    }
  }

  if (specifier.endsWith('/admin-auth')) {
    return {
      url: new URL('./auth-test-double.mjs', import.meta.url).href,
      shortCircuit: true,
    }
  }

  if (specifier === './auth' && context.parentURL?.endsWith('/require-user.ts')) {
    return {
      url: new URL('./auth-test-double.mjs', import.meta.url).href,
      shortCircuit: true,
    }
  }

  if (specifier.startsWith('#shared/')) {
    const sharedPath = specifier.slice('#shared/'.length)
    return {
      url: new URL(`../../shared/${sharedPath}.ts`, import.meta.url).href,
      shortCircuit: true,
    }
  }

  if (specifier.startsWith('.') && context.parentURL?.startsWith(new URL('../../', import.meta.url).href)) {
    const resolvedUrl = new URL(specifier, context.parentURL)
    if (!resolvedUrl.pathname.endsWith('.ts') && !resolvedUrl.pathname.endsWith('.mjs')) {
      const typedUrl = new URL(`${resolvedUrl.href}.ts`)
      if (existsSync(fileURLToPath(typedUrl))) {
        return { url: typedUrl.href, shortCircuit: true }
      }
    }
  }

  return nextResolve(specifier, context)
}
