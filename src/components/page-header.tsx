import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function PageHeader({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("flex h-12 shrink-0 items-center gap-2 border-b px-3", className)}>
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
      {children}
    </header>
  )
}
