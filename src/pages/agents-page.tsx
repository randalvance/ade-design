import { BotIcon, LockIcon } from "lucide-react"
import { useEffect } from "react"

import { AgentAvatar, AgentPhotoEditor } from "@/components/manage/agent-avatar"
import { CapabilitySections } from "@/components/manage/capabilities"
import { ConfirmDelete } from "@/components/manage/confirm-delete"
import { EditorColumn, ManagerLayout } from "@/components/manage/manager-layout"
import { FieldLabel, Section } from "@/components/manage/section"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { models } from "@/data/mock"
import { useStore } from "@/data/store"
import { uid } from "@/lib/id"
import type { Agent } from "@/data/types"
import { accentColors } from "@/lib/icons"
import { navigate } from "@/lib/router"

export function AgentsPage({ id }: { id?: string }) {
  const { agents } = useStore()
  const selected = agents.items.find((a) => a.id === id)

  useEffect(() => {
    if (!selected && agents.items[0]) navigate({ name: "agents", id: agents.items[0].id }, { replace: true })
  }, [selected, agents.items])

  const create = () => {
    const agent: Agent = {
      id: `ag-${uid()}`,
      name: "New agent",
      description: "",
      color: accentColors[agents.items.length % accentColors.length],
      modelId: models[1].id,
      systemPrompt: "",
      skillIds: [],
      mcpServerIds: [],
      memory: [],
    }
    agents.add(agent)
    navigate({ name: "agents", id: agent.id })
  }

  return (
    <ManagerLayout
      title="Agents"
      icon={BotIcon}
      items={agents.items}
      selectedId={selected?.id}
      onSelect={(aid) => navigate({ name: "agents", id: aid })}
      onCreate={create}
      createLabel="New agent"
      renderItem={(a) => (
        <>
          <AgentAvatar agent={a} size="sm" />
          <span className="min-w-0 flex-1 truncate">{a.name}</span>
          {a.builtIn && <LockIcon className="size-3 text-muted-foreground" aria-label="Built-in" />}
        </>
      )}
    >
      {selected && <AgentEditor key={selected.id} agent={selected} />}
    </ManagerLayout>
  )
}

function AgentEditor({ agent }: { agent: Agent }) {
  const { agents } = useStore()
  const patch = (p: Partial<Agent>) => agents.update(agent.id, p)

  return (
    <EditorColumn>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AgentPhotoEditor agent={agent} onChange={(photo) => patch({ photo })} />
        {agent.builtIn ? (
          <Badge variant="outline" className="gap-1">
            <LockIcon className="size-3" /> Built-in
          </Badge>
        ) : (
          <ConfirmDelete
            noun="agent"
            name={agent.name}
            onConfirm={() => {
              agents.remove(agent.id)
              navigate({ name: "agents" }, { replace: true })
            }}
          />
        )}
      </div>

      <Section title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel htmlFor="agent-name">Name</FieldLabel>
            <Input id="agent-name" value={agent.name} onChange={(e) => patch({ name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Default model</FieldLabel>
            <Select value={agent.modelId} onValueChange={(modelId) => patch({ modelId })}>
              <SelectTrigger className="w-full" aria-label="Default model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel htmlFor="agent-description">Description</FieldLabel>
            <Input
              id="agent-description"
              value={agent.description}
              placeholder="What this agent does — Triage reads this when routing"
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>
        </div>
      </Section>

      <Section title="System prompt" description="Sent at the start of every task this agent runs.">
        <Textarea
          value={agent.systemPrompt}
          onChange={(e) => patch({ systemPrompt: e.target.value })}
          placeholder="You are…"
          className="min-h-40 font-mono text-[13px] leading-relaxed"
        />
        <p className="mt-1.5 text-right text-xs text-muted-foreground tabular-nums">{agent.systemPrompt.length} characters</p>
      </Section>

      <CapabilitySections value={agent} onChange={patch} scope="agent" />
    </EditorColumn>
  )
}
