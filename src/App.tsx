import { useEffect } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Composer } from "@/components/chat/composer"
import { Home } from "@/components/chat/home"
import { MessageList } from "@/components/chat/message-list"
import { AgentAvatar } from "@/components/manage/agent-avatar"
import { EntityIcon } from "@/components/manage/entity-icon"
import { PageHeader } from "@/components/page-header"
import { ThemeProvider } from "@/components/theme-provider"
import { ThreadStatusDot, threadStatusLabel } from "@/components/thread-status"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { StoreProvider, useStore } from "@/data/store"
import { getLastAppHash, href, isSettingsRoute, navigate, useRoute } from "@/lib/router"
import { AgentsPage } from "@/pages/agents-page"
import { FactoriesPage } from "@/pages/factories-page"
import { GeneralSettingsPage } from "@/pages/general-settings-page"
import { McpPage } from "@/pages/mcp-page"
import { SkillsPage } from "@/pages/skills-page"
import { WorkspacesPage } from "@/pages/workspaces-page"

function ThreadView() {
  const { activeThread, workspaces, agents } = useStore()
  if (!activeThread) {
    return (
      <div className="flex h-svh flex-col">
        <PageHeader>
          <h2 className="text-sm font-medium">Thread not found</h2>
        </PageHeader>
        <p className="p-6 text-sm text-muted-foreground">
          This thread doesn't exist anymore. <a className="underline" href={href({ name: "home" })}>Start a new one</a>.
        </p>
      </div>
    )
  }
  const ws = workspaces.items.find((w) => w.id === activeThread.workspaceId)
  const routed = activeThread.routedTo.flatMap((id) => agents.items.filter((a) => a.id === id))

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <PageHeader>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ThreadStatusDot status={activeThread.status} />
          <h2 className="truncate text-sm font-medium">{activeThread.title}</h2>
          <span className="hidden text-xs text-muted-foreground sm:inline">{threadStatusLabel(activeThread.status)}</span>
          <div className="ml-auto hidden items-center gap-3 md:flex">
            {routed.length > 0 && (
              <div className="flex -space-x-1.5">
                {routed.map((a) => (
                  <Tooltip key={a.id}>
                    <TooltipTrigger asChild>
                      <a href={href({ name: "agents", id: a.id })} className="rounded-full ring-2 ring-background">
                        <AgentAvatar agent={a} size="sm" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>Routed to {a.name}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
            {ws && (
              <a
                href={href({ name: "workspaces", id: ws.id })}
                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <EntityIcon icon={ws.icon} color={ws.color} size="sm" />
                {ws.name}
              </a>
            )}
          </div>
        </div>
      </PageHeader>
      <div className="flex min-h-0 flex-1 flex-col">
        <MessageList />
        <div className="mx-auto w-full max-w-3xl px-4 pb-4">
          <Composer key={activeThread.id} autoFocus placeholder="Reply to Triage…" />
        </div>
      </div>
    </div>
  )
}

function Workspace() {
  const route = useRoute()

  const inSettings = isSettingsRoute(route)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault()
        navigate({ name: "home" })
      } else if (mod && e.key === ",") {
        e.preventDefault()
        navigate({ name: "settings" })
      } else if (e.key === "Escape" && inSettings && !e.defaultPrevented) {
        // Leave settings — but not while typing, or when a dialog/menu/popover is open.
        const el = document.activeElement
        const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement)?.isContentEditable
        const overlayOpen = document.querySelector('[role="dialog"], [role="menu"], [role="listbox"], [data-radix-popper-content-wrapper]')
        if (!typing && !overlayOpen) location.hash = getLastAppHash()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [inSettings])

  return (
    <SidebarInset className="h-svh overflow-hidden">
      {route.name === "home" && (
        <div className="flex h-svh flex-col">
          <PageHeader>
            <h2 className="text-sm font-medium">New thread</h2>
          </PageHeader>
          <Home />
        </div>
      )}
      {route.name === "thread" && <ThreadView />}
      {route.name === "workspaces" && <WorkspacesPage id={route.id} />}
      {route.name === "agents" && <AgentsPage id={route.id} />}
      {route.name === "factories" && <FactoriesPage id={route.id} />}
      {route.name === "settings" && <GeneralSettingsPage />}
      {route.name === "skills" && <SkillsPage id={route.id} />}
      {route.name === "mcp" && <McpPage id={route.id} />}
    </SidebarInset>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <StoreProvider>
          <SidebarProvider>
            <AppSidebar />
            <Workspace />
          </SidebarProvider>
        </StoreProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
