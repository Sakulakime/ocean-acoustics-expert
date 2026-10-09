# 06: `doctor` and README

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** Two things. First, a `doctor` command that diagnoses any installation in one step and reports problems without fixing them. Second, a README that lets a colleague install and use the expert without the author. This closes the installer for people other than the author.

**Blocked by:** 04, 05

**Status:** done

- [x] `doctor` checks:
  - [x] every path-map entry exists
  - [x] each installed harness file parses and points at the installed copy
  - [x] skill symlinks resolve
  - [x] every book PDF a note points at exists in the installed copy (missing ones listed)
  - [x] duplicate skill names visible to OpenCode
- [x] `doctor` exits non-zero with a specific message for each failure class, each covered by a fake-home fixture test; it never modifies files
- [x] README covers:
  - [x] what the expert is
  - [x] supported harnesses
  - [x] pinned-tag `npx github:` install
  - [x] link vs copy mode
  - [x] path overrides
  - [x] `status` / `doctor` / `check` / `uninstall`
  - [x] the bundled-books policy: the package carries five copyrighted book PDFs, so the repository must stay private (ADR 0005)
- [x] Nothing pushed, tagged or published

## Comments

**Done (2026-10-10), commits `31f1c31` and `5535ab5`.** `doctor` takes no options. It prints `OK`, `WARN` or `FAIL` lines and a summary, and exits 1 when it finds a problem. `test/doctor.test.js` holds 37 subprocess tests against fake homes, and each run asserts that doctor changed no file in the home or the package (contents and mtimes). The full suite has 146 tests.

**The checks, in order:**
1. **Local path map.** It parses `local-paths.yaml`, and every entry that is set must exist. An unset toolbox (`at_2023`, `at_2020`) is only a `WARN` with the `--at-*` flag that sets it, because install allows it and the expert works without it.
2. **Symbolic links.** Each link the manifest lists must still be that link, pointing at the recorded target, and must resolve. In link mode that means the installed copy and the MATLAB helpers; Claude's skill links are checked in every mode.
3. **Agents.** Each installed harness's agent file must parse:
   - Claude and OpenCode: YAML frontmatter with `name`/`description`, or `description` alone for OpenCode;
   - Codex: a TOML file with `name`, `description` and `developer_instructions`.

   Its instructions must name the installed hub and no absolute path outside the data folder. OpenCode's `permission.external_directory` must allow `<data>/**`. Each harness adapter now has `agentPath` and `inspectAgent`. Doctor looks for agents where the harness reads them now (current `CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `XDG_CONFIG_HOME`), not where the manifest says install put them.
4. **Shared skills.** The router's `SKILL.md` is checked the same way.
5. **Book PDFs.** Every `sources/…pdf` that a note or data file points at must exist in the installed copy. Each missing PDF is listed with up to five `file:line` places and a count of the rest. On this machine the notes point at one PDF, COA. The other four books have no notes yet (ticket 12).
6. **OpenCode skills** (only when OpenCode is installed). It searches the folders OpenCode 1.16.2 searches outside a project (read from the binary):
   - `~/.claude/skills` and `~/.agents/skills`, with hidden folders;
   - `skill/` and `skills/` in `~/.config/opencode` and `~/.opencode`, without hidden folders.

   Skills are keyed by frontmatter `name`, as OpenCode keys them. If the expert's router appears more than once but always through links to one folder, that is an `OK` line ("duplicate-name warning is harmless"). If it appears in different folders, that is a `FAIL`: OpenCode loads only one, in no fixed order.

**Decisions.**
- **Duplicates are checked only for the expert's own skills.** On this machine OpenCode also sees about 50 other skill names in several different folders (Claude Scholar copies). Those are not this package's concern, and reporting them would bury the one that is.
- **A small TOML reader** (`parseToml` in `src/toml.js`). Without dependencies, this is the only way to tell whether the Codex file parses. It reads top-level `key = value` pairs:
  - all four string kinds, booleans and decimal integers;
  - tables, arrays, floats, dates and dotted keys raise an error.

  Files outside the YAML or TOML subset are reported as "doctor cannot parse", not as invalid. The harness may still load them, and reinstalling rewrites them.
- **System-call failures don't stop the run.** One that a check does not expect, such as a folder doctor may not read, is reported as `<check>: could not finish: …`, and the other checks still run.

**Known limits.**
- Path-map values are read with the package's YAML subset, which strips quotes without unescaping, so a path containing `"` or `\` would be reported as missing.
- Two kinds of skill location are not searched:
  - Project-level skill folders, which OpenCode finds by walking up from its working directory.
  - `skills.paths` in `opencode.json`.
- The `OPENCODE_DISABLE_*` skill variables are not modelled.

**Real machine.** `doctor` against the three-harness link-mode install reports no problems (exit 0). The router shows as one folder seen twice.

**Review.** The two-axis review found that:
- a link replaced by a real folder passed;
- one unexpected error stopped all later checks;
- URLs and closing tags counted as paths;
- valid but unsupported YAML/TOML was labelled invalid;
- several messages had no test;
- the README claimed the expert reads all five books.

All are fixed in `5535ab5`, and mutation checks confirm the tests catch each fix.

**README.** It uses `<owner>` and the tag `v0.1.0` as placeholders. There is no remote or tag yet, and creating them waits for the user's approval (story 47).
