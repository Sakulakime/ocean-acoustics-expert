# Spec: Ocean Acoustics Expert v1 — richer knowledge base, installable into every harness

Status: ready-for-agent

## Revision 2026-10-10: books bundled, papers out of scope (ADR 0005)

This revision overrides the rest of the spec wherever they conflict.

- **Papers are out of scope.** Journal and conference papers do not enter the knowledge base.
  - Withdrawn: stories 1–6 and 16–26; the paper-card and topic-synthesis schemas; the ingestion skill; the "Papers" and "Literature" content scope; retrieval step 6 (full-text search of paper caches); the `[paper: …]` evidence tag and uncurated evidence.
  - Tickets 08–11 and 16 are `wontfix`. Evidence tags are `[textbook: …]` and `[inference]`.
- **Book PDFs live in the knowledge base.** COA and the four monographs (Collins & Siegmann, Colosi, Etter 5th ed., Brekhovskikh & Lysanov) are copied from Zotero into `knowledge/sources/`. Zotero stays untouched.
  - The PDFs are committed and shipped in the package. Story 46 is replaced: the package carries these five books, so the repository must stay private, and `"private": true` blocks npm publishing.
  - Notes point at a PDF by its `sources/…` path and keep the Zotero item key as a bibliographic identifier. Ticket 17 does this before ticket 03.
- **Zotero is no longer needed at answer time.**
  - The local path map loses Zotero storage.
  - `doctor` checks that the PDFs the notes point at exist in the installed copy, not in Zotero (stories 38 and 49).
  - Story 48 is withdrawn: a colleague gets the books with the private repository.
  - Story 12 is met by page-range reads of the PDFs in `sources/`.
- **Ticket order.** Ticket 17 comes after 02 and before 03.

## Problem Statement

I do PhD research on machine learning for underwater acoustic propagation (PINNs, neural operators, data-driven TL prediction, conformal/UQ, differentiable-physics inversion). The ocean-acoustics-expert agent knows only one source, *Computational Ocean Acoustics* (COA), and only at summary depth. It cannot tell me who did what in my research area, compare methods across papers, or separate textbook consensus from one paper's claim, and those are what I need for related work, baselines, and experiment design. Several hundred relevant papers and a shelf of monographs sit in my Zotero library, invisible to the agent.

