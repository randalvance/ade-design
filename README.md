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
| `src/App.tsx` | Shell: sidebar, header, home or thread view |
| `src/components/app-sidebar.tsx` | Thread list (pinned and date-grouped, search, status dots) |
| `src/components/chat/home.tsx` | Home page: composer for the Triage agent, plus suggestions |
| `src/components/chat/composer.tsx` | Prompt input (repo, model, approval mode) |
| `src/components/chat/message-list.tsx` | Renders text, reasoning and tool-call parts |
| `src/data/mock.ts` | Mock threads, agents, repos, canned Triage replies |
| `src/data/store.tsx` | In-memory store and simulated streaming |
| `src/themes/` | Theme tokens and registry |

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
