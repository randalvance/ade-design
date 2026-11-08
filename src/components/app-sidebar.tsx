import {
  MoreHorizontalIcon,
  PinIcon,
  PinOffIcon,
  SearchIcon,
  SettingsIcon,
  SquarePenIcon,
  Trash2Icon,
  WorkflowIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

import { ThreadStatusDot } from "@/components/thread-status"
import { ThemeSwitcher } from "@/components/theme-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useStore } from "@/data/store"
import type { Thread } from "@/data/types"
import { bucketOrder, dateBucket, relativeTime } from "@/lib/time"

export function AppSidebar() {
  const { threads, activeThread, selectThread } = useStore()
  const [query, setQuery] = useState("")

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = threads
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.repo.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt - a.updatedAt)
    const map = new Map<string, Thread[]>()
    const pinned = filtered.filter((t) => t.pinned)
    if (pinned.length) map.set("Pinned", pinned)
    for (const t of filtered.filter((t) => !t.pinned)) {
      const b = dateBucket(t.updatedAt)
      map.set(b, [...(map.get(b) ?? []), t])
    }
    const order = ["Pinned", ...bucketOrder]
    return [...map.entries()].sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
  }, [threads, query])

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="gap-3">
        <div className="flex items-center gap-2 px-1 pt-1">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <WorkflowIcon className="size-4" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">Primepaw</span>
            <span className="truncate text-xs text-muted-foreground">Agentic workspace</span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => selectThread(null)} isActive={!activeThread} tooltip="New thread">
              <SquarePenIcon />
              <span>New thread</span>
              <Kbd className="ml-auto">⌘N</Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <SidebarInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threads"
            className="pl-7"
            aria-label="Search threads"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">No threads match “{query}”.</p>
        )}
        {groups.map(([label, items]) => (
          <SidebarGroup key={label} className="py-1">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((t) => (
                  <ThreadItem key={t.id} thread={t} active={t.id === activeThread?.id} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-1">
          <SidebarMenu className="flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <SettingsIcon />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <ThemeSwitcher />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function ThreadItem({ thread, active }: { thread: Thread; active: boolean }) {
  const { selectThread, togglePin, deleteThread } = useStore()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        onClick={() => selectThread(thread.id)}
        className="h-auto py-1.5"
        tooltip={thread.title}
      >
        <ThreadStatusDot status={thread.status} className="mt-0.5 self-start" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate">{thread.title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {thread.repo.split("/")[1]} · {relativeTime(thread.updatedAt)}
          </span>
        </div>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover aria-label="Thread actions" className="top-2">
            <MoreHorizontalIcon />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onClick={() => togglePin(thread.id)}>
            {thread.pinned ? <PinOffIcon /> : <PinIcon />}
            {thread.pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => deleteThread(thread.id)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
