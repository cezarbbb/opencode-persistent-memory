import { existsSync, readFileSync, writeFileSync } from "fs"
import { CAPACITY, ENTRYPOINT_NAME } from "./constants.js"
import { formatMemoryManifest, scanMemoryFiles } from "./memoryScan.js"

export function updateMemoryIndex(memoryDir: string): void {
  const files = scanMemoryFiles(memoryDir)
  const lines: string[] = ["# Memory Index", ""]

  for (const f of files) {
    const desc = f.description ? ` — ${f.description}` : ""
    const entry = `- [${f.frontmatter.name || f.filename}](./${f.filename})${desc}`
    lines.push(entry)
  }

  lines.push("")

  let content = lines.join("\n")

  if (content.split("\n").length > CAPACITY.MAX_ENTRYPOINT_LINES) {
    const truncated = content.split("\n").slice(0, CAPACITY.MAX_ENTRYPOINT_LINES)
    truncated.push(
      "",
      `> WARNING: Truncated to ${CAPACITY.MAX_ENTRYPOINT_LINES} lines. Some entries omitted.`,
    )
    content = truncated.join("\n")
  }

  if (Buffer.byteLength(content, "utf-8") > CAPACITY.MAX_ENTRYPOINT_BYTES) {
    const cutAt = content.lastIndexOf("\n", CAPACITY.MAX_ENTRYPOINT_BYTES)
    content =
      content.slice(0, cutAt > 0 ? cutAt : CAPACITY.MAX_ENTRYPOINT_BYTES) +
      `\n\n> WARNING: Truncated at ${CAPACITY.MAX_ENTRYPOINT_BYTES} bytes.\n`
  }

  const indexPath = `${memoryDir}/${ENTRYPOINT_NAME}`
  writeFileSync(indexPath, content, "utf-8")
}

export function readMemoryIndex(memoryDir: string): string {
  const indexPath = `${memoryDir}/${ENTRYPOINT_NAME}`
  if (!existsSync(indexPath)) return "Memory index is empty."
  return readFileSync(indexPath, "utf-8")
}
