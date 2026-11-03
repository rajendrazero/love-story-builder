export interface UserFacingError {
  title: string
  message: string
  location?: string
}

export interface UserFacingErrorOptions {
  title: string
  fallback: string
  location?: string
}

const fieldLocations: Record<string, { label: string, location: string }> = {
  activeStep: { label: 'Langkah aktif', location: 'Studio cerita' },
  coupleNames: { label: 'Nama pasangan', location: 'Studio · Langkah 1 · Sampul' },
  customSlug: { label: 'Link khusus', location: 'Studio · Langkah 7 · Lagu & privasi' },
  date: { label: 'Tanggal cerita', location: 'Studio · Langkah 1 · Sampul' },
  detailText: { label: 'Cerita momen', location: 'Studio · Langkah 4 · Momen' },
  detailTitle: { label: 'Judul momen', location: 'Studio · Langkah 4 · Momen' },
  finalImage: { label: 'Foto penutup', location: 'Studio · Langkah 6 · Penutup' },
  finalMessage: { label: 'Pesan penutup', location: 'Studio · Langkah 6 · Penutup' },
  gallery: { label: 'Foto galeri', location: 'Studio · Langkah 3 · Galeri' },
  greetingImage: { label: 'Foto ucapan', location: 'Studio · Langkah 2 · Ucapan' },
  greetingText: { label: 'Teks ucapan', location: 'Studio · Langkah 2 · Ucapan' },
  greetingVideoUrl: { label: 'Video ucapan', location: 'Studio · Langkah 2 · Ucapan' },
  heroImage: { label: 'Foto sampul', location: 'Studio · Langkah 1 · Sampul' },
  musicArtist: { label: 'Nama artis', location: 'Studio · Langkah 7 · Lagu & privasi' },
  musicTitle: { label: 'Judul lagu', location: 'Studio · Langkah 7 · Lagu & privasi' },
  musicUrl: { label: 'URL musik', location: 'Studio · Langkah 7 · Lagu & privasi' },
  password: { label: 'Sandi cerita', location: 'Studio · Langkah 7 · Lagu & privasi' },
  secondImage: { label: 'Foto momen', location: 'Studio · Langkah 4 · Momen' },
  storyPages: { label: 'Bab cerita', location: 'Studio · Langkah 5 · Bab cerita' },
  templateDetails: { label: 'Detail template', location: 'Studio · Langkah 1 · Sampul' },
  templateId: { label: 'Template', location: 'Studio · Langkah 1 · Sampul' },
  title: { label: 'Judul cerita', location: 'Studio · Langkah 1 · Sampul' },
}

const statusMessages: Record<number, string> = {
  401: 'Sesi akun tidak aktif. Masuk kembali, lalu ulangi tindakan ini.',
  403: 'Akun ini tidak memiliki izin untuk melakukan tindakan tersebut.',
  404: 'Data yang diminta tidak ditemukan atau sudah tidak tersedia.',
  409: 'Data berubah atau bertentangan dengan data yang tersimpan. Muat ulang, lalu coba lagi.',
  413: 'Ukuran data terlalu besar. Kurangi ukuran file atau jumlah konten, lalu coba lagi.',
  429: 'Terlalu banyak percobaan dalam waktu singkat. Tunggu sebentar, lalu coba lagi.',
  503: 'Layanan penyimpanan belum siap. Coba lagi beberapa saat atau hubungi admin jika masalah berlanjut.',
}

const validationMessage = 'Data belum memenuhi format yang diminta. Periksa isian yang ditandai, lalu coba lagi.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getFieldErrors(error: unknown): Record<string, unknown> | undefined {
  if (!isRecord(error)) return undefined

  const response = isRecord(error.data) ? error.data : undefined
  const nested = response && isRecord(response.data) ? response.data : response
  const fieldErrors = nested && isRecord(nested.fieldErrors) ? nested.fieldErrors : undefined
  return fieldErrors && Object.keys(fieldErrors).length ? fieldErrors : undefined
}

function getMessage(error: unknown): string | undefined {
  if (!isRecord(error)) return undefined

  const response = isRecord(error.data) ? error.data : undefined
  const responseMessage = response && typeof response.message === 'string' ? response.message : undefined
  const statusMessage = typeof error.statusMessage === 'string' ? error.statusMessage : undefined
  const message = typeof error.message === 'string' ? error.message : undefined
  return responseMessage || statusMessage || message
}

function getStatusCode(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined
  const response = isRecord(error.data) ? error.data : undefined
  const statusCode = error.statusCode ?? error.status ?? response?.statusCode
  return typeof statusCode === 'number' ? statusCode : undefined
}

export function getUserFacingError(
  error: unknown,
  options: UserFacingErrorOptions,
): UserFacingError {
  const fieldErrors = getFieldErrors(error)
  if (fieldErrors) {
    const fields = Object.keys(fieldErrors)
    const firstField = fieldLocations[fields[0] ?? '']
    const location = firstField?.location ?? options.location
    const labels = fields.map(field => fieldLocations[field]?.label ?? 'Isian')
    const message = fields.includes('customSlug')
      ? 'Gunakan 3–32 huruf kecil atau angka. Pisahkan kata hanya dengan satu tanda hubung; spasi dan simbol lain tidak diperbolehkan.'
      : `${labels.join(', ')}: periksa kembali format dan batas karakter isian.`

    return {
      title: options.title,
      message,
      location,
    }
  }

  const statusCode = getStatusCode(error)
  const candidate = getMessage(error)
  const isNetworkMessage = candidate
    ? /^(fetch failed|failed to fetch|network request failed)$/i.test(candidate.trim())
    : false
  const isInternalMessage = candidate
    ? /^(internal server error|request failed)$/i.test(candidate.trim())
    : false
  const isGenericHttpMessage = candidate
    ? /^(bad request|unauthorized|forbidden|not found|conflict|payload too large|too many requests)$/i.test(candidate.trim())
    : false

  let message = options.fallback
  if (statusCode === 503) {
    message = statusMessages[statusCode]!
  } else if (statusCode && statusCode >= 500) {
    message = 'Terjadi gangguan pada server. Coba lagi beberapa saat; perubahan yang belum tersimpan tetap ada di browser.'
  } else if (error instanceof TypeError || isNetworkMessage) {
    message = 'Tidak dapat terhubung ke layanan. Periksa koneksi internet, lalu coba lagi.'
  } else if (candidate && !isInternalMessage && !isGenericHttpMessage) {
    message = candidate
  } else if (statusCode && statusMessages[statusCode]) {
    message = statusMessages[statusCode]!
  } else if (statusCode === 400 || statusCode === 422) {
    message = validationMessage
  }

  return {
    title: options.title,
    message,
    location: options.location,
  }
}
