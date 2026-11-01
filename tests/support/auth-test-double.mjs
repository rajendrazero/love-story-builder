export async function requireUser(event) {
  const user = event.context.testUser
  if (!user?.emailVerified) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
  return user
}

export async function requireAdmin(event) {
  if (!event.context.testAdmin) {
    throw Object.assign(new Error('Forbidden'), { statusCode: 403 })
  }
  return 'admin@example.test'
}

export function createAuth(event) {
  return {
    api: {
      async getSession() {
        return event.context.authSession ?? null
      },
    },
  }
}
