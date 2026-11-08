import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"
import { Composer } from "@/components/chat/composer"
import { suggestions } from "@/data/mock"
import { useStore } from "@/data/store"

export function Home() {
  const { sendMessage, agents } = useStore()
  const specialists = agents.items.filter((a) => a.id !== "triage")

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-[12vh]">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">What should we work on?</h1>
          <p className="text-sm text-muted-foreground">
            Just describe it. <span className="font-medium text-foreground">Triage</span> picks the workspace and model, and
            routes it to{" "}
            {specialists.map((a, i) => (
              <span key={a.id}>
                <span className="font-medium text-foreground">{a.name}</span>
                {i < specialists.length - 2 ? ", " : i === specialists.length - 2 ? " or " : ""}
              </span>
            ))}
            .
          </p>
        </div>
        <Composer autoFocus />
        <Suggestions className="justify-center">
          {suggestions.map((s) => (
            <Suggestion key={s} suggestion={s} onClick={sendMessage} />
          ))}
        </Suggestions>
      </div>
    </div>
  )
}
