import { useEffect } from 'react'
import {
  getSchemaIssueDisclosureStore,
  useActiveIssueFocus,
  useSchemaIssueDisclosureActions,
} from '@/features/schema-issue/schema-issue-disclosure-store'
import type { PresetIssueFilterKey } from '@/utils/presetIssueFilters'

/** Open a detail disclosure once when its overview filter is active and the user has not toggled it yet. */
export function useAutoOpenFocusedIssue(
  disclosureId: string,
  issue: PresetIssueFilterKey,
  applies: boolean,
): void {
  const focus = useActiveIssueFocus()
  const { setOpen } = useSchemaIssueDisclosureActions()

  useEffect(
    function autoOpenFocusedIssueDisclosure() {
      if (focus !== issue || !applies) return
      const stored = getSchemaIssueDisclosureStore().openById[disclosureId]
      if (stored !== undefined) return
      setOpen(disclosureId, true)
    },
    [focus, issue, applies, disclosureId, setOpen],
  )
}
