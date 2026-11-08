import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CodeIcon,
  EyeIcon,
  FactoryIcon,
  FlaskConicalIcon,
  GitMergeIcon,
  ListTodoIcon,
  PauseCircleIcon,
  PlusIcon,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useState } from "react"

import { AgentAvatar } from "@/components/manage/agent-avatar"
import { ConfirmDelete } from "@/components/manage/confirm-delete"
import { EntityIcon, IconPicker } from "@/components/manage/entity-icon"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useStore } from "@/data/store"
import { useCreateFactory } from "@/data/use-create-factory"
import { uid } from "@/lib/id"
import { factoryColumns, type Factory, type FactoryCard, type FactoryColumn } from "@/data/types"
import { navigate } from "@/lib/router"
import { relativeTime } from "@/lib/time"
import { cn } from "@/lib/utils"

const columnMeta: Record<FactoryColumn, { label: string; icon: LucideIcon; hint: string }> = {
  todo: { label: "Todo", icon: ListTodoIcon, hint: "Pulled from the workspace's tracker" },
  plan: { label: "Plan", icon: CircleDashedIcon, hint: "Planner writes the implementation plan" },
  implement: { label: "Implement", icon: CodeIcon, hint: "Coder works in a worktree" },
  review: { label: "Review", icon: EyeIcon, hint: "Reviewer checks the diff" },
  test: { label: "Test", icon: FlaskConicalIcon, hint: "Tester runs and writes tests" },
  merge: { label: "Merge", icon: GitMergeIcon, hint: "Ready to merge" },
}

