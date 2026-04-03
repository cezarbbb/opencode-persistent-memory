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

> **Note:** The field name is `plugin` (singular), NOT `plugins`. Using `plugins` will cause OpenCode to fail to start.

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
| OpenCode fails to start after adding config | Config field name typo (`plugins` instead of `plugin`) | Make sure the field is `plugin` (singular) in `opencode.json` |
| Auto-extraction not triggering | Not enough messages buffered | Need ≥ 6 messages before `session.idle` fires. Stop interacting for ~30s to trigger idle |
| Auto-extraction triggers but 0 candidates | Message too short or no pattern match | Messages like "111" won't match. Use natural language with keywords like "remember", "不对", etc. |

## Debug Mode

Set the `OPENCODE_MEMORY_DEBUG` environment variable to enable debug logging:

```bash
OPENCODE_MEMORY_DEBUG=1 opencode
```

On Windows (PowerShell):

```powershell
$env:OPENCODE_MEMORY_DEBUG = "1"; opencode
```

Debug logs are written to `~/.local/share/opencode/memory/debug-events.log` and include:

- All received event types
- Message buffering (role, length, buffer size)
- Role mapping (messageID → user/assistant)
- Extraction lifecycle (idle triggers, candidates found, saves)
- Errors in event handlers

To view live logs:

```bash
tail -f ~/.local/share/opencode/memory/debug-events.log
```

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

## Auto-Extraction Patterns

Layer 3 uses heuristic pattern matching to detect extractable content in user messages. Supports both English and Chinese:

| Category | English Examples | Chinese Examples |
|----------|-----------------|------------------|
| **Correction** | "don't use X", "wrong approach", "use Y instead" | "不对", "别用", "请用X代替" |
| **Explicit** | "remember that", "don't forget", "note that" | "请记住", "记住这个", "别忘了" |
| **Profile** | "I'm a senior engineer", "my team uses K8s" | "我是工程师", "我擅长", "我们团队用" |
| **Confirmation** | "yes exactly", "good job", "that's right" | "没错", "做得好", "这个方法很好" |

Messages are buffered via `message.part.updated` events and extracted when `session.idle` fires with ≥ 6 buffered messages. Role inference uses `message.updated` events to build a messageID → role mapping.

## Hooks

| Hook | Purpose |
|------|---------|
| `experimental.session.compacting` | Injects memory index + session notes into compaction context |
| `experimental.chat.system.transform` | Injects memory availability hint into system prompt each LLM turn |
| `event` (session.created) | Initializes memory directory |
| `event` (session.idle) | Triggers automatic memory extraction (when buffer ≥ 6) |
| `event` (message.updated) | Builds messageID → role mapping for extraction |
| `event` (message.part.updated) | Buffers TextPart content for extraction |

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
