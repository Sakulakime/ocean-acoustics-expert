# ocean-acoustics-expert

English | [简体中文](README.zh-CN.md)

An underwater-acoustics expert agent and the knowledge base it answers from, installable into Claude Code, Codex, OpenCode and DeepSeek-TUI.

The expert covers acoustic propagation modeling and sonar-oriented signal processing: sound-speed structure, transmission loss, ray and Gaussian-beam methods, wavenumber integration, normal modes, parabolic equations, broadband propagation, ambient noise, reverberation, the sonar equation, beamforming, matched-field processing, and sound propagation through internal waves and other ocean fluctuations. It also knows how to build inputs for, run and plot BELLHOP, KRAKEN and RAM through the bundled MATLAB helpers.

It answers notes first. It reads the hub, the routing map and the concept index, then the smallest set of notes that settles the question: chapter notes on *Computational Ocean Acoustics* (COA), solver notes, runbooks and the visualization standard. Only when the notes fall short does it read a targeted page range of a book PDF: COA, or one of four more books through its source note. Every claim in an answer carries an evidence tag, `[textbook: <source> <section/pages>]` or `[inference]`. The agent is read-only: in Claude Code, Codex and OpenCode the harness stops it changing files; in DeepSeek-TUI, which has no such control for a skill, its instructions do.

