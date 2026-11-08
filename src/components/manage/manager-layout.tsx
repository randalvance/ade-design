import { PlusIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * List + editor layout for managing a collection (workspaces, agents).
 * Left: searchable list. Right: the selected item's editor.
 */
export function ManagerLayout<T extends { id: string; name: string }>({
  title,
  noun = title.toLowerCase(),
  icon: Icon,
  items,
  selectedId,
  onSelect,
  onCreate,
  createLabel,
  renderItem,
  children,
}: {
  title: string
  /** Used in "Search …"; defaults to the lowercased title. */
  noun?: string
  icon: React.ComponentType<{ className?: string }>
  items: T[]
  selectedId?: string
  onSelect: (id: string) => void
  onCreate: () => void
  createLabel: string
  renderItem: (item: T) => React.ReactNode
  children: React.ReactNode
}) {
  const [q, setQ] = useState("")
  const shown = useMemo(
    () => items.filter((i) => !q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase())),
    [items, q],
  )

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <PageHeader>
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">{title}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length}</span>
        <Button size="sm" className="ml-auto" onClick={onCreate}>
          <PlusIcon /> {createLabel}
        </Button>
      </PageHeader>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col border-r md:flex">
          <div className="p-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${noun}`}
                aria-label={`Search ${noun}`}
                className="h-8 pl-8"
              />
            </div>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2" aria-label={title}>
            <ul className="space-y-0.5">
              {shown.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={item.id === selectedId ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/60",
                      item.id === selectedId && "bg-accent text-accent-foreground",
                    )}
                  >
                    {renderItem(item)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

/** Centered column for an editor form. */
export function EditorColumn({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6">{children}</div>
}
