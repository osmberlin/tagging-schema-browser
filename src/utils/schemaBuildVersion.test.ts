import { describe, expect, it } from 'vitest'
import {
  detectSchemaBuildInfo,
  formatSchemaBuildLabel,
  isSchemaBuildSupported,
  isUnsupportedSchemaBuildMessage,
  majorFromVersionSpec,
  predictSchemaBuildFromUrl,
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

describe('predictSchemaBuildFromUrl', () => {
  it('detects pre-v7 npm URLs immediately', () => {
    expect(
      predictSchemaBuildFromUrl(
        'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@6.18.0/dist/',
      ),
    ).toEqual({
      major: 6,
      versionSpec: '6.18.0',
      detection: 'url',
    })
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

describe('isSchemaBuildSupported', () => {
  it('blocks v6 builds', () => {
    const build = { major: 6, versionSpec: '6.18.0', detection: 'url' as const }
    expect(
      isSchemaBuildSupported(
        build,
        'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@6.18.0/dist/',
      ),
    ).toBe(false)
  })

  it('allows v7 builds', () => {
    const build = { major: 7, versionSpec: '7.0.1', detection: 'url' as const }
    expect(
      isSchemaBuildSupported(
        build,
        'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@7.0.1/dist/',
      ),
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

  it('labels unreleased main builds as major-latest', () => {
    expect(formatSchemaBuildLabel({ major: 7, versionSpec: null, detection: 'content' })).toBe(
      '7-latest',
    )
  })

  it('can append staging age for unreleased builds', () => {
    expect(
      formatSchemaBuildLabel(
        { major: 7, versionSpec: null, detection: 'content' },
        { stagingAge: 'today' },
      ),
    ).toBe('7-latest (today)')
  })
})

describe('unsupportedSchemaBuildMessage', () => {
  it('explains that older builds cannot be shown', () => {
    expect(
      unsupportedSchemaBuildMessage({
        major: 6,
        versionSpec: '6.18.0',
        detection: 'url',
      }),
    ).toContain('cannot be shown')
  })
})

describe('isUnsupportedSchemaBuildMessage', () => {
  it('matches the v7+ gate error text', () => {
    expect(
      isUnsupportedSchemaBuildMessage(
        'The linked schema is v6.18.0. This browser only supports id-tagging-schema v7 and newer, so that dataset cannot be shown here.',
      ),
    ).toBe(true)
    expect(isUnsupportedSchemaBuildMessage('Failed to load comparison baseline')).toBe(false)
  })
})
