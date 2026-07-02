const APP_NAME = 'Tagging Schema Browser'

export type DocumentReferenceSegment = 'Release' | 'Unreleased'

/** Third segment of the browser tab title from URL search params. */
export function documentReferenceSegment(search: {
  dataUrl?: string
  reference?: 'release' | 'interem'
}): DocumentReferenceSegment {
  if (search.reference === 'release') return 'Release'
  return 'Unreleased'
}

export function buildDocumentTitle(
  pageName: string,
  referenceSegment: DocumentReferenceSegment,
): string {
  return `${pageName} - ${APP_NAME} - ${referenceSegment}`
}

type RouteHeadContext = {
  matches: Array<{ search: Record<string, unknown> }>
}

/** TanStack Router `head` helper for main routes. */
export function documentTitleHead(pageName: string) {
  return ({ matches }: RouteHeadContext) => {
    const rootSearch = (matches[0]?.search ?? {}) as {
      dataUrl?: string
      reference?: 'release' | 'interem'
    }
    const referenceSegment = documentReferenceSegment(rootSearch)
    return {
      meta: [{ title: buildDocumentTitle(pageName, referenceSegment) }],
    }
  }
}
