<script setup lang="ts">
export type AppIconName =
  | 'alert'
  | 'arrow-up-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'check'
  | 'chevron-left'
  | 'chevron-down'
  | 'chevron-up'
  | 'close'
  | 'copy'
  | 'eye'
  | 'eye-off'
  | 'globe'
  | 'image-plus'
  | 'info'
  | 'lock'
  | 'log-out'
  | 'menu'
  | 'move'
  | 'more-horizontal'
  | 'pause'
  | 'play'
  | 'plus'
  | 'refresh'
  | 'search'
  | 'trash'
  | 'upload'

const iconNames: Record<AppIconName, string> = {
  alert: 'lucide:circle-alert',
  'arrow-up-right': 'lucide:arrow-up-right',
  'arrow-up': 'lucide:arrow-up',
  'arrow-down': 'lucide:arrow-down',
  check: 'lucide:check',
  'chevron-left': 'lucide:chevron-left',
  'chevron-down': 'lucide:chevron-down',
  'chevron-up': 'lucide:chevron-up',
  close: 'lucide:x',
  copy: 'lucide:copy',
  eye: 'lucide:eye',
  'eye-off': 'lucide:eye-off',
  globe: 'lucide:globe',
  'image-plus': 'lucide:image-plus',
  info: 'lucide:info',
  lock: 'lucide:lock-keyhole',
  'log-out': 'lucide:log-out',
  menu: 'lucide:menu',
  move: 'lucide:move',
  'more-horizontal': 'lucide:ellipsis',
  pause: 'lucide:pause',
  play: 'lucide:play',
  plus: 'lucide:plus',
  refresh: 'lucide:refresh-cw',
  search: 'lucide:search',
  trash: 'lucide:trash',
  upload: 'lucide:upload',
}

withDefaults(defineProps<{
  name: AppIconName
  size?: number
}>(), {
  size: 20,
})
</script>

<template>
  <Icon
    :name="iconNames[name]"
    :size="size"
    aria-hidden="true"
    focusable="false"
  />
</template>
