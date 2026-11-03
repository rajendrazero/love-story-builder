import assert from 'node:assert/strict'
import test from 'node:test'
import {
  cloudinaryPublicIdFromLibraryUrl,
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

test('derives versioned public IDs beneath the authenticated owner folder', () => {
  assert.equal(
    cloudinaryPublicIdFromLibraryUrl(
      'https://res.cloudinary.com/example/image/upload/v123/kekasih/owner-hash/photo.jpg',
      'example',
      'kekasih/owner-hash',
    ),
    'kekasih/owner-hash/photo',
  )
  assert.equal(
    cloudinaryPublicIdFromLibraryUrl(
      'https://res.cloudinary.com/example/image/upload/kekasih/owner-hash/photo.jpg',
      'example',
      'kekasih/owner-hash',
    ),
    null,
  )
  assert.equal(
    cloudinaryPublicIdFromLibraryUrl(
      'https://res.cloudinary.com/example:8443/image/upload/v123/kekasih/owner-hash/photo.jpg',
      'example',
      'kekasih/owner-hash',
    ),
    null,
  )
})

test('derives public IDs for legacy library images in the shared kekasih folder', () => {
  assert.equal(
    cloudinaryPublicIdFromLibraryUrl(
      'https://res.cloudinary.com/dripo32vz/image/upload/v1793494631/kekasih/zh9wynnuucxzf6tbir1c.png',
      'dripo32vz',
      'kekasih/owner-hash',
    ),
    'kekasih/zh9wynnuucxzf6tbir1c',
  )
  assert.equal(
    cloudinaryPublicIdFromLibraryUrl(
      'https://res.cloudinary.com/other-cloud/image/upload/v123/kekasih/photo.png',
      'dripo32vz',
      'kekasih/owner-hash',
    ),
    null,
  )
  assert.equal(
    cloudinaryPublicIdFromLibraryUrl(
      'https://res.cloudinary.com/dripo32vz/image/upload/v123/kekasih/subfolder/photo.png',
      'dripo32vz',
      'kekasih/owner-hash',
    ),
    null,
  )
})

test('rejects non-Cloudinary, insecure, credentialed, and non-image URLs', () => {
  for (const url of [
    'http://res.cloudinary.com/example/image/upload/photo.jpg',
    'https://example.com/image/upload/photo.jpg',
    'https://res.cloudinary.com.example.com/example/image/upload/photo.jpg',
    'https://res.cloudinary.com:8443/example/image/upload/photo.jpg',
    'https://user:pass@res.cloudinary.com/example/image/upload/photo.jpg',
    'https://res.cloudinary.com/example/video/upload/video.mp4',
    'not a URL',
  ]) {
    assert.equal(isCloudinaryImageUrl(url), false, url)
  }
})

test('rejects altered paths, owner-folder prefixes, query strings, and fragments for deletion', () => {
  for (const url of [
    'https://res.cloudinary.com/example/image/upload/v123/kekasih/owner-hash-evil/photo.jpg',
    'https://res.cloudinary.com/example/image/upload/v123/kekasih/other/../owner-hash/photo.jpg',
    'https://res.cloudinary.com/example/image/upload/v123/kekasih/owner-hash/photo.jpg?redirect=other',
    'https://res.cloudinary.com/example/image/upload/v123/kekasih/owner-hash/photo.jpg#other',
  ]) {
    assert.equal(
      cloudinaryPublicIdFromLibraryUrl(url, 'example', 'kekasih/owner-hash'),
      null,
      url,
    )
  }
})
