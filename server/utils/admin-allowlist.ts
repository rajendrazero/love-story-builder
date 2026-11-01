export function getAdminEmailAllowlist(value?: string) {
  return value?.split(',').map(email => email.trim().toLowerCase()).filter(Boolean) ?? []
}

export function isAdminEmailAllowed(email: string, allowlist: string[]) {
  return allowlist.includes(email.trim().toLowerCase())
}

export function getUserRole(email: string, adminEmails?: string): 'admin' | 'user' {
  return isAdminEmailAllowed(email, getAdminEmailAllowlist(adminEmails)) ? 'admin' : 'user'
}
