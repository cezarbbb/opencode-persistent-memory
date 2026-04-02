import { tool } from "@opencode-ai/plugin"
import { fullTextSearch } from "../search/searchEngine.js"

export function createSearchTool(memoryDir: string) {
  return tool({
    description: "Full-text search across all memory files. Use for broad searches when memory_recall is too narrow.",
    args: {
      pattern: tool.schema.string().describe("Search pattern (keyword or phrase)"),
    },
    async execute(args: { pattern: string }) {
      const results = fullTextSearch(memoryDir, args.pattern)

      if (results.length === 0) {
        return `No matches for "${args.pattern}" across memory files.`
      }

      return results
        .map((r) => `**${r.file}**\n${r.matches.map((m) => `  - ${m}`).join("\n")}`)
        .join("\n\n")
    },
  })
}
