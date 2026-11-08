import { CheckIcon, SlidersHorizontalIcon } from "lucide-react"

import { EditorColumn } from "@/components/manage/manager-layout"
import { Section } from "@/components/manage/section"
import { SettingsHeader } from "@/components/settings-header"
import { useTheme } from "@/components/theme-provider"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { themes, type ThemeDefinition, type ThemeId } from "@/themes/registry"
import { cn } from "@/lib/utils"

const shortcuts: { keys: string[]; label: string }[] = [
  { keys: ["⌘", "N"], label: "New thread" },
  { keys: ["⌘", ","], label: "Open settings" },
  { keys: ["Esc"], label: "Leave settings" },
  { keys: ["Enter"], label: "Send to Triage" },
  { keys: ["Shift", "Enter"], label: "New line in the composer" },
]

export function GeneralSettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <SettingsHeader title="General" icon={SlidersHorizontalIcon} />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <EditorColumn>
          <Section title="Appearance" description="Color theme for the whole app, including code blocks.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Color theme">
              {themes.map((t) => (
                <ThemeCard key={t.id} theme={t} selected={t.id === theme.id} onSelect={() => setTheme(t.id as ThemeId)} />
              ))}
            </div>
          </Section>

          <Section title="Keyboard shortcuts">
            <ul className="divide-y rounded-lg border">
              {shortcuts.map((s) => (
                <li key={s.label} className="flex items-center justify-between px-3 py-2 text-sm">
                  {s.label}
                  <KbdGroup>
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </KbdGroup>
                </li>
              ))}
            </ul>
          </Section>
        </EditorColumn>
      </main>
    </div>
  )
}

/** A miniature app window painted in the theme's own colors. */
function ThemeCard({ theme, selected, onSelect }: { theme: ThemeDefinition; selected: boolean; onSelect: () => void }) {
  const [bg, side, primary, accent] = theme.swatch
  const line = theme.appearance === "dark" ? "rgb(255 255 255 / 0.14)" : "rgb(0 0 0 / 0.12)"
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group overflow-hidden rounded-xl border text-left transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected ? "border-primary ring-1 ring-primary" : "hover:border-ring/60",
      )}
    >
      <div className="flex h-20" style={{ background: bg }} aria-hidden>
        <div className="flex w-1/3 flex-col gap-1.5 p-2" style={{ background: side }}>
          <span className="h-1.5 w-3/4 rounded-full" style={{ background: primary }} />
          <span className="h-1.5 w-full rounded-full" style={{ background: line }} />
          <span className="h-1.5 w-2/3 rounded-full" style={{ background: line }} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-2">
          <span className="h-1.5 w-1/2 rounded-full" style={{ background: accent }} />
          <span className="h-1.5 w-full rounded-full" style={{ background: line }} />
          <span className="h-1.5 w-5/6 rounded-full" style={{ background: line }} />
          <span className="mt-auto ml-auto h-3 w-8 rounded" style={{ background: primary }} />
        </div>
      </div>
      <div className="flex items-center gap-2 border-t bg-card px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{theme.label}</div>
          <div className="truncate text-xs text-muted-foreground">
            {theme.family} · <span className="capitalize">{theme.appearance}</span>
          </div>
        </div>
        {selected && <CheckIcon className="size-4 text-primary" />}
      </div>
    </button>
  )
}
