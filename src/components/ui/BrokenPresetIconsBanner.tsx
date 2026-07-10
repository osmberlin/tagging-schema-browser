import { brandAccent } from '@/theme/brandAccent'

export function BrokenPresetIconsBanner({
  count,
  onShowBroken,
}: {
  count: number
  onShowBroken: () => void
}) {
  if (count <= 0) return null

  return (
    <p className={brandAccent.errorBanner}>
      <strong>{count}</strong> {count === 1 ? 'preset references' : 'presets reference'} a missing
      preset icon —{' '}
      <button type="button" onClick={onShowBroken} className={brandAccent.errorBannerLink}>
        show broken preset icons
      </button>
      .
    </p>
  )
}
