import type { ChatStatus } from "ai"
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

import { uid } from "@/lib/id"
import { navigate, useRoute } from "@/lib/router"

import {
  initialAgents,
  initialFactories,
  initialMcpServers,
  initialSkills,
  initialThreads,
  initialWorkspaces,
  mockTriageReply,
} from "./mock"
import type { Agent, ChatMessage, Factory, FactoryCard, McpServer, MessagePart, Skill, Thread, Workspace } from "./types"

/** Generic in-memory CRUD for a list of `{ id }` records. */
function useCollection<T extends { id: string }>(initial: T[]) {
  const [items, setItems] = useState<T[]>(initial)
  const update = useCallback((id: string, patch: Partial<T> | ((item: T) => Partial<T>)) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...(typeof patch === "function" ? patch(x) : patch) } : x)))
  }, [])
  const add = useCallback((item: T) => setItems((xs) => [...xs, item]), [])
  const remove = useCallback((id: string) => setItems((xs) => xs.filter((x) => x.id !== id)), [])
  return { items, setItems, update, add, remove }
}

export type Collection<T extends { id: string }> = Omit<ReturnType<typeof useCollection<T>>, "setItems">

interface StoreValue {
  /* Triage chat */
  threads: Thread[]
  activeThread: Thread | null
  /** Chat status of the active thread (drives the composer submit button). */
  status: ChatStatus
  sendMessage: (text: string) => void
  stop: () => void
  togglePin: (id: string) => void
  deleteThread: (id: string) => void

  /* Managed entities */
  workspaces: Collection<Workspace>
  agents: Collection<Agent>
  factories: Collection<Factory>
  skills: Collection<Skill>
  mcpServers: Collection<McpServer>
  /** Deletes a skill and unlinks it from every workspace and agent. */
  deleteSkill: (id: string) => void
  /** Deletes an MCP server and unlinks it from every workspace and agent. */
  deleteMcpServer: (id: string) => void
  moveCard: (factoryId: string, cardId: string, column: FactoryCard["column"], beforeCardId?: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

const titleFrom = (text: string) => {
  const t = text.trim().replace(/\s+/g, " ")
  return t.length > 42 ? `${t.slice(0, 40)}…` : t
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const route = useRoute()
  const activeId = route.name === "thread" ? route.id : null

  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [statusById, setStatusById] = useState<Record<string, ChatStatus>>({})
  const timers = useRef<Record<string, number[]>>({})

  const workspaces = useCollection(initialWorkspaces)
  const agents = useCollection(initialAgents)
  const factories = useCollection(initialFactories)
  const skills = useCollection(initialSkills)
  const mcpServers = useCollection(initialMcpServers)

  const { setItems: setWorkspaces } = workspaces
  const { setItems: setAgents } = agents
  const { remove: removeSkill } = skills
  const { remove: removeMcp } = mcpServers
  const deleteSkill = useCallback(
    (id: string) => {
      removeSkill(id)
      const unlink = <T extends { skillIds: string[] }>(xs: T[]) => xs.map((x) => ({ ...x, skillIds: x.skillIds.filter((s) => s !== id) }))
      setWorkspaces(unlink)
      setAgents(unlink)
    },
    [removeSkill, setAgents, setWorkspaces],
  )
  const deleteMcpServer = useCallback(
    (id: string) => {
      removeMcp(id)
      const unlink = <T extends { mcpServerIds: string[] }>(xs: T[]) =>
        xs.map((x) => ({ ...x, mcpServerIds: x.mcpServerIds.filter((s) => s !== id) }))
      setWorkspaces(unlink)
      setAgents(unlink)
    },
    [removeMcp, setAgents, setWorkspaces],
  )

  const updateThread = useCallback((id: string, fn: (t: Thread) => Thread) => {
    setThreads((ts) => ts.map((t) => (t.id === id ? fn(t) : t)))
  }, [])

  const setStatus = useCallback((id: string, s: ChatStatus) => {
    setStatusById((m) => ({ ...m, [id]: s }))
  }, [])

  /** Fake a streamed assistant response: parts appear one by one, text streams in chunks. */
  const simulateReply = useCallback(
    (threadId: string, prompt: string) => {
      const { parts, workspaceId, agentId } = mockTriageReply(prompt, workspaces.items, agents.items)
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
              patchMessage((ps) =>
                ps.map((p) => (p.type === "tool" && p.name === part.name && p.state === "input-available" ? part : p)),
              ),
            )
          }
          if (part.name === "select_workspace") {
            schedule(0, () => updateThread(threadId, (th) => ({ ...th, workspaceId })))
          }
        } else {
          schedule(300, () => patchMessage((ps) => [...ps, part]))
        }
      })

      schedule(200, () => {
        setStatus(threadId, "ready")
        updateThread(threadId, (th) => ({ ...th, routedTo: [...new Set([...th.routedTo, agentId])] }))
      })
    },
    [agents.items, setStatus, updateThread, workspaces.items],
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
          status: "running",
          routedTo: [],
          updatedAt: Date.now(),
          messages: [userMsg],
        }
        setThreads((ts) => [thread, ...ts])
        navigate({ name: "thread", id: threadId })
      } else {
        updateThread(threadId, (th) => ({ ...th, status: "running", updatedAt: Date.now(), messages: [...th.messages, userMsg] }))
      }
      setStatus(threadId, "submitted")
      simulateReply(threadId, body)
    },
    [activeId, setStatus, simulateReply, updateThread],
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

  const deleteThread = useCallback(
    (id: string) => {
      setThreads((ts) => ts.filter((t) => t.id !== id))
      if (activeId === id) navigate({ name: "home" })
    },
    [activeId],
  )

  const { update: updateFactory } = factories
  const moveCard = useCallback(
    (factoryId: string, cardId: string, column: FactoryCard["column"], beforeCardId?: string) => {
      updateFactory(factoryId, (f) => {
        const moving = f.cards.find((c) => c.id === cardId)
        if (!moving) return {}
        const rest = f.cards.filter((c) => c.id !== cardId)
        const moved = { ...moving, column, updatedAt: Date.now() }
        const idx = beforeCardId ? rest.findIndex((c) => c.id === beforeCardId) : -1
        if (idx === -1) {
          // Append after the last card of the target column (keeps column order stable).
          const lastIdx = rest.map((c) => c.column).lastIndexOf(column)
          rest.splice(lastIdx + 1, 0, moved)
        } else {
          rest.splice(idx, 0, moved)
        }
        return { cards: rest }
      })
    },
    [updateFactory],
  )

  const value = useMemo<StoreValue>(() => {
    const activeThread = threads.find((t) => t.id === activeId) ?? null
    return {
      threads,
      activeThread,
      status: (activeId && statusById[activeId]) || "ready",
      sendMessage,
      stop,
      togglePin,
      deleteThread,
      workspaces,
      agents,
      factories,
      skills,
      mcpServers,
      deleteSkill,
      deleteMcpServer,
      moveCard,
    }
  }, [
    threads,
    activeId,
    statusById,
    sendMessage,
    stop,
    togglePin,
    deleteThread,
    workspaces,
    agents,
    factories,
    skills,
    mcpServers,
    deleteSkill,
    deleteMcpServer,
    moveCard,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
