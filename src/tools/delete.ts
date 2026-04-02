import { tool } from "@opencode-ai/plugin"
import { deleteMemory } from "../core/memoryStore.js"

export function createDeleteTool(memoryDir: string) {
  return tool({
    description: "Delete a memory file and update the index. Use when a memory is outdated or wrong.",
    args: {
      name: tool.schema.string().describe("Memory name to delete (filename without .md, e.g., 'user-role')"),
    },
    async execute(args: { name: string }) {
      const result = deleteMemory(memoryDir, args.name)
      if (!result.ok) return result.reason
      return `Deleted: ${args.name} (${result.path})`
    },
  })
}
