import { readFileSync } from "fs"
import { DAY_MS, type MemoryType } from "../core/constants.js"
import { memoryAge, memoryFreshnessMarker, memoryFreshnessText } from "../core/freshnessTracker.js"
import type { MemoryHeader } from "../core/memoryScan.js"
import { scanMemoryFiles } from "../core/memoryScan.js"

export type SearchResult = {
  memory: MemoryHeader
  score: number
}

export function searchMemories(
  memoryDir: string,
  query: string,
  type?: MemoryType,
): SearchResult[] {
  let candidates = scanMemoryFiles(memoryDir)

  if (type) {
    candidates = candidates.filter((m) => m.type === type)
  }

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0)

  if (terms.length === 0) return []

  const scored = candidates
    .map((memory) => ({
      memory,
      score: computeRelevanceScore(memory, terms),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 5)
}

function computeRelevanceScore(memory: MemoryHeader, terms: string[]): number {
  let score = 0
  const nameLower = memory.filename.toLowerCase()
  const descLower = (memory.description ?? "").toLowerCase()
  const fmNameLower = (memory.frontmatter.name ?? "").toLowerCase()

  for (const term of terms) {
    if (fmNameLower.includes(term)) score += 12
    if (nameLower.includes(term)) score += 10
    if (descLower.includes(term)) score += 5
    if (memory.type === term) score += 3
  }

  if (terms.length > 1) {
    const full = query_text(memory).toLowerCase()
    for (const term of terms) {
      if (full.includes(term)) score += 2
    }
  }

  const ageDays = (Date.now() - memory.mtimeMs) / DAY_MS
  if (ageDays < 1) score += 3
  else if (ageDays < 7) score += 1

  return score
}

function query_text(memory: MemoryHeader): string {
  try {
    return readFileSync(memory.filePath, "utf-8")
  } catch {
    return `${memory.filename} ${memory.description ?? ""}`
  }
}

export function fullTextSearch(
  memoryDir: string,
  pattern: string,
): Array<{ file: string; matches: string[] }> {
  const files = scanMemoryFiles(memoryDir)
  const results: Array<{ file: string; matches: string[] }> = []
  const patLower = pattern.toLowerCase()

  for (const file of files) {
    try {
      const content = readFileSync(file.filePath, "utf-8")
      const lines = content.split("\n")
      const matches: string[] = []

      for (const line of lines) {
        if (line.toLowerCase().includes(patLower)) {
          matches.push(line.trim())
          if (matches.length >= 5) break
        }
      }

      if (matches.length > 0) {
        results.push({ file: file.filename, matches })
      }
    } catch {
      continue
    }
  }

  return results
}

export function formatSearchResult(sr: SearchResult): string {
  const freshness = memoryFreshnessText(sr.memory.mtimeMs)
  const header = freshness
    ? `${freshness}\n\nMemory: ${sr.memory.filePath}:`
    : `Memory (saved ${memoryAge(sr.memory.mtimeMs)}): ${sr.memory.filePath}:`
  const marker = memoryFreshnessMarker(sr.memory.mtimeMs)

  try {
    const content = readFileSync(sr.memory.filePath, "utf-8")
    return `${header}\n${content}`
  } catch {
    return `${marker} ${sr.memory.filename} — (file unreadable)`
  }
}
