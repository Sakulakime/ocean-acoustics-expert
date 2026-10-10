# 12: Source notes and page maps for four monographs

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** The expert can answer from Collins & Siegmann (*Parabolic Wave Equations*), Colosi (*Sound Propagation through the Stochastic Ocean*), Etter (5th ed.) and Brekhovskikh & Lysanov. For each book, a source note gives the bibliographic record, the Zotero item key, the path of its PDF in `knowledge/sources/` (ticket 17), the book-page to PDF-page offset, and a section → PDF page-range map. The agent reads targeted page ranges of these books when COA does not settle a question. No chapter notes are written for them.

**Blocked by:** 07, 17

**Status:** done

- [x] Four source notes in the spec's source-note schema; Collins & Siegmann's page map built from the PDF itself (it has no Zotero text cache)
- [x] Routing map lists their fallback windows under the matching routes
- [x] Route-selection cases cover at least one fallback window per book; `check` passes
- [x] Smoke: a parabolic-equation question beyond COA's coverage is answered with a cited Collins & Siegmann page-range read and a `[textbook: …]` tag

## Comments

**Done (2026-10-10), commits `95df4e1`, `fa88151` and `4861365`.** There are four source notes. `check` validates every fallback window, and 19 route-selection cases pass. The full suite has 160 tests.

