# 09: Pilot ten cards and freeze the card schema

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** About ten papers from `Research-CP-Acoustics-2026` are ingested to calibrate the card template on real papers before scaling. Selection spans the collection's topics: PINN, neural operators, conformal prediction and UQ, DL inversion, differentiable physics, surrogate TL. Template adjustments are applied to every pilot card, the initial topic-synthesis list is settled, and after the user approves the cards the schema is frozen at v1.

**Blocked by:** 08

**Status:** wontfix

- [ ] ~10 pilot cards ingested, covering the collection's main topics
- [ ] Template adjustments, if any, applied uniformly to all pilot cards
- [ ] Initial topic list settled; a synthesis skeleton exists for each topic
- [ ] Pilot cards presented to the user; the user's review is recorded in this ticket's comments
- [ ] After approval: schema frozen at v1, `check` enforces v1, approved cards set to `reviewed`

## Comments

**Won't fix (ADR 0005 (2026-10-10)).** Journal and conference papers are out of scope for the knowledge base. v1 drops paper cards, topic syntheses, the ingestion skill and full-text search of Zotero caches.
