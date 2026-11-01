import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isCloudinaryImageOwnedBy,
  isCloudinaryImageUrl,
} from '../server/utils/cloudinary-library.ts'

test('accepts HTTPS Cloudinary image upload URLs', () => {
  assert.equal(
    isCloudinaryImageUrl('https://res.cloudinary.com/example/image/upload/v123/photo.jpg'),
    true,
  )
})

test('scopes upload-library URLs to the configured cloud and owner folder', () => {
  const folder = 'kekasih/owner-hash'
  assert.equal(
    isCloudinaryImageOwnedBy(
      'https://res.cloudinary.com/example/image/upload/v123/kekasih/owner-hash/photo.jpg',
      'example',
      folder,
    ),
    true,
  )
  assert.equal(
    isCloudinaryImageOwnedBy(
      'https://res.cloudinary.com/example/image/upload/v123/kekasih/another-owner/photo.jpg',
      'example',
      folder,
    ),
    false,
  )
  assert.equal(
    isCloudinaryImageOwnedBy(
      'https://res.cloudinary.com/other-cloud/image/upload/v123/kekasih/owner-hash/photo.jpg',
      'example',
      folder,
    ),
    false,
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
