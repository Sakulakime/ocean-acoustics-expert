# Book PDFs live in the knowledge base; papers are out of scope

The five books the expert reads are copied from Zotero into `knowledge/sources/`: *Computational Ocean Acoustics* (COA) and the monographs by Collins & Siegmann, Colosi, Etter (5th ed.) and Brekhovskikh & Lysanov. They are committed to git and shipped in the package. Notes point at a book's PDF by its path inside the knowledge base. The Zotero item key stays only as a bibliographic identifier, so the expert no longer needs Zotero storage at answer time.

Journal and conference papers are no longer part of the knowledge base. v1 drops paper cards, topic syntheses, the ingestion skill and full-text search of Zotero caches.

This reverses two earlier decisions:

- **ADR 0004's "no bundled sources" rule.** That rule kept the package free of copyrighted, large PDFs and resolved them per machine through Zotero storage. The user chose a self-contained knowledge base instead, accepting the copyright and size cost for five books (about 95 MB, each under 50 MB).
- **ADRs 0001 and 0002.** Paper cards and long-tail grep only existed to serve papers.

Zotero itself is never modified: books are copied, not moved.

## Consequences

- **The repository must stay private.** It now redistributes copyrighted books. `"private": true` in `package.json` stops npm from publishing. Pushing remains the user's decision (spec, story 47). Once a book is committed, removing it later means rewriting git history.
- **Packaging and installs.** The `files` whitelist includes `knowledge/sources/*.pdf`. Copy-mode installs carry the books, and link-mode installs see them through the link.
- **The local path map loses `zotero_storage`.** Notes have no Zotero storage location left to name. Zotero keys remain in source notes, as citation identifiers only.
- **Book fallbacks read page ranges of the PDFs in `sources/`.** Zotero's outline and full-text cache are not used, so the 100-page cache limit no longer matters.
- **Doctor checks the knowledge base, not the Zotero library.** It verifies that every PDF the notes point at exists in the installed copy.
- **Evidence tags shrink.** They become textbook and inference only; there are no `[paper: …]` tags and no uncurated evidence.
