import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs"
import { dirname } from "path"
import { CAPACITY, getMemoryFilePath, type MemoryType } from "./constants.js"
import { createFrontmatter, serializeFrontmatter, type Frontmatter } from "./frontmatter.js"
import { findMemoryByName, scanMemoryFiles } from "./memoryScan.js"
import { updateMemoryIndex } from "./memoryIndex.js"

export type SaveMemoryInput = {
  name: string
  type: MemoryType
  description: string
  content: string
}

export type SaveResult =
  | { ok: true; path: string; updated: boolean }
  | { ok: false; reason: string }

export function saveMemory(memoryDir: string, input: SaveMemoryInput): SaveResult {
  const existing = findMemoryByName(memoryDir, input.name)

  const fileCount = scanMemoryFiles(memoryDir).length
  if (!existing && fileCount >= CAPACITY.MAX_MEMORY_FILES) {
    return {
      ok: false,
      reason: `Memory directory at capacity (${fileCount}/${CAPACITY.MAX_MEMORY_FILES} files). Use memory_list to review and memory_delete to clean up.`,
    }
  }

  const filePath = existing
    ? existing.filePath
    : getMemoryFilePath(memoryDir, input.type, input.name)

  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  let fm: Frontmatter
  if (existing) {
    fm = {
      ...existing.frontmatter,
      description: input.description,
      type: input.type,
      updated: new Date().toISOString().split("T")[0],
    }
  } else {
    fm = createFrontmatter(input.name, input.description, input.type)
  }

  const content = serializeFrontmatter(fm, input.content)
  writeFileSync(filePath, content, "utf-8")

  updateMemoryIndex(memoryDir)

  return { ok: true, path: filePath, updated: !!existing }
}

export function deleteMemory(memoryDir: string, name: string): SaveResult {
  const existing = findMemoryByName(memoryDir, name)
  if (!existing) {
    return { ok: false, reason: `Memory "${name}" not found.` }
  }

  unlinkSync(existing.filePath)
  updateMemoryIndex(memoryDir)

  return { ok: true, path: existing.filePath, updated: false }
}

export function readMemoryContent(filePath: string): string | null {
  try {
    return readFileSync(filePath, "utf-8")
  } catch {
    return null
  }
}
