import { tool } from "@opencode-ai/plugin"
import { type MemoryType } from "../core/constants.js"
import { searchMemories, formatSearchResult } from "../search/searchEngine.js"

export function createRecallTool(memoryDir: string) {
  return tool({
    description:
      "Search and retrieve memories by keywords or type. Returns full content of matching files. " +
      "Use when the user references past work, after compaction, or when starting complex tasks.",
    args: {
      query: tool.schema.string().optional().describe("Keywords or topic to search for. Omit to list all memories of a given type."),
      type: tool.schema.string().optional().describe("Optional filter: user | feedback | project | reference"),
    },
    async execute(args: { query?: string; type?: string }) {
      if (!args.query && !args.type) {
        return "Please provide at least a query or type filter. Use memory_list to see all available memories."
      }
      const results = searchMemories(
        memoryDir,
        args.query,
        args.type as MemoryType | undefined,
      )

      if (results.length === 0) {
        const filter = args.type ? `type="${args.type}"` : `"${args.query}"`
        return `No memories matching ${filter}. Use memory_list to see all available memories.`
      }

      return results.map((sr) => formatSearchResult(sr)).join("\n\n---\n\n")
    },
  })
}
