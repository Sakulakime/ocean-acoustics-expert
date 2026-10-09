# One installed knowledge base, no machine paths in notes, no bundled sources

> **Amended by ADR 0005 (2026-10-10):** the five book PDFs now live in `knowledge/sources/` and ship with the package, and the local path map no longer has a Zotero storage entry. The single installed copy and the logical names for tools still stand.

The knowledge base is installed once to `~/.local/share/ocean-acoustics-expert/`, and every harness's agent points there by an absolute path rendered at install time. Per-harness copies would drift, and placing the knowledge base inside a skill folder would tie it to one skill. Notes never contain absolute paths. They name sources by Zotero key and tools by logical name, and a generated `local-paths.yaml` maps those names to this machine (Zotero storage, Acoustics Toolbox, MATLAB helpers). The package never bundles source PDFs: they are copyrighted, large, and already in each user's own library.

## Consequences

- Ingestion writes only to the authoring copy, the knowledge base inside the project repo. On the author's machine the installed copy is a symlink to it (link mode). In copy mode the ingestion skill refuses to run, so a reinstall cannot overwrite new cards.
- The existing route-selection regression test (`~/.claude/hooks/tests/ocean-acoustics-route-selection-regression.js`, 11 cases) moves into the repo and runs against the authoring copy.
