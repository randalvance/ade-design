import { FolderGit2Icon, ImageIcon, PaperclipIcon, PlusIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react"
import { useState } from "react"

import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import { models, repos } from "@/data/mock"
import { useStore } from "@/data/store"
import { cn } from "@/lib/utils"

export function Composer({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const { sendMessage, status, stop, repo, setRepo, activeThread } = useStore()
  const [model, setModel] = useState(models[0].id)
  const [autoApprove, setAutoApprove] = useState(false)

  return (
    <PromptInput
      className={cn("rounded-xl bg-card shadow-sm", className)}
      onSubmit={(message) => {
        if (status === "streaming" || status === "submitted") return
        sendMessage(message.text)
      }}
    >
      <PromptInputBody>
        <PromptInputTextarea
          autoFocus={autoFocus}
          placeholder={activeThread ? "Reply to Triage…" : "Describe a task, bug or question — Triage will route it"}
          className="min-h-14"
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger aria-label="Add context">
              <PlusIcon className="size-4" />
            </PromptInputActionMenuTrigger>
            <PromptInputActionMenuContent>
              <PromptInputActionMenuItem>
                <PaperclipIcon /> Attach files
              </PromptInputActionMenuItem>
              <PromptInputActionMenuItem>
                <ImageIcon /> Add screenshot
              </PromptInputActionMenuItem>
              <PromptInputActionMenuItem>
                <FolderGit2Icon /> Reference a file or PR
              </PromptInputActionMenuItem>
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          <PromptInputSelect value={repo} onValueChange={setRepo} disabled={!!activeThread}>
            <PromptInputSelectTrigger aria-label="Repository" className="max-w-48">
              <FolderGit2Icon className="size-3.5" />
              <PromptInputSelectValue />
            </PromptInputSelectTrigger>
            <PromptInputSelectContent>
              {repos.map((r) => (
                <PromptInputSelectItem key={r} value={r}>
                  {r}
                </PromptInputSelectItem>
              ))}
            </PromptInputSelectContent>
          </PromptInputSelect>

          <PromptInputSelect value={model} onValueChange={setModel}>
            <PromptInputSelectTrigger aria-label="Model">
              <SparklesIcon className="size-3.5" />
              <PromptInputSelectValue />
            </PromptInputSelectTrigger>
            <PromptInputSelectContent>
              {models.map((m) => (
                <PromptInputSelectItem key={m.id} value={m.id}>
                  {m.name}
                </PromptInputSelectItem>
              ))}
            </PromptInputSelectContent>
          </PromptInputSelect>

          <PromptInputButton
            variant={autoApprove ? "secondary" : "ghost"}
            aria-pressed={autoApprove}
            onClick={() => setAutoApprove((v) => !v)}
            tooltip="Let routed agents run tools without asking"
          >
            <ShieldCheckIcon className={cn("size-3.5", autoApprove && "text-success")} />
            <span className="hidden sm:inline">{autoApprove ? "Auto-approve" : "Ask first"}</span>
          </PromptInputButton>
        </PromptInputTools>
        <PromptInputSubmit status={status} onStop={stop} />
      </PromptInputFooter>
    </PromptInput>
  )
}
