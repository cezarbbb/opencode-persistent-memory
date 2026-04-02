import { CAPACITY, type MemoryType } from "../core/constants.js"
import { findMemoryByName } from "../core/memoryScan.js"
import type { BufferedMessage } from "./messageBuffer.js"
import {
  CONFIRMATION_PATTERNS,
  CORRECTION_PATTERNS,
  REMEMBER_PATTERNS,
  USER_PROFILE_PATTERNS,
} from "./patterns.js"

export type MemoryCandidate = {
  content: string
  type: MemoryType
  confidence: number
  source: "correction" | "explicit" | "profile" | "confirmation"
}

export function heuristicExtract(
  messages: BufferedMessage[],
  memoryDir: string,
): MemoryCandidate[] {
  const candidates: MemoryCandidate[] = []

  for (const msg of messages) {
    if (msg.role !== "user") continue
    const text = msg.content

    extractFromPatterns(text, CORRECTION_PATTERNS, "feedback", "correction", candidates)
    extractFromPatterns(text, REMEMBER_PATTERNS, "user", "explicit", candidates)
    extractFromPatterns(text, USER_PROFILE_PATTERNS, "user", "profile", candidates)
    extractFromPatterns(text, CONFIRMATION_PATTERNS, "feedback", "confirmation", candidates)
  }

  return candidates
    .filter((c) => c.confidence >= CAPACITY.HIGH_CONFIDENCE_THRESHOLD)
    .filter((c) => !isDuplicate(c, memoryDir))
}

function extractFromPatterns(
  text: string,
  patterns: Array<{ pattern: RegExp; confidence: number }>,
  defaultType: MemoryType,
  source: MemoryCandidate["source"],
  out: MemoryCandidate[],
): void {
  for (const { pattern, confidence } of patterns) {
    if (pattern.test(text)) {
      const inferredType = inferType(text, defaultType)
      out.push({
        content: text.trim(),
        type: inferredType,
        confidence: adjustConfidence(text, confidence, source),
        source,
      })
      break
    }
  }
}

function inferType(text: string, defaultType: MemoryType): MemoryType {
  const lower = text.toLowerCase()
  if (/sprint|deadline|milestone|release|deploy/i.test(lower)) return "project"
  if (/jira|linear|slack|grafana|dashboard/i.test(lower)) return "reference"
  return defaultType
}

function adjustConfidence(text: string, base: number, source: string): number {
  if (source === "explicit") return Math.min(base + 0.1, 1.0)
  if (text.length < 20) return base - 0.15
  if (text.length > 200) return base - 0.05
  return base
}

function isDuplicate(candidate: MemoryCandidate, memoryDir: string): boolean {
  const keywords = candidate.content
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 3)

  if (keywords.length === 0) return false

  const existing = findMemoryByName(memoryDir, candidate.content.split(/\s+/).slice(0, 3).join("-"))
  if (existing) return true

  return false
}
