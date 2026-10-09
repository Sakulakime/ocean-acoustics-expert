# 07: Upgrade the agent's retrieval and answer rules

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADR 0002)

**What to build:** The expert follows the v1 retrieval order and labels every claim with an evidence tag. The order is: hub → routing map → concept index → smallest note set → book fallback window. Book fallbacks read targeted page ranges of the PDFs in `knowledge/sources/`, so deep-COA questions stop silently failing past page 100. The template and router reference every note family: concept index, solver notes, visualization standard, and, when present, benchmark cases and book source notes. The ray-methods route gains the BELLHOP solver note.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Template and router state the v1 retrieval order and the evidence-tag formats `[textbook: …]` and `[inference]`
- [x] Book fallbacks are page-range reads of the PDFs in `knowledge/sources/`; no Zotero cache is used
- [x] Template and router reference concept index, solver notes and visualization standard, and the benchmark cases and book source notes when present
- [x] Ray-methods route lists the BELLHOP solver note; a route-selection case covers it
- [ ] `check` passes; reinstall propagates the new rules to every installed harness
- [ ] Smoke: a question whose evidence lies beyond COA page 100 is answered with a cited page-range read and evidence tags

## Comments

**Partly done by ticket 03 (2026-10-10).** The agent template and the router no longer mention the Zotero PDF or `.zotero-ft-cache`. To make the rendered files point only at the installed copy, ticket 03 made three changes:
- the fallback source is now `{{knowledge_base}}/sources/jensen-2011-computational-ocean-acoustics.pdf`;
- fallbacks are worded as page-range reads;
- the "cite section headings when using `.zotero-ft-cache`" rule is gone.

The retrieval order, the evidence tags and the note-family references are still to do here.

**Rules implemented on branch `ticket-07-rules` (2026-10-10); the reinstall and the smoke test wait for the user's go-ahead.** `check` passes with 13 route-selection cases. The full suite has 82 tests, including 5 new subprocess tests in `test/agent-rules.test.js`. Those tests install into a fake home and read the rendered Claude agent and the shared router. Decisions and deviations:

- **Retrieval order.** The agent and the router each have a "Mandatory retrieval order" of exactly five steps: hub, routing map, concept index, smallest note set, fallback window.
  - Step 3 says to *check* the concept index for the terms the question names; searching it for the term is enough. The step always runs, but it does not mean reading 300 lines of JSON. The ticket 03 smoke run already used the index this way, through a search.
  - Step 4 lists the note families: chapter notes, solver notes (`solvers/`), runbooks, the visualization standard (`visualization.md`), and "when present" the benchmark-cases note and book source notes. The runbook guidance and the `{{matlab_helpers}}` pointer moved into this step.
  - Step 5 is a targeted page range of a book PDF in `{{knowledge_base}}/sources/`. The range comes from the route, the concept entry or a source note, and is cited. Another book is read only through its source note.
- **Optional notes are named in words, not paths.** The template says to check the hub or the routing map for the benchmark-cases note and the source notes. Tickets 12 and 15 must list their new notes in the hub or the routing map for the agent to use them. `check` rejects a backticked hub reference to a missing file, so the hub cannot list them in advance.
- **Evidence tags.** The format lines are `[textbook: <source> <section/pages>]` and `[inference]`, and every claim carries one.
  - Pages are PDF pages, as in the notes and the routing map.
  - The textbook example was checked against the PDF: COA §3.5 "Gaussian Beams" starts on PDF p. 198, and p. 201 gives the 10–50 wavelength initial beamwidth.
  - The two-tag scheme has no tag for guidance from notes that cite no book, such as runbooks and the visualization standard. v1 tags it `[inference]` (no book page states it) and names the note under the sources used. A third tag would need a spec decision.
- **Glossary conflict (not edited).** `GLOSSARY.md` still defines **Evidence tag** with "a paper's finding", and it still has **Uncurated evidence**, **Paper card** and **Topic synthesis**. ADR 0005 withdrew all four. This needs `/domain-modeling`.
- **Search hint.** One line in each file says to search for literal text (a fixed-string search) or escape regex metacharacters, with `k_{rm}` as the example. It names no harness tool, and neither file has a backslash or a triple quote, so the Codex TOML body needs no extra escaping.
- **Ray-methods route.** `routing-map.yaml` lists `solvers/solver-bellhop.md` after the chapter note, in the same order as the other routes.
  - The concept index had no ray concepts. It gains `gaussian_beam` and `eigenray`, each with bucket `ray_methods`, primary note `chapters/ch03-ray-methods.md` and secondary note `solvers/solver-bellhop.md`. This mirrors KRAKEN under `normal_modes` and RAM under `parabolic_equation`. Their fallback windows are `anomalies_and_gaussian_beams` and `numerical_solution_and_eigenrays`.
  - Two cases cover them. Both failed before the concept-index change ("got no match").
  - **Gap:** cases resolve through the concept index, so no case asserts a route's `notes` list. Nothing fails if the BELLHOP entry is removed from the ray route; `check` only confirms that every listed note exists. An optional `route_notes` expectation in `evaluateCase` would close this gap; it is left for a follow-up.
- **Hub and routing map aligned.** The hub's "Default retrieval policy" and the routing map's `policy.default_order` now state the v1 order, so the first file the agent reads agrees with its template. Both also gain the tag rule. The YAML item is quoted because it contains `: `.
- **Smaller changes.**
  - The router's version is now 0.2.0.
  - The router's buckets gain "visualization of TL and fields" (the `visualization` route already existed).
  - The agent's topic list gains plotting to the visualization standard.
  - The template frontmatter (`name`, `description`) and its placeholders are unchanged. Full `{{knowledge_base}}/…` paths stay in the file lists, because the install tests look for the absolute hub and routing-map paths.
- **Reinstall and smoke (orchestrator).**
  - Link mode already shows the knowledge-base changes. The agent and the router are rendered files, so `install` must run again for each harness. It replaces unchanged installer output without a backup.
  - Smoke candidate: "What initial beamwidth should Gaussian beam tracing use, and why?" The answer should cite §3.5, PDF pp. 198–201, with tags.
  - Alternative: a normal-mode cutoff question. `ch05-normal-modes.md` has no cutoff formulas, so the answer must fall back to PDF pp. 354–372.
