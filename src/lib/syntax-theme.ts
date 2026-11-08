import { createCssVariablesTheme } from "shiki/core"

/**
 * A single Shiki theme whose colors are CSS variables (`--syntax-*`).
 * Every app theme defines those variables, so code blocks re-color
 * automatically when the theme changes — no per-theme Shiki config.
 */
export const syntaxTheme = createCssVariablesTheme({
  name: "app-syntax",
  variablePrefix: "--syntax-",
  variableDefaults: {},
  fontStyle: true,
})

export const syntaxThemes = [syntaxTheme, syntaxTheme] as [
  typeof syntaxTheme,
  typeof syntaxTheme,
]
