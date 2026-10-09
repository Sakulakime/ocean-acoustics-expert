# One self-written npx installer generates every harness's files from one template

The package ships a zero-dependency Node CLI, run via `npx`, that renders the expert agent for each harness (Claude Code `.md`, Codex `.toml`, OpenCode `.md`) from a single template through per-harness adapters. Three alternatives were rejected:

- **The `skills` CLI** (`npx skills add`), which the user already runs for 41 skills. It installs skill folders only, not subagents or out-of-skill data, and it is interactive with telemetry on by default.
- **A Claude Code plugin marketplace**, which reaches only one harness.
- **Hand-ported per-harness branches or string-rewriting importers**, as Claude Scholar and Codex's `/import` do. That `/import` replaced every "claude" with "Codex" and left the Codex copy of this agent pointing at a nonexistent `~/.Codex/knowledge/` path.

## Consequences

- Tool restrictions do not translate one-to-one. Claude gets `tools: [Read, Grep, Glob]`. Codex has no per-tool allowlist and gets `sandbox_mode = "read-only"`. OpenCode ignores a Claude-style `tools` array and gets a `permission` block (edit/bash/webfetch denied, `external_directory` allowed for the knowledge base and source paths).
- Skills follow the `skills` CLI layout the machine already uses. The canonical copy lives in `~/.agents/skills/<name>`, and `~/.claude/skills/<name>` is a symlink to it. OpenCode and Codex read `~/.agents/skills` directly.
