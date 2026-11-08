import type { ToolUIPart } from "ai"

import type { IconName } from "@/lib/icons"

/* ── Shared building blocks (used by both workspaces and agents) ───────── */

export interface Skill {
  id: string
  name: string
  /** One line. Agents read this to decide when to load the skill. */
  description: string
  /** The skill body (SKILL.md), in Markdown. */
  instructions: string
  /** Built-in skills ship with the app and can't be deleted. */
  source: "built-in" | "custom"
}

export type McpTransport = "stdio" | "http"
export type McpStatus = "connected" | "disconnected" | "error"

export interface KeyValue {
  key: string
  value: string
  /** Masked in the UI. */
  secret?: boolean
}

export interface McpTool {
  name: string
  description: string
}

export interface McpServer {
  id: string
  name: string
  description: string
  transport: McpTransport
  /** stdio: the command and its arguments. */
  command?: string
  args?: string[]
  /** http: the server URL. */
  url?: string
  /** stdio: environment variables. http: request headers. */
  env: KeyValue[]
  /** Globally disabled servers can't be used by any workspace or agent. */
  enabled: boolean
  status: McpStatus
  lastError?: string
  /** Tools the server advertised on its last connection. */
  tools: McpTool[]
}

export interface MemoryItem {
  id: string
  text: string
  createdAt: number
  /** Who added it: the user, or an agent that learned it. */
  source: "user" | "agent"
}

/** Fields both workspaces and agents carry; edited with the same components. */
export interface Capabilities {
  skillIds: string[]
  mcpServerIds: string[]
  memory: MemoryItem[]
}

export interface Model {
  id: string
  name: string
}

/* ── Workspaces ───────────────────────────────────────────────────────── */

export type TrackerKind = "github" | "jira" | "linear"

export interface TrackerLink {
  kind: TrackerKind
  /** `owner/repo` for GitHub, project key for Jira/Linear. */
  project: string
  url: string
}

export interface Workspace extends Capabilities {
  id: string
  name: string
  icon: IconName
  color: string
  folders: string[]
  instructions: string
  tracker: TrackerLink | null
}

/* ── Agents ───────────────────────────────────────────────────────────── */

export interface Agent extends Capabilities {
  id: string
  name: string
  description: string
  /** Data URL or image URL; falls back to initials. */
  photo?: string
  color: string
  modelId: string
  systemPrompt: string
  /** Built-in agents (Triage) can't be deleted. */
  builtIn?: boolean
}

/* ── Factories ────────────────────────────────────────────────────────── */

export const factoryColumns = ["todo", "plan", "implement", "review", "test", "merge"] as const
export type FactoryColumn = (typeof factoryColumns)[number]

export interface FactoryCard {
  id: string
  title: string
  column: FactoryColumn
  /** Ticket reference from the workspace's tracker, e.g. `#1412` or `PAW-88`. */
  ticket?: string
  agentId?: string
  labels: string[]
  /** Agent is actively working on it. */
  active?: boolean
  updatedAt: number
}

export interface Factory {
  id: string
  name: string
  icon: IconName
  color: string
  enabled: boolean
  workspaceId: string
  cards: FactoryCard[]
}

/* ── Threads (Triage chat) ────────────────────────────────────────────── */

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
  /** Workspace Triage chose for this thread (unset until it decides). */
  workspaceId?: string
  status: ThreadStatus
  /** Agents the Triage agent has routed work to. */
  routedTo: string[]
  updatedAt: number
  pinned?: boolean
  messages: ChatMessage[]
}
