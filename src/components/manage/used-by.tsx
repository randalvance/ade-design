import { AgentAvatar } from "@/components/manage/agent-avatar"
import { EntityIcon } from "@/components/manage/entity-icon"
import { useStore } from "@/data/store"
import { href } from "@/lib/router"

import { Section } from "./section"

/** Lists the workspaces and agents that enable a skill or MCP server. */
export function UsedBy({ kind, id }: { kind: "skill" | "mcp"; id: string }) {
  const { workspaces, agents } = useStore()
  const has = (x: { skillIds: string[]; mcpServerIds: string[] }) =>
    (kind === "skill" ? x.skillIds : x.mcpServerIds).includes(id)
  const ws = workspaces.items.filter(has)
  const ag = agents.items.filter(has)
  const total = ws.length + ag.length

  return (
    <Section
      title="Used by"
      description={
        total === 0
          ? "Not enabled anywhere yet. Turn it on from a workspace or an agent."
          : `Enabled in ${ws.length} workspace${ws.length === 1 ? "" : "s"} and ${ag.length} agent${ag.length === 1 ? "" : "s"}.`
      }
    >
      {total === 0 ? (
        <p className="text-xs text-muted-foreground">—</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ws.map((w) => (
            <a
              key={w.id}
              href={href({ name: "workspaces", id: w.id })}
              className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm hover:bg-accent"
            >
              <EntityIcon icon={w.icon} color={w.color} size="sm" className="rounded-full" />
              {w.name}
            </a>
          ))}
          {ag.map((a) => (
            <a
              key={a.id}
              href={href({ name: "agents", id: a.id })}
              className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm hover:bg-accent"
            >
              <AgentAvatar agent={a} size="sm" />
              {a.name}
            </a>
          ))}
        </div>
      )}
    </Section>
  )
}
