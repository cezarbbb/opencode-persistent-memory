import { CAPACITY } from "../core/constants.js"
import { scanMemoryFiles } from "../core/memoryScan.js"
import { heuristicExtract } from "../extraction/heuristicExtractor.js"
import { extractWithLLM } from "../extraction/llmExtractor.js"
import { saveMemory } from "../core/memoryStore.js"
import type { MessageBuffer } from "../extraction/messageBuffer.js"

type EventMap = Record<string, Array<(data: unknown) => void | Promise<void>>>

export function createEventRouter(
  memoryDir: string,
  buffer: MessageBuffer,
  sideCall: ((system: string, user: string) => Promise<string>) | null,
) {
  let lastExtraction = 0
  let extractionInProgress = false

  const handlers: EventMap = {}

  function on(event: string, handler: (data: unknown) => void | Promise<void>) {
    if (!handlers[event]) handlers[event] = []
    handlers[event].push(handler)
  }

  on("session.created", async () => {
    const { ensureMemoryDir } = await import("../core/constants.js")
    await ensureMemoryDir(memoryDir)
  })

  on("session.idle", async () => {
    if (extractionInProgress) return
    if (buffer.size < CAPACITY.MIN_MESSAGES_FOR_EXTRACT) return
    if (Date.now() - lastExtraction < CAPACITY.MIN_EXTRACT_INTERVAL_MS) return

    extractionInProgress = true
    try {
      const messages = buffer.drain()

      if (sideCall) {
        await extractWithLLM(messages, memoryDir, sideCall)
      } else {
        const candidates = heuristicExtract(messages, memoryDir)
        for (const candidate of candidates) {
          saveMemory(memoryDir, {
            name: generateName(candidate.content, candidate.source),
            type: candidate.type,
            description: candidate.content.slice(0, 120),
            content: candidate.content,
          })
        }
      }

      lastExtraction = Date.now()
    } catch {
      // best-effort
    } finally {
      extractionInProgress = false
    }
  })

  on("message.updated", (data: unknown) => {
    if (!data || typeof data !== "object") return
    const msg = data as Record<string, unknown>
    const content = extractTextContent(msg)
    if (!content) return

    buffer.push({
      role: typeof msg.role === "string" ? msg.role : "unknown",
      content,
      timestamp: Date.now(),
    })
  })

  return async ({ event }: { event: { type: string; data?: unknown } }) => {
    const { type, data } = event
    const eventHandlers = handlers[type]
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        await handler(data)
      }
    }
  }
}

export function createSystemTransformHook(memoryDir: string) {
  let lastCheck = 0
  let cachedHint = ""

  return async (_input: unknown, output: { system: string[] }) => {
    const now = Date.now()
    if (now - lastCheck > 60_000 || !cachedHint) {
      lastCheck = now
      const files = scanMemoryFiles(memoryDir)
      if (files.length === 0) return

      const freshCount = files.filter(
        (f) => Date.now() - f.mtimeMs < 7 * 86_400_000,
      ).length

      if (freshCount > 0) {
        const types = [...new Set(files.map((f) => f.type).filter(Boolean))]
        cachedHint =
          `[Memory: ${files.length} memories available (${types.join(", ")}). ` +
          `Use memory_list to browse or memory_recall to search.]`
      } else {
        cachedHint =
          `[Memory: ${files.length} memories available. Use memory_list to browse.]`
      }
    }

    if (cachedHint) {
      output.system.push(cachedHint)
    }
  }
}

function extractTextContent(msg: Record<string, unknown>): string | null {
  if (typeof msg.content === "string") return msg.content
  if (Array.isArray(msg.content)) {
    return msg.content
      .filter((b: Record<string, unknown>) => b.type === "text" && typeof b.text === "string")
      .map((b: Record<string, unknown>) => b.text as string)
      .join(" ")
  }
  return null
}

function generateName(content: string, source: string): string {
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)

  return [source, ...words].join("-").slice(0, 40)
}
