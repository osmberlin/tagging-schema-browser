const APP_NAME = 'Tagging Schema Browser'

export type DocumentReferenceSegment = 'Release' | 'Unreleased'

/** Third segment of the browser tab title from URL search params. */
export function documentReferenceSegment(search: {
  dataUrl?: string
  reference?: 'release' | 'interim'
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

function referenceSegmentFromMatches(matches: RouteHeadContext['matches']) {
  const rootSearch = (matches[0]?.search ?? {}) as {
    dataUrl?: string
    reference?: 'release' | 'interim'
  }
  return documentReferenceSegment(rootSearch)
}

/** TanStack Router `head` helper for main routes. */
export function documentTitleHead(pageName: string) {
  return ({ matches }: RouteHeadContext) => {
    const referenceSegment = referenceSegmentFromMatches(matches)
    return {
      meta: [{ title: buildDocumentTitle(pageName, referenceSegment) }],
    }
  }
}

type DetailRouteHeadContext = RouteHeadContext & {
  params: { _splat?: string }
}

/** TanStack Router `head` helper for `/preset/$` and `/field/$` detail routes. */
export function documentDetailTitleHead(pageName: string) {
  return ({ matches, params }: DetailRouteHeadContext) => {
    const referenceSegment = referenceSegmentFromMatches(matches)
    const entityId = typeof params._splat === 'string' ? params._splat.trim() : ''
    const titlePageName = entityId ? `${entityId} ${pageName}` : pageName
    return {
      meta: [{ title: buildDocumentTitle(titlePageName, referenceSegment) }],
    }
  }
}
