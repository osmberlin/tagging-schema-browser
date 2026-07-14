import { useCallback, useEffect, useState } from 'react'

/** Tracks an element's content width via ResizeObserver (callback ref survives DOM swaps). */
export function useContainerWidth() {
  const [width, setWidth] = useState(0)
  const [element, setElement] = useState<HTMLElement | null>(null)

  const ref = useCallback((node: HTMLElement | null) => {
    setElement(node)
  }, [])

  useEffect(() => {
    if (!element) {
      setWidth(0)
      return
    }

    const measure = () => setWidth(element.offsetWidth)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return { ref, width }
}
