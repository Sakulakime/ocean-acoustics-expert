# 07: Upgrade the agent's retrieval and answer rules

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADR 0002)

**What to build:** The expert follows the v1 retrieval order and labels every claim with an evidence tag. The order is: hub → routing map → concept index → smallest note set → book fallback window. Book fallbacks read targeted page ranges of the PDFs in `knowledge/sources/`, so deep-COA questions stop silently failing past page 100. The template and router reference every note family: concept index, solver notes, visualization standard, and, when present, benchmark cases and book source notes. The ray-methods route gains the BELLHOP solver note.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Template and router state the v1 retrieval order and the evidence-tag formats `[textbook: …]` and `[inference]`
- [ ] Book fallbacks are page-range reads of the PDFs in `knowledge/sources/`; no Zotero cache is used
- [ ] Template and router reference concept index, solver notes and visualization standard, and the benchmark cases and book source notes when present
- [ ] Ray-methods route lists the BELLHOP solver note; a route-selection case covers it
- [ ] `check` passes; reinstall propagates the new rules to every installed harness
- [ ] Smoke: a question whose evidence lies beyond COA page 100 is answered with a cited page-range read and evidence tags

## Comments

**Partly done by ticket 03 (2026-10-10).** The agent template and the router no longer mention the Zotero PDF or `.zotero-ft-cache`. To make the rendered files point only at the installed copy, ticket 03 made three changes:
- the fallback source is now `{{knowledge_base}}/sources/jensen-2011-computational-ocean-acoustics.pdf`;
- fallbacks are worded as page-range reads;
- the "cite section headings when using `.zotero-ft-cache`" rule is gone.

The retrieval order, the evidence tags and the note-family references are still to do here.
