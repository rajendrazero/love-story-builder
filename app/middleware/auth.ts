import { createAuthClient } from 'better-auth/vue'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/setup') return

  const authClient = createAuthClient()
  const { data: session } = await authClient.useSession(useFetch)
  if (!session.value?.user) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
