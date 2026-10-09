# Paper cards live in the knowledge base, not the Obsidian vault

> **Superseded by ADR 0005 (2026-10-10):** papers are out of scope, so there are no paper cards.

The Obsidian vault (OrbitOS) already holds stub notes for ~61 acoustics papers and 18 full notes under `20_项目/Ch4-…/文献/`, so filling those in looked like the obvious path. We instead write paper cards into the knowledge base and leave the vault untouched. A paper card records what a paper says independent of any project; the vault's full notes are project literature notes that judge a paper against one research route. Merging the two would make the agent's evidence project-biased, tie the knowledge base to OrbitOS's custom folder layout, and make it non-portable across harnesses.

## Consequences

- The `zotero_key` is the join key if vault stubs later link back to cards.
- `zotero-obsidian-bridge` is not reused as-is: its `Papers/` layout targets a vault, not this knowledge base.
