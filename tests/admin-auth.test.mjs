import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getAdminEmailAllowlist, getUserRole, isAdminEmailAllowed } from '../server/utils/admin-allowlist.ts'
import { seedUserRole } from '../server/utils/admin-role.ts'

test('normalizes admin email allowlists and promotes only matching addresses', () => {
  const adminEmails = ' Admin@Example.com, , owner@example.com '
  const allowlist = getAdminEmailAllowlist(adminEmails)

  assert.deepEqual(allowlist, ['admin@example.com', 'owner@example.com'])
  assert.equal(isAdminEmailAllowed('ADMIN@example.com', allowlist), true)
  assert.equal(getUserRole('ADMIN@example.com', adminEmails), 'admin')
  assert.equal(getUserRole('user@example.com', adminEmails), 'user')
  assert.equal(getUserRole('admin@example.com.evil', adminEmails), 'user')
  assert.equal(getUserRole('admin@example.com'), 'user')
})

test('seeds the configured admin role idempotently without changing other users', async () => {
  const savedRoles = new Map()
  const database = {
    prepare(query) {
      let parameters = []
      return {
        bind(...values) {
          parameters = values
          return this
        },
        async run() {
          if (query.startsWith('INSERT INTO user_roles')) {
            savedRoles.set(parameters[0], parameters[1])
          }
          return { meta: { changes: 1 } }
        },
        async first() {
          return { role: savedRoles.get(parameters[0]) }
        },
      }
    },
  }

  assert.equal(await seedUserRole(database, 'admin-1', 'Admin@Example.com', 'admin@example.com'), 'admin')
  assert.equal(await seedUserRole(database, 'user-1', 'user@example.com', 'admin@example.com'), 'user')
  assert.equal(await seedUserRole(database, 'admin-1', 'admin@example.com', 'admin@example.com'), 'admin')
  assert.deepEqual([...savedRoles.entries()], [['admin-1', 'admin'], ['user-1', 'user']])
})
