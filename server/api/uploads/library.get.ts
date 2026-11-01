import { createError, defineEventHandler } from 'h3'
import { getAppEnv } from '../../utils/cloudflare'
import { isCloudinaryImageUrl } from '../../utils/cloudinary-library'
import { requireUser } from '../../utils/require-user'
import { enforceRateLimit } from '../../utils/rate-limit'

interface UploadedImageRow {
  url: string
  created_at: string
}

interface StoryImageRow {
  url: string
  created_at: string
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'upload-library-read', 60, 60, user.id)
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }

  const [uploadedImages, draftContentImages, draftExtraImages, publishedContentImages, publishedExtraImages] = await Promise.all([
    database.prepare(
      'SELECT url, created_at FROM uploaded_images WHERE owner_user_id = ? ORDER BY created_at DESC LIMIT 100',
    ).bind(user.id).all<UploadedImageRow>(),
    database.prepare(
      `SELECT content.hero_image AS url, draft.updated_at AS created_at
       FROM story_drafts AS draft JOIN story_content AS content ON content.id = draft.id
       WHERE draft.owner_user_id = ? AND content.hero_image != ''
       UNION ALL
       SELECT content.greeting_image, draft.updated_at
       FROM story_drafts AS draft JOIN story_content AS content ON content.id = draft.id
       WHERE draft.owner_user_id = ? AND content.greeting_image != ''
       UNION ALL
       SELECT content.second_image, draft.updated_at
       FROM story_drafts AS draft JOIN story_content AS content ON content.id = draft.id
       WHERE draft.owner_user_id = ? AND content.second_image != ''
       UNION ALL
       SELECT content.final_image, draft.updated_at
       FROM story_drafts AS draft JOIN story_content AS content ON content.id = draft.id
       WHERE draft.owner_user_id = ? AND content.final_image != ''`,
    ).bind(...Array.from({ length: 4 }, () => user.id)).all<StoryImageRow>(),
    database.prepare(
      `SELECT gallery.url, draft.updated_at AS created_at
       FROM story_drafts AS draft JOIN story_gallery_items AS gallery ON gallery.content_id = draft.id
       WHERE draft.owner_user_id = ? AND gallery.url != ''
       UNION ALL
       SELECT chapter.image_url, draft.updated_at
       FROM story_drafts AS draft JOIN story_chapters AS chapter ON chapter.content_id = draft.id
       WHERE draft.owner_user_id = ? AND chapter.image_url != ''`,
    ).bind(user.id, user.id).all<StoryImageRow>(),
    database.prepare(
      `SELECT content.hero_image AS url, story.published_at AS created_at
       FROM stories AS story JOIN story_content AS content ON content.id = story.content_id
       WHERE story.owner_user_id = ? AND content.hero_image != ''
       UNION ALL
       SELECT content.greeting_image, story.published_at
       FROM stories AS story JOIN story_content AS content ON content.id = story.content_id
       WHERE story.owner_user_id = ? AND content.greeting_image != ''
       UNION ALL
       SELECT content.second_image, story.published_at
       FROM stories AS story JOIN story_content AS content ON content.id = story.content_id
       WHERE story.owner_user_id = ? AND content.second_image != ''
       UNION ALL
       SELECT content.final_image, story.published_at
       FROM stories AS story JOIN story_content AS content ON content.id = story.content_id
       WHERE story.owner_user_id = ? AND content.final_image != ''`,
    ).bind(...Array.from({ length: 4 }, () => user.id)).all<StoryImageRow>(),
    database.prepare(
      `SELECT gallery.url, story.published_at AS created_at
       FROM stories AS story JOIN story_gallery_items AS gallery ON gallery.content_id = story.content_id
       WHERE story.owner_user_id = ? AND gallery.url != ''
       UNION ALL
       SELECT chapter.image_url, story.published_at
       FROM stories AS story JOIN story_chapters AS chapter ON chapter.content_id = story.content_id
       WHERE story.owner_user_id = ? AND chapter.image_url != ''`,
    ).bind(user.id, user.id).all<StoryImageRow>(),
  ])
  const photosByUrl = new Map<string, string>()
  for (const image of [
    ...uploadedImages.results,
    ...draftContentImages.results,
    ...draftExtraImages.results,
    ...publishedContentImages.results,
    ...publishedExtraImages.results,
  ]) {
    if (isCloudinaryImageUrl(image.url)) {
      const currentDate = photosByUrl.get(image.url)
      if (!currentDate || image.created_at > currentDate) {
        photosByUrl.set(image.url, image.created_at)
      }
    }
  }

  return {
    photos: Array.from(photosByUrl, ([url, createdAt]) => ({ url, createdAt }))
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
      .slice(0, 100),
  }
})
