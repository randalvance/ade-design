import { cn } from "@/lib/utils"
import type { ThreadStatus } from "@/data/types"

const config: Record<ThreadStatus, { label: string; className: string }> = {
  running: { label: "Running", className: "bg-info animate-pulse" },
  "needs-input": { label: "Needs your input", className: "bg-warning" },
  done: { label: "Done", className: "bg-success" },
  error: { label: "Error", className: "bg-destructive" },
  idle: { label: "Idle", className: "bg-muted-foreground/40" },
}

export function ThreadStatusDot({ status, className }: { status: ThreadStatus; className?: string }) {
  const c = config[status]
  return (
    <span
      role="img"
      aria-label={c.label}
      title={c.label}
      className={cn("inline-block size-2 shrink-0 rounded-full", c.className, className)}
    />
  )
}

export const threadStatusLabel = (s: ThreadStatus) => config[s].label