export function FactoriesPage({ id }: { id?: string }) {
  const { factories } = useStore()
  const createFactory = useCreateFactory()
  const factory = factories.items.find((f) => f.id === id)

  useEffect(() => {
    if (!factory && factories.items[0]) navigate({ name: "factories", id: factories.items[0].id }, { replace: true })
  }, [factory, factories.items])

  if (!factory) {
    return (
      <div className="flex h-svh flex-col">
        <PageHeader>
          <h2 className="text-sm font-medium">Factories</h2>
        </PageHeader>
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FactoryIcon />
            </EmptyMedia>
            <EmptyTitle>No factories yet</EmptyTitle>
            <EmptyDescription>A factory runs agents through a board of work, from Todo to Merge.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={createFactory}>
              <PlusIcon /> New factory
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return <FactoryView key={factory.id} factory={factory} />
}

function FactoryView({ factory }: { factory: Factory }) {
  const { factories, workspaces } = useStore()
  const patch = (p: Partial<Factory>) => factories.update(factory.id, p)
  const workspace = workspaces.items.find((w) => w.id === factory.workspaceId)
  const active = factory.cards.filter((c) => c.active).length

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <PageHeader className="h-auto min-h-12 flex-wrap gap-y-2 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <IconPicker icon={factory.icon} color={factory.color} onChange={patch} size="md" />
          <Input
            value={factory.name}
            onChange={(e) => patch({ name: e.target.value })}
            aria-label="Factory name"
            className="h-8 w-48 border-transparent bg-transparent px-1.5 text-sm font-medium shadow-none hover:border-input focus-visible:border-input dark:bg-transparent"
          />
        </div>

        <Select value={factory.workspaceId} onValueChange={(workspaceId) => patch({ workspaceId })}>
          <SelectTrigger size="sm" className="h-8 gap-2 border-transparent shadow-none hover:border-input" aria-label="Workspace">
            {workspace && <EntityIcon icon={workspace.icon} color={workspace.color} size="sm" />}
            <SelectValue placeholder="Choose workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.items.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline tabular-nums">
            {factory.cards.length} cards · {active} in progress
          </span>
          <label className="flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium">
            <span className={cn("size-1.5 rounded-full", factory.enabled ? "bg-success animate-pulse" : "bg-muted-foreground/50")} />
            {factory.enabled ? "Running" : "Paused"}
            <Switch checked={factory.enabled} onCheckedChange={(enabled) => patch({ enabled })} aria-label="Factory on/off" />
          </label>
          <ConfirmDelete
            noun="factory"
            name={factory.name}
            onConfirm={() => {
              factories.remove(factory.id)
              navigate({ name: "factories" }, { replace: true })
            }}
          />
        </div>
      </PageHeader>

      {!factory.enabled && (
        <div className="flex items-center gap-2 border-b bg-warning/10 px-4 py-2 text-xs text-foreground">
          <PauseCircleIcon className="size-4 text-warning" />
          This factory is paused. Agents won't pick up or advance cards until you turn it on.
        </div>
      )}

      <Board factory={factory} />
    </div>
  )
}

function Board({ factory }: { factory: Factory }) {
  const { moveCard, factories } = useStore()
  const [dragId, setDragId] = useState<string | null>(null)
  const [target, setTarget] = useState<{ column: FactoryColumn; beforeId?: string } | null>(null)

  const drop = () => {
    if (dragId && target) moveCard(factory.id, dragId, target.column, target.beforeId)
    setDragId(null)
    setTarget(null)
  }

  const addCard = (title: string) =>
    factories.update(factory.id, (f) => ({
      cards: [...f.cards, { id: `card-${uid()}`, title, column: "todo", labels: [], updatedAt: Date.now() }],
    }))

  return (
    <div className={cn("min-h-0 flex-1 overflow-x-auto", !factory.enabled && "opacity-75 saturate-50")}>
      <div className="flex h-full min-w-max gap-3 p-3">
        {factoryColumns.map((col) => {
          const meta = columnMeta[col]
          const cards = factory.cards.filter((c) => c.column === col)
          const isTarget = target?.column === col
          return (
            <section
              key={col}
              aria-label={meta.label}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40 transition-colors",
                isTarget && dragId && "border-primary/60 bg-primary/5",
              )}
              onDragOver={(e) => {
                // Cards stop propagation, so this only fires over empty column space → drop at the end.
                e.preventDefault()
                if (target?.column !== col || target.beforeId) setTarget({ column: col })
              }}
              onDrop={(e) => {
                e.preventDefault()
                drop()
              }}
            >
              <header className="flex items-center gap-2 px-3 pt-3 pb-2">
                <meta.icon className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">{meta.label}</h3>
                <Badge variant="secondary" className="h-5 px-1.5 font-normal tabular-nums">
                  {cards.length}
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-auto cursor-help text-xs text-muted-foreground">?</span>
                  </TooltipTrigger>
                  <TooltipContent>{meta.hint}</TooltipContent>
                </Tooltip>
              </header>
              <ol className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                {cards.map((c) => (
                  <li
                    key={c.id}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (c.id !== dragId) setTarget({ column: col, beforeId: c.id })
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      drop()
                    }}
                  >
                    {target?.beforeId === c.id && dragId && <div className="mb-2 h-0.5 rounded-full bg-primary" />}
                    <KanbanCard
                      card={c}
                      dragging={dragId === c.id}
                      onDragStart={() => setDragId(c.id)}
                      onDragEnd={() => {
                        setDragId(null)
                        setTarget(null)
                      }}
                    />
                  </li>
                ))}
                {isTarget && !target?.beforeId && dragId && <li className="h-0.5 rounded-full bg-primary" />}
                {cards.length === 0 && !isTarget && (
                  <li className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">No cards</li>
                )}
              </ol>
              {col === "todo" && <AddCard onAdd={addCard} />}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function KanbanCard({
  card,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  card: FactoryCard
  dragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const { agents } = useStore()
  const agent = agents.items.find((a) => a.id === card.agentId)
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", card.id)
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab space-y-2 rounded-lg border bg-card p-3 shadow-xs transition hover:border-ring/50 active:cursor-grabbing",
        dragging && "opacity-40",
        card.active && "border-l-2 border-l-info",
      )}
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-sm leading-snug">{card.title}</p>
        {card.column === "merge" && <CheckCircle2Icon className="size-4 shrink-0 text-success" aria-label="Ready" />}
      </div>
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labels.map((l) => (
            <Badge key={l} variant="outline" className="h-5 px-1.5 text-[11px] font-normal">
              {l}
            </Badge>
          ))}
        </div>
      )}
      <footer className="flex items-center gap-2 text-xs text-muted-foreground">
        {card.ticket && <code className="text-[11px]">{card.ticket}</code>}
        <span className="ml-auto tabular-nums">{relativeTime(card.updatedAt)}</span>
        {agent && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="relative">
                <AgentAvatar agent={agent} size="sm" />
                {card.active && (
                  <span className="absolute -right-0.5 -bottom-0.5 size-2 animate-pulse rounded-full bg-info ring-2 ring-card" />
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {agent.name}
              {card.active ? " is working on this" : ""}
            </TooltipContent>
          </Tooltip>
        )}
      </footer>
    </article>
  )
}

function AddCard({ onAdd }: { onAdd: (title: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  if (!open)
    return (
      <Button variant="ghost" size="sm" className="m-2 mt-0 justify-start text-muted-foreground" onClick={() => setOpen(true)}>
        <PlusIcon /> Add card
      </Button>
    )
  return (
    <form
      className="m-2 mt-0 space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (title.trim()) onAdd(title.trim())
        setTitle("")
        setOpen(false)
      }}
    >
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="What should the factory build?"
        aria-label="Card title"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!title.trim()}>
          Add
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
