---
name: ocean-acoustics-router
description: This skill should be used when the user asks about underwater acoustics, ocean acoustic propagation, transmission loss, sound-speed effects, ray methods, normal modes, parabolic equations, wavenumber integration, broadband propagation, ambient noise, sonar equation, beamforming, or matched-field processing. It routes the request through the local COA structured notes first and only falls back to the local PDF when the notes are insufficient.
version: 0.1.0
---

# Ocean Acoustics Router

Route underwater acoustics questions through the global COA knowledge base before reading the source PDF.

## Knowledge sources

- Hub: `{{knowledge_base}}/00-hub.md`
- Source note: `{{knowledge_base}}/01-source-coa.md`
- Topic routing: `{{knowledge_base}}/routing-map.yaml`
- Reverse concept map: `{{knowledge_base}}/concept-index.yaml`
- Workflow guide: `{{knowledge_base}}/workflows/model-selection.md`
- Chapter notes: `{{knowledge_base}}/chapters/`
- Fallback PDF: `{{knowledge_base}}/sources/jensen-2011-computational-ocean-acoustics.pdf`
- Local path map (resolves the double-brace logical names in notes): `{{local_path_map}}`

## Mandatory retrieval order

1. Read `00-hub.md`
2. Read `routing-map.yaml`
3. Read `concept-index.yaml` when the prompt names a specific concept or subsection idea
4. Read the smallest relevant note set
5. Only if note coverage is insufficient, read the smallest relevant PDF page range
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

When the answer needs exact derivations, exact equations, subtle caveats, or section-specific evidence not present in the notes, read the COA PDF selectively using the targeted fallback windows (PDF page ranges) from `routing-map.yaml`. Never load the whole book.

## Preferred specialized executor

For deep underwater acoustics tasks, use the `ocean-acoustics-expert` agent after this skill has selected the routing payload.
