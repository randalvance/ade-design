import { useSyncExternalStore } from "react"

/**
 * Tiny hash router — enough for a prototype with deep links and back/forward.
 *   #/                              home (new Triage thread)
 *   #/t/:id                         thread
 *   #/factories[/:id]               factory board
 *   #/settings                      settings → general (appearance)
 *   #/settings/workspaces[/:id]     workspace manager
 *   #/settings/agents[/:id]         agent manager
 *   #/settings/skills[/:id]         skill manager
 *   #/settings/mcp[/:id]            MCP server manager
 */
export type Route =
  | { name: "home" }
  | { name: "thread"; id: string }
  | { name: "factories"; id?: string }
  | { name: "settings" }
  | { name: "workspaces"; id?: string }
  | { name: "agents"; id?: string }
  | { name: "skills"; id?: string }
  | { name: "mcp"; id?: string }

/** Routes that render inside Settings. */
export const settingsSections = ["workspaces", "agents", "skills", "mcp"] as const
export type SettingsSection = (typeof settingsSections)[number]

export const isSettingsRoute = (r: Route) =>
  r.name === "settings" || (settingsSections as readonly string[]).includes(r.name)

export function parseRoute(hash: string): Route {
  const [, section, a, b] = hash.replace(/^#/, "").split("/")
  switch (section) {
    case "t":
      return a ? { name: "thread", id: a } : { name: "home" }
    case "factories":
      return { name: "factories", id: a || undefined }
    case "settings":
      if ((settingsSections as readonly string[]).includes(a)) return { name: a as SettingsSection, id: b || undefined }
      return { name: "settings" }
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
    case "factories":
      return `#/factories${route.id ? `/${route.id}` : ""}`
    case "settings":
      return "#/settings"
    default:
      return `#/settings/${route.name}${route.id ? `/${route.id}` : ""}`
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

/** Last route outside Settings, so "Back to app" returns where you were. */
let lastAppHash = isSettingsRoute(parseRoute(location.hash)) ? "#/" : location.hash || "#/"
window.addEventListener("hashchange", () => {
  if (!isSettingsRoute(parseRoute(location.hash))) lastAppHash = location.hash || "#/"
})
export const getLastAppHash = () => lastAppHash

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash)
  return parseRoute(hash)
}
