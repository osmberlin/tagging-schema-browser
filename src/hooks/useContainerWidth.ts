import { useEffect, useState, type RefObject } from 'react'

/** Tracks an element's content width via ResizeObserver. */
export function useContainerWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = () => setWidth(element.offsetWidth)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return width
}
