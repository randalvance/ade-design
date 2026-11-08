import { BlocksIcon, CopyIcon, LockIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { MessageResponse } from "@/components/ai-elements/message"
import { ConfirmDelete } from "@/components/manage/confirm-delete"
import { EditorColumn, ManagerLayout } from "@/components/manage/manager-layout"
import { FieldLabel, Section } from "@/components/manage/section"
import { UsedBy } from "@/components/manage/used-by"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/data/store"
import type { Skill } from "@/data/types"
import { uid } from "@/lib/id"
import { navigate } from "@/lib/router"

export function SkillsPage({ id }: { id?: string }) {
  const { skills } = useStore()
  const selected = skills.items.find((s) => s.id === id)

  useEffect(() => {
    if (!selected && skills.items[0]) navigate({ name: "skills", id: skills.items[0].id }, { replace: true })
  }, [selected, skills.items])

  const create = (from?: Skill) => {
    const s: Skill = from
      ? { ...from, id: `sk-${uid()}`, name: `${from.name} (copy)`, source: "custom" }
      : {
          id: `sk-${uid()}`,
          name: "New skill",
          description: "",
          instructions: "# New skill\n\nDescribe when to use this skill and the steps to follow.",
          source: "custom",
        }
    skills.add(s)
    navigate({ name: "skills", id: s.id })
  }

  return (
    <ManagerLayout
      title="Skills"
      icon={BlocksIcon}
      items={skills.items}
      selectedId={selected?.id}
      onSelect={(sid) => navigate({ name: "skills", id: sid })}
      onCreate={() => create()}
      createLabel="New skill"
      renderItem={(s) => (
        <>
          <BlocksIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{s.name}</span>
          {s.source === "built-in" && <LockIcon className="size-3 text-muted-foreground" aria-label="Built-in" />}
        </>
      )}
    >
      {selected && <SkillEditor key={selected.id} skill={selected} onDuplicate={() => create(selected)} />}
    </ManagerLayout>
  )
}

function SkillEditor({ skill, onDuplicate }: { skill: Skill; onDuplicate: () => void }) {
  const { skills, deleteSkill } = useStore()
  const [view, setView] = useState<"edit" | "preview">(skill.source === "built-in" ? "preview" : "edit")
  const readOnly = skill.source === "built-in"
  const patch = (p: Partial<Skill>) => skills.update(skill.id, p)

  return (
    <EditorColumn>
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <BlocksIcon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <Input
            value={skill.name}
            readOnly={readOnly}
            onChange={(e) => patch({ name: e.target.value })}
            aria-label="Skill name"
            className="h-auto border-transparent bg-transparent px-1 text-xl font-semibold shadow-none hover:border-input focus-visible:border-input read-only:hover:border-transparent dark:bg-transparent"
          />
          <div className="flex items-center gap-2 px-1">
            <Badge variant={readOnly ? "outline" : "secondary"} className="gap-1 font-normal">
              {readOnly && <LockIcon className="size-3" />}
              {readOnly ? "Built-in" : "Custom"}
            </Badge>
            <code className="text-xs text-muted-foreground">{skill.id}</code>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onDuplicate}>
          <CopyIcon /> Duplicate
        </Button>
        {!readOnly && (
          <ConfirmDelete
            noun="skill"
            name={skill.name}
            onConfirm={() => {
              deleteSkill(skill.id)
              navigate({ name: "skills" }, { replace: true })
            }}
          />
        )}
      </div>

      {readOnly && (
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Built-in skills are read-only. Duplicate this one to make your own version.
        </p>
      )}

      <Section title="Description" description="One line. Agents read it to decide when to load this skill.">
        <div className="space-y-1.5">
          <FieldLabel htmlFor="skill-description">When to use</FieldLabel>
          <Input
            id="skill-description"
            value={skill.description}
            readOnly={readOnly}
            placeholder="e.g. Use when writing database migrations"
            onChange={(e) => patch({ description: e.target.value })}
          />
        </div>
      </Section>

      <Section
        title="Instructions"
        description="The body of SKILL.md, in Markdown. Loaded into the agent's context when the skill is used."
        action={
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList className="h-8">
              <TabsTrigger value="edit" disabled={readOnly} className="text-xs">
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        {view === "edit" && !readOnly ? (
          <>
            <Textarea
              value={skill.instructions}
              onChange={(e) => patch({ instructions: e.target.value })}
              className="min-h-72 font-mono text-[13px] leading-relaxed"
              aria-label="Skill instructions"
            />
            <p className="mt-1.5 text-right text-xs text-muted-foreground tabular-nums">
              {skill.instructions.split(/\s+/).filter(Boolean).length} words
            </p>
          </>
        ) : (
          <div className="min-h-32 rounded-lg border bg-background/50 p-4 text-sm">
            <MessageResponse>{skill.instructions}</MessageResponse>
          </div>
        )}
      </Section>

      <UsedBy kind="skill" id={skill.id} />
    </EditorColumn>
  )
}
