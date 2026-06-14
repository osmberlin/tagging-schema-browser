import { CatalystDialog, CatalystDialogBody, CatalystDialogTitle } from "@/components/ui/Dialog";
import { Kbd, modLabel } from "@/components/ui/Kbd";

/** A single keyboard combo, rendered as a row of keycaps. */
type Combo = string[];

type ShortcutItem = {
  label: string;
  /** Alternative combos that all trigger the action (joined by "or"). */
  keys: Combo[];
};

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mod = modLabel();
  const groups: { title: string; items: ShortcutItem[] }[] = [
    {
      title: "General",
      items: [
        { label: "Focus search", keys: [[mod, "K"], ["/"]] },
        { label: "Show this dialog", keys: [["?"]] },
        { label: "Close dialog", keys: [["Esc"]] },
      ],
    },
    {
      title: "Go to page",
      items: [
        { label: "Presets", keys: [["g", "p"]] },
        { label: "Icons", keys: [["g", "i"]] },
        { label: "About", keys: [["g", "a"]] },
      ],
    },
    {
      title: "Presets list",
      items: [{ label: "Previous / next page", keys: [["["], ["]"]] }],
    },
  ];

  return (
    <CatalystDialog open={open} onClose={onClose} size="lg">
      <div className="flex items-start justify-between gap-4">
        <CatalystDialogTitle className="font-display">Keyboard shortcuts</CatalystDialogTitle>
        <button
          type="button"
          onClick={onClose}
          className="-mt-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <CatalystDialogBody className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 font-display text-xs font-medium uppercase tracking-wide text-slate-500">
              {group.title}
            </h3>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-4 text-sm text-slate-700"
                >
                  <span>{item.label}</span>
                  <span className="flex items-center gap-1.5">
                    {item.keys.map((combo, comboIndex) => (
                      <span key={combo.join("+")} className="flex items-center gap-1">
                        {comboIndex > 0 ? <span className="text-xs text-slate-400">or</span> : null}
                        {combo.map((key) => (
                          <Kbd key={key}>{key}</Kbd>
                        ))}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CatalystDialogBody>
    </CatalystDialog>
  );
}
