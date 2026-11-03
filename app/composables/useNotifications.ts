import type { UserFacingError } from '#shared/utils/user-facing-error'

export type NotificationTone = 'success' | 'error' | 'info'

export interface AppNotification {
  id: string
  tone: NotificationTone
  title: string
  message: string
  location?: string
}

export function useNotifications() {
  const notifications = useState<AppNotification[]>('app-notifications', () => [])

  function notify(
    tone: NotificationTone,
    message: string,
    details: { title?: string, location?: string } = {},
  ) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    const defaultTitle = tone === 'success' ? 'Berhasil' : tone === 'error' ? 'Perlu perhatian' : 'Informasi'
    notifications.value = [...notifications.value, {
      id,
      tone,
      title: details.title ?? defaultTitle,
      message,
      location: details.location,
    }].slice(-4)
  }

  function dismiss(id: string) {
    notifications.value = notifications.value.filter(item => item.id !== id)
  }

  function error(message: string | UserFacingError) {
    if (typeof message === 'string') {
      notify('error', message)
      return
    }
    notify('error', message.message, { title: message.title, location: message.location })
  }

  return {
    notifications,
    notify,
    dismiss,
    success: (message: string) => notify('success', message),
    error,
    info: (message: string) => notify('info', message),
  }
}
