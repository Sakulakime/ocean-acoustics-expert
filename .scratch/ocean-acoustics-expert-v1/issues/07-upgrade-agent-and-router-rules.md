# 07: Upgrade the agent's retrieval and answer rules

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADR 0002)

**What to build:** The expert follows the v1 retrieval order and labels every claim with an evidence tag. The order is: hub → routing map → concept index → smallest note set → book fallback window → paper full text, with full-text hits reported as uncurated evidence. Book fallbacks read targeted PDF page ranges, so deep-COA questions stop silently failing past page 100. The template and router reference every note family: concept index, solver notes, visualization standard, and, when present, benchmark cases, topic syntheses and paper cards. The ray-methods route gains the BELLHOP solver note.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Template and router state the v1 retrieval order and the evidence-tag formats `[textbook: …]`, `[paper: Author Year, zotero_key, section]`, `[inference]`, plus the uncurated-evidence label
- [ ] Book fallbacks are page-range PDF reads; the Zotero full-text cache is used only for papers
- [ ] Template and router reference concept index, solver notes and visualization standard, and the benchmark cases, syntheses and cards when present
- [ ] Ray-methods route lists the BELLHOP solver note; a route-selection case covers it
- [ ] `check` passes; reinstall propagates the new rules to every installed harness
- [ ] Smoke: a question whose evidence lies beyond COA page 100 is answered with a cited page-range read and evidence tags
