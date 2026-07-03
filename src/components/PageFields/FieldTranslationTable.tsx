import type { ReactNode } from 'react'
import { Fragment } from 'react'
import { googleTranslateUrl } from '@/components/PagePresets/PresetTranslationTable'
import { TranslationAttrRow, TranslationColumnHeader } from '@/components/TranslationTableLayout'
import { externalLinkClass } from '@/theme/externalAccent'
import {
  fieldOptionDescription,
  fieldOptionTitle,
  fieldOptionTranslateTexts,
  isFieldOptionObject,
} from '@/utils/fieldOptionTranslation'
import type { RawFieldTranslation } from '@/utils/types'

function TextWithTranslate({
  locale,
  text,
  children,
}: {
  locale: string
  text: string
  children: ReactNode
}) {
  if (!text.trim()) return <>{children}</>
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {children}
      <a
        href={googleTranslateUrl(locale, text)}
        target="_blank"
        rel="noopener noreferrer"
        className={externalLinkClass('text-[11px]')}
      >
        Google Translate ↗
      </a>
    </span>
  )
}

export function FieldTranslationTable({
  fieldId,
  english,
  localized,
  locale,
}: {
  fieldId: string
  english: RawFieldTranslation
  localized?: RawFieldTranslation
  locale: string
}) {
  const showLocale = Boolean(locale)
  const optionKeys = Array.from(
    new Set([...Object.keys(english.options ?? {}), ...Object.keys(localized?.options ?? {})]),
  ).sort((a, b) => a.localeCompare(b))

  const englishTexts = [
    english.label,
    english.placeholder,
    english.terms,
    ...optionKeys.flatMap((key) => fieldOptionTranslateTexts(english.options?.[key])),
  ].filter((value): value is string => Boolean(value?.trim()))

  return (
    <div className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
        <span className="font-mono">{fieldId}</span>
      </div>
      <TranslationColumnHeader
        showLocale={showLocale}
        locale={locale}
        englishHeader={
          showLocale ? (
            <span className="flex items-center gap-2">
              <span>English</span>
              <a
                href={googleTranslateUrl(locale, englishTexts.join('\n'))}
                target="_blank"
                rel="noreferrer"
                className={externalLinkClass()}
                title="Translate the English label, placeholder, terms & options (one per line) via Google Translate"
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
        label="Label"
        english={english.label ?? '—'}
        localized={localized?.label ?? '—'}
        showLocale={showLocale}
      />
      <TranslationAttrRow
        label="Placeholder"
        english={english.placeholder ?? '—'}
        localized={localized?.placeholder ?? '—'}
        showLocale={showLocale}
      />
      <TranslationAttrRow
        label="Terms"
        english={english.terms ?? '—'}
        localized={
          localized?.terms ? (
            <TextWithTranslate locale={locale} text={english.terms ?? ''}>
              {localized.terms}
            </TextWithTranslate>
          ) : (
            '—'
          )
        }
        showLocale={showLocale}
      />
      {optionKeys.length > 0 ? (
        <div className="border-t border-slate-100">
          <div className="px-4 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Options
          </div>
          {optionKeys.map((key) => {
            const englishOption = english.options?.[key]
            const localizedOption = localized?.options?.[key]

            if (isFieldOptionObject(englishOption) || isFieldOptionObject(localizedOption)) {
              return (
                <Fragment key={key}>
                  {fieldOptionTitle(englishOption) || fieldOptionTitle(localizedOption) ? (
                    <TranslationAttrRow
                      label={`${key} / title`}
                      english={fieldOptionTitle(englishOption) ?? '—'}
                      localized={fieldOptionTitle(localizedOption) ?? '—'}
                      showLocale={showLocale}
                    />
                  ) : null}
                  {fieldOptionDescription(englishOption) ||
                  fieldOptionDescription(localizedOption) ? (
                    <TranslationAttrRow
                      label={`${key} / description`}
                      english={fieldOptionDescription(englishOption) ?? '—'}
                      localized={fieldOptionDescription(localizedOption) ?? '—'}
                      showLocale={showLocale}
                    />
                  ) : null}
                </Fragment>
              )
            }

            return (
              <TranslationAttrRow
                key={key}
                label={key}
                english={typeof englishOption === 'string' ? englishOption : '—'}
                localized={typeof localizedOption === 'string' ? localizedOption : '—'}
                showLocale={showLocale}
              />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
