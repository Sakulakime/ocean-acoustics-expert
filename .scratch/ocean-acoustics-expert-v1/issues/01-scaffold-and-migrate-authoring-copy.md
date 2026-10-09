# 01: Scaffold the package and migrate the authoring copy behind `check`

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** The repo becomes a working zero-dependency Node package. Its `check` command validates the authoring copy of the knowledge base. Copied into the repo:

- the current knowledge base
- the router skill
- the agent definition (kept as the raw material for the later template)
- the MATLAB solver helpers
- the route-selection regression suite with its fixtures, rewired to read the authoring copy instead of the Claude folder

Nothing on the live machine changes in this ticket.

Deviation from the spec: only the route-selection suite moves. The forced-skill-eval suite tests Claude Scholar's own hook, which is out of scope, so it stays where it is.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] ES-module package with a single `bin` entry, no runtime dependencies, tests run with `node:test`
- [ ] Knowledge base, router skill, agent definition and MATLAB helpers copied into the repo; no source PDFs or Zotero caches copied, and the `files` whitelist would exclude them
- [ ] `check` exits 0 on the authoring copy and runs the 11 route-selection cases, all passing
- [ ] `check` verifies that every note referenced by the hub, routing map and concept index exists
- [ ] `check` exits non-zero with a specific message on a fixture knowledge base containing a dangling note reference
- [ ] Tests drive `check` only as a subprocess (the spec's single seam)
- [ ] Live files under the Claude, Codex and shared-skills folders are untouched
