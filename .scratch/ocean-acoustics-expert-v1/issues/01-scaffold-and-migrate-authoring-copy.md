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

**Status:** done

- [x] ES-module package with a single `bin` entry, no runtime dependencies, tests run with `node:test`
- [x] Knowledge base, router skill, agent definition and MATLAB helpers copied into the repo; no source PDFs or Zotero caches copied, and the `files` whitelist would exclude them
- [x] `check` exits 0 on the authoring copy and runs the 11 route-selection cases, all passing
- [x] `check` verifies that every note referenced by the hub, routing map and concept index exists
- [x] `check` exits non-zero with a specific message on a fixture knowledge base containing a dangling note reference
- [x] Tests drive `check` only as a subprocess (the spec's single seam)
- [x] Live files under the Claude, Codex and shared-skills folders are untouched

## Comments

**Implemented on `develop`.** `check` validates the authoring copy and runs the 11 route-selection cases; 19 subprocess tests pass. The following were deliberate decisions or deviations:

- **Hub link removed.** `knowledge/00-hub.md` no longer references `../hooks/tests/skill-forced-eval-underwater-regression.js`. That suite stays with Claude Scholar, and the reference was already dangling in the original: it resolved to `~/.claude/knowledge/hooks/…`.
- **New `--cases <file>` option** for `check`. It lets fixture knowledge bases be paired with fixture cases. Without `--kb`, `check` uses the bundled cases.
- **Integrity checks run on every concept.** These are: notes exist, route exists, fallback window defined and belonging to the concept's route. The prior-art script ran them only for concepts some case happened to hit. Route-selection cases now compare only expected vs resolved routing.
- **Strict YAML subset parser.** `routing-map.yaml` is parsed by a strict parser that raises on unsupported syntax instead of misreading it.
- **Packaging excludes source documents.** The `files` whitelist negates `**/*.pdf` and `**/.zotero-*`. Verified with planted files.
- **Deferred to ticket 02:** a rule against absolute machine paths in notes.
- **Known limit:** the hub check sees only backticked references, which are the only form the hub uses today. Markdown or wiki links would need a new rule.
