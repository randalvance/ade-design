import { accentColors } from "@/lib/icons"
import { uid } from "@/lib/id"
import { navigate } from "@/lib/router"

import { useStore } from "./store"
import type { Factory } from "./types"

/** Creates a factory and opens it. Exported for the sidebar's "+" action. */
export function useCreateFactory() {
  const { factories, workspaces } = useStore()
  return () => {
    const f: Factory = {
      id: `fac-${uid()}`,
      name: "New factory",
      icon: "factory",
      color: accentColors[factories.items.length % accentColors.length],
      enabled: false,
      workspaceId: workspaces.items[0]?.id ?? "",
      cards: [],
    }
    factories.add(f)
    navigate({ name: "factories", id: f.id })
  }
}
