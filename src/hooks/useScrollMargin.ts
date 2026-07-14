import { useLayoutEffect, useState, type RefObject } from 'react'

function documentOffsetTop(element: HTMLElement): number {
  return element.getBoundingClientRect().top + window.scrollY
}

/** Distance from the document top to a list container — required by window virtualizers. */
export function useScrollMargin(ref: RefObject<HTMLElement | null>) {
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = () => setScrollMargin(documentOffsetTop(element))

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])

  return scrollMargin
}
