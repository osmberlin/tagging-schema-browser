import { describe, expect, it } from 'vitest'
import { githubBranchFromDataUrl, githubFileUrl, schemaRepoPath } from '@/utils/githubFileUrl'

describe('schemaRepoPath', () => {
  it('maps searchable presets to data/presets/<id>.json', () => {
    expect(schemaRepoPath('preset', 'office/coworking')).toBe('data/presets/office/coworking.json')
  })

  it('prefixes unsearchable presets with underscore on the leaf segment', () => {
    expect(schemaRepoPath('preset', 'amenity/bus_station', { searchable: false })).toBe(
      'data/presets/amenity/_bus_station.json',
    )
  })

  it('does not prefix @templates presets even when unsearchable', () => {
    expect(schemaRepoPath('preset', '@templates/internet_access', { searchable: false })).toBe(
      'data/presets/@templates/internet_access.json',
    )
    expect(schemaRepoPath('preset', '@templates/poi', { searchable: false })).toBe(
      'data/presets/@templates/poi.json',
    )
  })

  it('maps field ids to data/fields/<id>.json', () => {
    expect(schemaRepoPath('field', 'internet_access/fee')).toBe(
      'data/fields/internet_access/fee.json',
    )
  })
})

describe('githubFileUrl', () => {
  it('builds main-branch links for release CDN data', () => {
    expect(
      githubFileUrl(
        'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@latest/dist',
        'data/presets/@templates/internet_access.json',
      ),
    ).toBe(
      'https://github.com/openstreetmap/id-tagging-schema/blob/main/data/presets/@templates/internet_access.json',
    )
  })

  it('uses npm version tag for versioned CDN data', () => {
    expect(
      githubFileUrl(
        'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@6.12.0/dist',
        'data/presets/office/coworking.json',
      ),
    ).toBe(
      'https://github.com/openstreetmap/id-tagging-schema/blob/6.12.0/data/presets/office/coworking.json',
    )
  })
})

describe('githubBranchFromDataUrl', () => {
  it('maps Netlify deploy preview host to PR head ref', () => {
    expect(githubBranchFromDataUrl('https://deploy-preview-200--example.netlify.app/dist')).toBe(
      'refs/pull/200/head',
    )
  })
})
