---
title: Ocean Acoustics Knowledge Hub
type: hub
source_root: /home/jay/.claude/knowledge/ocean-acoustics
primary_source_pdf: /home/jay/Zotero/storage/B4W6S79R/Jensen 等 - 2011 - Computational Ocean Acoustics.pdf
primary_outline: /home/jay/Zotero/storage/B4W6S79R/jasminum-outline.json
primary_text_cache: /home/jay/Zotero/storage/B4W6S79R/.zotero-ft-cache
status: active
---

# Ocean Acoustics Knowledge Hub

This library is the default local knowledge base for underwater acoustics questions, with emphasis on propagation modeling and signal processing grounded in *Computational Ocean Acoustics* (COA, 2nd ed.).

## Default retrieval policy

1. Read this hub and `routing-map.yaml` first.
2. Read `concept-index.yaml` when the user prompt names a specific COA concept, subsection idea, or technical term.
3. Read the smallest relevant chapter notes next.
4. Escalate to the local COA PDF only when the notes are insufficient.
5. Prefer targeted page reads over whole-chapter reads.

## Source of truth

- Primary book: `01-source-coa.md`
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

## Core topic map

| Topic | First notes to read | PDF range |
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
- When the notes do not settle the question, read only the relevant COA PDF pages and cite the page interval used.

## Related files

- `01-source-coa.md`
- `routing-map.yaml`
- `glossary.md`
- `workflows/model-selection.md`
- `solvers/00-solvers-hub.md`
- `runbooks/bellhop-runbook.md`, `runbooks/kraken-runbook.md`, `runbooks/ram-runbook.md`
- `visualization.md` — TL 场可视化规范（jet_r 色图、AT2020 plotshd.m 自适应 caxis=median+0.75std/50dB窗口、多图共用色标、离散标签不用连续色标、MAE 计算）。任何出图/色标/配色问题必读。
