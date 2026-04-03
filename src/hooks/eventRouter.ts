import { appendFileSync } from "fs"
import { join } from "path"
import { CAPACITY } from "../core/constants.js"
import { scanMemoryFiles } from "../core/memoryScan.js"
import { heuristicExtract } from "../extraction/heuristicExtractor.js"
import { extractWithLLM } from "../extraction/llmExtractor.js"
import { saveMemory } from "../core/memoryStore.js"
import type { MessageBuffer } from "../extraction/messageBuffer.js"

const DEBUG = process.env.OPENCODE_MEMORY_DEBUG === "1"
const LOG_FILE = join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".local",
  "share",
  "opencode",
  "memory",
  "debug-events.log",
)

function log(tag: string, msg: string) {
  if (!DEBUG) return
  const ts = new Date().toISOString()
  const line = `[${ts}] [${tag}] ${msg}\n`
  try { appendFileSync(LOG_FILE, line) } catch { /* silent */ }
}

type EventMap = Record<string, Array<(properties: unknown) => void | Promise<void>>>

export function createEventRouter(
  memoryDir: string,
  buffer: MessageBuffer,
  sideCall: ((system: string, user: string) => Promise<string>) | null,
) {
  let lastExtraction = 0
  let extractionInProgress = false

  const handlers: EventMap = {}

  function on(event: string, handler: (properties: unknown) => void | Promise<void>) {
    if (!handlers[event]) handlers[event] = []
    handlers[event].push(handler)
  }

  on("session.created", async () => {
    const { ensureMemoryDir } = await import("../core/constants.js")
    await ensureMemoryDir(memoryDir)
  })

  on("session.idle", async () => {
    log("session.idle", `fired | buffer.size=${buffer.size}`)
    if (extractionInProgress) return
    if (buffer.size < CAPACITY.MIN_MESSAGES_FOR_EXTRACT) return
    if (Date.now() - lastExtraction < CAPACITY.MIN_EXTRACT_INTERVAL_MS) return

    extractionInProgress = true
    try {
      const messages = buffer.drain()
      log("session.idle", `drained ${messages.length} messages`)

      if (sideCall) {
        await extractWithLLM(messages, memoryDir, sideCall)
      } else {
        const candidates = heuristicExtract(messages, memoryDir)
        log("session.idle", `extracted ${candidates.length} candidates`)
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
    } catch (err) {
      log("session.idle", `ERROR: ${err}`)
    } finally {
      extractionInProgress = false
    }
  })

  const messageRoleMap = new Map<string, string>()

  on("message.updated", (properties: unknown) => {
    if (!properties || typeof properties !== "object") return
    const props = properties as Record<string, unknown>
    const info = props.info as Record<string, unknown> | undefined
    if (!info || typeof info !== "object") return
    const id = typeof info.id === "string" ? info.id : ""
    const role = typeof info.role === "string" ? info.role : ""
    if (id && role) {
      messageRoleMap.set(id, role)
      log("message.updated", `roleMap | id=${id} role=${role}`)
    }
  })

  on("message.part.updated", (properties: unknown) => {
    if (!properties || typeof properties !== "object") return
    const props = properties as Record<string, unknown>
    const part = props.part as Record<string, unknown> | undefined
    if (!part || typeof part !== "object") return
    if (part.type !== "text") return

    const text = typeof part.text === "string" ? part.text : ""
    if (!text) return

    const messageID = typeof part.messageID === "string" ? part.messageID : ""
    const role = messageRoleMap.get(messageID) || inferRoleFromPart(part)
    if (part.synthetic === true) return

    buffer.push({ role, content: text, timestamp: Date.now() })
    log("message.part.updated", `buffered | role=${role} | len=${text.length} | bufferSize=${buffer.size}`)
  })

  return async ({ event }: { event: { type: string; properties?: unknown } }) => {
    const { type, properties } = event
    log("eventRouter", `event: ${type}`)
    const eventHandlers = handlers[type]
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          await handler(properties)
        } catch (err) {
          log("eventRouter", `ERROR in ${type}: ${err}`)
        }
      }
    }
  }
}

function inferRoleFromPart(part: Record<string, unknown>): string {
  const text = (typeof part.text === "string" ? part.text : "").toLowerCase()
  if (text.startsWith("user:") || text.startsWith("human:")) return "user"
  if (text.startsWith("assistant:") || text.startsWith("ai:")) return "assistant"
  return "unknown"
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

function generateName(content: string, source: string): string {
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)

  return [source, ...words].join("-").slice(0, 40)
}
