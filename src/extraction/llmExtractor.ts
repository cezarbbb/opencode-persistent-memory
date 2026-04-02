import { type MemoryType } from "../core/constants.js"
import { formatMemoryManifest, scanMemoryFiles } from "../core/memoryScan.js"
import type { BufferedMessage } from "./messageBuffer.js"
import { saveMemory } from "../core/memoryStore.js"

const EXTRACTION_SYSTEM_PROMPT = `You are a memory extraction agent. Analyze the conversation messages below and extract information worth remembering for future sessions.

You have access to existing memory files. Check the list before creating duplicates — update an existing file rather than creating a new one when the topic overlaps.

Return a JSON object with a "memories" array. Each entry has:
- name: kebab-case identifier (e.g., "user-role", "testing-style")
- type: one of "user", "feedback", "project", "reference"
- description: one-line summary used to decide relevance in future sessions
- content: the memory body. For feedback/project types, include **Why:** and **How to apply:** lines

Types:
- user: User's role, expertise, preferences, communication style
- feedback: Corrections, validated approaches, behavior guidance (what to do/avoid)
- project: Ongoing work context, decisions, deadlines (not derivable from code)
- reference: External systems, dashboards, issue trackers

What NOT to save:
- Code patterns, conventions, file paths (derivable from code)
- Git history (derivable from git)
- Debugging solutions (the fix is in the code)
- Ephemeral task details

Be selective. Only extract information that is genuinely surprising, non-obvious, or explicitly requested. If nothing is worth saving, return {"memories": []}.`

const EXTRACTION_USER_TEMPLATE = `## Recent conversation messages (last ~{count})

{messages}

## Existing memory files

{manifest}

Extract memories from the messages above. Return JSON only.`

export type LLMExtractionResult = {
  memories: Array<{
    name: string
    type: MemoryType
    description: string
    content: string
  }>
}

export async function extractWithLLM(
  messages: BufferedMessage[],
  memoryDir: string,
  sideCall: (system: string, user: string) => Promise<string>,
): Promise<number> {
  const manifest = formatMemoryManifest(scanMemoryFiles(memoryDir))

  const messageText = messages
    .map((m) => `[${m.role}]: ${m.content}`)
    .join("\n\n")
    .slice(0, 8000)

  const userPrompt = EXTRACTION_USER_TEMPLATE
    .replace("{count}", String(messages.length))
    .replace("{messages}", messageText)
    .replace("{manifest}", manifest || "(empty)")

  try {
    const raw = await sideCall(EXTRACTION_SYSTEM_PROMPT, userPrompt)
    const parsed = parseExtractionResult(raw)

    let saved = 0
    for (const memory of parsed.memories) {
      const result = saveMemory(memoryDir, {
        name: memory.name,
        type: memory.type,
        description: memory.description,
        content: memory.content,
      })
      if (result.ok) saved++
    }
    return saved
  } catch {
    return 0
  }
}

function parseExtractionResult(raw: string): LLMExtractionResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { memories: [] }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.memories || !Array.isArray(parsed.memories)) return { memories: [] }

    return {
      memories: parsed.memories.filter(
        (m: Record<string, unknown>) =>
          typeof m.name === "string" &&
          typeof m.description === "string" &&
          typeof m.content === "string" &&
          ["user", "feedback", "project", "reference"].includes(m.type as string),
      ),
    }
  } catch {
    return { memories: [] }
  }
}
