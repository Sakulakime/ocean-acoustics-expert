# 10: First batch, the rest of Research-CP-Acoustics-2026

**Spec:** `.scratch/ocean-acoustics-expert-v1/spec.md`

**What to build:** Every remaining item of `Research-CP-Acoustics-2026` that has a PDF becomes a draft paper card under the frozen v1 schema, and its topic synthesis is updated. `Research-DiffPhysics-Inversion-2026-04` holds the same items and adds nothing. Each card is produced by its own subagent so the orchestrating session stays within one context window.

**Blocked by:** 09

**Status:** ready-for-agent

- [ ] Every remaining item with a PDF has a card (~58 at time of writing); no duplicate keys
- [ ] Items without a PDF, or with an unreadable PDF, are listed in this ticket's comments with the reason
- [ ] Each card's topic synthesis skeleton links it
- [ ] `check` passes after the batch
