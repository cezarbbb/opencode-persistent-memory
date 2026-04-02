import { DAY_MS } from "./constants.js"

export type FreshnessLevel = "fresh" | "recent" | "aging" | "old" | "stale"

export function memoryAgeDays(mtimeMs: number): number {
  return (Date.now() - mtimeMs) / DAY_MS
}

export function memoryAge(mtimeMs: number): string {
  const days = memoryAgeDays(mtimeMs)
  if (days < 1) return "today"
  if (days < 2) return "yesterday"
  if (days < 7) return `${Math.floor(days)}d ago`
  if (days < 30) return `${Math.floor(days)}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function memoryFreshnessLevel(mtimeMs: number): FreshnessLevel {
  const days = memoryAgeDays(mtimeMs)
  if (days < 1) return "fresh"
  if (days < 7) return "recent"
  if (days < 30) return "aging"
  if (days < 90) return "old"
  return "stale"
}

export function memoryFreshnessMarker(mtimeMs: number): string {
  switch (memoryFreshnessLevel(mtimeMs)) {
    case "fresh":
      return "✓"
    case "recent":
      return "○"
    case "aging":
      return "⚠"
    case "old":
      return "⚑"
    case "stale":
      return "✗"
  }
}

export function memoryFreshnessText(mtimeMs: number): string {
  const days = memoryAgeDays(mtimeMs)

  if (days < 1) return ""
  if (days < 7) return `○ Saved ${Math.floor(days)}d ago — verify before relying on this.`
  if (days < 30)
    return `⚠ Saved ${Math.floor(days)}d ago — may be stale. Verify against current code.`
  if (days < 90)
    return `⚑ Saved ${Math.floor(days)}d ago — likely stale. Trust current code over this memory.`
  return `✗ Saved ${Math.floor(days)}d ago — probably outdated. Treat as historical context only.`
}
