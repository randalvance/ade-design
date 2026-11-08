const DAY = 24 * 60 * 60 * 1000

export function relativeTime(ts: number, now = Date.now()) {
  const diff = Math.max(0, now - ts)
  const m = Math.floor(diff / 60000)
  if (m < 1) return "now"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return `${Math.floor(d / 7)}w`
}

/** Bucket timestamps the way chat apps group history. */
export function dateBucket(ts: number, now = Date.now()) {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0)
  if (ts >= startOfToday) return "Today"
  if (ts >= startOfToday - DAY) return "Yesterday"
  if (ts >= startOfToday - 7 * DAY) return "Previous 7 days"
  if (ts >= startOfToday - 30 * DAY) return "Previous 30 days"
  return "Older"
}

export const bucketOrder = ["Today", "Yesterday", "Previous 7 days", "Previous 30 days", "Older"]
