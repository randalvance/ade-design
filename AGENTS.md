# AGENTS.md

## Run commands inside the dev container, never on the host

Run every project command inside the dev container (`.devcontainer/devcontainer.json`), not on the host machine. That includes `pnpm install`, `pnpm add`, `pnpm dev`, `pnpm build`, `pnpm lint`, `tsc`, `npx`/`pnpm dlx` (including the shadcn CLI) and any scripts.

The container keeps `node_modules` in its own Linux volume. A host install would put the wrong native binaries (Rolldown, Tailwind Oxide, oxlint) into the project and can break the container's build.

```bash
# Start (or reuse) the container. Run from the repo root on the host.
devcontainer up --workspace-folder .

# Run any project command inside it
devcontainer exec --workspace-folder . pnpm <command>

# Dev server, published on the host at http://localhost:5180
devcontainer exec --workspace-folder . pnpm dev:container
```

Only these run on the host:

- `devcontainer` and `docker` commands that manage the container itself
- `git`, which needs the host's credentials and the shared `.git` directory of worktrees

If the container isn't running, start it with `devcontainer up`. Don't fall back to running the command on the host.

## Project notes

- See `README.md` for the stack, layout and how to add a theme.
- UI components come from shadcn (`src/components/ui`) and AI Elements (`src/components/ai-elements`). Add more with `devcontainer exec --workspace-folder . pnpm dlx shadcn@latest add <name>`. After adding, check that imports use `@/lib/utils` for `cn`.
- All data is mock data (`src/data/`). There is no backend.
