import type { McpStatus } from "@/data/types"
import { mcpStatusLabel } from "@/lib/mcp"
import { cn } from "@/lib/utils"

const classes: Record<McpStatus, string> = {
  connected: "bg-success",
  disconnected: "bg-muted-foreground/50",
  error: "bg-destructive",
}

export function McpStatusDot({ status, className }: { status: McpStatus; className?: string }) {
  const label = mcpStatusLabel(status)
  return <span role="img" aria-label={label} title={label} className={cn("inline-block size-2 shrink-0 rounded-full", classes[status], className)} />
}
