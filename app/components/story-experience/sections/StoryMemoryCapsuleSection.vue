<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { StoryContent } from '#shared/schema/story'
import type { StorySectionConfig } from '#shared/story-sections'
import { getUserFacingError } from '#shared/utils/user-facing-error'

const props = defineProps<{
  story: StoryContent
  config: StorySectionConfig
  storySlug?: string
  storyPassword?: string
}>()

const templateId = computed(() => props.story.templateId ?? 'editorial-rose')
const capsule = computed(() => props.story.sectionContent?.memoryCapsule)
const capsuleMessage = shallowRef('')
const capsuleError = shallowRef('')
const loadingCapsule = shallowRef(false)
const formattedCapsuleDate = computed(() => formatDate(capsule.value?.unlockDate))

function formatDate(value: string | undefined): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`))
}

async function openCapsule(): Promise<void> {
  if (!props.storySlug) {
    capsuleError.value = 'Kapsul dapat dibuka dari halaman cerita setelah diterbitkan.'
    return
  }
  loadingCapsule.value = true
  capsuleError.value = ''
  try {
    const result = await $fetch<{ title: string, message: string, unlockDate: string }>(
      `/api/stories/${encodeURIComponent(props.storySlug)}/capsules/memory-capsule`,
      {
        method: 'POST',
        body: props.storyPassword ? { password: props.storyPassword } : {},
      },
    )
    capsuleMessage.value = result.message
  } catch (caught) {
    capsuleError.value = getUserFacingError(caught, {
      title: 'Kapsul belum bisa dibuka',
      fallback: 'Periksa tanggal buka dan sandi cerita, lalu coba lagi.',
      location: 'Cerita · Kapsul kenangan',
    }).message
  } finally {
    loadingCapsule.value = false
  }
}
</script>

<template>
  <section
    class="story-screen story-creative-section creative-memory-capsule"
    :class="`template-${templateId}`"
    :data-story-section="config.type"
    :data-section-variant="config.variant"
    :data-scroll-effect="config.animation.scroll"
  >
    <div class="creative-frame capsule-content">
      <p class="creative-eyebrow">Untuk dibuka pada {{ formattedCapsuleDate }}</p>
      <h2>{{ capsule?.title }}</h2>
      <p v-if="capsuleMessage" class="capsule-message">{{ capsuleMessage }}</p>
      <template v-else>
        <p class="capsule-seal" aria-hidden="true">✦</p>
        <button type="button" class="capsule-open" :disabled="loadingCapsule" @click="openCapsule">
          {{ loadingCapsule ? 'Memeriksa tanggal…' : 'Coba buka kapsul' }}
        </button>
        <p v-if="capsuleError" class="capsule-error" role="alert">{{ capsuleError }}</p>
      </template>
    </div>
  </section>
</template>

<style scoped>
.story-creative-section {
  display: grid;
  align-items: center;
  padding-inline: var(--screen-pad);
  background: #e7ddd4;
  color: #201d28;
  text-align: center;
}

.creative-frame {
  width: min(100%, 74rem);
  margin-inline: auto;
}

.capsule-content {
  max-width: 48rem;
}

.creative-eyebrow {
  margin: 0;
  color: #9c6257;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.capsule-content h2 {
  margin: 0.6rem 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2rem, 5vw, 4.5rem);
  font-weight: 400;
  line-height: 0.98;
}

.capsule-seal {
  margin: 1.5rem 0;
  color: #9c6257;
  font-size: 3rem;
}

.capsule-open {
  min-height: 2.75rem;
  border: 1px solid #342923;
  border-radius: 999px;
  padding: 0.7rem 1.2rem;
  color: #342923;
  background: transparent;
  cursor: pointer;
}

.capsule-open:disabled {
  opacity: 0.65;
  cursor: progress;
}

.capsule-error {
  margin-top: 1rem;
  color: #8f1d18;
}

.capsule-message {
  margin-top: 2rem;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.35rem, 3vw, 2rem);
  line-height: 1.55;
  white-space: pre-wrap;
}

.creative-memory-capsule[data-section-variant='time-lock'] .capsule-content {
  border: 1px solid rgb(156 98 87 / 38%);
  padding: clamp(1.5rem, 5vw, 3rem);
}
</style>
