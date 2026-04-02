import { formatMemoryManifest, scanMemoryFiles } from "../core/memoryScan.js"

export function createCompactingHook(memoryDir: string) {
  return async (_input: unknown, output: { context: string[]; prompt?: string }) => {
    let memoryIndex = ""
    try {
      const { readFileSync, existsSync } = await import("fs")
      const indexPath = `${memoryDir}/MEMORY.md`
      if (existsSync(indexPath)) {
        memoryIndex = readFileSync(indexPath, "utf-8")
      }
    } catch {
      // ignore
    }

    let sessionNotes = ""
    try {
      const { readFileSync, existsSync } = await import("fs")
      const notesPath = `${memoryDir}/.session/notes.md`
      if (existsSync(notesPath)) {
        sessionNotes = readFileSync(notesPath, "utf-8")
      }
    } catch {
      // ignore
    }

    const manifest = formatMemoryManifest(scanMemoryFiles(memoryDir))

    output.context.push(
      [
        "## Persistent Memory (MUST survive compaction)",
        "",
        "### Memory Index (MEMORY.md)",
        memoryIndex || "(empty)",
        "",
        "### Session Notes",
        sessionNotes || "(empty)",
        "",
        "### All Memory Files",
        manifest || "(none)",
        "",
        "### Instructions",
        `After compaction, all memories above still exist on disk at ${memoryDir}`,
        "Use memory_list to see the full index",
        "Use memory_recall with relevant keywords to retrieve specific memories",
        "Use session_checkpoint to save current work state",
        "The session notes file is the authoritative source for current work context",
        "",
      ].join("\n"),
    )
  }
}
