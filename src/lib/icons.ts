import {
  AppWindowIcon,
  BlocksIcon,
  BotIcon,
  BoxIcon,
  BrainIcon,
  BugIcon,
  CloudIcon,
  CodeIcon,
  CogIcon,
  CpuIcon,
  DatabaseIcon,
  FactoryIcon,
  FlaskConicalIcon,
  FolderIcon,
  GlobeIcon,
  HammerIcon,
  LayersIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  PaletteIcon,
  PawPrintIcon,
  RocketIcon,
  ServerIcon,
  ShieldIcon,
  ShoppingCartIcon,
  SmartphoneIcon,
  SparklesIcon,
  TerminalIcon,
  WorkflowIcon,
  WrenchIcon,
  ZapIcon,
} from "lucide-react"

/** Curated icon set for workspaces and factories. Keys are stored in data. */
export const icons = {
  paw: PawPrintIcon,
  app: AppWindowIcon,
  globe: GlobeIcon,
  server: ServerIcon,
  database: DatabaseIcon,
  cloud: CloudIcon,
  code: CodeIcon,
  terminal: TerminalIcon,
  palette: PaletteIcon,
  layers: LayersIcon,
  blocks: BlocksIcon,
  box: BoxIcon,
  smartphone: SmartphoneIcon,
  cart: ShoppingCartIcon,
  dashboard: LayoutDashboardIcon,
  shield: ShieldIcon,
  bug: BugIcon,
  flask: FlaskConicalIcon,
  rocket: RocketIcon,
  zap: ZapIcon,
  sparkles: SparklesIcon,
  brain: BrainIcon,
  bot: BotIcon,
  cpu: CpuIcon,
  cog: CogIcon,
  wrench: WrenchIcon,
  hammer: HammerIcon,
  factory: FactoryIcon,
  workflow: WorkflowIcon,
  folder: FolderIcon,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof icons

export const iconNames = Object.keys(icons) as IconName[]

/** Accent colors for entity icons. They read on both light and dark themes. */
export const accentColors = [
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#84cc16", // lime
  "#eab308", // yellow
  "#f97316", // orange
  "#ef4444", // red
  "#ec4899", // pink
  "#a855f7", // purple
  "#64748b", // slate
]
