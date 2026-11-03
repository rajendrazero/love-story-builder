import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getUserFacingError } from '../shared/utils/user-facing-error.ts'

test('explains invalid custom slugs and points to their studio location', () => {
  const result = getUserFacingError({
    statusCode: 400,
    statusMessage: 'Isi draft tidak valid.',
    data: {
      error: true,
      message: 'Isi draft tidak valid.',
      data: {
        formErrors: [],
        fieldErrors: { customSlug: ['Invalid input'] },
      },
    },
  }, {
    title: 'Draft belum tersimpan',
    fallback: 'Draft belum berhasil disimpan.',
  })

  assert.equal(result.title, 'Draft belum tersimpan')
  assert.equal(result.location, 'Studio · Langkah 7 · Lagu & privasi')
  assert.match(result.message, /3–32/)
  assert.match(result.message, /spasi/)
})

test('does not expose server exception details for server errors', () => {
  const result = getUserFacingError({
    statusCode: 500,
    message: 'SQL connection string leaked',
  }, {
    title: 'Data belum dimuat',
    fallback: 'Coba lagi.',
    location: 'Halaman akun',
  })

  assert.equal(result.location, 'Halaman akun')
  assert.doesNotMatch(result.message, /SQL|connection string/i)
  assert.match(result.message, /gangguan pada server/i)
})

test('provides a connection hint for network failures', () => {
  const result = getUserFacingError(new TypeError('Failed to fetch'), {
    title: 'Foto belum diunggah',
    fallback: 'Unggah lagi.',
    location: 'Foto sampul',
  })

  assert.equal(result.location, 'Foto sampul')
  assert.match(result.message, /koneksi internet/i)
})

test('preserves useful application messages and localizes generic field errors', () => {
  const applicationError = getUserFacingError(new Error('Email belum diverifikasi.'), {
    title: 'Tidak dapat masuk',
    fallback: 'Coba lagi.',
  })
  const fieldError = getUserFacingError({
    data: { data: { fieldErrors: { title: ['Too big'] } } },
  }, {
    title: 'Cerita belum tersimpan',
    fallback: 'Coba lagi.',
  })

  assert.equal(applicationError.message, 'Email belum diverifikasi.')
  assert.equal(fieldError.location, 'Studio · Langkah 1 · Sampul')
  assert.match(fieldError.message, /Judul cerita/)
  assert.doesNotMatch(fieldError.message, /Too big/)
})

test('replaces generic HTTP status text with an actionable validation hint', () => {
  const result = getUserFacingError({
    statusCode: 400,
    statusMessage: 'Bad Request',
  }, {
    title: 'Permintaan belum berhasil',
    fallback: 'Coba lagi.',
  })

  assert.match(result.message, /Periksa isian yang ditandai/)
  assert.doesNotMatch(result.message, /Bad Request/)
})

test('preserves a specific password error instead of treating it as an expired account session', () => {
  const result = getUserFacingError({
    statusCode: 401,
    statusMessage: 'Sandi yang kamu masukkan belum tepat.',
  }, {
    title: 'Cerita belum bisa dibuka',
    fallback: 'Periksa sandi.',
    location: 'Halaman cerita · Verifikasi sandi',
  })

  assert.equal(result.message, 'Sandi yang kamu masukkan belum tepat.')
})
