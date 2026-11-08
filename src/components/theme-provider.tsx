import { createContext, useCallback, useContext, useEffect, useState } from "react"

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  getTheme,
  type ThemeDefinition,
  type ThemeId,
} from "@/themes/registry"

interface ThemeContextValue {
  theme: ThemeDefinition
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): ThemeId {
  try {
    return getTheme(localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME).id as ThemeId
  } catch {
    return DEFAULT_THEME
  }
}

export function applyTheme(id: string) {
  const theme = getTheme(id)
  const root = document.documentElement
  root.dataset.theme = theme.id
  root.dataset.appearance = theme.appearance
  root.classList.toggle("dark", theme.appearance === "dark")
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(readStoredTheme)

  useEffect(() => {
    applyTheme(themeId)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId)
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [themeId])

  const setTheme = useCallback((id: ThemeId) => setThemeId(id), [])

  return (
    <ThemeContext.Provider value={{ theme: getTheme(themeId), setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
