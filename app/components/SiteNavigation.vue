<template>
  <header class="site-nav-shell">
    <nav class="site-nav" aria-label="Navigasi utama" @keydown.esc.prevent.stop="closeMobileMenu(true)">
      <NuxtLink to="/" class="site-nav-brand">selamanya<span>.</span></NuxtLink>
      <button
        ref="menuToggle"
        class="site-nav-menu-toggle"
        type="button"
        aria-controls="site-navigation-links"
        :aria-expanded="mobileMenuOpen"
        :aria-label="mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <span aria-hidden="true">{{ mobileMenuOpen ? '×' : '☰' }}</span>
      </button>
      <div id="site-navigation-links" class="site-nav-links" :class="{ 'site-nav-links-open': mobileMenuOpen }">
        <NuxtLink to="/templates" :aria-current="route.path === '/templates' ? 'page' : undefined" @click="closeMobileMenu(true)">Template</NuxtLink>
        <NuxtLink to="/preview" :aria-current="route.path === '/preview' ? 'page' : undefined" @click="closeMobileMenu(true)">Preview</NuxtLink>
        <NuxtLink
          v-if="session?.user"
          to="/account"
          :aria-current="route.path === '/account' ? 'page' : undefined"
          @click="closeMobileMenu(true)"
        >Akun saya</NuxtLink>
        <NuxtLink
          v-if="session?.user"
          to="/studio"
          :aria-current="route.path === '/studio' ? 'page' : undefined"
          @click="closeMobileMenu(true)"
        >Studio</NuxtLink>
        <AppButton
          v-if="session?.user"
          variant="secondary"
          size="sm"
          type="button"
          class="site-nav-logout"
          :disabled="signingOut"
          :loading="signingOut"
          @click="closeMobileMenu(true); signOut()"
        >
          {{ signingOut ? 'Keluar…' : 'Keluar' }}
        </AppButton>
        <template v-else>
          <NuxtLink to="/login" :aria-current="route.path === '/login' ? 'page' : undefined" @click="closeMobileMenu(true)">Masuk</NuxtLink>
          <NuxtLink to="/register" class="site-nav-cta" :aria-current="route.path === '/register' ? 'page' : undefined" @click="closeMobileMenu(true)">Daftar ↗</NuxtLink>
        </template>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import AppButton from './AppButton.vue'
import { createAuthClient } from 'better-auth/vue'
import { ref, useTemplateRef } from 'vue'

const route = useRoute()
const mobileMenuOpen = ref(false)
const menuToggle = useTemplateRef<HTMLButtonElement>('menuToggle')
const authClient = createAuthClient()
const { data: session } = await authClient.useSession(useFetch)
const { success, error: notifyError } = useNotifications()
const signingOut = ref(false)

function closeMobileMenu(restoreFocus = false) {
  if (!mobileMenuOpen.value) return
  mobileMenuOpen.value = false
  if (restoreFocus) {
    void nextTick(() => menuToggle.value?.focus())
  }
}

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
  color: var(--color-foreground);
  font-family: var(--font-family-editorial);
  font-size: 1.15rem;
  font-weight: 700;
  text-decoration: none;
}

.site-nav-brand span {
  color: var(--color-primary);
}

.site-nav-links {
  display: flex;
  align-items: center;
  gap: clamp(0.65rem, 2.4vw, 1.7rem);
  font-size: 0.76rem;
}

.site-nav-menu-toggle {
  display: none;
}

.site-nav-links a {
  color: var(--color-muted-foreground);
  text-decoration: none;
  white-space: nowrap;
}

.site-nav-links a[aria-current='page'] {
  color: var(--color-primary);
  font-weight: 700;
}

.site-nav-links .site-nav-cta {
  border-radius: var(--radius-full);
  padding: 0.7rem 1rem;
  color: #fff;
  background: var(--color-primary);
}

.site-nav-logout {
  gap: 0.4rem;
  padding: 0.6rem 0.85rem;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .site-nav {
    position: relative;
    min-height: 3.8rem;
  }

  .site-nav-brand {
    font-size: 1rem;
  }

  .site-nav-links {
    position: absolute;
    top: calc(100% + 0.35rem);
    right: 0;
    left: 0;
    z-index: 1;
    display: none;
    align-items: stretch;
    gap: 0.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-large);
    padding: var(--space-2);
    background: var(--color-surface);
    box-shadow: var(--shadow-medium);
    font-size: 0.875rem;
  }

  .site-nav-links-open {
    display: grid;
  }

  .site-nav-links > a {
    display: flex;
    min-height: 2.75rem;
    align-items: center;
    border-radius: var(--radius-small);
    padding-inline: var(--space-3);
  }

  .site-nav-menu-toggle {
    display: inline-flex;
    width: 2.75rem;
    height: 2.75rem;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-foreground);
    background: var(--color-surface);
    font: inherit;
    font-size: 1.25rem;
  }

  .site-nav-menu-toggle:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 3px;
  }

  .site-nav-links .site-nav-cta {
    padding: 0.7rem 0.75rem;
  }

  .site-nav-links .site-nav-logout {
    min-height: 2.75rem;
    justify-content: flex-start;
    padding-inline: var(--space-3);
  }
}

@media (max-width: 390px) {
  .site-nav-shell {
    padding-inline: 0.65rem;
  }
}
</style>
