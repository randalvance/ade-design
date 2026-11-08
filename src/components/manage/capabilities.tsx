import { BlocksIcon, PlugIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useStore } from "@/data/store"
import type { Capabilities, McpStatus } from "@/data/types"
import { href } from "@/lib/router"
import { cn } from "@/lib/utils"

import { McpStatusDot } from "./mcp-status"

import { MemorySection } from "./memory"
import { Section } from "./section"

interface Option {
  id: string
  name: string
  description: string
  meta?: string
  status?: McpStatus
  /** Shown but not selectable (e.g. an MCP server that's turned off globally). */
  disabledReason?: string
}

/** Searchable checkbox list. Shared by skills and MCP servers. */
function OptionChecklist({
  options,
  selected,
  onChange,
  icon: Icon,
  noun,
}: {
  options: Option[]
  selected: string[]
  onChange: (ids: string[]) => void
  icon: React.ComponentType<{ className?: string }>
  noun: string
}) {
  const [q, setQ] = useState("")
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return options.filter((o) => !needle || `${o.name} ${o.description}`.toLowerCase().includes(needle))
  }, [options, q])

  const toggle = (id: string, on: boolean) =>
    onChange(on ? [...selected, id] : selected.filter((x) => x !== id))

  return (
    <div className="space-y-3">
      {options.length > 6 && (
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${noun}`} className="h-8 pl-8" />
        </div>
      )}
      <ul className="grid gap-1 sm:grid-cols-2">
        {shown.map((o) => {
          const checked = selected.includes(o.id)
          return (
            <li key={o.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:bg-accent/50 has-[:checked]:border-border has-[:checked]:bg-accent/30",
                  o.disabledReason && "cursor-not-allowed opacity-60 hover:bg-transparent",
                )}
                title={o.disabledReason}
              >
                <Checkbox
                  checked={checked}
                  disabled={!!o.disabledReason}
                  onCheckedChange={(v) => toggle(o.id, v === true)}
                  className="mt-0.5"
                />
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {o.status && <McpStatusDot status={o.status} />}
                    {o.name}
                    {o.meta && (
                      <Badge variant="outline" className="h-4 px-1 font-mono text-[10px] font-normal">
                        {o.meta}
                      </Badge>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">{o.disabledReason ?? o.description}</span>
                </span>
              </label>
            </li>
          )
        })}
        {shown.length === 0 && <li className="p-2 text-xs text-muted-foreground">No {noun} match “{q}”.</li>}
      </ul>
    </div>
  )
}

const count = (n: number, of: number, manage: string) => (
  <div className="flex shrink-0 items-center gap-2">
    <Badge variant="secondary" className="font-normal tabular-nums">
      {n} of {of}
    </Badge>
    <a href={manage} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
      Manage
    </a>
  </div>
)

/**
 * Skills, MCP servers and memory — identical for workspaces and agents.
 * `scope` only changes the copy.
 */
export function CapabilitySections<T extends Capabilities>({
  value,
  onChange,
  scope,
}: {
  value: T
  onChange: (patch: Partial<Capabilities>) => void
  scope: "workspace" | "agent"
}) {
  const { skills, mcpServers } = useStore()
  return (
    <>
      <Section
        title="Skills"
        description={
          scope === "workspace"
            ? "Available to every agent working in this workspace."
            : "Always loaded for this agent, in any workspace."
        }
        action={count(value.skillIds.length, skills.items.length, href({ name: "skills" }))}
      >
        <OptionChecklist
          options={skills.items}
          selected={value.skillIds}
          onChange={(skillIds) => onChange({ skillIds })}
          icon={BlocksIcon}
          noun="skills"
        />
      </Section>
      <Section
        title="MCP servers"
        description={
          scope === "workspace"
            ? "Tools agents can call while working in this workspace."
            : "Tools this agent can call."
        }
        action={count(value.mcpServerIds.length, mcpServers.items.length, href({ name: "mcp" }))}
      >
        <OptionChecklist
          options={mcpServers.items.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description,
            meta: m.transport,
            status: m.status,
            disabledReason: m.enabled ? undefined : "Turned off in MCP servers",
          }))}
          selected={value.mcpServerIds}
          onChange={(mcpServerIds) => onChange({ mcpServerIds })}
          icon={PlugIcon}
          noun="servers"
        />
      </Section>
      <MemorySection memory={value.memory} onChange={(memory) => onChange({ memory })} scope={scope} />
    </>
  )
}
