import { PaletteIcon } from "lucide-react"
import { Fragment } from "react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { themes, type ThemeDefinition, type ThemeId } from "@/themes/registry"

export function ThemeSwatch({ theme }: { theme: ThemeDefinition }) {
  const [bg, side, primary, accent] = theme.swatch
  return (
    <span
      aria-hidden
      className="relative inline-flex h-4 w-6 shrink-0 overflow-hidden rounded-sm ring-1 ring-foreground/15"
      style={{ background: bg }}
    >
      <span className="h-full w-2" style={{ background: side }} />
      <span className="absolute right-1 top-1 size-1.5 rounded-full" style={{ background: primary }} />
      <span className="absolute bottom-1 right-1 h-0.5 w-2 rounded-full" style={{ background: accent }} />
    </span>
  )
}

const families = [...new Set(themes.map((t) => t.family))]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Change color theme">
              <PaletteIcon />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Color theme · {theme.label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuRadioGroup value={theme.id} onValueChange={(v) => setTheme(v as ThemeId)}>
          {families.map((family, i) => (
            <Fragment key={family}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground">{family}</DropdownMenuLabel>
              {themes
                .filter((t) => t.family === family)
                .map((t) => (
                  <DropdownMenuRadioItem key={t.id} value={t.id} className="gap-2">
                    <ThemeSwatch theme={t} />
                    <span className="flex-1">{t.label}</span>
                    <span className="text-xs text-muted-foreground capitalize">{t.appearance}</span>
                  </DropdownMenuRadioItem>
                ))}
            </Fragment>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
