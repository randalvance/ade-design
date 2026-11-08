/**
 * Theme registry. To add a theme:
 *   1. Create `src/themes/<id>.css` with a `[data-theme="<id>"]` block
 *      defining every token (copy an existing file as a template).
 *   2. Import it in `src/themes/index.css`.
 *   3. Add an entry below.
 */
export type Appearance = "light" | "dark"

export interface ThemeDefinition {
  id: string
  label: string
  appearance: Appearance
  /** Group label in the theme picker. */
  family: string
  /** [background, sidebar, primary, accent-ish] — used for picker swatches. */
  swatch: [string, string, string, string]
}

export const themes = [
  {
    id: "vscode-dark",
    label: "Dark Modern",
    family: "Visual Studio Code",
    appearance: "dark",
    swatch: ["#1f1f1f", "#181818", "#0078d4", "#4ec9b0"],
  },
  {
    id: "vscode-light",
    label: "Light Modern",
    family: "Visual Studio Code",
    appearance: "light",
    swatch: ["#ffffff", "#f8f8f8", "#005fb8", "#795e26"],
  },
  {
    id: "darcula",
    label: "Darcula",
    family: "JetBrains",
    appearance: "dark",
    swatch: ["#2b2b2b", "#3c3f41", "#4a88c7", "#cc7832"],
  },
  {
    id: "one-dark-pro",
    label: "One Dark Pro",
    family: "Community",
    appearance: "dark",
    swatch: ["#282c34", "#21252b", "#61afef", "#c678dd"],
  },
  {
    id: "nord",
    label: "Nord",
    family: "Community",
    appearance: "dark",
    swatch: ["#2e3440", "#2b303b", "#88c0d0", "#a3be8c"],
  },
] as const satisfies readonly ThemeDefinition[]

export type ThemeId = (typeof themes)[number]["id"]

export const DEFAULT_THEME: ThemeId = "vscode-dark"
export const THEME_STORAGE_KEY = "primepaw.theme"

export function getTheme(id: string): ThemeDefinition {
  return themes.find((t) => t.id === id) ?? themes[0]
}
