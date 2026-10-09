# 02: Remove machine paths from the knowledge base

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md` (ADR 0004)

**What to build:** Notes in the authoring copy no longer contain absolute machine paths. They name sources by Zotero key and tools by logical names defined in the local path map schema. The MATLAB helpers read toolbox locations from a configuration function instead of hard-coded literals. `check` enforces both rules, so a machine path can never creep back in.

**Blocked by:** 01

**Status:** done

- [x] Local path map schema defined with logical names for: installed knowledge-base root, Zotero storage, the Acoustics Toolbox trees the runbooks currently use (2023 tree; 2020 tree for plotting), MATLAB helpers, and authoring root (link mode only)
- [x] Every absolute-path occurrence in notes rewritten to a Zotero key or logical name (34 occurrences across 16 files when the spec was written); routes and source notes reference the COA PDF by Zotero key
- [x] `check` fails with a specific message on a fixture note containing an absolute path, and on one using an undefined logical name
- [x] MATLAB helpers obtain toolbox locations from a configuration function; the repo ships an example configuration; no hard-coded machine paths remain in the helpers or their README
- [x] `check` passes on the authoring copy and all route-selection cases still pass

## Comments

**Implemented on `develop`.** `check` now rejects absolute machine paths and undefined logical names. It covers the authoring copy and the bundled MATLAB helpers. 37 subprocess tests pass, and the 11 route-selection cases still pass. The following were deliberate decisions or deviations:

- **Logical-name syntax: `{{name}}`.** The schema is `src/local-paths.js`, with these names:
  - `knowledge_base`
  - `zotero_storage`
  - `at_2023`
  - `at_2020`
  - `matlab_helpers`
  - `authoring_root` (link mode only)

  The hub documents the names for the agent. YAML values that start with a name must be quoted, because `{` opens a flow mapping.
- **Two Zotero key fields.** `B4W6S79R` is the PDF attachment, which is also the storage-folder key. The library item is `NWQ228R5`. To match the spec's use of `zotero_key` for the item, the fields are:
  - `zotero_key`: the item. Only the source note carries it.
  - `zotero_storage_key`: the folder `{{zotero_storage}}/<key>/` that holds the PDF. Chapter notes and the hub carry it, and the routing map carries it as `primary_zotero_storage_key`.

  Ticket 08 should keep this split for paper cards. Ticket 06 (doctor) should resolve PDFs through `zotero_storage_key`.
- **Absolute-path rule.** A match is a POSIX path of two or more segments, a Windows drive, UNC or `%VAR%` path, `~/` or `$HOME/`, or a `file://` URI. It must not continue a word, number, closing bracket or other path, so units, fractions, URLs, relative paths and `{{name}}/…` all pass.
  - `/path/to/…` is allowed as a placeholder unless it climbs out with `..`.
  - `~user/` is deliberately not matched, because it collides with notation like `~k/2`.
- **`/usr/local/bin/matlab`** became "matlab (on PATH)". Scratch run directories became `/path/to/ram_run`.
- **`check` lints the MATLAB helpers.** It does so by default when run without `--kb`, or with a new `--helpers <dir>` option that pairs with fixtures the same way `--cases` does. This replaced a separate test that read files directly; that test duplicated the path definition and asserted on a private MATLAB function.
  - The local `oae_local_paths.m` is skipped by design. It is git-ignored and excluded from the package `files` list (verified with `npm pack --dry-run`).
- **MATLAB configuration.** The runners call `oae_local_paths()` and read `at_2020` and `at_2023`. An explicit `AtRoot`/`RamBin` still takes precedence, and a missing configuration raises `<runner>:noConfig`. The repo ships `tools/matlab/oae_local_paths.m.example`.
  - Smoke-tested on MATLAB R2025b: BELLHOP `MunkB_Coh`, KRAKEN `MunkK` and the shipped RAM `ram.in` all run from the configuration.
- **Handoff to 03:**
  - Generate `local-paths.yaml` from `LOCAL_PATHS` and `oae_local_paths.m` with `at_2020` and `at_2023`, and put the latter on the MATLAB path.
  - The hub says the agent definition gives the path map's location; the rendered template must do so.
  - `agent/` and `skills/` still hold absolute paths. They are raw material for ticket 03 (rendering) and ticket 07 (rules) and are outside this ticket's scope ("notes in the authoring copy").
- **Pre-existing bug (not fixed here).** `run_bellhop`, `run_kraken` and `run_ram` prepend `genpath(<at_2020>/Matlab)`. The toolbox's own `Matlab/Slicer/run_ram.m` then shadows ours for the rest of the MATLAB session, so calling `run_ram` after one of them fails.
- **Glossary gap** for `/domain-modeling`: "logical name", "local path map".
