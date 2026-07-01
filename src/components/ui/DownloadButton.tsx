import { downloadJson } from "@/utils/download";
import { useCallback } from "react";

type DownloadButtonProps = {
  filename: string;
  data: unknown;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function DownloadButton({
  filename,
  data,
  label = "Download JSON",
  disabled = false,
  className = "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
}: DownloadButtonProps) {
  const onDownload = useCallback(() => {
    downloadJson(filename, data);
  }, [data, filename]);

  return (
    <button type="button" onClick={onDownload} disabled={disabled} className={className}>
      {label}
    </button>
  );
}
