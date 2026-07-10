import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { type ModeSearch, modeSearchSchema } from '@/components/PageMode/modeSearch'

/** `[state, setState]` for `/mode` search params (tags, geometry, region). */
export function useModeSearch() {
  const state = useSearch({ strict: false, select: (raw) => modeSearchSchema.parse(raw) })
  const navigate = useNavigate()
  const setState = useCallback(
    (patch: Partial<ModeSearch>) => {
      void navigate({ to: '.', search: (prev) => ({ ...prev, ...patch }), replace: true })
    },
    [navigate],
  )
  return [state, setState] as const
}
