---
title: Ocean Acoustics Knowledge Hub
type: hub
primary_source: 01-source-coa.md
primary_source_pdf: sources/jensen-2011-computational-ocean-acoustics.pdf
status: active
---

# Ocean Acoustics Knowledge Hub

This library is the default local knowledge base for underwater acoustics questions, with emphasis on propagation modeling and signal processing grounded in *Computational Ocean Acoustics* (COA, 2nd ed.).

## Default retrieval policy

1. Read this hub, then `routing-map.yaml`.
2. Check `concept-index.yaml` for the concepts, subsection ideas or technical terms the question names.
3. Read the smallest relevant note set: chapter notes, solver notes, runbooks and `visualization.md`, plus the benchmark-cases note once this hub lists it. A route or concept may also point at a book's source note.
4. Only when the notes are insufficient, read a fallback window: a targeted page range of a book PDF in `sources/`, cited with its range. A window written as a page range (`473-492`) is COA's. A window with a `source` is another book's: read that source note for the book's PDF and section map, then read the window's pages.
5. Prefer targeted page reads over whole-chapter reads.

## Source of truth

- Primary book: `01-source-coa.md`
- Other books, each with a source note (bibliographic record, page offset, section map) but no chapter notes:
  - `01-source-collins-siegmann.md`: Collins & Siegmann, *Parabolic Wave Equations with Applications* (2019): PE techniques and elastic, poro-elastic and moving-media PEs
  - `01-source-colosi.md`: Colosi, *Sound Propagation through the Stochastic Ocean* (2016): internal waves and acoustic fluctuations
  - `01-source-etter.md`: Etter, *Underwater Acoustic Modeling and Simulation*, 5th ed. (2018): model catalogues, noise, reverberation, sonar performance, model evaluation
  - `01-source-brekhovskikh-lysanov.md`: Brekhovskikh & Lysanov, *Fundamentals of Ocean Acoustics*, 3rd ed. (2003): classical theory of reflection, waveguides, rough-surface scattering and the random ocean
- Topic routing: `routing-map.yaml`
- Reverse concept map: `concept-index.yaml`
- Model comparison: `workflows/model-selection.md`
- Glossary: `glossary.md`
- Chapter notes: `chapters/`
- Solver notes: `solvers/`
- Run recipes (Linux + MATLAB run recipe, input-file format, validators, gotchas):
  - BELLHOP (ray, `.env`): `runbooks/bellhop-runbook.md` (+ `runbooks/bellhop-env-template.md`, `runbooks/bellhop-checklist.md`)
  - KRAKEN (normal modes, `.env`+`.flp` two-stage): `runbooks/kraken-runbook.md` (+ `runbooks/kraken-template.md`, `runbooks/kraken-checklist.md`)
  - RAM (parabolic equation, `ram.in`): `runbooks/ram-runbook.md` (+ `runbooks/ram-in-template.md`, `runbooks/ram-checklist.md`)

When the question is about actually building an input file or running a model (not just the physics), read the matching runbook in `runbooks/` — it has the exact input-file format, the Linux+MATLAB call recipe against the local AT install, a pre-run validator, and the known crash traps.

## Sources and machine locations

Notes contain no absolute paths:

- **Books** ship with this knowledge base: their PDFs sit in `sources/`, and a note points at one by its path relative to the knowledge-base root (the `source_pdf` field), such as `sources/jensen-2011-computational-ocean-acoustics.pdf` for COA. A source note's `zotero_key` names the book's item in the author's Zotero library; it is a citation identifier only, and answering never needs Zotero.
- **Tools** and other machine-specific locations are named by logical name, written in double braces, such as `{{at_2023}}/RAM/ram.exe`. Resolve each name through the local path map (local-paths.yaml, written at install time; the agent definition gives its location):
  - `{{knowledge_base}}`: the installed copy of this knowledge base
  - `{{at_2023}}`: the Acoustics Toolbox 2023 tree, which holds the working Linux RAM binary (RAM/ram.exe)
  - `{{at_2020}}`: the Acoustics Toolbox 2020 tree (atWin10_2020_11_4), which holds the MATLAB scripts and plotting (Matlab) and the BELLHOP and KRAKEN binaries (linux-bin)
  - `{{matlab_helpers}}`: the MATLAB solver helpers (validators and runners for BELLHOP, KRAKEN and RAM)
  - `{{authoring_root}}`: the project checkout holding the authoring copy (link-mode installs only)
- A path beginning with /path/to/ in a recipe stands for a directory of the user's choice.

## Core topic map

| Topic | First notes to read | COA PDF range |
|---|---|---|
| Fundamentals / environment | `chapters/ch01-fundamentals.md` | 20-83 |
| Wave propagation theory | `chapters/ch02-wave-propagation-theory.md` | 84-172 |
| Ray acoustics | `chapters/ch03-ray-methods.md` | 173-250 |
| Wavenumber integration | `chapters/ch04-wavenumber-integration.md` | 251-353 |
| Normal modes | `chapters/ch05-normal-modes.md` | 354-472 |
| Parabolic equations | `chapters/ch06-parabolic-equations.md` | 473-545 |
| General numerical methods | `chapters/ch07-fd-fe-methods.md` | 546-625 |
| Broadband propagation | `chapters/ch08-broadband-modeling.md` | 626-675 |
| Ambient noise | `chapters/ch09-ambient-noise.md` | 676-719 |
| Sonar / signal processing | `chapters/ch10-signals-in-noise.md` | 720-787 |
| Ocean fluctuations / internal waves | `01-source-colosi.md` | none; the route's windows are Colosi's |

## Research-oriented reading patterns

### Propagation model selection
- Start with `workflows/model-selection.md`
- Then read the method-specific notes among Ch. 3-6 and Ch. 8

### Environment-sensitive propagation questions
- Read Ch. 1 and Ch. 2 first
- Then read the method note whose assumptions best match the environment

### Signal-processing questions tied to propagation physics
- Read Ch. 8, Ch. 9, and Ch. 10
- Backfill with Ch. 3-6 if the question depends on the propagation model itself

## Operating rules for future answers

- Distinguish physical assumptions from numerical approximations.
- State when a method is valid, not only how it works.
- For model-selection answers, compare at least: geometry, range dependence, frequency content, computational cost, and phase fidelity.
- When the notes do not settle the question, read only the relevant PDF pages, of COA or of another book through its source note, and cite the page interval used.
- Tag every claim in an answer `[textbook: <source> <section/pages>]` when a book states it, or `[inference]` when no book page does.

## Related files

- `01-source-coa.md`
- `01-source-collins-siegmann.md`, `01-source-colosi.md`, `01-source-etter.md`, `01-source-brekhovskikh-lysanov.md`
- `routing-map.yaml`
- `glossary.md`
- `workflows/model-selection.md`
- `solvers/00-solvers-hub.md`
- `runbooks/bellhop-runbook.md`, `runbooks/kraken-runbook.md`, `runbooks/ram-runbook.md`
- `visualization.md` — TL 场可视化规范（jet_r 色图、AT2020 plotshd.m 自适应 caxis=median+0.75std/50dB窗口、多图共用色标、离散标签不用连续色标、MAE 计算）。任何出图/色标/配色问题必读。
