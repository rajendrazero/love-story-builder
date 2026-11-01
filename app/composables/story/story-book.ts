export type StoryBookTurnDirection = 'next' | 'previous'

export interface StoryPageTurn<Page> {
  nextIndex: number
  page: Page
}

export function getStoryPageTurn<Page>(
  pages: readonly Page[],
  activePage: number,
  direction: StoryBookTurnDirection,
): StoryPageTurn<Page> | null {
  const nextIndex = activePage + (direction === 'next' ? 1 : -1)
  if (nextIndex < 0 || nextIndex >= pages.length) return null

  const pageIndex = direction === 'next' ? activePage : activePage - 1
  const page = pages[pageIndex]
  if (page === undefined) return null

  return { nextIndex, page }
}

export function getStoryPageTurnDuration(reducedMotion: boolean): number {
  return reducedMotion ? 50 : 820
}
