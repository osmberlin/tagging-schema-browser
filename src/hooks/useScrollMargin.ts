import { useLayoutEffect, useState, type RefObject } from 'react'

/** Distance from the window top to a list container — required by window virtualizers. */
export function useScrollMargin(ref: RefObject<HTMLElement | null>) {
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = () => setScrollMargin(element.offsetTop)
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
