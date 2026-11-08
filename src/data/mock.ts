import type { Agent, AgentId, ChatMessage, MessagePart, Thread } from "./types"

export const agents: Record<AgentId, Agent> = {
  triage: { id: "triage", name: "Triage", description: "Understands the request and routes it to the right agents" },
  planner: { id: "planner", name: "Planner", description: "Breaks work into an implementation plan" },
  coder: { id: "coder", name: "Coder", description: "Writes and edits code in a worktree" },
  reviewer: { id: "reviewer", name: "Reviewer", description: "Reviews diffs for correctness and style" },
  tester: { id: "tester", name: "Tester", description: "Writes and runs tests" },
  researcher: { id: "researcher", name: "Researcher", description: "Reads docs, issues and code to answer questions" },
}

export const repos = ["primepaw/web", "primepaw/api", "primepaw/infra", "primepaw/design-system"]

export const models = [
  { id: "claude-opus-5-5", name: "Claude Opus 5.5" },
  { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5" },
  { id: "claude-haiku-5-5", name: "Claude Haiku 5.5" },
]

export const suggestions = [
  "Fix the flaky checkout e2e test",
  "Why is /api/orders slow since Tuesday?",
  "Add dark mode to the settings page",
  "Review my open PR for auth changes",
]

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const now = Date.now()

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
    repo: "primepaw/web",
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
    repo: "primepaw/api",
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
    repo: "primepaw/web",
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
    repo: "primepaw/api",
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
            input: { repo: "primepaw/api", number: 1420 },
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
    repo: "primepaw/infra",
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
    repo: "primepaw/design-system",
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
    repo: "primepaw/web",
    status: "done",
    routedTo: ["coder"],
    updatedAt: now - 5 * DAY,
    messages: [msg("user", [text("Write empty-state copy for the onboarding checklist.")], 5 * DAY)],
  },
  {
    id: "t-ci-cache",
    title: "Speed up CI with pnpm cache",
    repo: "primepaw/infra",
    status: "done",
    routedTo: ["coder", "reviewer"],
    updatedAt: now - 12 * DAY,
    messages: [msg("user", [text("CI install step takes 3 minutes. Can we cache it?")], 12 * DAY)],
  },
  {
    id: "t-rate-limit",
    title: "Rate limiting for public API",
    repo: "primepaw/api",
    status: "idle",
    routedTo: ["planner"],
    updatedAt: now - 20 * DAY,
    messages: [msg("user", [text("Propose a rate limiting design for the public API.")], 20 * DAY)],
  },
]

/** Canned Triage responses for new prompts — picked by keyword, streamed in by the mock runtime. */
export function mockTriageReply(prompt: string): MessagePart[] {
  const p = prompt.toLowerCase()
  const agent: AgentId = /test|flaky|e2e/.test(p)
    ? "tester"
    : /review|pr\b|pull request/.test(p)
      ? "reviewer"
      : /why|slow|investigate|what happened|find/.test(p)
        ? "researcher"
        : /plan|design|propose/.test(p)
          ? "planner"
          : "coder"
  const a = agents[agent]
  return [
    {
      type: "reasoning",
      duration: 3,
      text: `The request reads as a **${a.name.toLowerCase()}** task. I'll check the repository context, then hand it to the ${a.name} agent with a scoped brief.`,
    },
    {
      type: "tool",
      name: "search_codebase",
      state: "output-available",
      input: { query: prompt.slice(0, 60), limit: 5 },
      output: { matches: 3, files: ["src/app/routes.ts", "src/lib/api.ts", "src/features/orders/index.ts"] },
    },
    {
      type: "tool",
      name: "route_to_agent",
      state: "input-available",
      input: { agent, task: prompt.slice(0, 80) },
    },
    {
      type: "text",
      text: `Got it. I found **3 relevant files** and routed this to the **${a.name}** agent — ${a.description.toLowerCase()}.\n\nI'll post updates in this thread as it progresses. Anything else to add before it starts?`,
    },
  ]
}