The book PDFs are not part of this repository: put your own copies in the knowledge base to enable the book fallback (see [Books](#books)). Without them the expert still answers from the notes.

## Supported harnesses

All harnesses read one installed copy of the knowledge base in the data folder, `~/.local/share/ocean-acoustics-expert/`.

| Harness | Agent file | Kept read-only by | Router skill | Book PDFs |
|---|---|---|---|---|
| Claude Code | `~/.claude/agents/ocean-acoustics-expert.md` | `tools: [Read, Grep, Glob]` | `~/.claude/skills/ocean-acoustics-router`, a link to the shared folder | reads page ranges |
| Codex | `~/.codex/agents/ocean-acoustics-expert.toml` | `sandbox_mode = "read-only"` | read from `~/.agents/skills` | prints page ranges with `pdftotext` |
| OpenCode | `~/.config/opencode/agents/ocean-acoustics-expert.md` (a subagent) | a `permission` block that denies edit, bash, web and task, and allows reads of the data folder | read from `~/.agents/skills` | does not open PDFs; names the book and page range to read instead |
| DeepSeek-TUI (`dst`) | `~/.dsh/skills/ocean-acoustics-expert/SKILL.md` (a skill: DSH has no named agents) | its instructions only; DSH has no per-skill tool allowlist | read from `~/.agents/skills` | prints page ranges with `pdftotext` |

The router skill, `ocean-acoustics-router`, lives in the shared skills folder `~/.agents/skills/`. It routes an underwater-acoustics question through the notes and hands deep work to the expert.

The data folder holds:

```
~/.local/share/ocean-acoustics-expert/
├── knowledge/        installed copy of the knowledge base; your book PDFs go in knowledge/sources/
├── matlab/           MATLAB solver helpers
├── local-paths.yaml  local path map: where this machine keeps the Acoustics Toolbox
├── manifest.json     every file and link install wrote
└── backups/          everything install replaced or removed
```

## Requirements

- Node.js 22 or later.
- git, which npx uses to fetch the package from GitHub.
- Optional: your own PDFs of the five books, for the book fallback (see [Books](#books)).
- For the book fallbacks of Codex and DeepSeek-TUI: `pdftotext` from poppler-utils.
- Optional: MATLAB and the Acoustics Toolbox, for the solver helpers (see `tools/matlab/README.md`).

## Install

Install a pinned tag. npx caches packages, so pinning a tag gets you a known version rather than a stale cached copy:

```sh
npx github:Sakulakime/ocean-acoustics-expert#v0.1.1 install --dry-run
npx github:Sakulakime/ocean-acoustics-expert#v0.1.1 install
```

On Windows, installer-owned directory links use junctions with absolute targets;
POSIX systems keep directory symlinks. Existing relative link records remain
compatible with reinstall, `doctor`, and `uninstall`. Windows directory-link
backups preserve the destination and restore as junctions, including when that
destination no longer exists. File symlinks still require the system's symlink
permissions. A legacy dangling symlink without recorded directory type cannot
be inferred from its target's namespace prefix; it remains an ordinary symlink.
After an interrupted install, rerun the fixed installer with the
same harnesses and mode; review any backups it reports before removing them.
The Linux regression suite models the link permission boundary and does not
replace validation on a Windows machine.

The package is under 1 MB. After installing, copy your book PDFs into `~/.local/share/ocean-acoustics-expert/knowledge/sources/` (see [Books](#books)).

- `--dry-run` prints the local path map and every action install would take, and changes nothing.
- On a terminal, install asks which harnesses to install into: a checklist of all four, each marked found or not found. Move with the arrow keys, toggle with space (`a` toggles all), confirm with enter, cancel with esc or Ctrl+C. The harnesses whose config folder exists (`~/.claude`, `~/.codex`, `~/.config/opencode`, `~/.dsh`) start checked; on a later install, the recorded ones do.
- Before it changes anything, install shows how many actions it will take, lists every path it will back up, and asks to go ahead. A dry run skips this question.
- `--harness` picks the harnesses without the checklist, once per harness: `--harness claude --harness opencode`. `--yes` (`-y`) skips every question. Without a terminal (a pipe, CI) install never asks: it uses `--harness`, else the recorded harnesses, else the ones present.
- A later install keeps the recorded harnesses. To change them, pick a new set in the checklist or pass the full new list with `--harness`.
- Before install overwrites or removes anything it did not write, it copies it into `backups/<timestamp>/`. Its own unchanged files it simply replaces. It also cleans up the paths of the hand-made setup this package replaced, with a backup first.
- Install is idempotent: running it again with nothing changed does nothing.

Afterwards, check the result:

```sh
npx github:Sakulakime/ocean-acoustics-expert#v0.1.1 doctor
```

### Using the expert

- **Claude Code:** ask an underwater-acoustics question. The router skill routes it, or ask for the `ocean-acoustics-expert` agent.
- **Codex:** Codex has no syntax for calling an agent directly; `$` calls skills. Ask for the expert as a sub-agent in plain words, for example `Spawn an ocean-acoustics-expert sub-agent to answer: ...`. Codex spawns sub-agents only when asked explicitly, so a plain question does not reach the expert. The sub-agent runs in Codex's read-only sandbox. To use only the router in the main session, call `$ocean-acoustics-router`.
- **OpenCode:** mention `@ocean-acoustics-expert`, or let the main agent hand the question to it.
- **DeepSeek-TUI:** run `/ocean-acoustics-expert <question>` (it also appears in `/skills`). The expert runs inside the main agent, so it stays read-only by its instructions alone. Plain underwater-acoustics questions go through the router skill.

## Link mode and copy mode

**Copy mode** is the default when the package is not a git checkout, which is the case with npx. Install copies the knowledge base and the MATLAB helpers into the data folder. To update, install a newer tag.

**Link mode** is the default in a git checkout, and is for working on the knowledge base. The data folder's `knowledge/` and `matlab/` are links to the checkout's `knowledge/` (the authoring copy) and `tools/matlab/`, so an edit to the authoring copy reaches every harness at once. The MATLAB configuration `oae_local_paths.m` is written into the checkout's `tools/matlab/`, where git ignores it.

```sh
git clone https://github.com/Sakulakime/ocean-acoustics-expert.git
cd ocean-acoustics-expert
node bin/ocean-acoustics-expert.js install --dry-run
node bin/ocean-acoustics-expert.js install
```

Force a mode with `--mode link` or `--mode copy`; link mode needs a checkout. To switch an installation from one mode to the other, uninstall first. In link mode, keep the checkout where it is: if it moves, the links break (`doctor` reports this) until you reinstall.

## Path overrides

**Acoustics Toolbox.** The local path map records where two Acoustics Toolbox trees live. The solver helpers need them; the rest of the expert works without them. Install searches your home folder up to five levels deep, skipping hidden folders, `node_modules` and symbolic links:

| Entry | Flag | Recognised by |
|---|---|---|
| `at_2023` | `--at-2023 <dir>` | a folder whose name contains `2023` and that holds `RAM/ram.exe` |
| `at_2020` | `--at-2020 <dir>` | a folder whose name contains `2020` and that holds `linux-bin/bellhop.exe` and `Matlab/Plot/plotshd.m` |

A flag overrides the search. Later installs reuse the recorded locations, so you pass a flag only once. An entry with no match or several is left unset with a warning; reinstall with its flag to set it.

**Config folders.** Install follows the same environment variables as the harnesses. Relative values are ignored. Use the same values for every command, or `status`, `doctor` and `uninstall` will look in the wrong place.

| Variable | Default | Locates |
|---|---|---|
| `XDG_DATA_HOME` | `~/.local/share` | the data folder, `$XDG_DATA_HOME/ocean-acoustics-expert` |
| `CLAUDE_CONFIG_DIR` | `~/.claude` | Claude Code's config folder |
| `CODEX_HOME` | `~/.codex` | Codex's config folder |
| `DSH_HOME` | `~/.dsh` | DeepSeek-TUI's (DSH's) home folder |
| `XDG_CONFIG_HOME` | `~/.config` | OpenCode's config folder, `$XDG_CONFIG_HOME/opencode` |

The shared skills folder is always `~/.agents/skills`.

## Commands

Run each command as `npx github:Sakulakime/ocean-acoustics-expert#<tag> <command>`, or as `node bin/ocean-acoustics-expert.js <command>` in a checkout.

| Command | What it does |
|---|---|
| `install` | Installs or updates the expert. Asks which harnesses on a terminal. Options: `--harness <name>`, `--mode link\|copy`, `--dry-run`, `--yes`, `--at-2023 <dir>`, `--at-2020 <dir>`. Exits 130 when cancelled. |
| `status` | Shows the installed version, mode, harnesses, data folder, local path map, and how many files, links and backups the manifest lists. |
| `doctor` | Diagnoses the installation and changes nothing. It prints a `FAIL` line for each problem and exits non-zero when there is one; a `WARN` line does not fail it. |
| `check` | Lints a knowledge base and runs the route-selection cases. It is for people editing the knowledge base. Options: `--kb <dir>`, `--cases <file>`, `--helpers <dir>`. |
| `uninstall` | Removes exactly what the manifest lists. Add `--restore` to put back what install backed up. |

`doctor` checks five things:

1. Every entry of the local path map exists. An unset toolbox only gets a `WARN`.
2. Every symbolic link install made is still that link and resolves.
3. Each harness's agent file and the shared router skill parse, name the installed hub, and name no path outside the data folder. For OpenCode, the agent must also be allowed to read the data folder without asking.
4. Every book PDF a note points at is in the installed copy. A missing book only gets a `WARN`, naming where to put it and the notes that point at it.
5. When OpenCode is installed, OpenCode does not see the router in two different folders. Seeing it twice through Claude's link to the same folder is harmless; OpenCode logs a duplicate-name warning for it.

`uninstall` backs up any file you changed after install before removing it. With `--restore`, it puts back the earliest backup of each path, which returns the machine to its state before the first install. Backups stay in `backups/` in the data folder.

## Books

The expert's page-range fallback reads five books (ADR 0006):

- Jensen, Kuperman, Porter & Schmidt, *Computational Ocean Acoustics*, 2nd ed. (2011), the default book
- Collins & Siegmann, *Parabolic Wave Equations with Applications* (2019)
- Colosi, *Sound Propagation through the Stochastic Ocean* (2016)
- Etter, *Underwater Acoustic Modeling and Simulation*, 5th ed. (2018)
- Brekhovskikh & Lysanov, *Fundamentals of Ocean Acoustics*, 3rd ed. (2003)

The repository does not include them. Put your copies in `knowledge/sources/` of the installed copy (`~/.local/share/ocean-acoustics-expert/knowledge/sources/`; in link mode, the checkout's `knowledge/sources/`), under the file names listed in [`knowledge/sources/README.md`](knowledge/sources/README.md). Page numbers in the notes are PDF pages of these editions. Install never touches files it did not write, so your books survive reinstalls and uninstall. Run `doctor` to see which ones are missing.

The expert reads a book only through notes that point at its pages. COA has chapter notes. Each of the other four has a source note: its page offset and a map from sections to PDF pages, which the routing map's fallback windows point into. When a book is missing, the expert answers from the notes and names the book and page range it would have read.

## Development

```sh
npm test        # the test suite: the CLI run as a subprocess against fake homes
npm run check   # lint the authoring copy of the knowledge base
```

Domain terms are defined in `GLOSSARY.md`, and design decisions are recorded in `docs/adr/`.

## License

[MIT](LICENSE).
