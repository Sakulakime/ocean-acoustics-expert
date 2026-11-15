---
title: Ocean Acoustics Knowledge Hub
type: hub
sources: [01-source-coa.md, 01-source-collins-siegmann.md, 01-source-colosi.md, 01-source-etter.md, 01-source-brekhovskikh-lysanov.md]
status: active
---

# Ocean Acoustics Knowledge Hub

This knowledge base supports underwater acoustic propagation and signal processing with five complementary textbooks. Select the primary book by topic rather than by a fixed book ranking.

## Default retrieval policy

1. Read this hub, then `routing-map.yaml` and `book-selection.md` for topic-driven books and cross-check completion criteria.
2. Check `concept-index.yaml` for the concepts, subsection ideas or technical terms the question names.
3. Read the smallest substantive note set that answers the question and completes the selected cross-book checks: chapter and topic notes, solver notes, runbooks, `visualization.md` and `benchmark-cases.md`. Source-note section maps locate evidence; they do not supply it.
4. When an answer claim or required cross-book check lacks note evidence, read a fallback window: a targeted page range of a book PDF in `sources/`, cited with its range, even if COA already answers the main question. An unqualified page range (`473-488`) is COA's for backward compatibility. A window with a `source` identifies another book: read that source note for its PDF and section map, then read the window's pages.
5. Prefer targeted page reads over whole-chapter reads.

## Source of truth

- Book selection and proactive cross-checks: `book-selection.md`
- COA source map: `01-source-coa.md`; general solver formulations and canonical benchmarks
- Specialist books, each with a source note (bibliographic record, page offset, section map) and a first substantive topic note:
  - `01-source-collins-siegmann.md`: Collins & Siegmann, *Parabolic Wave Equations with Applications* (2019): PE techniques and elastic, poro-elastic and moving-media PEs
  - `01-source-colosi.md`: Colosi, *Sound Propagation through the Stochastic Ocean* (2016): internal waves and acoustic fluctuations
  - `01-source-etter.md`: Etter, *Underwater Acoustic Modeling and Simulation*, 5th ed. (2018): model catalogues, noise, reverberation, sonar performance, model evaluation
  - `01-source-brekhovskikh-lysanov.md`: Brekhovskikh & Lysanov, *Fundamentals of Ocean Acoustics*, 3rd ed. (2003): classical theory of reflection, waveguides, rough-surface scattering and the random ocean
- PDF-grounded topic notes: `topics/collins-pe-extensions.md`, `topics/colosi-stochastic-propagation.md`, `topics/etter-model-evaluation.md`, `topics/brekhovskikh-waveguide-approximations.md`. Each states its actual reading scope and section/page evidence; none represents its entire book.
- Topic routing: `routing-map.yaml`
- Reverse concept map: `concept-index.yaml`
- Model comparison: `workflows/model-selection.md`
- Glossary: `glossary.md`
- Chapter notes: `chapters/`. The deepened ones (`status: deepened`: Ch. 2, Ch. 3, Ch. 5 and Ch. 6) give, per subsection, key equations with symbols, COA equation numbers and PDF pages, and validity conditions with COA's numbers; take equations and validity limits from them before reading the PDF.
- Benchmark cases: `benchmark-cases.md`. COA's canonical test environments (Pekeris waveguide, Munk profile, ASA wedge, Dickins seamount, 3-D wedge and others), each with exact parameters, COA figures and pages, the solver families it validates and COA's reference solution. Read it for "which benchmark validates X" and "give me the parameters of case Y".
- Solver notes: `solvers/`
- Run recipes (Linux + MATLAB run recipe, input-file format, validators, gotchas):
  - BELLHOP (ray, `.env`): `runbooks/bellhop-runbook.md` (+ `runbooks/bellhop-env-template.md`, `runbooks/bellhop-checklist.md`)
  - KRAKEN (normal modes, `.env`+`.flp` two-stage): `runbooks/kraken-runbook.md` (+ `runbooks/kraken-template.md`, `runbooks/kraken-checklist.md`)
  - RAM (parabolic equation, `ram.in`): `runbooks/ram-runbook.md` (+ `runbooks/ram-in-template.md`, `runbooks/ram-checklist.md`)
  - UMPE (split-step Fourier PE, `perun.inp`+`peenv.inp`+`pefiles.inp`): `runbooks/umpe-runbook.md` (+ `runbooks/umpe-input-template.md`, `runbooks/umpe-checklist.md`)

When the question is about actually building an input file or running a model (not just the physics), read the matching runbook in `runbooks/` — it has the exact input-file format, the Linux+MATLAB call recipe against the local AT install, a pre-run validator, and the known crash traps.

## Sources and machine locations

Notes contain no absolute paths:

