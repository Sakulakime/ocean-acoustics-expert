# 05: Install into OpenCode

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADR 0003)

**What to build:** `install --harness opencode` gives OpenCode a working, read-only expert subagent. The adapter renders a native agent markdown file whose `permission` block enforces read-only use: edit, bash and webfetch are denied, and `external_directory` allows the installed copy, Zotero storage and toolbox paths. OpenCode reads the router from the shared skills folder. Whether the Claude symlink makes the router appear twice is observed and handled.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Rendered agent has `mode: subagent` and a `permission` block (edit/bash/webfetch denied; `external_directory` allows the installed copy, Zotero storage and toolbox paths); it does not rely on a `tools` array; frontmatter parses (subprocess test with fake home)
- [ ] Manifest, dry-run, idempotency and `uninstall --restore` cover the OpenCode files
- [ ] Real install on this machine; smoke in OpenCode: a COA theory question is answered with no permission prompt for knowledge-base reads
- [ ] Observed behaviour of the router being visible through both the Claude skills folder and the shared skills folder recorded in this ticket's comments; if it causes duplicate or conflicting skills, a mitigation is implemented and covered by a test
