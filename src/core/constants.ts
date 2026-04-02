import { join } from "path"
import { homedir } from "os"

export const MEMORY_TYPES = ["user", "feedback", "project", "reference"] as const
export type MemoryType = (typeof MEMORY_TYPES)[number]

export const DAY_MS = 86_400_000

export const CAPACITY = {
  MAX_MEMORY_FILES: 200,
  MAX_ENTRYPOINT_LINES: 200,
  MAX_ENTRYPOINT_BYTES: 25_000,
  MAX_MEMORY_FILE_BYTES: 10_000,
  MAX_BUFFER_MESSAGES: 50,
  MIN_MESSAGES_FOR_EXTRACT: 6,
  MIN_EXTRACT_INTERVAL_MS: 30_000,
  STALE_THRESHOLD_DAYS: 90,
  HIGH_CONFIDENCE_THRESHOLD: 0.7,
} as const

export const ENTRYPOINT_NAME = "MEMORY.md"
export const SESSION_NOTES_NAME = "notes.md"

const MEMORY_SUBDIRS = ["user", "feedback", "project", "reference", ".session"]

export function resolveMemoryDir(projectDir: string, project?: { id?: string; worktree?: string; vcsDir?: string }): string {
  const slug = slugifyPath(project?.vcsDir || project?.worktree || projectDir)
  return join(homedir(), ".local", "share", "opencode", "memory", slug)
}

export function getSessionNotesPath(memoryDir: string): string {
  return join(memoryDir, ".session", SESSION_NOTES_NAME)
}

export function getMemoryIndexPath(memoryDir: string): string {
  return join(memoryDir, ENTRYPOINT_NAME)
}

export async function ensureMemoryDir(memoryDir: string): Promise<void> {
  const { mkdir } = await import("fs/promises")
  for (const subdir of MEMORY_SUBDIRS) {
    await mkdir(join(memoryDir, subdir), { recursive: true })
  }
  const indexPath = getMemoryIndexPath(memoryDir)
  const { existsSync } = await import("fs")
  if (!existsSync(indexPath)) {
    const { writeFileSync } = await import("fs")
    writeFileSync(
      indexPath,
      ["# Memory Index", "", "<!-- One-line entries with links to memory files. -->", "<!-- Keep under 200 lines / 25KB. -->", ""].join("\n"),
    )
  }
  const notesPath = getSessionNotesPath(memoryDir)
  if (!existsSync(notesPath)) {
    const { writeFileSync } = await import("fs")
    writeFileSync(notesPath, buildInitialSessionNotes("new"))
  }
}

function slugifyPath(p: string): string {
  let slug = p
    .replace(/\\/g, "/")
    .replace(/[:?*<>|"]/g, "")
    .replace(/\/+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/\/\.git$/g, "")
  slug = slug.replace(/^([a-zA-Z])\//, "$1-")
  return slug
}

function buildInitialSessionNotes(sessionId: string): string {
  const now = new Date().toISOString()
  return [
    "---",
    `session_id: ${sessionId}`,
    `last_updated: ${now}`,
    "compact_count: 0",
    "---",
    "",
    "## Session Title",
    "",
    "## Current State",
    "",
    "## Task Specification",
    "",
    "## Files and Functions",
    "",
    "## Workflow",
    "",
    "## Errors & Corrections",
    "",
    "## Codebase Documentation",
    "",
    "## Learnings",
    "",
    "## Key Results",
    "",
    "## Worklog",
    "",
  ].join("\n")
}

export function parseMemoryType(raw: unknown): MemoryType | undefined {
  if (typeof raw !== "string") return undefined
  return MEMORY_TYPES.find((t) => t === raw)
}

export function getMemoryFilePath(memoryDir: string, type: MemoryType, name: string): string {
  return join(memoryDir, type, `${name}.md`)
}
