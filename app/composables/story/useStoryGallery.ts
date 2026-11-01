export type GalleryScrollDirection = -1 | 1

type GalleryTrack = Pick<HTMLElement, 'clientWidth' | 'scrollBy'>

export interface StoryGalleryControls {
  scroll: (direction: GalleryScrollDirection) => void
}

export function useStoryGallery(getTrack: () => GalleryTrack | null): StoryGalleryControls {
  function scroll(direction: GalleryScrollDirection): void {
    const element = getTrack()
    if (!element) return

    element.scrollBy({
      left: direction * element.clientWidth * 0.75,
      behavior: 'smooth',
    })
  }

  return { scroll }
}
