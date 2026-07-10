import { brandAccent } from '@/theme/brandAccent'

export function MissingInheritanceBanners({
  unreviewedCount,
  staleCount,
  onShowUnreviewed,
  onShowStale,
}: {
  unreviewedCount: number
  staleCount: number
  onShowUnreviewed: () => void
  onShowStale: () => void
}) {
  return (
    <>
      {unreviewedCount > 0 ? (
        <p className={brandAccent.errorBanner}>
          <strong>{unreviewedCount}</strong> {unreviewedCount === 1 ? 'preset has' : 'presets have'}{' '}
          unreviewed missing slash-parent field inheritance —{' '}
          <button type="button" onClick={onShowUnreviewed} className={brandAccent.errorBannerLink}>
            show unreviewed
          </button>
          .
        </p>
      ) : null}
      {staleCount > 0 ? (
        <p className={brandAccent.errorBanner}>
          <strong>{staleCount}</strong> {staleCount === 1 ? 'override is' : 'overrides are'} stale —{' '}
          <button type="button" onClick={onShowStale} className={brandAccent.errorBannerLink}>
            show stale overrides
          </button>
          .
        </p>
      ) : null}
    </>
  )
}
