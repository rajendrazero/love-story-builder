<template>
  <header class="site-nav-shell">
    <nav class="site-nav" aria-label="Navigasi utama">
      <NuxtLink to="/" class="site-nav-brand">selamanya<span>.</span></NuxtLink>
      <div class="site-nav-links">
        <NuxtLink to="/templates" :aria-current="route.path === '/templates' ? 'page' : undefined">Template</NuxtLink>
        <NuxtLink to="/preview" :aria-current="route.path === '/preview' ? 'page' : undefined">Preview</NuxtLink>
        <NuxtLink
          v-if="session?.user"
          to="/account"
          :aria-current="route.path === '/account' ? 'page' : undefined"
        >Akun saya</NuxtLink>
        <NuxtLink
          v-if="session?.user"
          to="/studio"
          :aria-current="route.path === '/studio' ? 'page' : undefined"
        >Studio</NuxtLink>
        <button
          v-if="session?.user"
          type="button"
          class="site-nav-logout"
          :disabled="signingOut"
          @click="signOut"
        >
          <span v-if="signingOut" class="loading-spinner" aria-hidden="true" />
          {{ signingOut ? 'Keluar…' : 'Keluar' }}
        </button>
        <template v-else>
          <NuxtLink to="/login" :aria-current="route.path === '/login' ? 'page' : undefined">Masuk</NuxtLink>
          <NuxtLink to="/register" class="site-nav-cta" :aria-current="route.path === '/register' ? 'page' : undefined">Daftar ↗</NuxtLink>
        </template>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { createAuthClient } from 'better-auth/vue'

const route = useRoute()
const authClient = createAuthClient()
const { data: session } = await authClient.useSession(useFetch)
const { success, error: notifyError } = useNotifications()
const signingOut = ref(false)

async function signOut() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    const result = await authClient.signOut()
    if (result.error) throw new Error(result.error.message || 'Belum berhasil keluar dari akun.')
    const userId = session.value?.user?.id
    if (userId) {
      localStorage.removeItem(`selamanya:${userId}:draft-ref`)
      localStorage.removeItem(`selamanya:${userId}:draft-content`)
    }
    success('Kamu sudah keluar dari akun.')
    await navigateTo('/login')
  } catch (caught) {
    notifyError(caught instanceof Error ? caught.message : 'Belum berhasil keluar dari akun.')
  } finally {
    signingOut.value = false
  }
}
</script>

<style scoped>
.site-nav-shell {
  position: sticky;
  top: 0;
  z-index: 40;
  padding-inline: clamp(1rem, 5vw, 5rem);
  border-bottom: 1px solid rgb(32 29 40 / 8%);
  background: rgb(247 244 237 / 92%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.site-nav {
  display: flex;
  width: min(100%, 90rem);
  min-height: 4.25rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-inline: auto;
}

.site-nav-brand {
  flex: 0 0 auto;
  color: #201d28;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  text-decoration: none;
}

.site-nav-brand span {
  color: #5045f5;
}

.site-nav-links {
  display: flex;
  align-items: center;
  gap: clamp(0.65rem, 2.4vw, 1.7rem);
  font-size: 0.76rem;
}

.site-nav-links a {
  color: #514d57;
  text-decoration: none;
  white-space: nowrap;
}

.site-nav-links a[aria-current='page'] {
  color: #5045f5;
  font-weight: 700;
}

.site-nav-links .site-nav-cta {
  border-radius: 999px;
  padding: 0.7rem 1rem;
  color: #fff;
  background: #5045f5;
}

.site-nav-logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid rgb(32 29 40 / 16%);
  border-radius: 999px;
  padding: 0.6rem 0.85rem;
  color: #514d57;
  background: transparent;
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
}

.site-nav-logout:disabled {
  cursor: wait;
  opacity: 0.65;
}

@media (max-width: 560px) {
  .site-nav {
    min-height: 3.8rem;
  }

  .site-nav-brand {
    font-size: 1rem;
  }

  .site-nav-links {
    gap: 0.55rem;
    font-size: 0.64rem;
  }

  .site-nav-links .site-nav-cta {
    padding: 0.58rem 0.72rem;
  }

  .site-nav-logout {
    gap: 0.25rem;
    padding: 0.5rem 0.55rem;
  }
}

@media (max-width: 390px) {
  .site-nav-shell {
    padding-inline: 0.65rem;
  }

  .site-nav-links {
    gap: 0.4rem;
    font-size: 0.6rem;
  }
}
</style>
