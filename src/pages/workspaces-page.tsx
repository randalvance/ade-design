import { ExternalLinkIcon, FolderIcon, FolderPlusIcon, LayersIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { CapabilitySections } from "@/components/manage/capabilities"
import { ConfirmDelete } from "@/components/manage/confirm-delete"
import { EntityIcon, IconPicker } from "@/components/manage/entity-icon"
import { EditorColumn, ManagerLayout } from "@/components/manage/manager-layout"
import { FieldLabel, Section } from "@/components/manage/section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/data/store"
import { uid } from "@/lib/id"
import type { TrackerKind, Workspace } from "@/data/types"
import { navigate } from "@/lib/router"

const trackers: Record<TrackerKind, { label: string; projectLabel: string; placeholder: string; url: (p: string) => string }> = {
  github: {
    label: "GitHub Issues",
    projectLabel: "Repository",
    placeholder: "owner/repo",
    url: (p) => `https://github.com/${p}/issues`,
  },
  jira: {
    label: "Jira",
    projectLabel: "Project key",
    placeholder: "PAW",
    url: (p) => `https://your-org.atlassian.net/browse/${p}`,
  },
  linear: {
    label: "Linear",
    projectLabel: "Team key",
    placeholder: "ENG",
    url: (p) => `https://linear.app/your-org/team/${p}`,
  },
}

export function WorkspacesPage({ id }: { id?: string }) {
  const { workspaces } = useStore()
  const selected = workspaces.items.find((w) => w.id === id)

  useEffect(() => {
    if (!selected && workspaces.items[0]) navigate({ name: "workspaces", id: workspaces.items[0].id }, { replace: true })
  }, [selected, workspaces.items])

  const create = () => {
    const ws: Workspace = {
      id: `ws-${uid()}`,
      name: "New workspace",
      icon: "folder",
      color: "#64748b",
      folders: [],
      instructions: "",
      tracker: null,
      skillIds: [],
      mcpServerIds: [],
      memory: [],
    }
    workspaces.add(ws)
    navigate({ name: "workspaces", id: ws.id })
  }

  return (
    <ManagerLayout
      title="Workspaces"
      icon={LayersIcon}
      items={workspaces.items}
      selectedId={selected?.id}
      onSelect={(wid) => navigate({ name: "workspaces", id: wid })}
      onCreate={create}
      createLabel="New workspace"
      renderItem={(w) => (
        <>
          <EntityIcon icon={w.icon} color={w.color} size="sm" />
          <span className="min-w-0 flex-1 truncate">{w.name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{w.folders.length}</span>
        </>
      )}
    >
      {selected && <WorkspaceEditor key={selected.id} workspace={selected} />}
    </ManagerLayout>
  )
}

function WorkspaceEditor({ workspace: ws }: { workspace: Workspace }) {
  const { workspaces } = useStore()
  const patch = (p: Partial<Workspace>) => workspaces.update(ws.id, p)

  return (
    <EditorColumn>
      <div className="flex items-center gap-4">
        <IconPicker icon={ws.icon} color={ws.color} onChange={patch} />
        <div className="min-w-0 flex-1">
          <Input
            value={ws.name}
            onChange={(e) => patch({ name: e.target.value })}
            aria-label="Workspace name"
            className="h-auto border-transparent bg-transparent px-1 text-xl font-semibold shadow-none hover:border-input focus-visible:border-input dark:bg-transparent"
          />
          <p className="px-1 text-xs text-muted-foreground">
            {ws.folders.length} folder{ws.folders.length === 1 ? "" : "s"} · {ws.skillIds.length} skills ·{" "}
            {ws.mcpServerIds.length} MCP servers
          </p>
        </div>
        <ConfirmDelete
          noun="workspace"
          name={ws.name}
          onConfirm={() => {
            workspaces.remove(ws.id)
            navigate({ name: "workspaces" }, { replace: true })
          }}
        />
      </div>

      <FoldersSection folders={ws.folders} onChange={(folders) => patch({ folders })} />

      <Section title="Instructions" description="Context and rules every agent follows in this workspace.">
        <Textarea
          value={ws.instructions}
          onChange={(e) => patch({ instructions: e.target.value })}
          placeholder="e.g. Use the design-system package for all UI. Every PR needs tests."
          className="min-h-32 font-mono text-[13px] leading-relaxed"
        />
        <p className="mt-1.5 text-right text-xs text-muted-foreground tabular-nums">{ws.instructions.length} characters</p>
      </Section>

      <TrackerSection workspace={ws} onChange={(tracker) => patch({ tracker })} />

      <CapabilitySections value={ws} onChange={patch} scope="workspace" />
    </EditorColumn>
  )
}

function FoldersSection({ folders, onChange }: { folders: string[]; onChange: (f: string[]) => void }) {
  const [draft, setDraft] = useState("")
  const add = () => {
    const p = draft.trim()
    if (!p || folders.includes(p)) return
    onChange([...folders, p])
    setDraft("")
  }
  return (
    <Section title="Folders" description="Agents can read and write only inside these folders.">
      <div className="space-y-3">
        {folders.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {folders.map((f) => (
              <li key={f} className="group flex items-center gap-2.5 px-3 py-2">
                <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                <code className="min-w-0 flex-1 truncate text-[13px]">{f}</code>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove ${f}`}
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => onChange(folders.filter((x) => x !== f))}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="~/dev/project"
            className="font-mono text-[13px]"
            aria-label="Folder path"
          />
          <Button type="submit" variant="outline" disabled={!draft.trim()}>
            <FolderPlusIcon /> Add folder
          </Button>
        </form>
      </div>
    </Section>
  )
}

function TrackerSection({ workspace, onChange }: { workspace: Workspace; onChange: (t: Workspace["tracker"]) => void }) {
  const t = workspace.tracker
  const kind = t?.kind ?? "none"
  return (
    <Section
      title="Ticket tracker"
      description="Where this workspace's issues live. Factories pull work from here."
      action={t ? <Badge className="bg-success/15 text-success">Linked</Badge> : <Badge variant="outline">Not linked</Badge>}
    >
      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <div className="space-y-1.5">
          <FieldLabel>Tracker</FieldLabel>
          <Select
            value={kind}
            onValueChange={(v) => {
              if (v === "none") return onChange(null)
              const k = v as TrackerKind
              const project = t?.project ?? ""
              onChange({ kind: k, project, url: trackers[k].url(project) })
            }}
          >
            <SelectTrigger className="w-full" aria-label="Tracker">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {(Object.keys(trackers) as TrackerKind[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {trackers[k].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {t && (
          <div className="space-y-1.5">
            <FieldLabel htmlFor="tracker-project">{trackers[t.kind].projectLabel}</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="tracker-project"
                value={t.project}
                placeholder={trackers[t.kind].placeholder}
                onChange={(e) => onChange({ ...t, project: e.target.value, url: trackers[t.kind].url(e.target.value) })}
                className="font-mono text-[13px]"
              />
              <Button variant="outline" size="icon" asChild aria-label="Open tracker">
                <a href={t.url} target="_blank" rel="noreferrer">
                  <ExternalLinkIcon />
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