**Source notes** (`knowledge/01-source-*.md`, frontmatter like COA's plus `pdf_pages` and `pdf_page_offset`). Each note gives:
- the bibliographic record, with the Zotero key as a citation identifier only;
- what the book adds to COA;
- the page offset;
- a section map with book pages and PDF pages;
- retrieval guidance and a citation example.

| Book | Offset (PDF = book + n) | Map built from |
|---|---|---|
| Collins & Siegmann 2019 | 8 in ch. 1-2, 7 in ch. 3, 6 in ch. 4: the PDF drops blank pages 72 and 106 | the PDF's outline and page labels (the book has no Zotero text cache) |
| Colosi 2016 | 24 | the PDF's outline |
| Etter 2018 (5th ed.) | 31 | the PDF's outline |
| Brekhovskikh & Lysanov 2003 | 12 for book pages 1-273; 11 for the index, whose PDF lacks page 274 | the printed contents (no outline); every chapter opener checked in the PDF |

How the maps were built:
- Every PDF page's printed number was compared with the offset.
- A section ends on the page where the next one starts, unless that one starts at the top of a page.
- To find where a section starts, the outline's destination point was used where the PDF has one, and the heading's position on the page otherwise.
- Sampled rows and every window's start page were checked against the PDF text.
- The metadata comes from the Zotero database, opened read-only (`?immutable=1`), and from the books' copyright pages.

**Fallback windows into other books.** A window is either a page range, which is COA's as before, or a mapping:
- `source:` names the book's source note, which in turn names the PDF;
- `pages:` is a PDF page range of that PDF.

So the agent reads another book only through its source note, as the agent rules already require. `check` now fails, with a message specific to each problem, when:
- a window is not a page range `a-b` with `1 <= a <= b`;
- a window's source note is missing;
- the source is not a source note (`type: source-note`);
- the source note's frontmatter cannot be parsed;
- a window has any other shape.

**Routes.**
- Windows under existing routes:
  - Collins & Siegmann (5): `parabolic_equations`.
  - Etter (11): `fundamentals`, `ray_methods`, `wavenumber_integration`, `normal_modes`, `parabolic_equations`, `ambient_noise`, `sonar_signal_processing`.
  - Brekhovskikh & Lysanov (7): `fundamentals`, `wave_propagation_theory`, `ray_methods`, `normal_modes`.
- A new `ocean_fluctuations` route: Colosi (6), Brekhovskikh & Lysanov Ch. 10 (1), Etter §6.8 (1). COA has no chapter on this, so the route's notes are the Colosi and Brekhovskikh & Lysanov source notes plus `ch01-fundamentals.md`.
- 16 new concepts. When COA covers a concept, its COA window comes first.
- The `mode_coupling`, `sonar_equation` and `ambient_noise` concepts gain a book window after their COA window. Their route and notes are unchanged.
- The hub lists the four source notes. The README, and the agent and router descriptions, name the books and the new topics.

**Review** (two-axis).
- **Spec.** It found that broad new aliases pulled existing COA questions onto other routes, against story 13: `reverberation`, `poroelastic`/`biot`, `seismo-acoustic`, `thorp`, and a bare `wkb`.
  - Those aliases are narrowed.
  - An audit resolved 2,830 prompts against the concept index before and after the change. The prompts were note headings and bullets, the old trigger keywords and the old aliases. Every prompt that matched a concept before still resolves to the same route and notes.
  - The remaining differences are prompts that now match a more specific concept on the same route, such as `elastic PE` and `caustic`.
  - A new route-selection case keeps poroelastic bottom-loss questions on `bottom_loss`. Mutation-checked: it fails if the old alias is restored.
- **Standards.** It found no hard violations. Fixed:
  - frontmatter parsing moved to `noteFrontmatter`;
  - an unparseable source note gets its own message;
  - a name (`isOtherBookWindow`);
  - the shared test helper;
  - doc drift in the agent template and the hub.

**Smoke (Claude Code, through the installed agent).** The question was how the parabolic equation is formulated in a poro-elastic (Biot) sediment: its marched variables, wave speeds and source conditions.
- The agent read the hub, the `parabolic_equations` route, the `poro_elastic_pe` concept and `ch06` ("no poro-elastic content"), then `01-source-collins-siegmann.md`.
- It then read PDF pp. 122-138 (window `collins_siegmann_poro_elastic` is 122-137) and pp. 88-89 for the §3.4 self-starter.
- Every claim is tagged `[textbook: Collins & Siegmann 2019 §4.4.x, PDF pp. …]` or `[inference]`, and the COA PDF was not read.
- Codex and OpenCode were not smoked.

**Not live yet.** In link mode the knowledge base changes reach every harness at once. The agent and router descriptions, and the template's routing-map line, reach the harnesses only after a reinstall, which waits for the user's approval.

**Reinstall and Codex/OpenCode smokes done (2026-10-10).**
- **Reinstall.** The user approved it. `install` rewrote the four rendered files (Claude agent, Codex agent, OpenCode agent, shared router) and the manifest; `doctor` found no problems.
- **Question.** Both harnesses got the Claude Code smoke question, plus "answer only from the local knowledge base; do not search the web". They ran in parallel from `/tmp/oae-smoke/<harness>`.
- **Codex 0.162.0** (`codex exec --sandbox read-only --json`, model `gpt-6.1-sol`): passed.
  - Per its own session log, the expert (role `ocean-acoustics-expert`, sandbox `read-only`):
    1. read `00-hub.md`;
    2. searched `routing-map.yaml` and `concept-index.yaml` with `rg`;
    3. read `chapters/ch06-parabolic-equations.md` and `01-source-collins-siegmann.md`;
    4. ran `pdftotext -f 128 -l 137 … -` and `-f 123 -l 125 … -` on the Collins & Siegmann PDF, inside window `collins_siegmann_poro_elastic`.
  - It did not read the COA PDF. Neither the expert nor the main session searched the web or wrote a file.
  - The answer matches the PDF:
    - marched variables (Δ, w, ζ), from §4.4.2;
    - fast and slow compressional waves plus shear;
    - the §4.4.4 self-starter, with eqs. (4.96) and (4.98), and §3.4 for sources in fluid or solid layers.
  - Tag drift:
    - after the first claim, the tags drop the book name (`[textbook: §4.4.2, PDF pp. 128–129]`);
    - the sources list carries an invented `[retrieval record]` tag.
- **OpenCode 1.16.2** (`opencode run --format json`, model `deepseek/deepseek-v4-pro`): the expert passed; the main session did not finish.
  - The expert read:
    - the hub;
    - the routing map;
    - the concept index (`poro_elastic_pe`);
    - `ch06`;
    - the Collins & Siegmann source note;
    - `solvers/solver-ram.md`.

    It opened no PDF.
  - Following its harness note, it said a book fallback is needed. It named Collins & Siegmann §4.4.1–4.4.4 with their PDF page ranges, and window pp. 122-137, and gave "Books and PDF page ranges read: none". This is the first observation of the OpenCode harness note in action, which ticket 05 left open.
  - Tag drift:
    - note files appear inside textbook tags (`[textbook: 01-source-collins-siegmann.md, §4.4.3 section map]`, `[textbook: routing-map.yaml, …]`);
    - an inference from a section title is tagged as textbook.

    The main session's delegation prompt had rewritten the tag rule as "note file name, or book title + PDF page range".
  - **Observed: main-session permission.** After the expert returned, the main session tried to `read` the source note itself. That triggered an `external_directory` permission request for the knowledge base, which `opencode run` auto-rejects, and the run ended with no final main-session message.
    - The expert's own reads raised no prompt.
    - In an interactive session the user would be asked instead.
    - Allowing the knowledge base for every OpenCode agent would mean editing the user's global OpenCode config, which this installer does not touch.

**Follow-up: tag rules tightened (2026-10-10).** The user asked for a fix to the tag drift above. The agent template and the router now say:
- only the two tags exist, and they hold even when a request words tagging differently;
- a textbook tag names the book in every tag, never a note file, the routing map or the concept index;
- what is read into a section title in a source note's page map is `[inference]`;
- the sources used are listed without tags.

The router also tells a main session to leave the expert's tag rules as they are when it delegates. A third example tags another book, `[textbook: Collins & Siegmann 2019 §4.4.4, PDF pp. 134-135]` (checked against the PDF), next to the two wrong forms seen in the smokes.

One new test in `test/agent-rules.test.js` covers this; it failed before the change. After the reinstall, all four rendered files carry the rules. The Codex TOML parses, `opencode debug agent` resolves the new prompt, and `doctor` found no problems. The smokes have not been re-run.

**Tag smoke after the tightening (Claude Code, 2026-10-10): passed.**
- **Setup.** A Claude Code session delegated to the installed `ocean-acoustics-expert` subagent (8 tool calls), with no external CLI. The delegation prompt was the question alone, so it did not restate the tag rules. The question: how the parabolic equation is formulated for a poro-elastic (Biot) sediment, which field variables are marched in range, which wave types it carries, and how the starting field is obtained, kept short with every claim tagged and the note files and books with PDF page ranges listed.
- **Read path**, per the agent's source list:
  1. the hub;
  2. the routing map, route `parabolic_equations`;
  3. the concept index, `poro_elastic_pe`;
  4. `ch06` ("covers only the elastic PE");
  5. `01-source-collins-siegmann.md`;
  6. Collins & Siegmann §4.4-4.4.4, PDF pp. 122-137, which is window `collins_siegmann_poro_elastic`.

  It also searched `solvers/`, `runbooks/` and `workflows/` and found no poro-elastic content. It did not read the COA PDF.
- **Tags.**
  - Every textbook tag names the book, as in `[textbook: Collins & Siegmann 2019 §4.4.4, PDF p. 134]`.
  - No note file, routing map or concept index appears in a tag.
  - No tag other than the two exists.
  - The sources list carries no tags.
- **Small gaps left:**
  - one bullet carries no tag of its own, the one that glosses Δ, w, ζ as frame dilatation, vertical frame displacement and relative-displacement dilatation;
  - the poro-elastic/fluid interface sub-bullet relies on its parent bullet's tag;
  - the sources list gives absolute installed-copy paths (`~/.local/share/ocean-acoustics-expert/knowledge/…`) instead of knowledge-base-relative ones, which no rule forbids.
- **Content checked against the PDF:**
  - §4.4.4 starts on PDF p. 134;
  - the redundant equation Biot's form drops is on p. 129;
  - the wave-speed equation (4.71) is on p. 132;
  - R_j, eq. (4.89), is on p. 134;
  - the starters, eqs. (4.94), (4.96) and (4.98)-(4.99), and the 25 Hz shear-source example are on p. 135;
  - the four poro-elastic/fluid interface conditions are on p. 130.

  All of these match.
- Codex and OpenCode were not re-run, because those smokes cost money.
