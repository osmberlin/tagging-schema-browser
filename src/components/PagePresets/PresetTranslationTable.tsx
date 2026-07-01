import { TranslationAttrRow, TranslationColumnHeader } from '@/components/TranslationTableLayout'
import { areaAccent } from '@/theme/areaAccent'
import { externalLinkClass } from '@/theme/externalAccent'
import { cn } from '@/utils/tw'
import type { DenormalizedPreset } from '@/utils/types'

/** Google Translate deep link (no API). Strip the region for the target except for zh. */
export function googleTranslateUrl(locale: string, text: string): string {
  const tl = locale.startsWith('zh') ? locale : locale.split('-')[0] || locale
  return `https://translate.google.com/?sl=en&tl=${encodeURIComponent(tl)}&text=${encodeURIComponent(text)}&op=translate`
}

function TermChips({ terms, shared }: { terms: string[]; shared: Set<string> }) {
  if (!terms.length) return <span className="text-slate-300">—</span>
  return (
    <span className="flex flex-wrap gap-1">
      {terms.map((t) => (
        <span
          key={t}
          className={cn(
            'rounded-full px-2 py-0.5 text-xs',
            shared.has(t) ? areaAccent.translations.sharedChip : 'bg-slate-100 text-slate-600',
          )}
          title={shared.has(t) ? 'Identical in both languages' : undefined}
        >
          {t}
        </span>
      ))}
    </span>
  )
}

export type PresetLocaleStrings = {
  name?: string
  terms: string[]
  aliases: string[]
}

export function PresetTranslationTable({
  preset,
  locale,
  localized,
}: {
  preset: DenormalizedPreset
  locale: string
  localized?: PresetLocaleStrings
}) {
  const showLocale = Boolean(locale)
  const enTermSet = new Set(preset.terms)
  const locTermSet = new Set(localized?.terms ?? [])
  const untranslated = showLocale && !localized?.name
  const sameName = Boolean(localized?.name && localized.name === preset.name)

  return (
    <div className="overflow-hidden">
      <TranslationColumnHeader
        showLocale={showLocale}
        locale={locale}
        englishHeader={
          showLocale ? (
            <span className="flex items-center gap-2">
              <span>English</span>
              <a
                href={googleTranslateUrl(
                  locale,
                  [preset.name, ...preset.terms, ...preset.aliases].filter(Boolean).join('\n'),
                )}
                target="_blank"
                rel="noreferrer"
                className={externalLinkClass()}
                title="Translate the English name, terms & aliases (one per line) via Google Translate"
              >
                GT ↗
              </a>
            </span>
          ) : (
            'English'
          )
        }
      />

      <TranslationAttrRow
        label="Name"
        showLocale={showLocale}
        english={<span>{preset.name}</span>}
        localized={
          untranslated ? (
            <span className="text-slate-400">—</span>
          ) : (
            <span
              className={cn(sameName && 'text-yellow-700')}
              title={sameName ? 'Same as English' : undefined}
            >
              {localized?.name}
            </span>
          )
        }
      />
      <TranslationAttrRow
        label="Terms"
        showLocale={showLocale}
        english={<TermChips terms={preset.terms} shared={locTermSet} />}
        localized={<TermChips terms={localized?.terms ?? []} shared={enTermSet} />}
      />
      {preset.aliases.length || localized?.aliases.length ? (
        <TranslationAttrRow
          label="Aliases"
          showLocale={showLocale}
          english={
            preset.aliases.length ? (
              <span className="text-slate-600">{preset.aliases.join(', ')}</span>
            ) : (
              <span className="text-slate-300">—</span>
            )
          }
          localized={
            localized?.aliases.length ? (
              <span className="text-slate-600">{localized.aliases.join(', ')}</span>
            ) : (
              <span className="text-slate-300">—</span>
            )
          }
        />
      ) : null}
    </div>
  )
}
