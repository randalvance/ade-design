import type {
  Agent,
  ChatMessage,
  Factory,
  FactoryCard,
  McpServer,
  MessagePart,
  Model,
  Skill,
  Thread,
  Workspace,
} from "./types"

/* ── Catalogs ─────────────────────────────────────────────────────────── */

export const models: Model[] = [
  { id: "claude-opus-5-5", name: "Claude Opus 5.5" },
  { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5" },
  { id: "claude-haiku-5-5", name: "Claude Haiku 5.5" },
  { id: "claude-fable-5-1", name: "Claude Fable 5.1" },
]

const skill = (id: string, name: string, description: string, instructions: string, source: Skill["source"] = "built-in"): Skill => ({
  id,
  name,
  description,
  instructions,
  source,
})

export const initialSkills: Skill[] = [
  skill(
    "sk-tdd",
    "Test-driven development",
    "Red → green → refactor loop with failing tests first",
    "# Test-driven development\n\n1. Write a failing test that captures the behavior.\n2. Write the smallest change that makes it pass.\n3. Refactor with the tests green.\n\nNever change a test just to make it pass.",
  ),
  skill(
    "sk-review",
    "Code review",
    "Reviews diffs against the repo's standards",
    "# Code review\n\nReview the diff against the workspace instructions.\n\n- Report only issues you can demonstrate with a concrete input.\n- Order findings by severity.\n- Suggest the fix, don't apply it.",
  ),
  skill("sk-pr", "PR writer", "Writes pull request titles and descriptions", "# PR writer\n\nTitle: imperative, under 60 characters.\n\nBody: what changed, why, how it was tested."),
  skill(
    "sk-debug",
    "Bug diagnosis",
    "Reproduce, bisect and isolate regressions",
    "# Bug diagnosis\n\n1. Reproduce with the smallest input.\n2. Bisect commits if it's a regression.\n3. State the root cause before proposing a fix.",
  ),
  skill("sk-a11y", "Accessibility audit", "WCAG 2.1 AA checks for UI changes", "# Accessibility audit\n\nCheck contrast, keyboard paths, focus order, labels and touch targets."),
  skill(
    "sk-db",
    "Database migrations",
    "Writes safe, reversible migrations",
    "# Database migrations\n\n- Every migration has a down step.\n- Use `CREATE INDEX CONCURRENTLY` on large tables.\n- Never drop a column in the same release that stops writing it.",
  ),
  skill("sk-docs", "Docs writer", "Keeps README and ADRs current", "# Docs writer\n\nUpdate README and ADRs in the same change as the code."),
  skill(
    "sk-perf",
    "Performance profiling",
    "Traces, flame graphs and query plans",
    "# Performance profiling\n\nMeasure before and after. Attach the trace or `EXPLAIN ANALYZE` output to the report.",
  ),
  skill(
    "sk-release-notes",
    "Release notes",
    "Summarizes merged PRs into user-facing release notes",
    "# Release notes\n\nGroup by Added / Changed / Fixed. Write for users, not engineers.",
    "custom",
  ),
]

const tools = (...pairs: [string, string][]) => pairs.map(([name, description]) => ({ name, description }))

export const initialMcpServers: McpServer[] = [
  {
    id: "mcp-github",
    name: "GitHub",
    description: "Issues, pull requests, Actions",
    transport: "http",
    url: "https://api.githubcopilot.com/mcp/",
    env: [{ key: "Authorization", value: "Bearer ghp_••••••••", secret: true }],
    enabled: true,
    status: "connected",
    tools: tools(
      ["list_issues", "List issues in a repository"],
      ["get_pull_request", "Fetch a pull request with its diff"],
      ["create_pull_request", "Open a pull request"],
      ["list_workflow_runs", "List GitHub Actions runs"],
    ),
  },
  {
    id: "mcp-jira",
    name: "Jira",
    description: "Tickets, sprints and boards",
    transport: "http",
    url: "https://mcp.atlassian.com/v1/sse",
    env: [{ key: "Authorization", value: "Bearer ••••••••", secret: true }],
    enabled: true,
    status: "connected",
    tools: tools(["search_issues", "Search with JQL"], ["get_issue", "Fetch an issue"], ["transition_issue", "Move an issue to another status"]),
  },
  {
    id: "mcp-postgres",
    name: "Postgres",
    description: "Read-only queries against dev databases",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres", "postgres://readonly@localhost:5432/orders"],
    env: [],
    enabled: true,
    status: "connected",
    tools: tools(["query", "Run a read-only SQL query"], ["list_tables", "List tables and columns"]),
  },
  {
    id: "mcp-sentry",
    name: "Sentry",
    description: "Errors and performance traces",
    transport: "http",
    url: "https://mcp.sentry.dev/mcp",
    env: [{ key: "Authorization", value: "Bearer ••••••••", secret: true }],
    enabled: true,
    status: "error",
    lastError: "401 Unauthorized — token expired on Nov 6",
    tools: [],
  },
  {
    id: "mcp-figma",
    name: "Figma",
    description: "Design files and components",
    transport: "http",
    url: "http://127.0.0.1:3845/mcp",
    env: [],
    enabled: true,
    status: "disconnected",
    tools: tools(["get_design_context", "Read a frame's layout and styles"], ["get_variable_defs", "Read design tokens"]),
  },
  {
    id: "mcp-browser",
    name: "Browser",
    description: "Drive a headless browser for e2e checks",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@playwright/mcp@latest", "--headless"],
    env: [],
    enabled: true,
    status: "connected",
    tools: tools(["navigate", "Open a URL"], ["click", "Click an element"], ["screenshot", "Capture the page"], ["console_logs", "Read console output"]),
  },
  {
    id: "mcp-aws",
    name: "AWS",
    description: "CloudWatch, CloudTrail and resource inventory",
    transport: "stdio",
    command: "uvx",
    args: ["awslabs.aws-api-mcp-server@latest"],
    env: [
      { key: "AWS_PROFILE", value: "primepaw-staging" },
      { key: "AWS_REGION", value: "ap-southeast-1" },
    ],
    enabled: false,
    status: "disconnected",
    tools: tools(["call_aws", "Run an AWS CLI command"], ["suggest_aws_commands", "Suggest CLI commands for a task"]),
  },
  {
    id: "mcp-docs",
    name: "Docs search",
    description: "Search library and framework docs",
    transport: "http",
    url: "https://mcp.context7.com/mcp",
    env: [],
    enabled: true,
    status: "connected",
    tools: tools(["resolve_library_id", "Find a library"], ["query_docs", "Search its docs"]),
  },
]

/* ── Seed data ────────────────────────────────────────────────────────── */

const HOUR_ = 60 * 60 * 1000
const DAY_ = 24 * HOUR_
const t0 = Date.now()
let memSeq = 0
const mem = (text: string, source: "user" | "agent" = "user", ago = 3 * DAY_) => ({
  id: `mem-${++memSeq}`,
  text,
  source,
  createdAt: t0 - ago,
})

export const initialWorkspaces: Workspace[] = [
  {
    id: "ws-web",
    name: "Storefront Web",
    icon: "cart",
    color: "#3b82f6",
    folders: ["~/dev/primepaw/web", "~/dev/primepaw/shared-ui"],
    instructions:
      "Next.js 16 app router. Use the design-system package for all UI. Every PR needs a Playwright test for user-facing changes. Never touch `src/legacy/` without asking.",
    skillIds: ["sk-tdd", "sk-review", "sk-a11y", "sk-pr"],
    mcpServerIds: ["mcp-github", "mcp-browser", "mcp-figma"],
    memory: [
      mem("Checkout e2e tests are flaky when the tax request is slow — wait on the network call, not a timeout.", "agent", 2 * DAY_),
      mem("Prefer server components; only add 'use client' at leaf components."),
    ],
    tracker: { kind: "github", project: "primepaw/web", url: "https://github.com/primepaw/web/issues" },
  },
  {
    id: "ws-api",
    name: "Orders API",
    icon: "server",
    color: "#10b981",
    folders: ["~/dev/primepaw/api"],
    instructions: "Go 1.25 service. Migrations go in `db/migrations` and must use `CREATE INDEX CONCURRENTLY`. Run `make test` before proposing a merge.",
    skillIds: ["sk-db", "sk-perf", "sk-debug", "sk-review"],
    mcpServerIds: ["mcp-github", "mcp-postgres", "mcp-sentry"],
    memory: [mem("p95 budget for /api/orders is 150ms.", "user", 10 * DAY_)],
    tracker: { kind: "jira", project: "PAW", url: "https://primepaw.atlassian.net/browse/PAW" },
  },
  {
    id: "ws-infra",
    name: "Infrastructure",
    icon: "cloud",
    color: "#f97316",
    folders: ["~/dev/primepaw/infra"],
    instructions: "Terraform 1.12 + Terragrunt. Never apply to production; plans only. Staging changes need a CloudTrail check first.",
    skillIds: ["sk-review", "sk-docs"],
    mcpServerIds: ["mcp-aws", "mcp-github"],
    memory: [],
    tracker: { kind: "linear", project: "INF", url: "https://linear.app/primepaw/team/INF" },
  },
  {
    id: "ws-design",
    name: "Design System",
    icon: "palette",
    color: "#ec4899",
    folders: ["~/dev/primepaw/design-system"],
    instructions: "All colors must come from tokens. Components need Storybook stories and a11y checks.",
    skillIds: ["sk-a11y", "sk-docs"],
    mcpServerIds: ["mcp-figma", "mcp-github"],
    memory: [mem("Hard-coded hex values remain in Button, Badge and Toast.", "agent", 3 * DAY_)],
    tracker: null,
  },
]

export const initialAgents: Agent[] = [
  {
    id: "triage",
    name: "Triage",
    description: "Reads every request, picks the workspace, agent and model, and routes the work",
    color: "#3b82f6",
    modelId: "claude-sonnet-5-5",
    systemPrompt:
      "You are the Triage agent. For each request: identify the workspace it belongs to, decide which specialist agent should handle it, choose an appropriate model, and hand off a scoped brief. Ask a clarifying question only when the request is ambiguous.",
    skillIds: [],
    mcpServerIds: ["mcp-github", "mcp-jira"],
    memory: [mem("Randal prefers short status updates with a single question at the end.", "agent", 5 * DAY_)],
    builtIn: true,
  },
  {
    id: "planner",
    name: "Planner",
    description: "Breaks work into an implementation plan with acceptance criteria",
    color: "#a855f7",
    modelId: "claude-opus-5-5",
    systemPrompt: "Turn the brief into a numbered plan. Each step names the files it touches and how it will be verified.",
    skillIds: ["sk-docs"],
    mcpServerIds: ["mcp-github", "mcp-jira", "mcp-docs"],
    memory: [],
  },
  {
    id: "coder",
    name: "Coder",
    description: "Writes and edits code in an isolated worktree",
    color: "#10b981",
    modelId: "claude-opus-5-5",
    systemPrompt: "Implement the plan in a worktree. Keep diffs minimal and follow the workspace instructions.",
    skillIds: ["sk-tdd", "sk-db", "sk-pr"],
    mcpServerIds: ["mcp-github", "mcp-docs"],
    memory: [],
  },
  {
    id: "reviewer",
    name: "Reviewer",
    description: "Reviews diffs for correctness, security and style",
    color: "#eab308",
    modelId: "claude-opus-5-5",
    systemPrompt: "Review the diff. Report only issues you can demonstrate, most severe first.",
    skillIds: ["sk-review", "sk-a11y"],
    mcpServerIds: ["mcp-github"],
    memory: [],
  },
  {
    id: "tester",
    name: "Tester",
    description: "Writes and runs tests, reproduces bugs",
    color: "#06b6d4",
    modelId: "claude-sonnet-5-5",
    systemPrompt: "Reproduce the issue with a failing test before any fix. Run the full suite before handing back.",
    skillIds: ["sk-tdd", "sk-debug"],
    mcpServerIds: ["mcp-browser", "mcp-github"],
    memory: [],
  },
  {
    id: "researcher",
    name: "Researcher",
    description: "Reads docs, issues, traces and code to answer questions",
    color: "#f97316",
    modelId: "claude-sonnet-5-5",
    systemPrompt: "Investigate and cite sources. Separate what you verified from what you suspect.",
    skillIds: ["sk-perf", "sk-debug"],
    mcpServerIds: ["mcp-sentry", "mcp-postgres", "mcp-aws", "mcp-docs"],
    memory: [],
  },
]

let cardSeq = 0
const card = (column: FactoryCard["column"], title: string, extra: Partial<FactoryCard> = {}): FactoryCard => ({
  id: `card-${++cardSeq}`,
  title,
  column,
  labels: [],
  updatedAt: t0 - (cardSeq % 7) * HOUR_,
  ...extra,
})

export const initialFactories: Factory[] = [
  {
    id: "fac-storefront",
    name: "Storefront",
    icon: "factory",
    color: "#3b82f6",
    enabled: true,
    workspaceId: "ws-web",
    cards: [
      card("todo", "Saved carts for signed-out users", { ticket: "#1450", labels: ["feature"] }),
      card("todo", "Lazy-load product reviews", { ticket: "#1447", labels: ["perf"] }),
      card("todo", "Empty state for wishlist", { ticket: "#1444", labels: ["ux"] }),
      card("plan", "Gift card balance check", { ticket: "#1439", agentId: "planner", labels: ["feature"], active: true }),
      card("implement", "Fix flaky checkout e2e test", { ticket: "#1436", agentId: "tester", labels: ["bug", "ci"], active: true }),
      card("implement", "Address autocomplete on checkout", { ticket: "#1431", agentId: "coder", labels: ["feature"], active: true }),
      card("review", "Settings page dark mode", { ticket: "#1428", agentId: "reviewer", labels: ["ux"], active: true }),
      card("test", "Currency switcher rounding", { ticket: "#1422", agentId: "tester", labels: ["bug"] }),
      card("merge", "Upgrade to React 19.3", { ticket: "#1419", labels: ["chore"] }),
    ],
  },
  {
    id: "fac-api",
    name: "Orders API",
    icon: "server",
    color: "#10b981",
    enabled: true,
    workspaceId: "ws-api",
    cards: [
      card("todo", "Idempotency keys for POST /orders", { ticket: "PAW-91", labels: ["feature"] }),
      card("plan", "Restore orders (customer_id, created_at) index", { ticket: "PAW-88", agentId: "planner", labels: ["perf"], active: true }),
      card("implement", "Paginate /orders with cursors", { ticket: "PAW-84", agentId: "coder", labels: ["feature"], active: true }),
      card("review", "Session token refactor", { ticket: "PAW-80", agentId: "reviewer", labels: ["security"] }),
    ],
  },
  {
    id: "fac-design",
    name: "Design System",
    icon: "palette",
    color: "#ec4899",
    enabled: false,
    workspaceId: "ws-design",
    cards: [
      card("todo", "Replace hard-coded colors in Button", { labels: ["tokens"] }),
      card("todo", "Replace hard-coded colors in Badge", { labels: ["tokens"] }),
      card("todo", "Toast a11y: announce politely", { labels: ["a11y"] }),
    ],
  },
]

export const suggestions = [
  "Fix the flaky checkout e2e test",
  "Why is /api/orders slow since Tuesday?",
  "Add dark mode to the settings page",
  "Review my open PR for auth changes",
]

const HOUR = HOUR_
const DAY = DAY_
const now = t0

let seq = 0
const msg = (role: ChatMessage["role"], parts: MessagePart[], ago: number): ChatMessage => ({
  id: `m${++seq}`,
  role,
  parts,
  createdAt: now - ago,
})
const text = (t: string): MessagePart => ({ type: "text", text: t })

export const initialThreads: Thread[] = [
  {
    id: "t-flaky-checkout",
    title: "Flaky checkout e2e test",
    workspaceId: "ws-web",
    status: "running",
    routedTo: ["researcher", "tester"],
    updatedAt: now - 4 * 60 * 1000,
    pinned: true,
    messages: [
      msg("user", [text("The `checkout.spec.ts` e2e test fails about 1 in 5 runs on CI. Can you figure out why and fix it?")], 12 * 60 * 1000),
      msg(
        "assistant",
        [
          {
            type: "reasoning",
            duration: 4,
            text: "Intermittent e2e failure → likely a timing issue or shared state. I should look at recent CI runs to find the failing assertion before routing. This needs investigation first (Researcher), then a fix with a reproduction (Tester).",
          },
          {
            type: "tool",
            name: "search_ci_runs",
            state: "output-available",
            input: { workflow: "e2e", test: "checkout.spec.ts", status: "failed", limit: 20 },
            output: {
              failures: 4,
              of: 20,
              commonError: "TimeoutError: locator('[data-testid=order-total]') to have text '$42.00'",
              firstSeen: "2026-11-03",
            },
          },
          {
            type: "tool",
            name: "route_to_agent",
            state: "output-available",
            input: { agent: "researcher", task: "Find what changed around Nov 3 in the order-total render path" },
            output: { thread: "sub-1182", status: "completed" },
          },
          text(
            "Here's what I've found so far:\n\n- **4 of the last 20** CI runs failed, all on the same assertion: `order-total` never shows `$42.00` in time.\n- It started on **Nov 3**, right after `#1412` moved tax calculation into an async `useQuery`.\n\nThe test reads the total before the tax request settles. I've routed this to the **Tester** agent to reproduce it locally with network throttling and switch the assertion to wait on the `tax` request.",
          ),
          {
            type: "tool",
            name: "route_to_agent",
            state: "input-available",
            input: { agent: "tester", task: "Reproduce with throttled network; make test await tax response", worktree: "fix/flaky-checkout" },
          },
        ],
        10 * 60 * 1000,
      ),
    ],
  },
  {
    id: "t-orders-latency",
    title: "/api/orders latency regression",
    workspaceId: "ws-api",
    status: "needs-input",
    routedTo: ["researcher"],
    updatedAt: now - 55 * 60 * 1000,
    messages: [
      msg("user", [text("p95 on `/api/orders` jumped from 120ms to 900ms since Tuesday. What happened?")], 2 * HOUR),
      msg(
        "assistant",
        [
          { type: "reasoning", duration: 6, text: "Latency regression with a clear start date. Check deploys around Tuesday, then query plans." },
          {
            type: "tool",
            name: "query_traces",
            state: "output-available",
            input: { service: "api", route: "/api/orders", window: "7d", groupBy: "span" },
            output: { slowestSpan: "db.query orders_with_items", p95ms: 780, before: 70 },
          },
          text(
            "The slowdown is almost entirely in one query, `orders_with_items` (**70ms → 780ms** p95). Tuesday's migration `0087_add_fulfillment_status` dropped the composite index on `(customer_id, created_at)`.\n\n```sql\nCREATE INDEX CONCURRENTLY idx_orders_customer_created\n  ON orders (customer_id, created_at DESC);\n```\n\nWant me to send this to the **Coder** agent to add a migration restoring the index, or would you rather handle it in the ongoing fulfillment work?",
          ),
        ],
        HOUR,
      ),
    ],
  },
  {
    id: "t-settings-dark-mode",
    title: "Dark mode for settings page",
    workspaceId: "ws-web",
    status: "done",
    routedTo: ["planner", "coder", "reviewer"],
    updatedAt: now - 5 * HOUR,
    messages: [
      msg("user", [text("Add a dark mode toggle to the settings page.")], 7 * HOUR),
      msg(
        "assistant",
        [
          {
            type: "tool",
            name: "route_to_agent",
            state: "output-available",
            input: { agent: "planner", task: "Plan theme toggle in settings" },
            output: { steps: 4 },
          },
          {
            type: "tool",
            name: "route_to_agent",
            state: "output-available",
            input: { agent: "coder", task: "Implement plan", worktree: "feat/settings-theme" },
            output: { filesChanged: 6, pr: "#1431" },
          },
          text("Done. **PR #1431** adds an *Appearance* section to settings with System / Light / Dark, persisted per user. The Reviewer agent approved it with one nit (addressed)."),
        ],
        5 * HOUR,
      ),
    ],
  },
  {
    id: "t-auth-pr-review",
    title: "Review auth session refactor",
    workspaceId: "ws-api",
    status: "error",
    routedTo: ["reviewer"],
    updatedAt: now - 1 * DAY - 2 * HOUR,
    messages: [
      msg("user", [text("Review PR #1420 — the session token refactor.")], DAY + 3 * HOUR),
      msg(
        "assistant",
        [
          {
            type: "tool",
            name: "fetch_pull_request",
            state: "output-error",
            input: { workspaceId: "ws-api", number: 1420 },
            errorText: "GitHub API: 404 Not Found — PR may be in a fork the agent cannot access.",
          },
          text("I couldn't open **#1420** — it looks like it lives in a fork I don't have access to. Can you push the branch to `primepaw/api` or grant the agent access to the fork?"),
        ],
        DAY + 2 * HOUR,
      ),
    ],
  },
  {
    id: "t-terraform-drift",
    title: "Terraform drift in staging",
    workspaceId: "ws-infra",
    status: "done",
    routedTo: ["researcher"],
    updatedAt: now - 1 * DAY - 6 * HOUR,
    messages: [
      msg("user", [text("`terraform plan` on staging shows drift on the RDS instance. Who changed it?")], DAY + 7 * HOUR),
      msg("assistant", [text("CloudTrail shows `ModifyDBInstance` by **ops-bot** on Nov 6 (storage autoscaling bumped `allocated_storage` 100 → 120 GB). Not a manual change. I'd suggest adding `ignore_changes = [allocated_storage]`.")], DAY + 6 * HOUR),
    ],
  },
  {
    id: "t-button-tokens",
    title: "Button tokens audit",
    workspaceId: "ws-design",
    status: "idle",
    routedTo: [],
    updatedAt: now - 3 * DAY,
    messages: [
      msg("user", [text("Which components still use hard-coded colors instead of tokens?")], 3 * DAY),
      msg("assistant", [text("Found **11** hard-coded hex values across `Button`, `Badge` and `Toast`. Want me to route a cleanup to the Coder agent?")], 3 * DAY),
    ],
  },
  {
    id: "t-onboarding-copy",
    title: "Onboarding empty states",
    workspaceId: "ws-web",
    status: "done",
    routedTo: ["coder"],
    updatedAt: now - 5 * DAY,
    messages: [msg("user", [text("Write empty-state copy for the onboarding checklist.")], 5 * DAY)],
  },
  {
    id: "t-ci-cache",
    title: "Speed up CI with pnpm cache",
    workspaceId: "ws-infra",
    status: "done",
    routedTo: ["coder", "reviewer"],
    updatedAt: now - 12 * DAY,
    messages: [msg("user", [text("CI install step takes 3 minutes. Can we cache it?")], 12 * DAY)],
  },
  {
    id: "t-rate-limit",
    title: "Rate limiting for public API",
    workspaceId: "ws-api",
    status: "idle",
    routedTo: ["planner"],
    updatedAt: now - 20 * DAY,
    messages: [msg("user", [text("Propose a rate limiting design for the public API.")], 20 * DAY)],
  },
]

/** Canned Triage responses for new prompts — picked by keyword, streamed in by the mock runtime. */
export function mockTriageReply(prompt: string, workspaces: Workspace[], agents: Agent[]): {
  parts: MessagePart[]
  workspaceId: string
  agentId: string
} {
  const p = prompt.toLowerCase()
  const agentId = /test|flaky|e2e/.test(p)
    ? "tester"
    : /review|pr\b|pull request/.test(p)
      ? "reviewer"
      : /why|slow|investigate|what happened|find/.test(p)
        ? "researcher"
        : /plan|design|propose/.test(p)
          ? "planner"
          : "coder"
  const ws =
    (/api|orders|endpoint|database|query/.test(p) && workspaces.find((w) => w.id === "ws-api")) ||
    (/terraform|infra|deploy|aws/.test(p) && workspaces.find((w) => w.id === "ws-infra")) ||
    (/token|component|storybook/.test(p) && workspaces.find((w) => w.id === "ws-design")) ||
    workspaces[0]
  const agent = agents.find((a) => a.id === agentId) ?? agents[0]
  const model = models.find((m) => m.id === agent.modelId) ?? models[0]
  return {
    workspaceId: ws.id,
    agentId: agent.id,
    parts: [
      {
        type: "reasoning",
        duration: 3,
        text: `This reads as a **${agent.name.toLowerCase()}** task in **${ws.name}**. I'll confirm the workspace from its folders, then hand it to ${agent.name} on ${model.name}.`,
      },
      {
        type: "tool",
        name: "select_workspace",
        state: "output-available",
        input: { query: prompt.slice(0, 60) },
        output: { workspace: ws.name, folders: ws.folders, confidence: 0.91 },
      },
      {
        type: "tool",
        name: "route_to_agent",
        state: "input-available",
        input: { agent: agent.id, model: model.id, workspace: ws.id, task: prompt.slice(0, 80) },
      },
      {
        type: "text",
        text: `Got it. This belongs in **${ws.name}**, so I've routed it to the **${agent.name}** agent on *${model.name}*. ${agent.description}.\n\nI'll post updates in this thread as it progresses. Anything else to add before it starts?`,
      },
    ],
  }
}

