import type { ChatStatus } from "ai"
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

import { initialThreads, mockTriageReply, repos } from "./mock"
import type { ChatMessage, MessagePart, Thread } from "./types"

interface StoreValue {
  threads: Thread[]
  activeThread: Thread | null
  /** Chat status of the active thread (drives the composer submit button). */
  status: ChatStatus
  repo: string
  setRepo: (repo: string) => void
  selectThread: (id: string | null) => void
  sendMessage: (text: string) => void
  stop: () => void
  togglePin: (id: string) => void
  deleteThread: (id: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

const uid = () => Math.random().toString(36).slice(2, 10)
const titleFrom = (text: string) => {
  const t = text.trim().replace(/\s+/g, " ")
  return t.length > 42 ? `${t.slice(0, 40)}…` : t
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [repo, setRepo] = useState(repos[0])
  const [statusById, setStatusById] = useState<Record<string, ChatStatus>>({})
  const timers = useRef<Record<string, number[]>>({})

  const updateThread = useCallback((id: string, fn: (t: Thread) => Thread) => {
    setThreads((ts) => ts.map((t) => (t.id === id ? fn(t) : t)))
  }, [])

  const setStatus = useCallback((id: string, s: ChatStatus) => {
    setStatusById((m) => ({ ...m, [id]: s }))
  }, [])

  /** Fake a streamed assistant response: parts appear one by one, text streams in chunks. */
  const simulateReply = useCallback(
    (threadId: string, prompt: string) => {
      const parts = mockTriageReply(prompt)
      const messageId = uid()
      const queue: number[] = []
      timers.current[threadId] = queue
      let t = 700

      const schedule = (delay: number, fn: () => void) => {
        t += delay
        queue.push(window.setTimeout(fn, t))
      }
      const patchMessage = (fn: (parts: MessagePart[]) => MessagePart[]) =>
        updateThread(threadId, (th) => ({
          ...th,
          updatedAt: Date.now(),
          messages: th.messages.map((m) => (m.id === messageId ? { ...m, parts: fn(m.parts) } : m)),
        }))

      schedule(0, () => {
        setStatus(threadId, "streaming")
        updateThread(threadId, (th) => ({
          ...th,
          status: "running",
          messages: [...th.messages, { id: messageId, role: "assistant", parts: [], createdAt: Date.now() }],
        }))
      })

      parts.forEach((part) => {
        if (part.type === "text") {
          const words = part.text.split(/(?<=\s)/)
          schedule(250, () => patchMessage((ps) => [...ps, { type: "text", text: "" }]))
          for (let i = 0; i < words.length; i += 3) {
            const chunk = words.slice(i, i + 3).join("")
            schedule(45, () =>
              patchMessage((ps) => {
                const last = ps[ps.length - 1]
                return last?.type === "text" ? [...ps.slice(0, -1), { ...last, text: last.text + chunk }] : ps
              }),
            )
          }
        } else if (part.type === "tool") {
          schedule(500, () => patchMessage((ps) => [...ps, { ...part, state: "input-available", output: undefined }]))
          if (part.state !== "input-available") {
            schedule(900, () =>
              patchMessage((ps) => ps.map((p) => (p.type === "tool" && p.name === part.name && p.state === "input-available" ? part : p))),
            )
          }
        } else {
          schedule(300, () => patchMessage((ps) => [...ps, part]))
        }
      })

      schedule(200, () => {
        setStatus(threadId, "ready")
        updateThread(threadId, (th) => ({ ...th, routedTo: [...new Set([...th.routedTo, ...routed(parts)])] }))
      })
    },
    [setStatus, updateThread],
  )

  const sendMessage = useCallback(
    (text: string) => {
      const body = text.trim()
      if (!body) return
      const userMsg: ChatMessage = { id: uid(), role: "user", parts: [{ type: "text", text: body }], createdAt: Date.now() }
      let threadId = activeId
      if (!threadId) {
        threadId = `t-${uid()}`
        const thread: Thread = {
          id: threadId,
          title: titleFrom(body),
          repo,
          status: "running",
          routedTo: [],
          updatedAt: Date.now(),
          messages: [userMsg],
        }
        setThreads((ts) => [thread, ...ts])
        setActiveId(threadId)
      } else {
        updateThread(threadId, (th) => ({ ...th, status: "running", updatedAt: Date.now(), messages: [...th.messages, userMsg] }))
      }
      setStatus(threadId, "submitted")
      simulateReply(threadId, body)
    },
    [activeId, repo, setStatus, simulateReply, updateThread],
  )

  const stop = useCallback(() => {
    if (!activeId) return
    timers.current[activeId]?.forEach((h) => clearTimeout(h))
    timers.current[activeId] = []
    setStatus(activeId, "ready")
    updateThread(activeId, (th) => ({ ...th, status: "idle" }))
  }, [activeId, setStatus, updateThread])

  const togglePin = useCallback(
    (id: string) => updateThread(id, (th) => ({ ...th, pinned: !th.pinned })),
    [updateThread],
  )

  const deleteThread = useCallback((id: string) => {
    setThreads((ts) => ts.filter((t) => t.id !== id))
    setActiveId((a) => (a === id ? null : a))
  }, [])

  const value = useMemo<StoreValue>(() => {
    const activeThread = threads.find((t) => t.id === activeId) ?? null
    return {
      threads,
      activeThread,
      status: (activeId && statusById[activeId]) || "ready",
      repo: activeThread?.repo ?? repo,
      setRepo,
      selectThread: setActiveId,
      sendMessage,
      stop,
      togglePin,
      deleteThread,
    }
  }, [threads, activeId, statusById, repo, sendMessage, stop, togglePin, deleteThread])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

function routed(parts: MessagePart[]) {
  return parts.flatMap((p) => (p.type === "tool" && p.name === "route_to_agent" ? [p.input.agent as Thread["routedTo"][number]] : []))
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
