import { existsSync, readFileSync, writeFileSync } from "fs"
import { getSessionNotesPath } from "../core/constants.js"
import { parseFrontmatter, serializeFrontmatter, type Frontmatter } from "../core/frontmatter.js"

export type SessionNotes = {
  frontmatter: Frontmatter
  sections: Record<string, string>
}

const SECTION_ORDER = [
  "Session Title",
  "Current State",
  "Task Specification",
  "Files and Functions",
  "Workflow",
  "Errors & Corrections",
  "Codebase Documentation",
  "Learnings",
  "Key Results",
  "Worklog",
]

export function createEmptySessionNotes(sessionId: string): SessionNotes {
  const now = new Date().toISOString()
  return {
    frontmatter: {
      name: "session-notes",
      description: "Structured session notes surviving compaction",
      type: "session",
      created: now.split("T")[0],
      updated: now,
      session_id: sessionId,
      compact_count: "0",
    },
    sections: {},
  }
}

export function loadSessionNotes(memoryDir: string): SessionNotes {
  const notesPath = getSessionNotesPath(memoryDir)
  if (!existsSync(notesPath)) {
    return createEmptySessionNotes("unknown")
  }

  const content = readFileSync(notesPath, "utf-8")
  return parseSessionNotes(content)
}

export function parseSessionNotes(content: string): SessionNotes {
  const { frontmatter, body } = parseFrontmatter(content)
  const sections: Record<string, string> = {}

  const sectionRegex = /^## (.+)$/gm
  const matches: Array<{ name: string; index: number }> = []

  let match: RegExpExecArray | null
  while ((match = sectionRegex.exec(body)) !== null) {
    matches.push({ name: match[1], index: match.index + match[0].length })
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index
    const end = i + 1 < matches.length ? matches[i + 1].index - matches[i + 1].name.length - 3 : body.length
    sections[matches[i].name] = body.slice(start, end).trim()
  }

  return { frontmatter, sections }
}

export function saveSessionNotes(memoryDir: string, notes: SessionNotes): void {
  const notesPath = getSessionNotesPath(memoryDir)
  notes.frontmatter.updated = new Date().toISOString()

  const body = SECTION_ORDER.map((section) => {
    const content = notes.sections[section] || ""
    return `## ${section}\n\n${content}`
  }).join("\n\n")

  const content = serializeFrontmatter(notes.frontmatter, body)
  writeFileSync(notesPath, content, "utf-8")
}

export function isNotesStructured(notes: SessionNotes): boolean {
  const filled = Object.values(notes.sections).filter((s) => s.trim().length > 0)
  return filled.length >= 3
}

export function notesByteSize(notes: SessionNotes): number {
  const body = SECTION_ORDER.map((section) => {
    const content = notes.sections[section] || ""
    return `## ${section}\n\n${content}`
  }).join("\n\n")

  return Buffer.byteLength(serializeFrontmatter(notes.frontmatter, body), "utf-8")
}

export function isNotesFresh(notes: SessionNotes, maxAgeMs: number = 5 * 60_000): boolean {
  const updated = notes.frontmatter.updated
  if (!updated) return false
  return Date.now() - new Date(updated).getTime() < maxAgeMs
}

export type CheckpointInput = {
  current_task: string
  files_in_progress: string[]
  key_decisions: string[]
  next_steps: string
  blockers?: string
  errors_fixed?: string[]
}

export function applyCheckpoint(notes: SessionNotes, input: CheckpointInput): SessionNotes {
  const existing = notes.sections

  const mergedFiles = [
    ...(existing["Files and Functions"] || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    ...input.files_in_progress,
  ]

  const mergedErrors = [
    ...(existing["Errors & Corrections"] || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    ...(input.errors_fixed || []),
  ]

  const mergedResults = [
    ...(existing["Key Results"] || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    ...input.key_decisions,
  ]

  const worklog = existing["Worklog"] || ""
  const newEntry = `[${new Date().toISOString()}] ${input.current_task} → ${input.next_steps}`

  let currentState = input.current_task
  if (input.blockers) {
    currentState += `\n\n**Blockers:** ${input.blockers}`
  }

  return {
    ...notes,
    frontmatter: { ...notes.frontmatter },
    sections: {
      ...existing,
      "Current State": currentState,
      "Task Specification": existing["Task Specification"] || input.current_task,
      "Files and Functions": [...new Set(mergedFiles)].join("\n"),
      Workflow: input.next_steps,
      "Errors & Corrections": mergedErrors.join("\n"),
      "Key Results": [...new Set(mergedResults)].join("\n"),
      Worklog: [worklog, newEntry].filter(Boolean).join("\n"),
    },
  }
}
