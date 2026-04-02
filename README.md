# opencode-persistent-memory

OpenCode plugin that adds persistent memory surviving context compaction and cross sessions. Designed for users with limited context windows.

## Prerequisites

- [Bun](https://bun.sh/) runtime (required — OpenCode uses Bun to load TypeScript plugins)

## Install

### Step 1: Install the plugin package

Clone this repo and install globally:

```bash
git clone https://github.com/your-repo/opencode-persistent-memory.git
cd opencode-persistent-memory
npm install -g .
```

### Step 2: Register in OpenCode config

Add the plugin to your `opencode.json` (located at `~/.config/opencode/opencode.json`):

```json
{
  "plugin": ["opencode-persistent-memory"]
}
```

### Step 3: Link the plugin into OpenCode's cache

OpenCode loads plugins from its cache directory (`~/.cache/opencode/node_modules/`). Create a junction/symlink there:

**Windows (PowerShell, as Administrator):**

```powershell
New-Item -ItemType Junction -Path "$HOME\.cache\opencode\node_modules\opencode-persistent-memory" -Target "C:\path\to\opencode-persistent-memory"
```

**macOS / Linux:**

```bash
ln -s /path/to/opencode-persistent-memory ~/.cache/opencode/node_modules/opencode-persistent-memory
```

### Step 4: Restart OpenCode

```bash
opencode
```

After restart, verify the plugin is loaded by checking for the memory directory:

```bash
ls ~/.local/share/opencode/memory/
```

You should see `MEMORY.md` and type subdirectories (`user/`, `feedback/`, `project/`, `reference/`, `.session/`).

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Plugin not loading | Bun not installed | Install Bun: `npm install -g bun` |
| `404 failed to install plugin` in logs | Package not on npm registry | Create symlink in `~/.cache/opencode/node_modules/` (see Step 3) |
| No memory directory created | Plugin not loaded by OpenCode | Check logs with `opencode debug config --print-logs` |

## How It Works

### Three Layers of Memory Persistence

| Layer | Mechanism | Trigger | Needs API Key |
|-------|-----------|---------|--------------|
| **Layer 1** | Model calls `memory_save` actively | Model decides | No |
| **Layer 2** | `experimental.session.compacting` hook injects notes into compaction context | Context compaction | No |
| **Layer 3** | Automatic extraction from conversation (heuristic or LLM) | `session.idle` | Optional |

### Memory Types

- **user** — Role, expertise, preferences, communication style
- **feedback** — Corrections, validated approaches, behavior guidance
- **project** — Ongoing work context, decisions, deadlines
- **reference** — External systems, dashboards, issue trackers

### Storage

```
~/.local/share/opencode/memory/<project-slug>/
├── MEMORY.md              # Index (auto-maintained, ≤200 lines/25KB)
├── user/                  # User profile memories
├── feedback/              # Behavioral guidance
├── project/               # Project context
├── reference/             # External references
└── .session/
    └── notes.md           # Structured session notes (survives compaction)
```

### Freshness Tracking

| Marker | Age | Meaning |
|--------|-----|---------|
| ✓ | < 1 day | Fresh |
| ○ | < 7 days | Recent |
| ⚠ | < 30 days | Aging — verify before use |
| ⚑ | < 90 days | Old — trust code over memory |
| ✗ | > 90 days | Stale — historical only |

## Tools

| Tool | Description |
|------|-------------|
| `memory_save` | Save a persistent memory |
| `memory_recall` | Search memories by keywords/type |
| `memory_search` | Full-text search across all memories |
| `memory_list` | List all memories with freshness status |
| `memory_delete` | Delete an outdated memory |
| `session_checkpoint` | Save session state (survives compaction) |

## Hooks

| Hook | Purpose |
|------|---------|
| `experimental.session.compacting` | Injects memory index + session notes into compaction context |
| `experimental.chat.system.transform` | Injects memory availability hint into system prompt each LLM turn |
| `event` (session.created) | Initializes memory directory |
| `event` (session.idle) | Triggers automatic memory extraction |
| `event` (message.updated) | Tracks messages for extraction buffer |

## AGENTS.md Integration

Add this to your `AGENTS.md` to guide the model:

```markdown
## Persistent Memory System

You have a persistent memory system. Memories survive context compaction and persist across sessions.

### When to Save
- User corrects your approach → save as `feedback` (include **Why:** and **How to apply:**)
- User confirms a non-obvious approach worked → save as `feedback`
- You learn about user's role/expertise → save as `user`
- You learn project context not in code/git → save as `project`
- User says "remember this" → save immediately

### When to Recall
- User references past work → `memory_recall`
- After compaction → `memory_list` to reorient
- Starting complex work → `memory_recall` related context

### Before Compaction
Call `session_checkpoint` with current task, files, decisions, next steps.
```

## Compatibility

Memory file format is compatible with Claude Code's auto-memory system:
- Same frontmatter schema (`name`, `description`, `type`, `created`, `updated`)
- Same 4-type taxonomy (`user`, `feedback`, `project`, `reference`)
- Same `MEMORY.md` index convention

Note: storage paths differ between tools. Use `pathMapping` in config if you need cross-tool interoperability.

## License

MIT
