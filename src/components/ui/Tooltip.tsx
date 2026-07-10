import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  type Placement,
} from '@floating-ui/react'
import { useState } from 'react'
import { cn } from '@/utils/tw'

type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
  placement?: Placement
  /** Hover delay in ms before the tooltip opens. */
  openDelay?: number
  className?: string
  wrapperClassName?: string
  /** Use when the child is disabled — wraps it in a focusable span so hover works. */
  disabled?: boolean
}

const panelClass =
  'z-50 max-w-xs rounded-md bg-slate-900 px-2.5 py-2 text-[11px] leading-snug font-normal text-white shadow-lg'

/** Accessible hover/focus tooltip (Floating UI + portal — avoids header overflow clipping). */
export function Tooltip({
  content,
  children,
  placement = 'top',
  openDelay = 200,
  className,
  wrapperClassName,
  disabled = false,
}: TooltipProps) {
  const [open, setOpen] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, {
    delay: { open: openDelay, close: 80 },
    move: false,
  })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role])

  if (content == null || content === '') {
    return <>{children}</>
  }

  const referenceProps = getReferenceProps(
    disabled ? { tabIndex: 0, className: cn('inline-flex outline-none', wrapperClassName) } : {},
  )

  return (
    <>
      <span
        ref={refs.setReference}
        {...referenceProps}
        className={cn(!disabled && 'inline-flex', !disabled && wrapperClassName)}
      >
        {children}
      </span>
      <FloatingPortal>
        {open ? (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={cn(panelClass, className)}
          >
            {content}
          </div>
        ) : null}
      </FloatingPortal>
    </>
  )
}
