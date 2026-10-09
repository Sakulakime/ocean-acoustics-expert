# 12: Source notes and page maps for four monographs

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** The expert can answer from Collins & Siegmann (*Parabolic Wave Equations*), Colosi (*Sound Propagation through the Stochastic Ocean*), Etter (5th ed.) and Brekhovskikh & Lysanov. For each book, a source note gives the bibliographic record, the Zotero item key, the path of its PDF in `knowledge/sources/` (ticket 17), the book-page to PDF-page offset, and a section → PDF page-range map. The agent reads targeted page ranges of these books when COA does not settle a question. No chapter notes are written for them.

**Blocked by:** 07, 17

**Status:** ready-for-agent

- [ ] Four source notes in the spec's source-note schema; Collins & Siegmann's page map built from the PDF itself (it has no Zotero text cache)
- [ ] Routing map lists their fallback windows under the matching routes
- [ ] Route-selection cases cover at least one fallback window per book; `check` passes
- [ ] Smoke: a parabolic-equation question beyond COA's coverage is answered with a cited Collins & Siegmann page-range read and a `[textbook: …]` tag
