# 06: `doctor` and README

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** Two things. First, a `doctor` command that diagnoses any installation in one step and reports problems without fixing them. Second, a README that lets a colleague install and use the expert without the author. This closes the installer for people other than the author.

**Blocked by:** 04, 05

**Status:** ready-for-agent

- [ ] `doctor` checks:
  - [ ] every path-map entry exists
  - [ ] each installed harness file parses and points at the installed copy
  - [ ] skill symlinks resolve
  - [ ] each Zotero key referenced by notes has a PDF in the configured Zotero storage (missing ones listed)
  - [ ] duplicate skill names visible to OpenCode
- [ ] `doctor` exits non-zero with a specific message for each failure class, each covered by a fake-home fixture test; it never modifies files
- [ ] README covers:
  - [ ] what the expert is
  - [ ] supported harnesses
  - [ ] pinned-tag `npx github:` install
  - [ ] link vs copy mode
  - [ ] path overrides
  - [ ] `status` / `doctor` / `check` / `uninstall`
  - [ ] ingestion (link mode only)
  - [ ] the no-bundled-sources policy
- [ ] Nothing pushed, tagged or published
