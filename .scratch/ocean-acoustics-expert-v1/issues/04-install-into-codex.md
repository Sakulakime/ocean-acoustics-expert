# 04: Install into Codex

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADR 0003)

**What to build:** `install --harness codex` gives Codex a working, read-only expert. The Codex adapter renders a native agent TOML from the same template. Codex picks up the router from the shared skills folder, with no separate copy. The broken Codex agent (created by Codex's `/import`, pointing at `~/.Codex/…`) and the stale May snapshot in Codex's skills folder are cleaned up with backup.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Rendered TOML has `name`, `description`, `developer_instructions` and `sandbox_mode = "read-only"`, and parses as valid TOML (subprocess test with fake home)
- [x] `developer_instructions` carries the same retrieval and answer rules as the Claude agent, with absolute paths to the installed copy
- [x] Legacy cleanup with backup: the broken Codex agent TOML and the stale Codex skills snapshot of the expert
- [x] Manifest, dry-run, idempotency and `uninstall --restore` cover the Codex files
- [ ] Real install on this machine; smoke in Codex: a COA theory question is answered from the installed copy under the read-only sandbox

## Comments

**Codex adapter implemented on branch `ticket-04-codex`; the real install and the smoke test wait for the user's go-ahead.** 16 new subprocess tests in `test/install-codex.test.js`; the full suite has 93 tests, and `check` passes. Decisions and deviations:

- **Config folder.** `codexDir` is `$CODEX_HOME` when it is an absolute path, else `~/.codex`, the same rule as `CLAUDE_CONFIG_DIR`. Codex counts as present when that folder exists.
- **Agent file.** `<codexDir>/agents/ocean-acoustics-expert.toml` is rendered from the same template as the Claude agent:
  - The keys are `name`, `description`, `sandbox_mode = "read-only"` and `developer_instructions`, after a one-line comment saying install wrote the file.
  - `developer_instructions` is the template body rendered by `renderPlaceholders`. A test asserts it equals the Claude agent's body, so both harnesses get the same rules.
  - The layout follows the existing files in `~/.codex/agents/`: top-level `key = value` lines and a multi-line string for the instructions.
- **TOML strings (`src/toml.js`).**
  - Single-line values are basic strings with TOML escapes.
  - The instructions are a multi-line literal string (`'''`), which keeps backslashes verbatim. Text a literal string cannot hold falls back to a multi-line basic string (`"""`) with every `\`, `"` and control character escaped. That text is anything containing `'''`, ending in `'`, or holding a control character other than tab and line feed (CR included, so CRLF survives exactly).
  - Tests parse the output with Python's `tomllib` and check an exact round trip for both forms. Mutating either form makes them fail.
- **Skills.** Codex gets no skill entry, because it reads the router from `~/.agents/skills`.
- **Legacy cleanup.**
  - The `/import` agent TOML sits at the rendered file's own path, so it is backed up and replaced like any foreign file.
  - The May snapshot `<codexDir>/skills/ocean-acoustics-expert` is an `absent` unit: backed up, removed, and not owned by the manifest.
  - Neighbouring agents, skills (`.system` included) and `config.toml` are untouched.
- **Checked against Codex 0.162.0 without a prompt.**
  - `codex doctor --all` with `HOME` and `CODEX_HOME` pointed at a throwaway install reports no agent-role startup warning for the rendered file. A role with a blank `description` does produce one.
  - Doctor accepts an unknown key and an invalid `sandbox_mode` value without a warning too, so it shows only that the required fields load.
  - `codex debug prompt-input` lists the router from the shared skills folder.
- **Real install.** The current manifest records `harnesses: ["claude"]`. `install` without `--harness` reuses that list, so the real install needs explicit flags: `--harness claude --harness codex`, plus `--harness opencode` once ticket 05 is merged. Run the dry run from the main checkout. It should show backup and remove for `~/.codex/skills/ocean-acoustics-expert`, and backup, remove and write for `~/.codex/agents/ocean-acoustics-expert.toml`.
