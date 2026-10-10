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
