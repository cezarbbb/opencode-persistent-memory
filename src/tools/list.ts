import { tool } from "@opencode-ai/plugin"
import { DAY_MS } from "../core/constants.js"
import { readMemoryIndex } from "../core/memoryIndex.js"
import { scanMemoryFiles } from "../core/memoryScan.js"
import { checkCapacity } from "../core/capacityManager.js"
import { memoryAge, memoryFreshnessMarker } from "../core/freshnessTracker.js"

export function createListTool(memoryDir: string) {
  return tool({
    description: "List all memories with freshness status. Use to orient yourself after compaction or at session start.",
    args: {},
    async execute() {
      const indexContent = readMemoryIndex(memoryDir)
      const files = scanMemoryFiles(memoryDir)
      const capacity = checkCapacity(memoryDir)

      const freshCount = files.filter((f) => Date.now() - f.mtimeMs < DAY_MS).length
      const staleCount = capacity.staleCount

      const header = [
        `Memory Directory: ${memoryDir}`,
        `Total: ${files.length}/${capacity.fileCount} files | Fresh: ${freshCount} | Stale: ${staleCount}`,
        `Index: ${capacity.indexBytes}/25000 bytes`,
        "",
      ].join("\n")

      if (files.length === 0) {
        return `${header}No memories saved yet. Use memory_save to create your first memory.`
      }

      const list = files
        .map((f) => {
          const marker = memoryFreshnessMarker(f.mtimeMs)
          const tag = f.type ? `[${f.type}]` : "[?]"
          const desc = f.description ? ` — ${f.description}` : ""
          const age = memoryAge(f.mtimeMs)
          return `${marker} ${tag} ${f.filename} (${age})${desc}`
        })
        .join("\n")

      return `${header}${list}\n\n---\n\n### MEMORY.md\n\`\`\`\n${indexContent}\n\`\`\``
    },
  })
}
