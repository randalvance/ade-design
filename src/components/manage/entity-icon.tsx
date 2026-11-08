import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { accentColors, iconNames, icons, type IconName } from "@/lib/icons"
import { cn } from "@/lib/utils"

const sizes = {
  sm: "size-5 rounded [&_svg]:size-3",
  md: "size-7 rounded-md [&_svg]:size-4",
  lg: "size-12 rounded-xl [&_svg]:size-6",
}

/** A tinted rounded square with a lucide icon. Used for workspaces and factories. */
export function EntityIcon({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: IconName
  color: string
  size?: keyof typeof sizes
  className?: string
}) {
  const Icon = icons[icon] ?? icons.folder
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center", sizes[size], className)}
      style={{ background: `color-mix(in oklab, ${color} 20%, transparent)`, color }}
    >
      <Icon />
    </span>
  )
}

/** Click the icon to choose a glyph and accent color. */
export function IconPicker({
  icon,
  color,
  onChange,
  size = "lg",
}: {
  icon: IconName
  color: string
  onChange: (next: { icon: IconName; color: string }) => void
  size?: keyof typeof sizes
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="size-auto rounded-xl p-0.5" aria-label="Change icon">
          <EntityIcon icon={icon} color={color} size={size} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <div className="grid grid-cols-8 gap-1">
          {iconNames.map((name) => {
            const Icon = icons[name]
            return (
              <button
                key={name}
                type="button"
                title={name}
                aria-label={name}
                aria-pressed={name === icon}
                onClick={() => onChange({ icon: name, color })}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  name === icon && "bg-accent text-foreground ring-1 ring-ring",
                )}
              >
                <Icon className="size-4" />
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-1.5 border-t pt-3">
          {accentColors.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              aria-pressed={c === color}
              onClick={() => onChange({ icon, color: c })}
              className="flex size-6 items-center justify-center rounded-full ring-offset-2 ring-offset-popover focus-visible:ring-2"
              style={{ background: c }}
            >
              {c === color && <CheckIcon className="size-3.5 text-white" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
