import { ChevronRightIcon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { href } from "@/lib/router"

/** Page header for settings pages: "Settings › Title", plus optional actions on the right. */
export function SettingsHeader({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
  children?: React.ReactNode
}) {
  return (
    <PageHeader>
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        <a href={href({ name: "settings" })} className="text-muted-foreground hover:text-foreground">
          Settings
        </a>
        <ChevronRightIcon className="size-3.5 text-muted-foreground" />
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="truncate font-medium">{title}</h2>
        {count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
      </nav>
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </PageHeader>
  )
}
