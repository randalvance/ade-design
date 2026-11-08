import { CopyIcon, RefreshCcwIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation"
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message"
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool"
import { agents } from "@/data/mock"
import { useStore } from "@/data/store"
import type { ChatMessage, MessagePart, ToolPart } from "@/data/types"

const toolTitles: Record<string, (p: ToolPart) => string> = {
  route_to_agent: (p) => `Route to ${agents[p.input.agent as keyof typeof agents]?.name ?? p.input.agent}`,
  search_ci_runs: () => "Search CI runs",
  search_codebase: () => "Search codebase",
  query_traces: () => "Query traces",
  fetch_pull_request: () => "Fetch pull request",
}

function Part({ part, streaming }: { part: MessagePart; streaming: boolean }) {
  switch (part.type) {
    case "text":
      return <MessageResponse isAnimating={streaming}>{part.text}</MessageResponse>
    case "reasoning":
      return (
        <Reasoning duration={part.duration} isStreaming={streaming && !part.duration}>
          <ReasoningTrigger />
          <ReasoningContent>{part.text}</ReasoningContent>
        </Reasoning>
      )
    case "tool":
      return (
        <Tool defaultOpen={part.state === "output-error"} className="mb-0">
          <ToolHeader
            type="dynamic-tool"
            toolName={part.name}
            title={toolTitles[part.name]?.(part) ?? part.name}
            state={part.state}
          />
          <ToolContent>
            <ToolInput input={part.input} />
            <ToolOutput output={part.output} errorText={part.errorText} />
          </ToolContent>
        </Tool>
      )
  }
}

function AssistantMessage({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
  const text = message.parts.flatMap((p) => (p.type === "text" ? [p.text] : [])).join("\n\n")
  return (
    <Message from="assistant">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="flex size-5 items-center justify-center rounded bg-primary/15 text-[10px] font-bold text-primary">
          T
        </span>
        Triage
      </div>
      <MessageContent className="w-full">
        {message.parts.length === 0 ? (
          <Shimmer className="text-sm">Triaging your request…</Shimmer>
        ) : (
          message.parts.map((p, i) => <Part key={i} part={p} streaming={streaming && i === message.parts.length - 1} />)
        )}
      </MessageContent>
      {!streaming && text && (
        <MessageActions className="opacity-0 transition-opacity group-hover:opacity-100">
          <MessageAction tooltip="Copy" onClick={() => navigator.clipboard?.writeText(text)}>
            <CopyIcon className="size-3.5" />
          </MessageAction>
          <MessageAction tooltip="Retry">
            <RefreshCcwIcon className="size-3.5" />
          </MessageAction>
          <MessageAction tooltip="Good response">
            <ThumbsUpIcon className="size-3.5" />
          </MessageAction>
          <MessageAction tooltip="Bad response">
            <ThumbsDownIcon className="size-3.5" />
          </MessageAction>
        </MessageActions>
      )}
    </Message>
  )
}

export function MessageList() {
  const { activeThread, status } = useStore()
  if (!activeThread) return null
  const last = activeThread.messages[activeThread.messages.length - 1]
  const busy = status === "streaming" || status === "submitted"

  return (
    <Conversation className="flex-1">
      <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
        {activeThread.messages.map((m) =>
          m.role === "user" ? (
            <Message key={m.id} from="user">
              <MessageContent>
                {m.parts.map((p, i) => (p.type === "text" ? <p key={i} className="whitespace-pre-wrap">{p.text}</p> : null))}
              </MessageContent>
            </Message>
          ) : (
            <AssistantMessage key={m.id} message={m} streaming={busy && m.id === last?.id} />
          ),
        )}
        {status === "submitted" && last?.role === "user" && (
          <Message from="assistant">
            <Shimmer className="text-sm">Triaging your request…</Shimmer>
          </Message>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}
