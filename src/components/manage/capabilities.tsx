import { BlocksIcon, PlugIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { mcpServers, skills } from "@/data/mock"
import type { Capabilities } from "@/data/types"

import { MemorySection } from "./memory"
import { Section } from "./section"

interface Option {
  id: string
  name: string
  description: string
  meta?: string
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
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:bg-accent/50 has-[:checked]:border-border has-[:checked]:bg-accent/30">
                <Checkbox checked={checked} onCheckedChange={(v) => toggle(o.id, v === true)} className="mt-0.5" />
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {o.name}
                    {o.meta && (
                      <Badge variant="outline" className="h-4 px-1 font-mono text-[10px] font-normal">
                        {o.meta}
                      </Badge>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">{o.description}</span>
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

const count = (n: number, of: number) => (
  <Badge variant="secondary" className="font-normal tabular-nums">
    {n} of {of}
  </Badge>
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
  return (
    <>
      <Section
        title="Skills"
        description={
          scope === "workspace"
            ? "Available to every agent working in this workspace."
            : "Always loaded for this agent, in any workspace."
        }
        action={count(value.skillIds.length, skills.length)}
      >
        <OptionChecklist
          options={skills}
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
        action={count(value.mcpServerIds.length, mcpServers.length)}
      >
        <OptionChecklist
          options={mcpServers.map((m) => ({ ...m, meta: m.transport }))}
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
