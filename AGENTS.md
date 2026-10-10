# ocean-acoustics-expert

## Agent skills

### Issue tracker

Issues and specs live as local markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Knowledge-base navigation

To find cross-references (which chapter subsections mention a specific benchmark case, equation, or concept):

1. Grep the knowledge base for the entity name: `grep -r "entity_name" knowledge/`
2. Read each hit's surrounding subsection to verify relevance
3. The knowledge base uses consistent terminology from `GLOSSARY.md`, making grep reliable

Example: to find which subsections reference the Pekeris waveguide, grep for "Pekeris" and read the matching subsections in full.
