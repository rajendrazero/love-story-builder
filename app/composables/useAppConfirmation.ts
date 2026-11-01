import type { InjectionKey } from 'vue'

export interface AppConfirmationOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
}

export type AppConfirmation = (options: AppConfirmationOptions) => Promise<boolean>

export const appConfirmationKey: InjectionKey<AppConfirmation> = Symbol('app-confirmation')

export function useAppConfirmation(): AppConfirmation {
  const confirm = inject(appConfirmationKey)
  if (!confirm) throw new Error('Dialog konfirmasi aplikasi belum tersedia.')
  return confirm
}
