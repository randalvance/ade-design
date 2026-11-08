import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  PlugIcon,
  PlugZapIcon,
  PlusIcon,
  RefreshCwIcon,
  WrenchIcon,
  XIcon,
} from "lucide-react"
import { useEffect, useState } from "react"

import { CodeBlock } from "@/components/ai-elements/code-block"
import { ConfirmDelete } from "@/components/manage/confirm-delete"
import { EditorColumn, ManagerLayout } from "@/components/manage/manager-layout"
import { McpStatusDot } from "@/components/manage/mcp-status"
import { FieldLabel, Section } from "@/components/manage/section"
import { UsedBy } from "@/components/manage/used-by"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/data/store"
import type { KeyValue, McpServer, McpTransport } from "@/data/types"
import { uid } from "@/lib/id"
import { mcpStatusLabel } from "@/lib/mcp"
import { navigate } from "@/lib/router"
import { cn } from "@/lib/utils"

export function McpPage({ id }: { id?: string }) {
  const { mcpServers } = useStore()
  const selected = mcpServers.items.find((m) => m.id === id)

  useEffect(() => {
    if (!selected && mcpServers.items[0]) navigate({ name: "mcp", id: mcpServers.items[0].id }, { replace: true })
  }, [selected, mcpServers.items])

  const create = () => {
    const m: McpServer = {
      id: `mcp-${uid()}`,
      name: "New server",
      description: "",
      transport: "stdio",
      command: "npx",
      args: [],
      env: [],
      enabled: true,
      status: "disconnected",
      tools: [],
    }
    mcpServers.add(m)
    navigate({ name: "mcp", id: m.id })
  }

  return (
    <ManagerLayout
      title="MCP servers"
      noun="MCP servers"
      icon={PlugIcon}
      items={mcpServers.items}
      selectedId={selected?.id}
      onSelect={(mid) => navigate({ name: "mcp", id: mid })}
      onCreate={create}
      createLabel="Add server"
      renderItem={(m) => (
        <>
          <McpStatusDot status={m.enabled ? m.status : "disconnected"} />
          <span className={cn("min-w-0 flex-1 truncate", !m.enabled && "text-muted-foreground")}>{m.name}</span>
          {m.enabled ? (
            <span className="font-mono text-[10px] text-muted-foreground">{m.transport}</span>
          ) : (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Off</span>
          )}
        </>
      )}
    >
      {selected && <McpEditor key={selected.id} server={selected} />}
    </ManagerLayout>
  )
}

