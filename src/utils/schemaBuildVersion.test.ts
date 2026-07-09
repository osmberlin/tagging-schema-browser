import { describe, expect, it } from 'vitest'
import {
  detectSchemaBuildInfo,
  formatSchemaBuildLabel,
  isSchemaBuildAllowed,
  majorFromVersionSpec,
  unsupportedSchemaBuildMessage,
  versionSpecFromDataUrl,
} from '@/utils/schemaBuildVersion'

describe('versionSpecFromDataUrl', () => {
  it('reads npm version specs from jsDelivr URLs', () => {
    expect(
      versionSpecFromDataUrl(
        'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@7.0.1/dist/',
      ),
    ).toBe('7.0.1')
    expect(
      versionSpecFromDataUrl(
        'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@latest/dist/',
      ),
    ).toBe('latest')
  })
})

describe('majorFromVersionSpec', () => {
  it('parses leading major version', () => {
    expect(majorFromVersionSpec('7.0.1')).toBe(7)
    expect(majorFromVersionSpec('6.18.0')).toBe(6)
    expect(majorFromVersionSpec('latest')).toBeNull()
  })
})

describe('detectSchemaBuildInfo', () => {
  it('detects major from URL spec', () => {
    const info = detectSchemaBuildInfo(
      'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@6.18.0/dist/',
      { presets: {}, fields: {}, translations: {} },
    )
    expect(info).toEqual({
      major: 6,
      versionSpec: '6.18.0',
      detection: 'url',
    })
  })

  it('detects v7 from array terms in translations', () => {
    const info = detectSchemaBuildInfo('https://example.com/dist/', {
      presets: {},
      fields: {},
      translations: {
        en: {
          presets: {
            presets: { 'amenity/cafe': { terms: ['coffee'] } },
            categories: {},
            fields: {},
          },
        },
      },
    })
    expect(info.major).toBe(7)
    expect(info.detection).toBe('content')
  })

  it('detects v6 from stringsCrossReference in fields', () => {
    const info = detectSchemaBuildInfo('https://example.com/dist/', {
      presets: {},
      fields: {
        marker: { stringsCrossReference: '{other}' },
      },
      translations: { en: { presets: { presets: {}, categories: {}, fields: {} } } },
    })
    expect(info.major).toBe(6)
    expect(info.detection).toBe('content')
  })
})

describe('isSchemaBuildAllowed', () => {
  it('blocks v6 unless legacy is enabled', () => {
    const build = { major: 6, versionSpec: '6.18.0', detection: 'url' as const }
    expect(
      isSchemaBuildAllowed(build, {
        allowLegacy: false,
        dataUrl: 'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@6.18.0/dist/',
      }),
    ).toBe(false)
    expect(
      isSchemaBuildAllowed(build, {
        allowLegacy: true,
        dataUrl: 'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@6.18.0/dist/',
      }),
    ).toBe(true)
  })
})

describe('formatSchemaBuildLabel', () => {
  it('uses resolved release version for @latest', () => {
    expect(
      formatSchemaBuildLabel(
        { major: 7, versionSpec: 'latest', detection: 'url' },
        { resolvedReleaseVersion: '7.0.1' },
      ),
    ).toBe('v7.0.1')
  })
})

describe('unsupportedSchemaBuildMessage', () => {
  it('mentions legacy opt-in', () => {
    expect(
      unsupportedSchemaBuildMessage({
        major: 6,
        versionSpec: '6.18.0',
        detection: 'url',
      }),
    ).toContain('?legacy=1')
  })
})
