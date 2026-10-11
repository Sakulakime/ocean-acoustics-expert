# Public repository; each user supplies the book PDFs

> **Supersedes ADR 0005's bundling of the book PDFs (2026-10-11).** Papers stay out of scope, and the books keep their place and file names in `knowledge/sources/`.

The repository becomes public under the MIT license, so it can no longer carry the five copyrighted books. The PDFs are removed from the package and from the whole git history. Each user puts their own copies into `sources/` of the installed knowledge base under the file names the source notes give; `knowledge/sources/README.md` lists them. Notes keep pointing at a book by its `sources/…` path, so the routing map, the concept index and the evidence tags do not change.

The alternative, restoring ADR 0004's per-machine Zotero lookup, was rejected: it ties every user to the author's Zotero layout, while a fixed folder and fixed file names work with any copy of the right edition.

## Consequences

- **Git and packaging.** Git ignores `knowledge/sources/*.pdf`, and the `files` whitelist no longer includes them. The package drops from about 95 MB to under 1 MB. `"private": true` is gone.
- **Link mode keeps working unchanged.** The author's PDFs sit in the checkout's `knowledge/sources/`, untracked, and the installed copy sees them through the link. In copy mode, install leaves files it did not write alone, so books a user added survive reinstalls and uninstall.
- **Check no longer looks for the PDFs.** It verifies instead that every PDF a note points at is the `source_pdf` of a source note, which catches typos in a path without needing the books.
- **Doctor warns instead of failing.** A book PDF missing from the installed copy is a `WARN` naming where to put it: the notes still answer, and only the page-range fallback for that book is lost.
- **The agent says so when a book is missing.** If a fallback window's PDF is not there, it answers from the notes, says a book fallback is needed, and names the book and page range, as the OpenCode agent already does.
- **Page numbers assume the editions named in the source notes.** A different edition or scan shifts PDF pages; that is the user's to match.
