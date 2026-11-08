import {
  ArrowLeftIcon,
  BlocksIcon,
  BotIcon,
  LayersIcon,
  MoreHorizontalIcon,
  PinIcon,
  PinOffIcon,
  PlugIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  SquarePenIcon,
  Trash2Icon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

import { EntityIcon } from "@/components/manage/entity-icon"
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
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useStore } from "@/data/store"
import { useCreateFactory } from "@/data/use-create-factory"
import type { Thread } from "@/data/types"
import { getLastAppHash, href, isSettingsRoute, navigate, type Route, useRoute } from "@/lib/router"
import { bucketOrder, dateBucket, relativeTime } from "@/lib/time"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const route = useRoute()
  const inSettings = isSettingsRoute(route)

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
          {inSettings ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Back to app">
                <a href={getLastAppHash()}>
                  <ArrowLeftIcon />
                  <span>Back to app</span>
                  <Kbd className="ml-auto">Esc</Kbd>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={route.name === "home"} tooltip="New thread">
                <a href={href({ name: "home" })}>
                  <SquarePenIcon />
                  <span>New thread</span>
                  <Kbd className="ml-auto">⌘N</Kbd>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>{inSettings ? <SettingsNav /> : <MainNav />}</SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-1">
          <SidebarMenu className="flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={inSettings} tooltip="Settings">
                <a href={href({ name: "settings" })}>
                  <SettingsIcon />
                  <span>Settings</span>
                  <Kbd className="ml-auto">⌘,</Kbd>
                </a>
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

/** Settings menu that replaces the main sidebar content on settings routes. */
function SettingsNav() {
  const route = useRoute()
  const { workspaces, agents, skills, mcpServers } = useStore()
  const mcpErrors = mcpServers.items.filter((m) => m.enabled && m.status === "error").length

  const items: { route: Route; label: string; icon: LucideIcon; count?: number; alert?: boolean }[] = [
    { route: { name: "workspaces" }, label: "Workspaces", icon: LayersIcon, count: workspaces.items.length },
    { route: { name: "agents" }, label: "Agents", icon: BotIcon, count: agents.items.length },
    { route: { name: "skills" }, label: "Skills", icon: BlocksIcon, count: skills.items.length },
    { route: { name: "mcp" }, label: "MCP servers", icon: PlugIcon, count: mcpServers.items.length, alert: mcpErrors > 0 },
  ]

  return (
    <>
      <SidebarGroup className="py-1">
        <SidebarGroupLabel>Preferences</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={route.name === "settings"} tooltip="General">
                <a href={href({ name: "settings" })}>
                  <SlidersHorizontalIcon />
                  <span>General</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup className="py-1">
        <SidebarGroupLabel>Configuration</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild isActive={route.name === item.route.name} tooltip={item.label}>
                  <a href={href(item.route)}>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
                <SidebarMenuBadge className="gap-1.5">
                  {item.alert && <span className="size-1.5 rounded-full bg-destructive" aria-label="Has errors" />}
                  <span className="tabular-nums">{item.count}</span>
                </SidebarMenuBadge>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}

/** Factories and Triage threads. */
function MainNav() {
  const { threads, factories } = useStore()
  const route = useRoute()
  const createFactory = useCreateFactory()
  const [query, setQuery] = useState("")

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = threads
      .filter((t) => !q || t.title.toLowerCase().includes(q))
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
    <>
        <SidebarGroup className="py-1">
          <SidebarGroupLabel>Factories</SidebarGroupLabel>
          <SidebarGroupAction title="New factory" onClick={createFactory}>
            <PlusIcon /> <span className="sr-only">New factory</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {factories.items.map((f) => {
                const active = f.cards.filter((c) => c.active).length
                return (
                  <SidebarMenuItem key={f.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={route.name === "factories" && route.id === f.id}
                      tooltip={`${f.name} · ${f.enabled ? "running" : "paused"}`}
                    >
                      <a href={href({ name: "factories", id: f.id })}>
                        <EntityIcon icon={f.icon} color={f.color} size="sm" className={cn(!f.enabled && "opacity-50 grayscale")} />
                        <span className={cn("truncate", !f.enabled && "text-muted-foreground")}>{f.name}</span>
                      </a>
                    </SidebarMenuButton>
                    <SidebarMenuBadge className="gap-1.5">
                      {f.enabled ? (
                        <>
                          {active > 0 && <span className="tabular-nums">{active}</span>}
                          <span className="size-1.5 rounded-full bg-success" aria-label="Running" />
                        </>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wide">Off</span>
                      )}
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="relative px-2 pt-2">
          <SearchIcon className="pointer-events-none absolute left-4 top-[calc(50%+4px)] size-3.5 -translate-y-1/2 text-muted-foreground" />
          <SidebarInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threads"
            className="pl-7"
            aria-label="Search threads"
          />
        </div>
        {groups.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">No threads match “{query}”.</p>
        )}
        {groups.map(([label, items]) => (
          <SidebarGroup key={label} className="py-1">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((t) => (
                  <ThreadItem key={t.id} thread={t} active={route.name === "thread" && route.id === t.id} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
    </>
  )
}

function ThreadItem({ thread, active }: { thread: Thread; active: boolean }) {
  const { togglePin, deleteThread, workspaces } = useStore()
  const ws = workspaces.items.find((w) => w.id === thread.workspaceId)
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        onClick={() => navigate({ name: "thread", id: thread.id })}
        className="h-auto py-1.5"
        tooltip={thread.title}
      >
        <ThreadStatusDot status={thread.status} className="mt-0.5 self-start" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate">{thread.title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {ws?.name ?? "Triage"} · {relativeTime(thread.updatedAt)}
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
