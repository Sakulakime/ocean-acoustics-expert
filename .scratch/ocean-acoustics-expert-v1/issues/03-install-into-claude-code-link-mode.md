# 03: Install into Claude Code (tracer bullet for the installer)

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADRs 0003, 0004)

**What to build:** Running the CLI's `install` for Claude Code makes Claude use the expert from this project. The steps:

- Render the agent from one harness-neutral template through a Claude adapter.
- Generate the local path map and the MATLAB configuration.
- Install the knowledge base once into the per-user data directory: a link to the authoring copy in link mode, a copy in copy mode.
- Place the router skill canonically in the shared skills folder, with a Claude symlink to it.
- Record everything in a manifest.

Overwritten files are backed up first, and the known legacy copies are cleaned up with backup. `status`, `uninstall` and `--restore` complete the round trip. After the tests pass, the installer runs for real on this machine.

**Blocked by:** 02, 17

**Status:** ready-for-agent

- [x] Claude agent file rendered from the template: `tools: [Read, Grep, Glob]`, `model: inherit`, absolute path to the installed copy; no find-and-replace on existing files
- [x] Local path map written with detected defaults, each overridable by a flag
- [x] Link mode links the installed copy to the authoring copy and records the authoring root; link mode refuses when not run from a checkout
- [x] Copy mode copies the knowledge base and records no authoring root
- [x] Router skill canonical copy in the shared skills folder; Claude skills entry is a symlink to it
- [x] Every overwritten file backed up into a timestamped backup folder in the data directory; manifest lists every file, link and backup
- [x] Legacy cleanup with backup:
  - [x] the current Claude agent file
  - [x] the real-directory Claude router skill
  - [x] the Claude knowledge folder
  - [x] the broken router in the shared skills folder (`.Codex` paths)
  - [x] the superseded route-selection test and its fixture in the Claude hooks tests folder
- [x] `--dry-run` lists every write, link, backup and removal and changes nothing
- [x] Re-running install with nothing changed is a no-op
- [x] `status` prints version, mode, harnesses, paths and manifest summary
- [x] `uninstall` removes exactly the manifest entries; `uninstall --restore` returns a fake home to its exact pre-install state
- [x] All of the above covered by subprocess tests with an isolated fake home
- [ ] Real install on this machine done after reviewing its dry-run output
- [ ] Smoke in Claude Code from a project outside the home folder: a COA theory question is answered from chapter notes via the installed copy

## Comments

**Installer implemented on `develop`; the real install and the smoke test wait for the user's go-ahead on the dry-run.** `install`, `status` and `uninstall [--restore]` work. 29 subprocess tests run against a temp copy of the package and a fake home, so link mode never writes into the real checkout. With `check`, the full suite has 77 tests. Decisions and deviations:

- **Layout.** The data directory is `$XDG_DATA_HOME/ocean-acoustics-expert` (default `~/.local/share/…`). It holds:
  - `knowledge` and `matlab`: links into the checkout in link mode, copies in copy mode;
  - `local-paths.yaml`;
  - `manifest.json`;
  - `backups/<UTC timestamp>/`, which mirrors each path relative to the home; paths outside the home go under `_root/`.

  Claude's folder honours `CLAUDE_CONFIG_DIR`. The Claude skill link is relative (`../../.agents/skills/<name>`), like the existing `skills` CLI links.
- **Default mode.** The default is link mode in a checkout (a `.git` beside the package) and copy mode elsewhere. Switching modes over an existing install is refused; uninstall first.
- **Templates.**
  - `agent/ocean-acoustics-expert.md` is now harness-neutral: its frontmatter has only `name` and `description`. The Claude adapter adds `model: inherit`, `tools: [Read, Grep, Glob]` and `color: cyan` (kept from the old agent).
  - Template variables are the path-map names plus `local_path_map`. An unknown or unset variable fails the render, so no `{{…}}` can leak.
  - The router skill is rendered the same way into `~/.agents/skills/ocean-acoustics-router/`.
- **Zotero references dropped from the template and router.** Their Zotero PDF and `.zotero-ft-cache` paths had to go so the rendered files point only at the installed copy. They now name `{{knowledge_base}}/sources/jensen-2011-computational-ocean-acoustics.pdf` and say "page ranges". The rest of the rule upgrade stays in ticket 07.
- **Path map flags.** Only the toolbox entries are detected, and only they take flags: `--at-2023` and `--at-2020`. `knowledge_base` and `matlab_helpers` are folders the installer itself places in the data directory, so they follow `XDG_DATA_HOME`. `authoring_root` is the checkout the CLI runs from.
- **Toolbox detection.** A flag wins, then the previous install's value, then a search of the home folder:
  - The search goes 5 levels deep and skips hidden folders, `node_modules` and symlinks.
  - A match needs the version in the folder name (`2023` or `2020`) plus the expected files: `RAM/ram.exe` for 2023, and `linux-bin/bellhop.exe` and `Matlab/Plot/plotshd.m` for 2020. Several toolbox versions share a layout, and on this machine the 2020 tree also holds `RAM/ram.exe`.
  - With no match or several matches, the entry is left unset (an empty key in `local-paths.yaml`, `''` in the MATLAB config) and a warning names the flag.
  - On this machine the search finds exactly `.../ACOUSTICS-TOOLS/at_2023` and `.../atWin10_2020_11_4` in under 0.1 s.
- **MATLAB config.** `oae_local_paths.m` is written next to the helpers. In link mode that is the checkout's `tools/matlab/`, which is git-ignored and excluded from the package (ticket 02). The user still runs `addpath('<matlab_helpers>')` in MATLAB; the installer does not edit MATLAB's startup.
- **Ownership and backups.**
  - The manifest records a sha256 for every installed file and the target of every link.
  - Install replaces its own unchanged output without a backup. It backs up anything foreign, and any installed file or link the user has changed since.
  - Uninstall backs up changed entries before removing them. `--restore` puts back the earliest backup of each path (its pre-install state), and keeps later backups.
  - Restore compares content, type and link targets exactly. File mtimes are preserved to within a millisecond, since Node's `utimes` loses sub-millisecond precision.
- **Legacy cleanup.** The agent file, the real-directory Claude router and the `.Codex` router in `~/.agents/skills` are replaced, after a backup. These are backed up and removed:
  - `~/.claude/knowledge/ocean-acoustics`
  - `hooks/tests/ocean-acoustics-route-selection-regression.js`
  - `hooks/tests/fixtures/underwater-route-selection-cases.json`

  The emptied `~/.claude/knowledge/` folder is left in place. Claude Scholar's `skill-forced-eval-underwater-regression.js` and its `underwater-routing-cases.json` stay.
- **Tests parse frontmatter with `src/yaml.js`.** That parser accepts only a strict YAML subset, so output it accepts is plain YAML. A third-party parser would break the zero-dependency rule.
- **Smoke risk.** Claude Code may prompt before reading `~/.local/share/…` from a project outside it. The installer sets no Claude permissions; the smoke test will show whether it needs to.
