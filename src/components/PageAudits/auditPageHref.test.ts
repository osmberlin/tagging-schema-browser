import { describe, expect, it } from 'vitest'
import { auditPageHref } from '@/components/PageAudits/auditPageHref'
import { appPath } from '@/utils/constants'

describe('auditPageHref', () => {
  it('prefixes the deploy base path so links work under a GitHub Pages sub-path', () => {
    const href = auditPageHref({
      slug: 'risky-typecombo',
      dataUrl: 'https://example.com/dist/',
    })
    expect(href).toBe(
      appPath('/audits/risky-typecombo?dataUrl=https%3A%2F%2Fexample.com%2Fdist%2F'),
    )
    expect(
      href.endsWith('/audits/risky-typecombo?dataUrl=https%3A%2F%2Fexample.com%2Fdist%2F'),
    ).toBe(true)
  })
})
