# Long-tail retrieval greps full text instead of using the vector cache

Papers without a paper card are still reachable: the agent greps their Zotero full-text cache and labels what it finds as uncurated evidence. A 275 MB FAISS cache from `pdf-vector-search` already covers COA, Etter, Colosi, Brekhovskikh and many ML papers, so semantic search was the obvious alternative. We rejected it because it needs the `pdf-rag` MCP server or Bash plus a cloud embedding API, which would break the agent's read-only tool set (Read/Grep/Glob) and would not port to every harness.

## Consequences

- Zotero's full-text cache indexes only the first 100 pages of each PDF. That is enough for papers but not for books, so book fallbacks read targeted PDF page ranges directly and never use the cache.
