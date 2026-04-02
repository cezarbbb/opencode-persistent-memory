import type { PluginInput, Hooks } from "@opencode-ai/plugin"
import { resolveMemoryDir, ensureMemoryDir } from "./core/constants.js"
import { MessageBuffer } from "./extraction/messageBuffer.js"
import { createCompactingHook } from "./hooks/compactingHook.js"
import { createEventRouter, createSystemTransformHook } from "./hooks/eventRouter.js"
import { createSaveTool } from "./tools/save.js"
import { createRecallTool } from "./tools/recall.js"
import { createSearchTool } from "./tools/search.js"
import { createListTool } from "./tools/list.js"
import { createDeleteTool } from "./tools/delete.js"
import { createCheckpointTool } from "./tools/checkpoint.js"

export const PersistentMemoryPlugin = async ({
  project,
  directory,
  client,
}: PluginInput) => {
  const memoryDir = resolveMemoryDir(directory, project)
  await ensureMemoryDir(memoryDir)

  const buffer = new MessageBuffer()
  const sideCall = buildSideCall(client)
  const eventHandler = createEventRouter(memoryDir, buffer, sideCall)

  const hooks: Hooks = {
    "experimental.session.compacting": createCompactingHook(memoryDir),
    "experimental.chat.system.transform": createSystemTransformHook(memoryDir),
    event: eventHandler,
    tool: {
      memory_save: createSaveTool(memoryDir),
      memory_recall: createRecallTool(memoryDir),
      memory_search: createSearchTool(memoryDir),
      memory_list: createListTool(memoryDir),
      memory_delete: createDeleteTool(memoryDir),
      session_checkpoint: createCheckpointTool(memoryDir),
    },
  }

  return hooks
}

function buildSideCall(
  client: PluginInput["client"],
): ((system: string, user: string) => Promise<string>) | null {
  const c = client as unknown as Record<string, unknown>
  const chat = c["chat"] as Record<string, unknown> | undefined
  if (!chat || typeof chat !== "object") return null

  const create = chat["create"] as ((...args: unknown[]) => Promise<unknown>) | undefined
  if (typeof create !== "function") return null

  return async (system: string, user: string): Promise<string> => {
    try {
      const response = await create({
        body: {
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          max_tokens: 1024,
        },
      })

      if (!response) return ""
      if (typeof response === "string") return response

      if (typeof response === "object") {
        const body = (response as Record<string, unknown>).body
        if (typeof body === "string") return body
        if (body && typeof body === "object") {
          const content = (body as Record<string, unknown>).content
          if (typeof content === "string") return content
          const choices = (body as Record<string, unknown>).choices
          if (Array.isArray(choices) && choices.length > 0) {
            const msg = choices[0]?.message
            if (msg && typeof msg === "object") {
              const text = (msg as Record<string, unknown>).content
              return typeof text === "string" ? text : ""
            }
            return typeof msg === "string" ? msg : ""
          }
        }
      }
      return ""
    } catch {
      return ""
    }
  }
}
