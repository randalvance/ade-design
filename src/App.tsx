import { FolderGit2Icon } from "lucide-react"
import { useEffect } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Composer } from "@/components/chat/composer"
import { Home } from "@/components/chat/home"
import { MessageList } from "@/components/chat/message-list"
import { ThemeProvider } from "@/components/theme-provider"
import { ThreadStatusDot, threadStatusLabel } from "@/components/thread-status"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { agents } from "@/data/mock"
import { StoreProvider, useStore } from "@/data/store"

function Workspace() {
  const { activeThread, selectThread } = useStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        selectThread(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectThread])

  return (
    <SidebarInset className="h-svh overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
        {activeThread ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ThreadStatusDot status={activeThread.status} />
            <h2 className="truncate text-sm font-medium">{activeThread.title}</h2>
            <span className="hidden text-xs text-muted-foreground sm:inline">{threadStatusLabel(activeThread.status)}</span>
            <div className="ml-auto hidden items-center gap-1.5 md:flex">
              {activeThread.routedTo.map((id) => (
                <Badge key={id} variant="secondary" className="font-normal">
                  {agents[id].name}
                </Badge>
              ))}
              <Badge variant="outline" className="gap-1 font-mono font-normal">
                <FolderGit2Icon className="size-3" />
                {activeThread.repo}
              </Badge>
            </div>
          </div>
        ) : (
          <h2 className="text-sm font-medium">New thread</h2>
        )}
      </header>

      {activeThread ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <MessageList />
          <div className="mx-auto w-full max-w-3xl px-4 pb-4">
            <Composer key={activeThread.id} autoFocus />
          </div>
        </div>
      ) : (
        <Home />
      )}
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
