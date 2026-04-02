import { tool } from "@opencode-ai/plugin"
import { loadSessionNotes, saveSessionNotes, applyCheckpoint } from "../session/sessionNotes.js"

export function createCheckpointTool(memoryDir: string) {
  return tool({
    description:
      "Save current session state to notes. This survives compaction. " +
      "Call before compaction and at key milestones.",
    args: {
      current_task: tool.schema.string().describe("What you are currently working on"),
      files_in_progress: tool.schema.array(tool.schema.string()).describe("Files being actively modified"),
      key_decisions: tool.schema.array(tool.schema.string()).describe("Important decisions made this session"),
      next_steps: tool.schema.string().describe("What to do next"),
      blockers: tool.schema.string().optional().describe("Any blockers or open questions"),
      errors_fixed: tool.schema.array(tool.schema.string()).optional().describe("Errors encountered and how they were fixed"),
    },
    async execute(args: {
      current_task: string
      files_in_progress: string[]
      key_decisions: string[]
      next_steps: string
      blockers?: string
      errors_fixed?: string[]
    }) {
      const notes = loadSessionNotes(memoryDir)
      const updated = applyCheckpoint(notes, {
        current_task: args.current_task,
        files_in_progress: args.files_in_progress || [],
        key_decisions: args.key_decisions || [],
        next_steps: args.next_steps,
        blockers: args.blockers,
        errors_fixed: args.errors_fixed,
      })

      saveSessionNotes(memoryDir, updated)

      const filledSections = Object.values(updated.sections).filter(
        (s) => s.trim().length > 0,
      ).length

      return `Session checkpoint saved. ${filledSections} sections updated at ${memoryDir}/.session/notes.md`
    },
  })
}