- **Books** are supplied by each user, not shipped: their PDFs go in `sources/` under the file names that `sources/README.md` lists, and a note points at one by its path relative to the knowledge-base root (the `source_pdf` field), such as `sources/jensen-2011-computational-ocean-acoustics.pdf` for COA. A source note's `zotero_key` names the book's item in the author's Zotero library; it is a citation identifier only, and answering never needs Zotero.
- **Tools** and other machine-specific locations are named by logical name, written in double braces, such as `{{at_2023}}/RAM/ram.exe`. Resolve each name through the local path map (local-paths.yaml, written at install time; the agent definition gives its location):
  - `{{knowledge_base}}`: the installed copy of this knowledge base
  - `{{at_2023}}`: the Acoustics Toolbox 2023 tree, which holds the working Linux RAM binary (RAM/ram.exe)
  - `{{at_2020}}`: the Acoustics Toolbox 2020 tree (atWin10_2020_11_4), which holds the MATLAB scripts and plotting (Matlab) and the BELLHOP and KRAKEN binaries (linux-bin)
  - `{{matlab_helpers}}`: the MATLAB solver helpers (validators and runners for BELLHOP, KRAKEN and RAM)
  - `{{authoring_root}}`: the project checkout holding the authoring copy (link-mode installs only)
- A path beginning with /path/to/ in a recipe stands for a directory of the user's choice.

## Core topic map

| Topic | Notes to select by question | COA PDF range (when applicable) |
|---|---|---|
| Fundamentals / environment | `chapters/ch01-fundamentals.md` | 20-83 |
| Wave propagation theory | `chapters/ch02-wave-propagation-theory.md` | 84-172 |
| Ray acoustics | `chapters/ch03-ray-methods.md` | 173-250 |
| Wavenumber integration | `chapters/ch04-wavenumber-integration.md` | 251-353 |
| Normal modes | `chapters/ch05-normal-modes.md` | 354-472 |
| PE foundations / specialist extensions | `chapters/ch06-parabolic-equations.md` / `topics/collins-pe-extensions.md`, selected with `book-selection.md` | 473-545 for COA; Collins windows are in its source map |
| General numerical methods | `chapters/ch07-fd-fe-methods.md` | 546-625 |
| Broadband propagation | `chapters/ch08-broadband-modeling.md` | 626-675 |
| Ambient noise | `chapters/ch09-ambient-noise.md` | 676-719 |
| Sonar / signal processing | `chapters/ch10-signals-in-noise.md` | 720-787 |
| Ocean fluctuations / internal waves | `topics/colosi-stochastic-propagation.md`, then `01-source-colosi.md` for additional sections | none; select Colosi's targeted windows |
| Specialist PE, stochastic propagation, evaluation and waveguide approximations | `book-selection.md` and the matching `topics/` note | select the book and targeted window by topic |
| Benchmark cases | `benchmark-cases.md` | none; the cases span Ch. 1-8, and the route's windows are the pages where COA sets them up |

## Research-oriented reading patterns

### Propagation model selection
- Start with `workflows/model-selection.md`
- Read `topics/etter-model-evaluation.md` for evaluation criteria, then the relevant method notes and specialist book from `book-selection.md`

### Environment-sensitive propagation questions
- For stochastic effects start at `topics/colosi-stochastic-propagation.md`; for classical waveguide assumptions use `topics/brekhovskikh-waveguide-approximations.md`
- Add the relevant COA method note for the deterministic propagation formulation

### Signal-processing questions tied to propagation physics
- Read Ch. 8, Ch. 9, and Ch. 10
- Backfill with Ch. 3-6 if the question depends on the propagation model itself

## Operating rules for future answers

- Distinguish physical assumptions from numerical approximations.
- State when a method is valid, not only how it works.
- For model-selection answers, compare at least: geometry, range dependence, frequency content, computational cost, and phase fidelity.
- Complete the selected cross-book checks with substantive notes or targeted PDF pages; distinguish pages cited through notes from pages read in this run and report any unavailable check.
- Tag every claim in an answer `[textbook: <source> <section/pages>]` when a book states it, or `[inference]` when no book page does.

## Related files

- `01-source-coa.md`
- `01-source-collins-siegmann.md`, `01-source-colosi.md`, `01-source-etter.md`, `01-source-brekhovskikh-lysanov.md`
- `routing-map.yaml`
- `glossary.md`
- `benchmark-cases.md`
- `workflows/model-selection.md`
- `solvers/00-solvers-hub.md`
- `runbooks/bellhop-runbook.md`, `runbooks/kraken-runbook.md`, `runbooks/ram-runbook.md`, `runbooks/umpe-runbook.md`
- `visualization.md` — TL 场可视化规范（jet_r 色图、AT2020 plotshd.m 自适应 caxis=median+0.75std/50dB窗口、多图共用色标、离散标签不用连续色标、MAE 计算）。任何出图/色标/配色问题必读。
