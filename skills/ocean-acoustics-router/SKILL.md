---
name: ocean-acoustics-router
description: This skill should be used when the user asks about underwater acoustics, ocean acoustic propagation, transmission loss, sound-speed effects, ray methods, normal modes, parabolic equations, wavenumber integration, broadband propagation, ambient noise, sonar equation, beamforming, or matched-field processing. It routes the request through the local COA structured notes first and only falls back to the local PDF when the notes are insufficient.
version: 0.1.0
---

# Ocean Acoustics Router

Route underwater acoustics questions through the global COA knowledge base before reading the source PDF.

## Knowledge sources

- Hub: `/home/jay/.claude/knowledge/ocean-acoustics/00-hub.md`
- Source note: `/home/jay/.claude/knowledge/ocean-acoustics/01-source-coa.md`
- Topic routing: `/home/jay/.claude/knowledge/ocean-acoustics/routing-map.yaml`
- Reverse concept map: `/home/jay/.claude/knowledge/ocean-acoustics/concept-index.yaml`
- Workflow guide: `/home/jay/.claude/knowledge/ocean-acoustics/workflows/model-selection.md`
- Chapter notes: `/home/jay/.claude/knowledge/ocean-acoustics/chapters/`
- Fallback PDF: `/home/jay/Zotero/storage/B4W6S79R/Jensen 等 - 2011 - Computational Ocean Acoustics.pdf`
- Fallback text cache: `/home/jay/Zotero/storage/B4W6S79R/.zotero-ft-cache`

## Mandatory retrieval order

1. Read `00-hub.md`
2. Read `routing-map.yaml`
3. Read `concept-index.yaml` when the prompt names a specific concept or subsection idea
4. Read the smallest relevant note set
5. Only if note coverage is insufficient, read the smallest relevant PDF or text-cache segment
6. Answer with both physical interpretation and model-assumption clarity

## Classification buckets

- fundamentals / environment
- wave propagation theory
- ray methods
- wavenumber integration
- normal modes
- parabolic equations
- finite-difference / finite-element / boundary-element methods
- broadband modeling
- ambient noise
- signals in noise / sonar signal processing
- model selection across methods

## Routing payload

Before deep analysis, produce this compact routing payload for yourself:
- `bucket`: one classification bucket
- `concept`: matched concept from `concept-index.yaml` when applicable
- `notes`: selected note paths
- `fallback_windows`: relevant targeted PDF windows from `routing-map.yaml`
- `fallback_reason`: only set when notes are insufficient

## Expected answer structure

1. Physical setting
2. Governing idea or model family
3. Assumptions and validity range
4. Numerical or signal-processing implications
5. Which COA notes or PDF ranges were used

## Escalation rule

When the answer needs exact derivations, exact equations, subtle caveats, or section-specific evidence not present in the notes, consult the local COA PDF or `.zotero-ft-cache` selectively using the targeted fallback windows from `routing-map.yaml`. Never load the whole book.

If `.zotero-ft-cache` is used, cite section headings rather than invented page numbers.

## Preferred specialized executor

For deep underwater acoustics tasks, use the `ocean-acoustics-expert` agent after this skill has selected the routing payload.
