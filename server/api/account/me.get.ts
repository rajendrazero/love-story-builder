import { defineEventHandler } from 'h3'
import { requireUser } from '../../utils/require-user'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return { id: user.id, name: user.name, email: user.email }
})
