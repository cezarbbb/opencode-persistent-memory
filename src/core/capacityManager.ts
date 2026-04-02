import { existsSync, statSync } from "fs"
import { CAPACITY, DAY_MS } from "./constants.js"
import { scanMemoryFiles } from "./memoryScan.js"

export type CapacityStatus = {
  fileCount: number
  atLimit: boolean
  indexBytes: number
  indexAtLimit: boolean
  staleCount: number
}

export function checkCapacity(memoryDir: string): CapacityStatus {
  const files = scanMemoryFiles(memoryDir)
  const indexPath = `${memoryDir}/MEMORY.md`
  let indexBytes = 0
  try {
    if (existsSync(indexPath)) {
      indexBytes = statSync(indexPath).size
    }
  } catch {
    // ignore
  }

  const staleCount = files.filter(
    (f) => Date.now() - f.mtimeMs > CAPACITY.STALE_THRESHOLD_DAYS * DAY_MS,
  ).length

  return {
    fileCount: files.length,
    atLimit: files.length >= CAPACITY.MAX_MEMORY_FILES,
    indexBytes,
    indexAtLimit: indexBytes >= CAPACITY.MAX_ENTRYPOINT_BYTES,
    staleCount,
  }
}
