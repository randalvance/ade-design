import { MicIcon, SquareIcon } from "lucide-react"
import { useEffect, useState } from "react"

import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input"
import { useStore } from "@/data/store"
import { cn } from "@/lib/utils"

/** Canned dictation results for the mock mic. */
const dictations = [
  "Figure out why the checkout test is flaky on CI and fix it",
  "Add pagination to the orders endpoint",
  "Review the session token refactor before Friday",
]

/**
 * The Triage composer is deliberately just a prompt: no workspace, agent or
 * model pickers. Triage decides all of that from what you write.
 */
export function Composer(props: { className?: string; autoFocus?: boolean; placeholder?: string }) {
  return (
    <PromptInputProvider>
      <ComposerInner {...props} />
    </PromptInputProvider>
  )
}

function ComposerInner({ className, autoFocus, placeholder }: { className?: string; autoFocus?: boolean; placeholder?: string }) {
  const { sendMessage, status, stop } = useStore()
  const { textInput } = usePromptInputController()
  const [listening, setListening] = useState(false)

  // Mock dictation: "hears" a sentence after a couple of seconds.
  useEffect(() => {
    if (!listening) return
    const t = window.setTimeout(() => {
      const said = dictations[Math.floor(Math.random() * dictations.length)]
      textInput.setInput(textInput.value ? `${textInput.value} ${said}` : said)
      setListening(false)
    }, 2200)
    return () => clearTimeout(t)
  }, [listening, textInput])

  const busy = status === "streaming" || status === "submitted"

  return (
    <PromptInput
      className={cn("rounded-2xl bg-card shadow-sm", className)}
      onSubmit={(message) => {
        if (busy) return
        setListening(false)
        sendMessage(message.text)
      }}
    >
      <PromptInputBody>
        <PromptInputTextarea
          autoFocus={autoFocus}
          placeholder={listening ? "Listening…" : (placeholder ?? "Ask Triage anything — it picks the workspace, agent and model")}
          className="min-h-14 text-[15px]"
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          {listening && <ListeningIndicator />}
        </PromptInputTools>
        <div className="flex items-center gap-1">
          <PromptInputButton
            variant={listening ? "destructive" : "ghost"}
            size="icon-sm"
            aria-label={listening ? "Stop dictation" : "Dictate"}
            aria-pressed={listening}
            tooltip={listening ? "Stop" : "Dictate"}
            onClick={() => setListening((v) => !v)}
            className="rounded-full"
          >
            {listening ? <SquareIcon className="size-3.5" /> : <MicIcon className="size-4" />}
          </PromptInputButton>
          <PromptInputSubmit status={status} onStop={stop} className="rounded-full" />
        </div>
      </PromptInputFooter>
    </PromptInput>
  )
}

function ListeningIndicator() {
  return (
    <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground" aria-live="polite">
      <span className="flex h-4 items-end gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-0.5 animate-pulse rounded-full bg-destructive"
            style={{ height: `${[40, 90, 60, 100, 50][i]}%`, animationDelay: `${i * 120}ms`, animationDuration: "700ms" }}
          />
        ))}
      </span>
      Listening…
    </div>
  )
}
