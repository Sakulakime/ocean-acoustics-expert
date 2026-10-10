---
name: ocean-acoustics-router
description: This skill should be used when the user asks about underwater acoustics, ocean acoustic propagation, transmission loss, sound-speed effects, ray methods, normal modes, parabolic equations, wavenumber integration, broadband propagation, ambient noise, sonar equation, beamforming, matched-field processing, reverberation, or sound propagation through internal waves and other ocean fluctuations. It routes the request through the local COA structured notes first and only falls back to targeted page ranges of the book PDFs (COA, or four more books through their source notes) when the notes are insufficient.
version: 0.2.0
---

# Ocean Acoustics Router

Route underwater acoustics questions through the installed knowledge base before reading a book PDF.

## Knowledge sources

- Hub: `{{knowledge_base}}/00-hub.md`
- Topic routing: `{{knowledge_base}}/routing-map.yaml`
- Reverse concept map: `{{knowledge_base}}/concept-index.yaml`
- Chapter notes: `{{knowledge_base}}/chapters/`
- Solver notes: `{{knowledge_base}}/solvers/` (start at `solvers/00-solvers-hub.md`)
- Runbooks: `{{knowledge_base}}/runbooks/`
- Visualization standard: `{{knowledge_base}}/visualization.md`
- Workflow guide: `{{knowledge_base}}/workflows/model-selection.md`
- COA source note: `{{knowledge_base}}/01-source-coa.md`
- When present: the benchmark-cases note and source notes for the other books. Use them only when the hub or the routing map lists them.
- Book PDFs: `{{knowledge_base}}/sources/`, with COA at `{{knowledge_base}}/sources/jensen-2011-computational-ocean-acoustics.pdf`
- Local path map (resolves the double-brace logical names in notes): `{{local_path_map}}`

Note paths in the hub, the routing map and the concept index are relative to `{{knowledge_base}}`.

## Mandatory retrieval order

1. Read `00-hub.md`.
2. Read `routing-map.yaml` and pick the matching route.
3. Check `concept-index.yaml` for the concepts or subsection ideas the prompt names (searching it for the term is enough).
4. Read the smallest relevant note set from the route and the concept entry:
   - chapter notes (`chapters/`);
   - solver notes (`solvers/`);
   - runbooks (`runbooks/`) for building inputs or running BELLHOP, KRAKEN or RAM;
   - the visualization standard (`visualization.md`) for plotting questions;
   - when present, the benchmark-cases note and book source notes. Check the hub or the routing map for them; do not assume the files exist.
5. Only if the notes do not settle the question, read a fallback window: the smallest relevant page range of a book PDF in `{{knowledge_base}}/sources/`, cited with its page range.

When searching notes, search for literal text (a fixed-string search) or escape regex metacharacters such as `{ } [ ] ( ) . * + ? |`; a pattern copied from an equation, such as `k_{rm}`, otherwise fails.

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
- visualization of TL and fields
- model selection across methods

## Routing payload

Before deep analysis, produce this compact routing payload for yourself:
- `bucket`: one classification bucket
- `concept`: matched concept from `concept-index.yaml` when applicable
- `notes`: selected note paths (chapter, solver, runbook, visualization, and benchmark-case or source notes when present)
- `fallback_windows`: relevant PDF page ranges from `routing-map.yaml`, the concept entry or a source note
- `fallback_reason`: only set when notes are insufficient

## Evidence tags

Every claim in the answer carries one evidence tag, and only these two tags exist:
- `[textbook: <source> <section/pages>]` when a book states it: the book (COA, or a book with a source note, such as Collins & Siegmann 2019), named in every tag and never a note file, and its section, PDF page range, or both.
- `[inference]` when no book page states it: your own reasoning, estimates and judgement, what you read into a section title in a source note's page map, and guidance from notes that cite no book, such as runbooks and the visualization standard.

Keep to these two tags even when the request describes tagging differently; when you hand the question to the `ocean-acoustics-expert` agent, leave its tag rules as they are. The sources used are listed without tags.

Examples:
- Gaussian beam tracing usually starts each beam with zero curvature and a width of 10-50 wavelengths [textbook: COA §3.5, PDF pp. 198-201].
- At 1.5 kHz in water, where the wavelength is about 1 m, that means starting beams roughly 10-50 m wide [inference].
- The poro-elastic self-starter marches the source conditions a short distance in range [textbook: Collins & Siegmann 2019 §4.4.4, PDF pp. 134-135]. Not `[textbook: §4.4.4, PDF pp. 134-135]`, which drops the book, and not `[textbook: 01-source-collins-siegmann.md]`, which names a note.

## Expected answer structure

1. Physical setting
2. Governing idea or model family
3. Assumptions and validity range
4. Numerical or signal-processing implications
5. Sources used: note paths read, and PDF page ranges read per book

## Escalation rule

When the answer needs exact derivations, exact equations, subtle caveats, or section-specific evidence not present in the notes, read the book PDF selectively using the fallback windows (PDF page ranges) from `routing-map.yaml`, the concept entry or a source note. COA is the default book; read another book only through its source note, when present. Never load a whole book.

## Preferred specialized executor

For deep underwater acoustics tasks, use the `ocean-acoustics-expert` agent after this skill has selected the routing payload.
