import { tool } from "@opencode-ai/plugin"
import { type MemoryType } from "../core/constants.js"
import { searchMemories, formatSearchResult } from "../search/searchEngine.js"

export function createRecallTool(memoryDir: string) {
  return tool({
    description:
      "Search and retrieve memories by keywords or type. Returns full content of matching files. " +
      "Use when the user references past work, after compaction, or when starting complex tasks.",
    args: {
      query: tool.schema.string().describe("Keywords or topic to search for"),
      type: tool.schema.string().optional().describe("Optional filter: user | feedback | project | reference"),
    },
    async execute(args: { query: string; type?: string }) {
      const results = searchMemories(
        memoryDir,
        args.query,
        args.type as MemoryType | undefined,
      )

      if (results.length === 0) {
        return `No memories matching "${args.query}". Use memory_list to see all available memories.`
      }

      return results.map((sr) => formatSearchResult(sr)).join("\n\n---\n\n")
    },
  })
}
