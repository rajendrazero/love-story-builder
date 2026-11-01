export const storySlugPattern = /^(?=.{3,32}$)[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidStorySlug(value: string): boolean {
  return storySlugPattern.test(value)
}
