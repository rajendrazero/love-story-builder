import { defineEventHandler, toWebRequest } from 'h3'
import { createAuth } from '../../utils/auth'

export default defineEventHandler((event) => createAuth(event).handler(toWebRequest(event)))
