import { useSyncExternalStore } from "react"

/**
 * Tiny hash router — enough for a prototype with deep links and back/forward.
 *   #/                    home (new Triage thread)
 *   #/t/:id               thread
 *   #/workspaces[/:id]    workspace manager
 *   #/agents[/:id]        agent manager
 *   #/factories[/:id]     factory board
 */
export type Route =
  | { name: "home" }
  | { name: "thread"; id: string }
  | { name: "workspaces"; id?: string }
  | { name: "agents"; id?: string }
  | { name: "factories"; id?: string }

export function parseRoute(hash: string): Route {
  const [, section, id] = hash.replace(/^#/, "").split("/")
  switch (section) {
    case "t":
      return id ? { name: "thread", id } : { name: "home" }
    case "workspaces":
    case "agents":
    case "factories":
      return { name: section, id: id || undefined }
    default:
      return { name: "home" }
  }
}

export function href(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/"
    case "thread":
      return `#/t/${route.id}`
    default:
      return `#/${route.name}${route.id ? `/${route.id}` : ""}`
  }
}

export function navigate(route: Route, { replace = false } = {}) {
  const next = href(route)
  if (replace) history.replaceState(null, "", next)
  else if (location.hash !== next) location.hash = next
  if (replace) window.dispatchEvent(new HashChangeEvent("hashchange"))
}

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb)
  return () => window.removeEventListener("hashchange", cb)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash)
  return parseRoute(hash)
}
