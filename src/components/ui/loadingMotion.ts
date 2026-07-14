import type { Transition } from 'motion/react'

/** Matches PrimaryNav / ReferenceToggle spring feel. */
export const loadingCardSpring: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  bounce: 0.08,
}

export const loadingInstant: Transition = { duration: 0 }
