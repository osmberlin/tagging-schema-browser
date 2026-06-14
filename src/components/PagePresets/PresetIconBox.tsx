import { getIconSvgDataUrl } from "@/components/PageIcons/iconRegistry";
import type { DenormalizedPreset } from "@/utils/types";
import { useState } from "react";

type PresetIconBoxProps = {
  preset: DenormalizedPreset;
  size?: "sm" | "md";
};

export function PresetIconBox({ preset, size = "sm" }: PresetIconBoxProps) {
  const [rasterFailed, setRasterFailed] = useState(false);
  const iconSrc = getIconSvgDataUrl(preset.icon);
  const raster = preset.imageURL?.trim();
  const showRaster = Boolean(raster && !rasterFailed);
  const frame =
    size === "sm"
      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-500 "
      : "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 ";
  const imgClass = size === "sm" ? "h-6 w-6 object-contain" : "h-9 w-9 object-contain";

  const titleParts = [preset.icon, preset.imageURL].filter(Boolean);
  const title = titleParts.length ? titleParts.join(" · ") : "No icon";

  return (
    <div className={frame} title={title}>
      {showRaster ? (
        <img
          src={raster}
          alt=""
          className={imgClass}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setRasterFailed(true)}
        />
      ) : iconSrc ? (
        <img src={iconSrc} alt="" className={imgClass} />
      ) : preset.icon ? (
        <span className="font-mono text-[10px] leading-tight">
          {preset.iconPrefix ?? preset.icon.slice(0, 8)}
        </span>
      ) : raster && rasterFailed ? (
        <span className="font-mono text-[10px] leading-tight" title="image failed">
          img
        </span>
      ) : (
        <span aria-hidden>—</span>
      )}
    </div>
  );
}
