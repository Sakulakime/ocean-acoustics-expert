# 11: Finish the topic syntheses for the first batch

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** Each topic synthesis becomes a usable related-work backbone. It gets:

- a comparison table of its cards (method, environment, ground truth, metric, headline result)
- the cards' agreements
- their disagreements
- the gaps they leave

All claims carry evidence tags. Literature questions now route to syntheses first.

**Blocked by:** 10

**Status:** wontfix

- [ ] Every synthesis has the comparison table plus agreements, disagreements and gaps, each claim evidence-tagged and linked to cards
- [ ] Routing map and concept index route literature questions per topic to its synthesis
- [ ] At least one route-selection case per topic; `check` passes
- [ ] Smoke: "what has been done on ML surrogates for TL prediction" returns a synthesis-based comparison with `[paper: …]` tags

## Comments

**Won't fix (ADR 0005 (2026-10-10)).** Journal and conference papers are out of scope for the knowledge base. v1 drops paper cards, topic syntheses, the ingestion skill and full-text search of Zotero caches.
