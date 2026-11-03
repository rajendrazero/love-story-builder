<template>
  <section class="error-alert" role="alert" aria-live="assertive" aria-atomic="true">
    <span class="error-alert-icon"><AppIcon name="alert" :size="17" /></span>
    <div class="error-alert-content">
      <p class="error-alert-title">{{ title }}</p>
      <p v-if="location" class="error-alert-location">{{ location }}</p>
      <p class="error-alert-message">{{ message }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  message: string
  location?: string
}>()
</script>

<style scoped>
.error-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  border: 1px solid #efb4a9;
  border-radius: 1rem;
  padding: 0.9rem 1rem;
  color: #752c25;
  background: #fff2ef;
}

.error-alert-icon {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: white;
  background: #b94b3f;
  font-size: 0.85rem;
  font-weight: 800;
}

.error-alert-content {
  min-width: 0;
}

.error-alert-title,
.error-alert-location,
.error-alert-message {
  margin: 0;
}

.error-alert-title {
  font-size: 0.9rem;
  font-weight: 750;
}

.error-alert-location {
  margin-top: 0.2rem;
  color: #8c4a42;
  font-size: 0.72rem;
  font-weight: 650;
}

.error-alert-message {
  margin-top: 0.3rem;
  font-size: 0.82rem;
  line-height: 1.55;
}
</style>
