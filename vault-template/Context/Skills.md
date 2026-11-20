# Skills & Token Tips
← [[Context/Context]]

---

## Skill Discovery

Claude Code can discover and install skills on demand. If a task might have a skill available, check before improvising a one-off script.

## Common Built-in Skills

| Skill | What it does |
|-------|-------------|
| `update-config` | Edit settings.json (hooks, permissions, env vars) |
| `diagnose-blocked-tooling` | Diagnose why a tool/MCP/network call fails in-session but works in a normal terminal |
| `nlm-skill` | Gemini Notebook / NotebookLM via the `nlm` CLI |
| `keybindings-help` | Customize keyboard shortcuts |
| `simplify` | Review changed code for quality |
| `fewer-permission-prompts` | Scan transcripts, add an allowlist to reduce prompts |
| `loop` | Run a prompt/command on a recurring interval |
| `schedule` | Schedule recurring or one-time agents |
| `claude-api` | Build/debug Claude API apps, prompt caching, SDK usage |
| `init` | Initialize a new CLAUDE.md |
| `code-review` | Review a diff or pull request |
| `security-review` | Security review of branch changes |

Exact availability depends on what's installed/configured in this Claude Code setup — check the live skill list rather than assuming this one is current.

---

## Token-Saving Practices

- **Plan before action** — present plan, wait for approval before multi-step tasks
- **No filler** — no openers, no trailing summaries
- **Memory-first** — read the vault at session start, don't re-fetch what's already known
- **Batch tool calls** — run independent lookups in parallel
- **Don't re-read after edits** — trust Edit/Write success
- **Skip plans for simple tasks** — single-step reads/lookups don't need approval
