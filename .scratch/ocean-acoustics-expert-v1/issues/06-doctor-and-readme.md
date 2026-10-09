# 06: `doctor` and README

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** Two things. First, a `doctor` command that diagnoses any installation in one step and reports problems without fixing them. Second, a README that lets a colleague install and use the expert without the author. This closes the installer for people other than the author.

**Blocked by:** 04, 05

**Status:** ready-for-agent

- [ ] `doctor` checks:
  - [ ] every path-map entry exists
  - [ ] each installed harness file parses and points at the installed copy
  - [ ] skill symlinks resolve
  - [ ] every book PDF a note points at exists in the installed copy (missing ones listed)
  - [ ] duplicate skill names visible to OpenCode
- [ ] `doctor` exits non-zero with a specific message for each failure class, each covered by a fake-home fixture test; it never modifies files
- [ ] README covers:
  - [ ] what the expert is
  - [ ] supported harnesses
  - [ ] pinned-tag `npx github:` install
  - [ ] link vs copy mode
  - [ ] path overrides
  - [ ] `status` / `doctor` / `check` / `uninstall`
  - [ ] the bundled-books policy: the package carries five copyrighted book PDFs, so the repository must stay private (ADR 0005)
- [ ] Nothing pushed, tagged or published
