# 16: Second batch, Acoustics/Deep Learning

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** Every item of the `Acoustics/Deep Learning` collection (118 at time of writing) that has a PDF and no existing card becomes a draft paper card, produced one subagent per card. The topic syntheses are extended to cover the new cards, with new topics added where the batch warrants them.

**Blocked by:** 11

**Status:** wontfix

- [ ] Items already carded in the first batch are skipped (deduplicated by Zotero key)
- [ ] Every remaining item with a PDF has a card; skipped items listed in this ticket's comments with the reason
- [ ] Syntheses updated (tables, agreements, disagreements, gaps) to include the new cards; any new topic gets a synthesis, routes and route-selection cases
- [ ] `check` passes after the batch

## Comments

**Won't fix (ADR 0005 (2026-10-10)).** Journal and conference papers are out of scope for the knowledge base. v1 drops paper cards, topic syntheses, the ingestion skill and full-text search of Zotero caches.
