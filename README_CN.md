# opencode-persistent-memory

OpenCode 持久化记忆插件 — 上下文压缩后记忆不丢失，跨会话持续存在。为上下文窗口有限的用户设计。

## 前置条件

- [Bun](https://bun.sh/) 运行时（必须 — OpenCode 使用 Bun 加载 TypeScript 插件）

## 安装

### 第 1 步：安装插件包

克隆仓库并全局安装：

```bash
git clone https://github.com/your-repo/opencode-persistent-memory.git
cd opencode-persistent-memory
npm install -g .
```

### 第 2 步：在 OpenCode 配置中注册

将插件添加到 `opencode.json`（位于 `~/.config/opencode/opencode.json`）：

```json
{
  "plugin": ["opencode-persistent-memory"]
}
```

> **注意：** 字段名是 `plugin`（单数），不是 `plugins`。写成 `plugins` 会导致 OpenCode 无法启动。

### 第 3 步：将插件链接到 OpenCode 缓存目录

OpenCode 从缓存目录（`~/.cache/opencode/node_modules/`）加载插件。在那里创建符号链接：

**Windows（PowerShell，需管理员权限）：**

```powershell
New-Item -ItemType Junction -Path "$HOME\.cache\opencode\node_modules\opencode-persistent-memory" -Target "C:\path\to\opencode-persistent-memory"
```

**macOS / Linux：**

```bash
ln -s /path/to/opencode-persistent-memory ~/.cache/opencode/node_modules/opencode-persistent-memory
```

### 第 4 步：重启 OpenCode

```bash
opencode
```

重启后，检查记忆目录验证插件是否加载成功：

```bash
ls ~/.local/share/opencode/memory/
```

应该能看到 `MEMORY.md` 和类型子目录（`user/`、`feedback/`、`project/`、`reference/`、`.session/`）。

## 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 插件未加载 | 未安装 Bun | 安装 Bun：`npm install -g bun` |
| 日志中出现 `404 failed to install plugin` | 包未发布到 npm 仓库 | 在 `~/.cache/opencode/node_modules/` 创建符号链接（见第 3 步） |
| 未创建记忆目录 | 插件未被 OpenCode 加载 | 使用 `opencode debug config --print-logs` 检查日志 |
| 添加配置后 OpenCode 无法启动 | 配置字段名写错（`plugins` 而非 `plugin`） | 确保字段名为 `plugin`（单数） |

## 工作原理

### 三层记忆持久化

| 层级 | 机制 | 触发时机 | 需要 API Key |
|------|------|----------|-------------|
| **Layer 1** | 模型主动调用 `memory_save` | 模型自行决定 | 否 |
| **Layer 2** | `experimental.session.compacting` hook 将记忆注入压缩上下文 | 上下文压缩时 | 否 |
| **Layer 3** | 自动从对话中提取记忆（启发式或 LLM） | `session.idle` | 可选 |

### 记忆类型

- **user** — 用户角色、专长、偏好、沟通风格
- **feedback** — 纠正、验证过的方法、行为指导
- **project** — 进行中的工作上下文、决策、截止日期
- **reference** — 外部系统、仪表盘、问题追踪器

### 存储结构

```
~/.local/share/opencode/memory/<project-slug>/
├── MEMORY.md              # 索引（自动维护，≤200行/25KB）
├── user/                  # 用户画像记忆
├── feedback/              # 行为指导
├── project/               # 项目上下文
├── reference/             # 外部引用
└── .session/
    └── notes.md           # 结构化会话笔记（压缩后存活）
```

### 新鲜度追踪

| 标记 | 时效 | 含义 |
|------|------|------|
| ✓ | < 1 天 | 新鲜 |
| ○ | < 7 天 | 近期 — 可直接参考 |
| ⚠ | < 30 天 | 老化 — 使用前需验证 |
| ⚑ | < 90 天 | 过旧 — 以代码为准 |
| ✗ | > 90 天 | 陈旧 — 仅作历史参考 |

## 工具列表

| 工具 | 说明 |
|------|------|
| `memory_save` | 保存一条持久化记忆 |
| `memory_recall` | 按关键词/类型搜索记忆 |
| `memory_search` | 全文搜索所有记忆文件 |
| `memory_list` | 列出所有记忆及新鲜度状态 |
| `memory_delete` | 删除过时的记忆 |
| `session_checkpoint` | 保存会话状态（压缩后存活） |

## Hooks

| Hook | 用途 |
|------|------|
| `experimental.session.compacting` | 压缩时注入记忆索引 + 会话笔记到压缩上下文 |
| `experimental.chat.system.transform` | 每轮 LLM 调用前注入记忆可用提示到系统提示 |
| `event` (session.created) | 初始化记忆目录 |
| `event` (session.idle) | 触发自动记忆提取 |
| `event` (message.updated) | 追踪消息到提取缓冲区 |

## AGENTS.md 集成

将以下内容添加到 `AGENTS.md` 引导模型使用记忆系统：

```markdown
## 持久化记忆系统

你拥有一个持久化记忆系统。记忆在上下文压缩后不会丢失，并跨会话持续存在。

### 何时保存
- 用户纠正你的做法 → 保存为 `feedback`（包含 **Why:** 和 **How to apply:**）
- 用户确认某个非显而易见的方法有效 → 保存为 `feedback`
- 你了解到用户的角色/专长 → 保存为 `user`
- 你了解到代码/git中没有的项目上下文 → 保存为 `project`
- 用户说"记住这个" → 立即保存

### 何时召回
- 用户引用过去的工作 → `memory_recall`
- 压缩发生后 → `memory_list` 重新定位
- 开始复杂工作前 → `memory_recall` 相关上下文

### 压缩前
调用 `session_checkpoint` 保存当前任务、文件、决策、下一步。
```

## 兼容性

记忆文件格式与 Claude Code 的 auto-memory 系统兼容：
- 相同的 frontmatter 结构（`name`、`description`、`type`、`created`、`updated`）
- 相同的 4 类型分类（`user`、`feedback`、`project`、`reference`）
- 相同的 `MEMORY.md` 索引约定

注意：不同工具的存储路径不同。如需跨工具互操作，请在配置中设置 `pathMapping`。

## 许可证

MIT
