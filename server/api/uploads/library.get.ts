import { createError, defineEventHandler } from 'h3'
import { getAppEnv } from '../../utils/cloudflare'
import { isCloudinaryImageUrl } from '../../utils/cloudinary-library'
import { requireUser } from '../../utils/require-user'
import { enforceRateLimit } from '../../utils/rate-limit'

interface UploadedImageRow {
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

  const result = await database.prepare(
    `WITH owned_content AS (
       SELECT id AS content_id, updated_at AS used_at
       FROM story_drafts
       WHERE owner_user_id = ?
       UNION ALL
       SELECT content_id, published_at AS used_at
       FROM stories
       WHERE owner_user_id = ?
     ),
     images AS (
       SELECT url, created_at AS used_at
       FROM uploaded_images
       WHERE owner_user_id = ?
       UNION ALL
       SELECT content.hero_image AS url, owned.used_at
       FROM owned_content AS owned
       JOIN story_content AS content ON content.id = owned.content_id
       UNION ALL
       SELECT content.greeting_image, owned.used_at
       FROM owned_content AS owned
       JOIN story_content AS content ON content.id = owned.content_id
       UNION ALL
       SELECT content.second_image, owned.used_at
       FROM owned_content AS owned
       JOIN story_content AS content ON content.id = owned.content_id
       UNION ALL
       SELECT content.final_image, owned.used_at
       FROM owned_content AS owned
       JOIN story_content AS content ON content.id = owned.content_id
       UNION ALL
       SELECT gallery.url, owned.used_at
       FROM owned_content AS owned
       JOIN story_gallery_items AS gallery ON gallery.content_id = owned.content_id
       UNION ALL
       SELECT chapter.image_url, owned.used_at
       FROM owned_content AS owned
       JOIN story_chapters AS chapter ON chapter.content_id = owned.content_id
     )
     SELECT url, MAX(used_at) AS created_at
     FROM images
     WHERE url != ''
     GROUP BY url
     ORDER BY MAX(used_at) DESC
     LIMIT 100`,
  ).bind(user.id, user.id, user.id).all<UploadedImageRow>()

  return {
    photos: result.results
      .filter(image => isCloudinaryImageUrl(image.url))
      .map(image => ({ url: image.url, createdAt: image.created_at })),
  }
})
