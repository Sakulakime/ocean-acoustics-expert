# 02: Remove machine paths from the knowledge base

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADR 0004)

**What to build:** Notes in the authoring copy no longer contain absolute machine paths. They name sources by Zotero key and tools by logical names defined in the local path map schema. The MATLAB helpers read toolbox locations from a configuration function instead of hard-coded literals. `check` enforces both rules, so a machine path can never creep back in.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Local path map schema defined with logical names for: installed knowledge-base root, Zotero storage, the Acoustics Toolbox trees the runbooks currently use (2023 tree; 2020 tree for plotting), MATLAB helpers, and authoring root (link mode only)
- [ ] Every absolute-path occurrence in notes rewritten to a Zotero key or logical name (34 occurrences across 16 files when the spec was written); routes and source notes reference the COA PDF by Zotero key
- [ ] `check` fails with a specific message on a fixture note containing an absolute path, and on one using an undefined logical name
- [ ] MATLAB helpers obtain toolbox locations from a configuration function; the repo ships an example configuration; no hard-coded machine paths remain in the helpers or their README
- [ ] `check` passes on the authoring copy and all route-selection cases still pass
