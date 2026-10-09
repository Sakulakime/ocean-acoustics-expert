# 08: Paper card schema and ingestion skill, one card end to end

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADRs 0001, 0004)

**What to build:** Saying "add this paper to the knowledge base" turns one Zotero item into a paper card the expert can cite. The ingestion skill:

1. reads Zotero metadata read-only: local API when Zotero runs, otherwise the database opened immutable
2. reads the PDF
3. writes a draft card in the authoring copy
4. creates or updates the matching topic synthesis skeleton
5. adds route and concept-index entries
6. runs `check`

It refuses in copy mode, and refuses to duplicate an existing card unless an update is requested. `check` learns the card schema.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] Card schema as in the spec (frontmatter fields, body sections, `status` draft|reviewed, schema version); `check` validates required fields and unique `zotero_key`, with failing fixtures for each
- [ ] Ingestion skill shipped in the repo and installed through the shared skills folder by `install`
- [ ] Accepts a Zotero key, DOI, title, or collection name; never writes to the Zotero library or database
- [ ] Refuses when no authoring root is configured (copy mode) and when a card for the key exists without an explicit update request
- [ ] One real paper from `Research-CP-Acoustics-2026` ingested end to end; `check` passes
- [ ] Smoke: the expert answers a question about that paper with a `[paper: …]` tag and its conditions
