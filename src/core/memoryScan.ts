import { readdirSync, readFileSync, statSync } from "fs"
import { basename, join } from "path"
import { CAPACITY, ENTRYPOINT_NAME, parseMemoryType, type MemoryType } from "./constants.js"
import { parseFrontmatter, type Frontmatter } from "./frontmatter.js"

export type MemoryHeader = {
  filename: string
  filePath: string
  mtimeMs: number
  description: string | null
  type: MemoryType | undefined
  frontmatter: Frontmatter
}

export function scanMemoryFiles(memoryDir: string): MemoryHeader[] {
  try {
    const entries = collectMdFiles(memoryDir, "")
    const headers: MemoryHeader[] = []

    for (const relativePath of entries) {
      if (basename(relativePath) === ENTRYPOINT_NAME) continue
      if (relativePath.startsWith(".session" + "/") || relativePath.startsWith(".session\\")) continue

      const filePath = join(memoryDir, relativePath)
      try {
        const stat = statSync(filePath)
        const content = readFileSync(filePath, { encoding: "utf-8" })
        const { frontmatter } = parseFrontmatter(content)
        headers.push({
          filename: relativePath,
          filePath,
          mtimeMs: stat.mtimeMs,
          description: frontmatter.description || null,
          type: parseMemoryType(frontmatter.type),
          frontmatter,
        })
      } catch {
        continue
      }
    }

    return headers.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, CAPACITY.MAX_MEMORY_FILES)
  } catch {
    return []
  }
}

function collectMdFiles(dir: string, prefix: string): string[] {
  const results: string[] = []
  let entries: import("fs").Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return results
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      results.push(...collectMdFiles(fullPath, relPath))
    } else if (entry.name.endsWith(".md")) {
      results.push(relPath)
    }
  }

  return results
}

export function formatMemoryManifest(memories: MemoryHeader[]): string {
  return memories
    .map((m) => {
      const tag = m.type ? `[${m.type}]` : "[?]"
      const ts = new Date(m.mtimeMs).toISOString().split("T")[0]
      return m.description
        ? `- ${tag} ${m.filename} (${ts}): ${m.description}`
        : `- ${tag} ${m.filename} (${ts})`
    })
    .join("\n")
}

export function findMemoryByName(
  memoryDir: string,
  name: string,
): MemoryHeader | undefined {
  const files = scanMemoryFiles(memoryDir)
  return files.find(
    (f) =>
      f.frontmatter.name === name ||
      f.filename === `${name}.md` ||
      f.filename === name ||
      f.filename.endsWith(`/${name}.md`),
  )
}
