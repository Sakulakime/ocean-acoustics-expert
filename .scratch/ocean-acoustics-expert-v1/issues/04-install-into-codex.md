# 04: Install into Codex

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADR 0003)

**What to build:** `install --harness codex` gives Codex a working, read-only expert. The Codex adapter renders a native agent TOML from the same template. Codex picks up the router from the shared skills folder, with no separate copy. The broken Codex agent (created by Codex's `/import`, pointing at `~/.Codex/…`) and the stale May snapshot in Codex's skills folder are cleaned up with backup.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Rendered TOML has `name`, `description`, `developer_instructions` and `sandbox_mode = "read-only"`, and parses as valid TOML (subprocess test with fake home)
- [ ] `developer_instructions` carries the same retrieval and answer rules as the Claude agent, with absolute paths to the installed copy
- [ ] Legacy cleanup with backup: the broken Codex agent TOML and the stale Codex skills snapshot of the expert
- [ ] Manifest, dry-run, idempotency and `uninstall --restore` cover the Codex files
- [ ] Real install on this machine; smoke in Codex: a COA theory question is answered from the installed copy under the read-only sandbox