The agent is also fragile and stuck in one place. Its files live loose in `~/.claude`. The Codex copy (made by Codex's `/import`) points at a nonexistent `~/.Codex/knowledge/` path, so it is broken. A stale May snapshot lingers in Codex's skills folder. OpenCode has no copy at all. Its full-text fallback for COA quietly fails beyond page 100, because Zotero only indexes the first 100 pages. There is no single place to develop it, version it, or install it with one command into Claude Code, Codex and OpenCode.

## Solution

The agent becomes a project, `ocean-acoustics-expert`, under my personal projects folder. The project holds the authoring copy of the knowledge base, the expert agent template, the router and ingestion skills, the MATLAB solver helpers, and a zero-dependency installer runnable with `npx`.

The knowledge base grows in three ways:

- **Papers.** Literature enters as paper cards (one per paper, project-neutral) grouped under topic syntheses (cross-paper comparisons). The first batch is my `Research-CP-Acoustics-2026` collection; the second is `Acoustics/Deep Learning`. Papers without a card stay reachable as uncurated evidence through full-text search.
- **COA depth.** Chapters 5, 6, 3 and 2 gain key equations and quantitative validity conditions, and a new benchmark-cases note catalogues the canonical test environments.
- **More books.** Four monographs get source notes with page maps, so the agent can read targeted page ranges of them as it does for COA.

Every answer labels each claim with an evidence tag (textbook, paper, inference).

One `npx … install` puts the agent into Claude Code, Codex and OpenCode, each in its native format with read-only permissions, all pointing at one installed copy of the knowledge base. On my machine it runs in link mode, so ingestion edits the repo and every harness sees the change immediately. A later `ingest` request adds a new paper to the same specification.

## User Stories

### Asking the agent (research use)

1. As a researcher, I want to ask "what has been done on ML surrogates for transmission-loss prediction" and get a comparison across papers, so that I can draft a related-work section.
2. As a researcher, I want each claim in an answer tagged as textbook consensus, a paper's finding, or the agent's inference, so that I never present one paper's result as field consensus.
3. As a researcher, I want paper claims cited with author, year, Zotero key and section, so that I can jump to the source and verify it.
4. As a researcher, I want paper findings reported together with their conditions (environment, frequency, solver used as ground truth, metric), so that I can judge whether they transfer to my setting.
5. As a researcher, I want the agent to say when a topic synthesis shows disagreement or a gap between papers, so that I can spot open research questions.
6. As a researcher, I want the agent to fall back to searching the full text of papers without cards, with the result clearly labelled as uncurated evidence, so that the long tail of my library is still useful but not over-trusted.
7. As a researcher, I want to ask which benchmark cases a family of methods is usually validated on, so that I can choose test environments that reviewers will recognise.
8. As a researcher, I want to ask for the exact parameters of a benchmark case (Pekeris waveguide, Munk profile, ASA wedge, and so on) and where COA shows it, so that I can reproduce it in my own solver or dataset.
9. As a researcher, I want key equations of normal modes, parabolic equations, ray methods and wave theory with symbol definitions and COA equation numbers, so that I can write the background section correctly.
10. As a researcher, I want quantitative validity conditions for each propagation method (angle limits, frequency limits, range-dependence assumptions), so that I can justify which solver generates my training data.
11. As a researcher, I want the agent to read targeted pages of Collins & Siegmann, Colosi, Etter or Brekhovskikh & Lysanov when COA does not cover a topic, so that theory answers are not limited to one book.
12. As a researcher, I want COA fallbacks to work beyond page 100, so that deep-chapter questions get evidence from the actual book instead of silently failing.
13. As a researcher, I want existing theory and solver questions to keep routing exactly as before, so that the upgrade does not regress what already works.
14. As a researcher, I want plotting questions to keep following the TL visualisation standard, so that figures stay consistent across my projects.
15. As a researcher, I want the agent to stay read-only in every harness, so that asking a question can never modify my files or launch a solver.

### Ingestion

16. As a researcher, I want to say "add this paper to the knowledge base" with a Zotero key, DOI or title, so that new reading becomes agent knowledge without manual note-writing.
17. As a researcher, I want every paper card to follow one fixed schema, so that cards are comparable and machine-checkable.
18. As a researcher, I want ingestion to also update the relevant topic synthesis and the routes, so that a new card is actually reachable by the agent.
19. As a researcher, I want ingestion to refuse to create a duplicate card for a paper that already has one, so that the knowledge base stays clean.
20. As a researcher, I want ingestion to run the knowledge-base check after writing, so that a malformed card is caught immediately.
21. As a researcher, I want ingestion to work from my local Zotero library read-only, so that it can never corrupt my library.
22. As a researcher, I want ingestion to be able to process a whole Zotero collection in a batch, so that I can build the first and second batches without 186 separate requests.
23. As a researcher, I want cards marked draft or reviewed, so that I know which ones I have personally checked.
24. As a researcher, I want a pilot of about ten cards before the batch, so that the card template is calibrated on real papers before it is applied at scale.
25. As a researcher, I want ingestion to refuse to run against an installed copy in copy mode, so that a later reinstall can never wipe new cards.
26. As a researcher, I want project literature notes in my Obsidian vault left untouched, so that my project-specific judgements stay separate from neutral paper cards.

### Installing and maintaining

27. As a researcher, I want one `npx` command to install the agent into Claude Code, Codex and OpenCode, so that all my harnesses share the same expert.
28. As a researcher, I want to choose which harnesses to install into, with detected harnesses as the default, so that I do not get files for tools I do not use.
29. As a researcher, I want each harness to receive the agent in its native format with equivalent read-only permissions, so that it actually loads and stays safe.
30. As a researcher, I want one installed copy of the knowledge base shared by all harnesses, so that an update reaches every harness at once.
31. As a researcher, I want link mode on my own machine, so that edits and ingestion in the repo are visible to every harness without reinstalling.
32. As a researcher, I want copy mode for other machines, so that the installed copy does not depend on a repo checkout.
33. As a researcher, I want every file the installer would overwrite to be backed up first, so that I can always roll back.
34. As a researcher, I want a dry-run that lists every file to be written, linked, backed up or removed, so that I can review the install before it touches anything.
35. As a researcher, I want re-running install with nothing changed to be a no-op, so that it is safe to run repeatedly.
36. As a researcher, I want uninstall to remove exactly what install wrote and optionally restore backups, so that removal is clean.
37. As a researcher, I want a status command that shows installed version, mode, harnesses and paths, so that I know what is live.
38. As a researcher, I want a doctor command that checks the local path map, source availability, harness files, symlinks and duplicate skill names, so that broken setups are diagnosed in one step.
39. As a researcher, I want a check command that validates the knowledge base (links resolve, no machine paths in notes, card schema, unique Zotero keys, routing regression cases), so that content errors are caught before they reach the agent.
40. As a researcher, I want machine-specific paths (Zotero storage, Acoustics Toolbox locations, MATLAB helpers) detected automatically and overridable by flags, so that the same package works on another machine.
41. As a researcher, I want the installer to clean up the known broken and stale copies (the `.Codex`-path agent and router in Codex's locations and the May snapshot), backed up first, so that harnesses stop loading broken versions.
42. As a researcher, I want my current `~/.claude` agent, router skill and knowledge folder migrated into the project and replaced by installer output, so that there is a single source of truth.
43. As a researcher, I want skills to follow the layout my `skills` CLI already uses (canonical folder plus Claude symlink), so that the install fits the rest of my setup.
44. As a researcher, I want the MATLAB solver helpers shipped with the package and pointed at my Acoustics Toolbox through the generated path map, so that runbooks keep working after the move.
45. As a researcher, I want to install a pinned version from a git tag, so that I get a known version rather than a stale npx cache.
46. As a researcher, I want the package never to contain source PDFs, so that sharing it never redistributes copyrighted books or papers.
47. As a researcher, I want nothing pushed to GitHub or published to npm without my explicit go-ahead, so that publishing stays my decision.

### A future colleague

48. As a colleague with my own Zotero library, I want to install the agent with `npx` and point it at my Zotero storage, so that I can use the knowledge base with my own copies of the sources.
49. As a colleague, I want doctor to tell me which referenced sources are missing from my library, so that I know which fallbacks will not work for me.
50. As a colleague, I want a README that explains install, modes, harness support and ingestion, so that I can get started without the author.

## Implementation Decisions

### Project and modules

- The project is a single-context repo with `GLOSSARY.md` and ADRs 0001–0004 at the root. All vocabulary below follows the glossary.
- Modules:
  1. **Knowledge base (authoring copy)**: the existing COA notes plus new paper cards, topic syntheses, source notes and the benchmark-cases note.
  2. **Agent template**: one harness-neutral description of the expert, its retrieval order and its answer rules.
  3. **Harness adapters** for Claude Code, Codex and OpenCode. Each turns the template into that harness's native agent file.
  4. **Skills**: the router (updated retrieval order) and a new ingestion skill.
  5. **Installer CLI**: install, uninstall, status, doctor and check.
  6. **Local path map** generator.
  7. **MATLAB helpers**: the validators and runners for BELLHOP, KRAKEN and RAM.
- The installer is a zero-dependency ES-module Node CLI with a single `bin` entry. It locates its bundled assets relative to its own module URL, never the working directory. Built JS is committed, with no `prepare` or `postinstall` reliance.

### Harness contracts (dictated by the harnesses, verified on Claude Code 2.1.295, Codex 0.161.0, OpenCode 1.16.2)

- **Claude Code**: agent markdown in the user agents folder, with `tools: [Read, Grep, Glob]` and `model: inherit`.
- **Codex**: an agent TOML in the user agents folder. It must contain `name`, `description` and `developer_instructions`, and sets `sandbox_mode = "read-only"`. There is no per-tool allowlist, and the sandbox is the closest equivalent.
- **OpenCode**: agent markdown in the user agents folder of its config dir, with `mode: subagent` and a `permission` block that denies edit, bash and webfetch. `external_directory` allows the installed knowledge base, Zotero storage and the toolbox paths. A Claude-style `tools` array is ignored by OpenCode and must not be relied on.
- **Skills**: the canonical folder lives under `~/.agents/skills/<name>`, which Codex and OpenCode read. Claude gets a symlink to it in its skills folder. This mirrors the existing `skills` CLI convention on this machine.
- Agent files are generated by rendering the template through an adapter, never by find-and-replace on another harness's file (ADR 0003).

### Knowledge base layout and paths

- The installed copy lives in one per-user data directory (XDG data home). In link mode it is a symlink to the authoring copy; in copy mode it is a copy (ADR 0004).
- Notes contain no absolute machine paths. Sources are referenced by Zotero key; tools by logical name.
- The generated **local path map** resolves logical names to this machine:
  - the installed knowledge-base root
  - Zotero storage
  - the Acoustics Toolbox root(s) currently referenced by the runbooks (the 2023 tree and the 2020 tree for plotting)
  - the MATLAB helpers
  - in link mode only, the authoring root
- The installer detects defaults, accepts flag overrides, and writes the map at install time.
- The MATLAB helpers read toolbox locations from a small generated MATLAB config function instead of hard-coded literals.
- The 34 absolute-path occurrences across 16 existing notes are rewritten to keys and logical names.

### Retrieval and answer rules (agent template and router)

- **Retrieval order**:
  1. hub
  2. routing map
  3. concept index
  4. smallest note set: chapter, solver, runbook, visualization, benchmark cases, topic synthesis, paper card
  5. targeted fallback window of a book PDF, read by page range
  6. full-text search of paper caches, which yields uncurated evidence
- Book fallbacks always read PDF page ranges. The Zotero full-text cache is used only for papers (ADR 0002).
- **Evidence tags**: `[textbook: <source> <section/pages>]`, `[paper: <Author Year>, <zotero_key>, <section>]`, `[inference]`. Uncurated evidence is labelled as such.
- The agent definition now explicitly references the concept index, solver notes, visualization standard, benchmark cases, syntheses and cards. The ray-methods route gains the BELLHOP solver note.

### Schemas

- **Paper card**:
  - Frontmatter: `zotero_key` (unique), title, authors, year, venue, DOI, item type, Zotero collections, topics, method family, solvers or ground truth used, benchmark cases used, `status` (draft | reviewed) and a card schema version.
  - Body sections: Problem; Method; Environment and data; Ground truth and solvers; Metrics; Findings (each with its conditions); Limitations; Related cards.
  - The pilot may adjust field names. After the pilot the schema is frozen and `check` enforces it.
- **Topic synthesis**: the question it answers; a comparison table of the cards it covers (method, environment, ground truth, metric, headline result); agreements; disagreements; gaps; links to cards.
  - Initial topics come from the pilot. Expected candidates: ML surrogates for TL, PINNs for propagation, neural operators, UQ and conformal prediction, DL geoacoustic inversion, differentiable physics.
- **Source note** (books): bibliographic record, Zotero key, book-page to PDF-page offset, and a table-of-contents map from sections to PDF page ranges.
  - Routes reference these as fallback windows.
  - No chapter notes are written for these four books.
- **Benchmark-cases note**: per case, the environment parameters, the COA figure and page references, the solver families it validates, and its known reference solutions.
- **Routing map**: routes may list syntheses and source-note fallback windows in addition to chapter notes. Concept-index entries may point to syntheses.

### Content scope

- **COA deepening**: chapters 5, 6, 3, 2 in that order. Add key equations (symbols defined, COA equation numbers) and quantitative validity conditions.
- **Book source notes**: Collins & Siegmann (*Parabolic Wave Equations*; it has no Zotero text cache, so its page map comes from the PDF itself), Colosi, Etter (5th ed.), Brekhovskikh & Lysanov.
- **Literature**:
  - Pilot of ~10 papers from `Research-CP-Acoustics-2026`, then the rest of that collection (68 items in total).
  - Second batch: `Acoustics/Deep Learning` (118 items), deduplicated against the first.
  - Items without a PDF are skipped and listed.

### Ingestion skill

- Input is a Zotero key, DOI, title or collection name.
- It reads metadata read-only: through Zotero's local API when Zotero is running, otherwise from the database opened immutable. Uncommitted WAL changes mean the newest items may be missing in the latter case.
- It reads the PDF and writes or updates the card in the authoring copy, updates the matching topic synthesis, routes and concept index, then runs `check`.
- It refuses when no authoring root is configured (copy mode) or when a card for that key already exists, unless an explicit update is requested.

### Installer CLI behaviour

- `install`:
  - Options: harness selection (default: detected), mode (link or copy; link requires running from a checkout), path overrides, and `--dry-run`.
  - It renders agent files, places skills, installs the knowledge base, and writes the path map, the MATLAB config and a manifest.
  - It backs up anything it would overwrite into a timestamped backup folder in the data directory, and cleans up the known legacy paths with backup.
  - It is idempotent.
- `uninstall`: removes exactly the manifest's files; `--restore` reinstates backups.
- `status`: prints version, mode, harnesses, paths and manifest summary.
- `doctor`: checks path-map entries exist, harness files parse and point at the installed copy, symlinks resolve, referenced Zotero keys have PDFs, and duplicate skill names are visible to OpenCode. It reports problems; it never fixes them.
- `check`: lints the knowledge base, covering resolvable links, no absolute paths, card schema, unique keys, and routes or concept index referencing existing notes. It also runs the routing regression fixtures.
- **Legacy paths handled on this machine**:
  - the current Claude agent file
  - the real-directory Claude router skill
  - the `~/.claude` knowledge folder
  - the broken router in `~/.agents/skills`
  - the broken Codex agent TOML
  - the stale May snapshot in Codex's skills folder
  - the route-selection regression test and its fixture under the Claude hooks tests folder, which move into the repo. The forced-skill-eval suite tests Claude Scholar's own hook, so it stays where it is.

### Distribution

- Install with `npx github:<owner>/ocean-acoustics-expert#<tag> install`.
- The `files` whitelist excludes anything but the CLI, templates, knowledge base, skills, MATLAB helpers and docs.
- Source PDFs are never included.
- Creating the remote, pushing, tagging and npm publishing all wait for explicit user approval. The default recommendation is a private repo.

## Testing Decisions

- A good test drives the system only through its external interface and asserts on observable results: files, file contents, exit codes and messages. It never asserts on internal functions.
- **One seam: the CLI run as a subprocess.**
  - `HOME`, `XDG_*` and config locations point at a throwaway temp directory, pre-seeded with fixture harness folders, fixture legacy files and a fake Zotero storage.
  - Install, uninstall, status and doctor are tested this way.
  - Assertions cover: generated agent files parse (YAML frontmatter, TOML) and carry the right permissions for each harness; every path they mention points at the installed copy; skill symlinks resolve; backups and the manifest exist; a re-run is a no-op; uninstall with restore returns the fixture home to its original state; dry-run writes nothing; legacy cleanup backs up before removing.
- **`check` runs through the same seam:**
  - against the real authoring copy, which must pass;
  - against small deliberately broken fixture knowledge bases (dangling link, absolute path in a note, card missing a required field, duplicate Zotero key, route pointing at a missing note), each of which must fail with a specific message.
- **Prior art**: the existing routing regression script (Node, JSON fixtures of prompt → expected bucket, notes and fallback windows; 11 cases currently passing). It moves into the repo, is rewired to read the authoring copy, and runs as part of `check`. New cases are added for syntheses, cards and book fallback windows. The test runner is Node's built-in `node:test` (zero dependencies).
- **Not automatable, done as a manual smoke checklist per harness after install**:
  - a COA theory question, which should route to chapter notes;
  - a literature comparison question, which should route to a synthesis plus cards with evidence tags;
  - a long-tail question, which should return uncurated evidence with a label;
  - a deep-COA fallback, which should be a page-range PDF read beyond page 100.
  - Also confirm that OpenCode does not prompt for the knowledge base and that Codex reads it under the read-only sandbox.
- Ingestion is validated by `check` passing after each card, plus my review of the pilot cards before the batch.

## Out of Scope

- Writing to or linking from the Obsidian vault; project literature notes stay where they are.
- Claude Scholar's hooks, including its forced-skill-eval underwater cases, which already fail 13/13 for reasons unrelated to this work.
- The `pdf-rag` vector cache and any semantic search (ADR 0002).
- Unifying Acoustics Toolbox versions; runbooks keep their current toolbox references.
- Giving the agent execution or write permissions.
- Adapters for Gemini CLI, Hermes, Kilo Code or other harnesses (next version).
- Full chapter notes for books other than COA; personal research notes (lessons learned, experiment logs).
- Collections beyond the two batches (the remaining `Acoustics/` subtree, ~678 items).
- Pushing, tagging or publishing without explicit approval.

## Further Notes

- **Risk: OpenCode duplicate skills.** OpenCode auto-loads both `~/.claude/skills` and `~/.agents/skills`, so the Claude symlink may make the router appear twice. `doctor` must detect this, and the smoke test must confirm the behaviour. If it is a problem, the fallback is an OpenCode-side override decided during implementation.
- **Risk: reads outside the working directory.** Claude Code, Codex and OpenCode may each treat reads outside the working directory differently. The smoke checklist covers all three.
- **Zotero data**: the database has a large uncommitted WAL while Zotero runs, so prefer the local API for metadata.
- **Copyright**: notes and cards are summaries; verbatim quotations stay short.
- **Unrelated finding**: the npm package name is unverified (irrelevant for `github:` installs). The Ch4 project's `.claude/project-memory/registry.yaml` still points at the old `Jay's_work` path.
- **Suggested ticket order**:
  1. Scaffold and migrate
  2. Path map and de-hardcoding
  3. `check` with the routing regression
  4. Claude adapter with install, uninstall and status
  5. Codex and OpenCode adapters with legacy cleanup and doctor
  6. Agent and router rule updates (evidence tags, retrieval order, book fallback fix)
  7. Card schema and ingestion skill
  8. Pilot of ten cards
  9. First batch
  10. Topic syntheses
  11. Book source notes
  12. COA deepening and benchmark cases
  13. Second batch
