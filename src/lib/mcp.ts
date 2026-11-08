import type { McpStatus } from "@/data/types"

const labels: Record<McpStatus, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Error",
}

export const mcpStatusLabel = (s: McpStatus) => labels[s]
