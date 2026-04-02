import { tool } from "@opencode-ai/plugin"
import { CAPACITY, type MemoryType } from "../core/constants.js"
import { saveMemory } from "../core/memoryStore.js"
import { checkCapacity } from "../core/capacityManager.js"

const VALID_TYPES: MemoryType[] = ["user", "feedback", "project", "reference"]

export function createSaveTool(memoryDir: string) {
  return tool({
    description:
      "Save a persistent memory that survives context compaction and cross sessions. " +
      "Types: 'user' (preferences/role), 'feedback' (corrections/guidance), " +
      "'project' (ongoing work context, decisions, deadlines), " +
      "'reference' (external systems, dashboards, issue trackers). " +
      "Do NOT save: code patterns, file paths, git history, anything derivable from code.",
    args: {
      name: tool.schema.string().describe("Memory name, kebab-case (e.g., 'user-role', 'testing-style')"),
      type: tool.schema.string().describe("Memory type: user | feedback | project | reference"),
      description: tool.schema.string().describe("One-line summary — used to decide relevance in future sessions"),
      content: tool.schema.string().describe("Memory body. For feedback/project: lead with rule/fact, then **Why:** and **How to apply:**"),
    },
    async execute(args: { name: string; type: string; description: string; content: string }) {
      if (!VALID_TYPES.includes(args.type as MemoryType)) {
        return `Invalid type "${args.type}". Must be one of: ${VALID_TYPES.join(", ")}`
      }

      const capacity = checkCapacity(memoryDir)
      if (capacity.atLimit) {
        return `Memory at capacity (${capacity.fileCount} files). Use memory_list to review and memory_delete to clean up.`
      }

      const result = saveMemory(memoryDir, {
        name: args.name,
        type: args.type as MemoryType,
        description: args.description,
        content: args.content,
      })

      if (!result.ok) return result.reason
      return result.updated
        ? `Memory updated: ${args.name} (${args.type}) at ${result.path}`
        : `Memory saved: ${args.name} (${args.type}) at ${result.path}`
    },
  })
}
