import { createError, defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  throw createError({
    statusCode: 410,
    statusMessage: 'Endpoint tanda tangan upload sudah diganti. Gunakan endpoint unggah foto.',
  })
})
