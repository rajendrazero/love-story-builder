import type { D1Database } from './cloudflare'
import { getUserRole } from './admin-allowlist.ts'

export async function seedUserRole(
  database: D1Database,
  userId: string,
  email: string,
  adminEmails?: string,
): Promise<'admin' | 'user'> {
  const role = getUserRole(email, adminEmails)
  await database.prepare(
    'INSERT INTO user_roles (user_id, role) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET role = excluded.role',
  ).bind(userId, role).run()

  const savedRole = await database.prepare(
    'SELECT role FROM user_roles WHERE user_id = ?',
  ).bind(userId).first<{ role: string }>()
  if (savedRole?.role !== role) {
    throw new Error('Role akun tidak berhasil disimpan.')
  }
  return role
}
