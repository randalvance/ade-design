# primepaw-design

UI prototype for **Primepaw**, an Agentic Development Environment. It runs entirely on mock data; this repo is for working out the UI.

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4**
- **[shadcn/ui](https://ui.shadcn.com)** (Radix base, Nova preset), with components in `src/components/ui`
- **[AI Elements](https://ai-sdk.dev/elements)**: shadcn-registry chat components (conversation, message, prompt input, reasoning, tool calls, code blocks) in `src/components/ai-elements`. Like other shadcn components, they're copied into the repo, so you own and can edit them.

Development runs in a dev container (see `AGENTS.md`). You need Docker (or OrbStack) and the [Dev Containers CLI](https://github.com/devcontainers/cli) on the host.

```bash
devcontainer up --workspace-folder .                         # build/start; installs deps inside
devcontainer exec --workspace-folder . pnpm dev:container    # → http://localhost:5180
```

The container publishes its port 5173 on the host at `127.0.0.1:5180`. `node_modules` lives in a container volume, separate from the host.

## Layout

| Path | What |
| --- | --- |
| `src/App.tsx` | Shell and route switch (home, thread, workspaces, agents, factories) |
| `src/lib/router.ts` | Hash router: `#/`, `#/t/:id`, `#/factories/:id`, and settings at `#/settings[/workspaces|agents|skills|mcp/:id]` |
| `src/components/app-sidebar.tsx` | Main mode: new thread, factories, threads. Settings mode: General, Workspaces, Agents, Skills, MCP servers |
| `src/components/chat/` | Triage home, composer (prompt + mic + send only), message list |
| `src/components/manage/` | Shared editors: icon picker, agent avatar, skills/MCP checklists, memory, list+editor layout |
| `src/pages/` | Factories (Kanban) and the settings pages: General (appearance, shortcuts), Workspaces, Agents, Skills, MCP servers |
| `src/data/mock.ts` | Seed workspaces, agents, factories, threads; skill/MCP/model catalogs; canned Triage replies |
| `src/data/store.tsx` | In-memory store (CRUD per collection) and simulated streaming |
| `src/themes/` | Theme tokens and registry |

## Concepts

- **Triage**: the home composer is just a prompt. Triage picks the workspace, agent and model.
- **Settings** (`⌘,`, `Esc` to leave): General (theme and shortcuts) plus Workspaces, Agents, Skills and MCP servers.
- **Workspaces**: icon, folders, instructions, linked tracker (GitHub Issues, Jira, Linear), skills, MCP servers and memory.
- **Agents**: photo, name, description, default model, system prompt, skills, MCP servers and memory. These use the same editor components as workspaces.
- **Skills**: name, description and SKILL.md instructions (edit and preview). Built-in skills are read-only; duplicate one to customize it.
- **MCP servers**: stdio command and args or an HTTP URL, env vars or headers (with secrets masked), on/off switch, connection status, discovered tools and the equivalent `mcp.json`. Deleting a skill or server unlinks it from every workspace and agent.
- **Factories**: a Kanban board (Todo → Plan → Implement → Review → Test → Merge) tied to a workspace, with an icon, a name and an on/off switch.

## Themes

Themes are plain CSS files that set shadcn's tokens, plus a few extras:

- `--success`, `--warning`, `--info` for status colors (`bg-success`, `text-warning`, …)
- `--syntax-*` for code highlighting. Shiki uses a CSS-variables theme (`src/lib/syntax-theme.ts`), so code blocks re-color with the app theme.
- `--radius`, so each theme can set its own corner shape

Included themes: VS Code Dark Modern, VS Code Light Modern, Darcula, One Dark Pro, Nord.

### Adding a theme

1. Copy `src/themes/nord.css` to `src/themes/<id>.css` and change the selector to `[data-theme="<id>"]` and the values.
2. Import it in `src/themes/index.css`.
3. Add an entry to `src/themes/registry.ts` (label, family, `appearance`, swatch).
4. If it's a **light** theme, add its id to the `light` list in the pre-paint script in `index.html`.

The active theme is stored in `localStorage` (`primepaw.theme`) and applied as `data-theme` / `data-appearance` on `<html>`. Tailwind's `dark:` variant follows `data-appearance`.
