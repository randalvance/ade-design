import { BotIcon, BrainIcon, PlusIcon, UserIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { uid } from "@/lib/id"
import type { MemoryItem } from "@/data/types"
import { relativeTime } from "@/lib/time"

import { Section } from "./section"

export function MemorySection({
  memory,
  onChange,
  scope,
}: {
  memory: MemoryItem[]
  onChange: (memory: MemoryItem[]) => void
  scope: "workspace" | "agent"
}) {
  const [draft, setDraft] = useState("")
  const add = () => {
    const text = draft.trim()
    if (!text) return
    onChange([{ id: `mem-${uid()}`, text, source: "user", createdAt: Date.now() }, ...memory])
    setDraft("")
  }

  return (
    <Section
      title="Memory"
      description={
        scope === "workspace"
          ? "Facts every agent recalls when working here. Agents add to it as they learn."
          : "What this agent remembers across workspaces and threads."
      }
    >
      <div className="space-y-3">
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add()
            }}
            placeholder="Add something to remember…"
            className="min-h-9 resize-none py-2"
            rows={1}
          />
          <Button variant="outline" onClick={add} disabled={!draft.trim()}>
            <PlusIcon /> Add
          </Button>
        </div>
        {memory.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
            <BrainIcon className="size-4" />
            Nothing remembered yet.
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {memory.map((m) => (
              <li key={m.id} className="group flex items-start gap-3 px-3 py-2.5">
                {m.source === "agent" ? (
                  <BotIcon className="mt-0.5 size-4 shrink-0 text-info" aria-label="Learned by an agent" />
                ) : (
                  <UserIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Added by you" />
                )}
                <p className="min-w-0 flex-1 text-sm">{m.text}</p>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{relativeTime(m.createdAt)}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Forget"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => onChange(memory.filter((x) => x.id !== m.id))}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  )
}
