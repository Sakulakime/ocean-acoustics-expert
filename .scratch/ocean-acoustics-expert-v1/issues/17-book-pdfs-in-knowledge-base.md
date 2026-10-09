# 17: Book PDFs in the knowledge base; Zotero no longer needed at answer time

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADR 0005)

**What to build:** The five books the expert reads become part of the knowledge base.

- Their PDFs are copied from Zotero into `knowledge/sources/` under stable names. Zotero itself stays untouched.
- The PDFs are committed to git and shipped in the package.
- Notes point at a book's PDF by its path inside the knowledge base. They keep the Zotero item key only as a bibliographic identifier, so the expert no longer depends on Zotero storage at answer time.
- `check` verifies that every PDF a note points at exists.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Five PDFs copied read-only from Zotero storage into `knowledge/sources/`, byte-identical to the originals, with stable lower-case ASCII names (author-year-short-title):
  - COA: Jensen et al. 2011 (item `NWQ228R5`, attachment `B4W6S79R`)
  - Collins & Siegmann 2019, *Parabolic Wave Equations with Applications* (`SSSAYTZ4` / `AUZ6UZ8D`)
  - Colosi 2016, *Sound Propagation through the Stochastic Ocean* (`KPCLPWMR` / `HXJGK3LT`)
  - Etter 2018, *Underwater Acoustic Modeling and Simulation*, 5th ed. (`79KZ6RYC` / `YRB8HB36`)
  - Brekhovskikh & Lysanov 2003, *Fundamentals of Ocean Acoustics* (`ICAQF4XZ` / `TZIJC9DS`)
- [ ] Zotero storage and database unchanged (copy only)
- [ ] Hub, COA source note, routing map and chapter notes point at the COA PDF by its `sources/…` path instead of `zotero_storage_key`
  - [ ] The source note keeps `zotero_key` (the item key)
  - [ ] References to Zotero artifacts (Jasminum outline, `.zotero-ft-cache`) are removed
- [ ] `zotero_storage` removed from the local path map schema and the hub, so `check` rejects `{{zotero_storage}}`
- [ ] `check` fails with a specific message on a fixture note pointing at a source PDF that does not exist
- [ ] PDFs are tracked by git, included by the package `files` whitelist (verified with `npm pack --dry-run`), and each under 50 MB
- [ ] `check` passes on the authoring copy and all route-selection cases still pass
