import { createAuthClient } from 'better-auth/vue'

export default defineNuxtRouteMiddleware(async (to) => {
  const authClient = createAuthClient()
  const { data: session } = await authClient.useSession(useFetch)
  if (!session.value?.user) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
