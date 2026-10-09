# 05: Install into OpenCode

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADR 0003)

**What to build:** `install --harness opencode` gives OpenCode a working, read-only expert subagent. The adapter renders a native agent markdown file whose `permission` block enforces read-only use: edit, bash and webfetch are denied, and `external_directory` allows the installed copy (which holds the book PDFs) and the toolbox paths. OpenCode reads the router from the shared skills folder. Whether the Claude symlink makes the router appear twice is observed and handled.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Rendered agent has `mode: subagent` and a `permission` block (edit/bash/webfetch denied; `external_directory` allows the installed copy and toolbox paths); it does not rely on a `tools` array; frontmatter parses (subprocess test with fake home)
- [x] Manifest, dry-run, idempotency and `uninstall --restore` cover the OpenCode files
- [ ] Real install on this machine; smoke in OpenCode: a COA theory question is answered with no permission prompt for knowledge-base reads
- [x] Observed behaviour of the router being visible through both the Claude skills folder and the shared skills folder recorded in this ticket's comments; if it causes duplicate or conflicting skills, a mitigation is implemented and covered by a test

## Comments

**OpenCode adapter implemented on branch `ticket-05-opencode`; the real install and the smoke test wait for the user's go-ahead.** `install --harness opencode` writes `<config>/opencode/agents/ocean-acoustics-expert.md`. Ten new subprocess tests in `test/install-opencode.test.js` bring the full suite to 87. Decisions:

- **Config folder.** It is `$XDG_CONFIG_HOME/opencode` when `XDG_CONFIG_HOME` is set and absolute, else `~/.config/opencode` (`Locations.opencodeDir`). OpenCode counts as present when that folder exists. OpenCode itself takes `XDG_CONFIG_HOME` even when it is relative; this installer ignores a relative value, as the XDG spec says to.
- **Agent file.** The body is the harness-neutral template, rendered with `renderPlaceholders`. The frontmatter holds:
  - `description` (JSON-quoted);
  - `mode: subagent`;
  - `permission`, which denies `edit`, `bash`, `webfetch` and `websearch`. Denying `edit` also turns off write and patch. `websearch` is denied too, so that neither web tool is available, as for Claude's `[Read, Grep, Glob]`;
  - `external_directory`, which allows `"<dir>/**"` for each of these folders:
    - the data folder (installed copy, PDFs, MATLAB helpers, path map);
    - in link mode, the authoring copy's `knowledge/` and `tools/matlab/` (see below);
    - each toolbox tree that is set.

  There is no `tools`, `name`, `model` or `color`:
  - In 1.16.2, `tools` is a deprecated `{tool: boolean}` map, so a Claude-style array fails validation.
  - The agent's name comes from the file name.
  - With no model, the subagent uses the parent's model.
  - Claude's `cyan` is not a valid OpenCode colour, which must be a hex value or a theme name.
- **Skills.** OpenCode gets no skill entries of its own and reads the router from `~/.agents/skills`.
- **`src/yaml.js` now accepts quoted mapping keys** and strips their quotes, as it already did for values. The permission keys are quoted with `JSON.stringify`, so any path is valid YAML. No existing knowledge-base YAML file has quoted keys. The frontmatter was cross-checked once with PyYAML 6.0.3 and with OpenCode itself.
- **On this machine `~/.config/opencode` is a git repository** (commit `ab5795a`). The installed `agents/ocean-acoustics-expert.md` will show up there as an untracked file. The installer does not touch that repository's `.gitignore`.

**OpenCode 1.16.2 contract, verified against the installed binary.** Two sources: the embedded JS read with `strings` from `~/.opencode/bin/opencode`, and the `opencode debug skill|agent|paths` subcommands run with `--pure` against a throwaway fake `HOME` (`env -i`, no providers, no prompts).
- **Agents folder.** Agents are loaded from `{agent,agents}/**/*.md` under each config directory, so both names work. The name is the path without that prefix and without `.md`. The embedded `customize-opencode` docs show both folder names.
- **Frontmatter schema (`AgentConfig`).** `mode` is one of `subagent|primary|all`. Unknown keys go into `options`. The `permission` (`PermissionConfig`) values:
  - each value is `ask|allow|deny`, or an object `{pattern: action}`;
  - `todowrite`, `question`, `webfetch`, `websearch` and `doom_loop` accept only a flat action.
- **Rule evaluation.** The last matching rule wins (`findLast`). A pattern turns `*` into `.*`, so `*` also matches `/`. `~/` and `$HOME` are expanded.
- **External reads.** A read outside the project asks `external_directory` with the pattern `<dirname>/*`. The defaults are:
  - `external_directory "*": ask`;
  - allow for skill folders, `/tmp/opencode/*` and the tool-output folder.

  Agent rules are merged after the defaults, so our allow rules win. `opencode debug agent ocean-acoustics-expert` shows the merged ruleset with our rules last. In its tool list, `edit`, `write`, `bash` and `webfetch` are false and `read`, `grep` and `glob` are true.
- **Symbolic links.** A probe agent with `external_directory: {"*": deny, "<data>/**": allow}` was run with `debug agent --tool`:
  - `read`, `glob` and `grep` through the data folder were allowed, so read and glob match the literal path;
  - reading the checkout path directly was denied;
  - **grep reports its matches under the resolved checkout path** (`…/pkg/knowledge/…`).

  In link mode, the agent's next read of a grep hit would therefore prompt. That is why link mode also allows the link targets; the probe then allowed reading `pkg/knowledge/…` and still denied `pkg/package.json`. A test ties the extra entries to the installed copy's actual link targets. A newer "v2" tool path in the binary, which these runs did not exercise, resolves canonical paths in its location checks; these entries would cover it too.

**Duplicate router: observed, harmless, no mitigation needed.**
- **Discovery.** Unless `OPENCODE_DISABLE_EXTERNAL_SKILLS` or `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` is set, OpenCode scans `~/.claude` and `~/.agents` for `skills/**/SKILL.md`, and follows symlinks.
- **De-duplication.** Skills are stored in a map keyed by `name`. A second file with the same name logs `WARN … duplicate skill name` and replaces the first.
- **Observed.** After an install with both harnesses, `opencode debug skill` in the fake home listed `ocean-acoustics-router` once, plus the built-in `customize-opencode`. Its location was `~/.agents/skills/…`, and the log had exactly one duplicate warning, naming the `~/.claude/skills/…` path.
- **Why it is harmless.** The Claude entry is a symlink to the same folder, so the contents cannot conflict.
- **Mitigations not taken.** Each available one costs more than the log line it would remove:
  - the `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` environment variable would hide all of the user's Claude skills;
  - dropping the Claude symlink would break Claude.

  `doctor` (ticket 06) can report the duplicate as informational.

**For the real install and the smoke test.**
- **Pass the harnesses explicitly.** The existing manifest pins `harnesses: [claude]`, and a re-run without `--harness` keeps that list, so it will not add OpenCode. Run `install --harness claude --harness opencode` (plus `--harness codex` after ticket 04).
- **PDF fallbacks don't work in OpenCode yet.** OpenCode's `read` of a PDF ignores `offset` and `limit` and attaches the whole file: COA's 22.7 MB PDF became a 30.3 MB base64 attachment in the probe. Most providers will reject it. Pick a smoke question the notes can answer. Ticket 07 should decide how the OpenCode agent handles book fallbacks.
- **Subagent defaults.** When the task tool runs the expert, OpenCode denies it `task` and `todowrite`, because its permission block names neither.
