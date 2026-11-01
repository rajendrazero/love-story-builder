import assert from 'node:assert/strict'
import test from 'node:test'
import { isCloudinaryImageUrl } from '../server/utils/cloudinary-library.ts'

test('accepts HTTPS Cloudinary image upload URLs', () => {
  assert.equal(
    isCloudinaryImageUrl('https://res.cloudinary.com/example/image/upload/v123/photo.jpg'),
    true,
  )
})

test('rejects non-Cloudinary, insecure, credentialed, and non-image URLs', () => {
  for (const url of [
    'http://res.cloudinary.com/example/image/upload/photo.jpg',
    'https://example.com/image/upload/photo.jpg',
    'https://res.cloudinary.com.example.com/example/image/upload/photo.jpg',
    'https://user:pass@res.cloudinary.com/example/image/upload/photo.jpg',
    'https://res.cloudinary.com/example/video/upload/video.mp4',
    'not a URL',
  ]) {
    assert.equal(isCloudinaryImageUrl(url), false, url)
  }
})
