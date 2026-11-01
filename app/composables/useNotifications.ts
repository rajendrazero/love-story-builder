export type NotificationTone = 'success' | 'error' | 'info'

export interface AppNotification {
  id: string
  tone: NotificationTone
  message: string
}

export function useNotifications() {
  const notifications = useState<AppNotification[]>('app-notifications', () => [])

  function notify(tone: NotificationTone, message: string) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    notifications.value = [...notifications.value, { id, tone, message }].slice(-4)
  }

  function dismiss(id: string) {
    notifications.value = notifications.value.filter(item => item.id !== id)
  }

  return {
    notifications,
    notify,
    dismiss,
    success: (message: string) => notify('success', message),
    error: (message: string) => notify('error', message),
    info: (message: string) => notify('info', message),
  }
}
