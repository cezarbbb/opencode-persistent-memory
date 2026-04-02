export type Frontmatter = {
  name: string
  description: string
  type: string
  created: string
  updated: string
  [key: string]: unknown
}

export function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const trimmed = content.trim()
  if (!trimmed.startsWith("---")) {
    return { frontmatter: emptyFrontmatter(), body: trimmed }
  }

  const endMatch = trimmed.indexOf("---", 3)
  if (endMatch === -1) {
    return { frontmatter: emptyFrontmatter(), body: trimmed }
  }

  const fmText = trimmed.slice(3, endMatch).trim()
  const body = trimmed.slice(endMatch + 3).trim()

  const fm: Record<string, string> = {}
  for (const line of fmText.split("\n")) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim()
    fm[key] = val
  }

  return {
    frontmatter: {
      name: fm.name || "",
      description: fm.description || "",
      type: fm.type || "",
      created: fm.created || "",
      updated: fm.updated || "",
      ...fm,
    },
    body,
  }
}

export function serializeFrontmatter(fm: Frontmatter, body: string): string {
  const lines = [
    "---",
    `name: ${fm.name}`,
    `description: ${fm.description}`,
    `type: ${fm.type}`,
    `created: ${fm.created}`,
    `updated: ${fm.updated}`,
  ]

  for (const [key, value] of Object.entries(fm)) {
    if (["name", "description", "type", "created", "updated"].includes(key)) continue
    lines.push(`${key}: ${value}`)
  }

  lines.push("---", "", body)
  return lines.join("\n")
}

export function createFrontmatter(
  name: string,
  description: string,
  type: string,
): Frontmatter {
  const today = new Date().toISOString().split("T")[0]
  return {
    name,
    description,
    type,
    created: today,
    updated: today,
  }
}

function emptyFrontmatter(): Frontmatter {
  return {
    name: "",
    description: "",
    type: "",
    created: "",
    updated: "",
  }
}
