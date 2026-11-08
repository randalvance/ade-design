import { CameraIcon, Trash2Icon } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import type { Agent } from "@/data/types"
import { cn } from "@/lib/utils"

const sizes = { sm: "size-5 text-[9px]", md: "size-7 text-[11px]", lg: "size-16 text-xl" }

export function AgentAvatar({
  agent,
  size = "md",
  className,
}: {
  agent: Pick<Agent, "name" | "photo" | "color">
  size?: keyof typeof sizes
  className?: string
}) {
  const initials = agent.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return agent.photo ? (
    <img src={agent.photo} alt="" className={cn("shrink-0 rounded-full object-cover", sizes[size], className)} />
  ) : (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", sizes[size], className)}
      style={{ background: `linear-gradient(135deg, ${agent.color}, color-mix(in oklab, ${agent.color} 55%, black))` }}
    >
      {initials || "?"}
    </span>
  )
}

/** Avatar with upload / remove photo controls. Photos are kept as data URLs (mock). */
export function AgentPhotoEditor({ agent, onChange }: { agent: Agent; onChange: (photo: string | undefined) => void }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="group relative rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label="Upload photo"
      >
        <AgentAvatar agent={agent} size="lg" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <CameraIcon className="size-5" />
        </span>
      </button>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
          Upload photo
        </Button>
        {agent.photo && (
          <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            <Trash2Icon /> Remove
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = () => onChange(String(reader.result))
          reader.readAsDataURL(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