function McpEditor({ server: m }: { server: McpServer }) {
  const { mcpServers, deleteMcpServer } = useStore()
  const patch = (p: Partial<McpServer>) => mcpServers.update(m.id, p)
  const [connecting, setConnecting] = useState(false)

  // Mock connection: succeeds after a moment and "discovers" tools if there were none.
  const connect = () => {
    setConnecting(true)
    window.setTimeout(() => {
      setConnecting(false)
      patch({
        status: "connected",
        lastError: undefined,
        tools: m.tools.length ? m.tools : [{ name: "ping", description: "Health check advertised by the server" }],
      })
    }, 1200)
  }

  return (
    <EditorColumn>
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary",
            !m.enabled && "bg-muted text-muted-foreground",
          )}
        >
          <PlugIcon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <Input
            value={m.name}
            onChange={(e) => patch({ name: e.target.value })}
            aria-label="Server name"
            className="h-auto border-transparent bg-transparent px-1 text-xl font-semibold shadow-none hover:border-input focus-visible:border-input dark:bg-transparent"
          />
          <Input
            value={m.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="What this server gives agents access to"
            aria-label="Description"
            className="h-7 border-transparent bg-transparent px-1 text-xs text-muted-foreground shadow-none hover:border-input focus-visible:border-input dark:bg-transparent"
          />
        </div>
        <label className="flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium">
          {m.enabled ? "On" : "Off"}
          <Switch
            checked={m.enabled}
            onCheckedChange={(enabled) => patch({ enabled, status: enabled ? m.status : "disconnected" })}
            aria-label="Enable server"
          />
        </label>
        <ConfirmDelete
          noun="server"
          name={m.name}
          onConfirm={() => {
            deleteMcpServer(m.id)
            navigate({ name: "mcp" }, { replace: true })
          }}
        />
      </div>

      <StatusBanner server={m} connecting={connecting} onConnect={connect} />

      <Section
        title="Connection"
        description="How Warlock starts or reaches this server."
        action={
          <Tabs value={m.transport} onValueChange={(v) => patch({ transport: v as McpTransport, status: "disconnected" })}>
            <TabsList className="h-8">
              <TabsTrigger value="stdio" className="font-mono text-xs">
                stdio
              </TabsTrigger>
              <TabsTrigger value="http" className="font-mono text-xs">
                http
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        {m.transport === "stdio" ? (
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="mcp-command">Command</FieldLabel>
              <Input
                id="mcp-command"
                value={m.command ?? ""}
                onChange={(e) => patch({ command: e.target.value })}
                placeholder="npx"
                className="font-mono text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="mcp-args">Arguments · one per line</FieldLabel>
              <Textarea
                id="mcp-args"
                value={(m.args ?? []).join("\n")}
                onChange={(e) => patch({ args: e.target.value.split("\n") })}
                placeholder={"-y\n@scope/mcp-server"}
                className="min-h-20 font-mono text-[13px]"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <FieldLabel htmlFor="mcp-url">Server URL</FieldLabel>
            <Input
              id="mcp-url"
              value={m.url ?? ""}
              onChange={(e) => patch({ url: e.target.value })}
              placeholder="https://example.com/mcp"
              className="font-mono text-[13px]"
            />
          </div>
        )}
      </Section>

      <KeyValueSection
        title={m.transport === "stdio" ? "Environment variables" : "Headers"}
        description={
          m.transport === "stdio"
            ? "Passed to the server process. Mark secrets so they're masked."
            : "Sent with every request, e.g. Authorization."
        }
        rows={m.env}
        onChange={(env) => patch({ env })}
        keyPlaceholder={m.transport === "stdio" ? "API_KEY" : "Authorization"}
      />

      <Section
        title="Tools"
        description="Advertised by the server on its last connection."
        action={
          <Badge variant="secondary" className="font-normal tabular-nums">
            {m.tools.length}
          </Badge>
        }
      >
        {m.tools.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tools yet. Connect to discover them.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {m.tools.map((t) => (
              <li key={t.name} className="flex items-start gap-3 px-3 py-2">
                <WrenchIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <code className="text-[13px] font-medium">{t.name}</code>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Config" description="The equivalent entry for an mcp.json file.">
        <CodeBlock code={toMcpJson(m)} language="json" />
      </Section>

      <UsedBy kind="mcp" id={m.id} />
    </EditorColumn>
  )
}

function StatusBanner({ server: m, connecting, onConnect }: { server: McpServer; connecting: boolean; onConnect: () => void }) {
  if (!m.enabled) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <PlugIcon className="size-4" />
        Turned off. No workspace or agent can use this server until you turn it on.
      </div>
    )
  }
  const tone =
    m.status === "connected"
      ? "border-success/40 bg-success/10"
      : m.status === "error"
        ? "border-destructive/40 bg-destructive/10"
        : "bg-muted/40"
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border px-3 py-2 text-sm", tone)} aria-live="polite">
      {connecting ? (
        <Spinner className="size-4" />
      ) : m.status === "connected" ? (
        <CheckCircle2Icon className="size-4 text-success" />
      ) : m.status === "error" ? (
        <AlertTriangleIcon className="size-4 text-destructive" />
      ) : (
        <McpStatusDot status="disconnected" />
      )}
      <div className="min-w-0 flex-1">
        <span className="font-medium">{connecting ? "Connecting…" : mcpStatusLabel(m.status)}</span>
        {!connecting && m.status === "connected" && (
          <span className="text-muted-foreground">
            {" "}
            · {m.tools.length} tool{m.tools.length === 1 ? "" : "s"} available
          </span>
        )}
        {!connecting && m.status === "error" && m.lastError && (
          <span className="block truncate font-mono text-xs text-muted-foreground">{m.lastError}</span>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={onConnect} disabled={connecting}>
        {m.status === "connected" ? <RefreshCwIcon /> : <PlugZapIcon />}
        {m.status === "connected" ? "Reconnect" : m.status === "error" ? "Retry" : "Connect"}
      </Button>
    </div>
  )
}

function KeyValueSection({
  title,
  description,
  rows,
  onChange,
  keyPlaceholder,
}: {
  title: string
  description: string
  rows: KeyValue[]
  onChange: (rows: KeyValue[]) => void
  keyPlaceholder: string
}) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  const set = (i: number, p: Partial<KeyValue>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r)))

  return (
    <Section
      title={title}
      description={description}
      action={
        <Button variant="outline" size="sm" onClick={() => onChange([...rows, { key: "", value: "" }])}>
          <PlusIcon /> Add
        </Button>
      }
    >
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">None.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={r.key}
                onChange={(e) => set(i, { key: e.target.value })}
                placeholder={keyPlaceholder}
                aria-label="Name"
                className="w-44 shrink-0 font-mono text-[13px]"
              />
              <Input
                value={r.value}
                type={r.secret && !revealed[i] ? "password" : "text"}
                onChange={(e) => set(i, { value: e.target.value })}
                placeholder="value"
                aria-label="Value"
                className="font-mono text-[13px]"
              />
              <Button
                variant={r.secret ? "secondary" : "ghost"}
                size="icon-sm"
                aria-pressed={!!r.secret}
                aria-label={r.secret ? "Secret (click to make plain)" : "Mark as secret"}
                title={r.secret ? "Secret" : "Mark as secret"}
                onClick={() => set(i, { secret: !r.secret })}
              >
                <KeyRoundIcon />
              </Button>
              {r.secret && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={revealed[i] ? "Hide value" : "Show value"}
                  onClick={() => setRevealed((x) => ({ ...x, [i]: !x[i] }))}
                >
                  {revealed[i] ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
                <XIcon />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

function toMcpJson(m: McpServer) {
  const slug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "server"
  const pairs = Object.fromEntries(m.env.filter((e) => e.key).map((e) => [e.key, e.secret ? "${" + e.key.toUpperCase().replace(/\W/g, "_") + "}" : e.value]))
  const entry =
    m.transport === "stdio"
      ? { command: m.command ?? "", args: (m.args ?? []).filter(Boolean), ...(m.env.length ? { env: pairs } : {}) }
      : { type: "http", url: m.url ?? "", ...(m.env.length ? { headers: pairs } : {}) }
  return JSON.stringify({ mcpServers: { [slug]: entry } }, null, 2)
}
