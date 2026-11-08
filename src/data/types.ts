import type { ToolUIPart } from "ai"

export type AgentId = "triage" | "planner" | "coder" | "reviewer" | "tester" | "researcher"

export interface Agent {
  id: AgentId
  name: string
  description: string
}

export type TextPart = { type: "text"; text: string }
export type ReasoningPart = { type: "reasoning"; text: string; duration?: number }
export type ToolPart = {
  type: "tool"
  /** Tool name, e.g. `route_to_agent`. */
  name: string
  state: ToolUIPart["state"]
  input: Record<string, unknown>
  output?: unknown
  errorText?: string
}

export type MessagePart = TextPart | ReasoningPart | ToolPart

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  parts: MessagePart[]
  createdAt: number
}

export type ThreadStatus = "idle" | "running" | "needs-input" | "done" | "error"

export interface Thread {
  id: string
  title: string
  /** Repository / workspace the thread operates on. */
  repo: string
  status: ThreadStatus
  /** Specialist agents the Triage agent has routed work to. */
  routedTo: AgentId[]
  updatedAt: number
  pinned?: boolean
  messages: ChatMessage[]
}
