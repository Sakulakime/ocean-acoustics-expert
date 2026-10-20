---
title: Topic-driven Book Selection
type: retrieval-policy
status: active
---

# Topic-driven Book Selection

Select the primary book by the question's topic, then read its substantive notes first. Use `concept-index.yaml` to refine a broad route. A primary book is the main technical source for this question, not a permanent ranking of the five books.

## Topic choices

| Question | Primary book and first substantive notes | Useful cross-check |
|---|---|---|
| General propagation solvers, numerical formulations and canonical cases | COA: the relevant `chapters/` note and `benchmark-cases.md` | The specialist book below when its assumptions affect the answer |
| Padé PE, self-starter, range-dependent interfaces or PE extensions | Collins & Siegmann: `topics/collins-pe-extensions.md` | COA `chapters/ch06-parabolic-equations.md`; use the source map for extensions not covered in the topic note |
| Stochastic propagation, fluctuation regimes, internal waves and coherence | Colosi: `topics/colosi-stochastic-propagation.md` | Brekhovskikh & Lysanov Ch. 10 for classical fluctuation theory; COA Ch. 5 or 8 for deterministic modal/broadband comparisons |
| Engineering model catalogues, evaluation, accuracy assessment or prediction uncertainty | Etter: `topics/etter-model-evaluation.md` | The relevant COA method note; Colosi for stochastic assumptions |
| Classical waveguide approximations, adiabatic validity and rough-surface scattering | Brekhovskikh & Lysanov: `topics/brekhovskikh-waveguide-approximations.md` | COA `chapters/ch05-normal-modes.md` or `chapters/ch01-fundamentals.md` |
| Solver input, execution or plotting | The relevant runbook or `visualization.md` | Add book evidence when a physical or numerical claim requires it |

The rows are retrieval guidance, not claims of equivalence between formulations. The source notes map the specific sections and PDF pages. A topic note supports only the sections and claims it actually covers; its presence does not replace every section of its book.

## When to cross-check

Treat a question as complex when it asks for method comparisons, validity or approximation limits, a derivation with subtle assumptions, environmental uncertainty or coherence, or a research/validation recommendation. Select at least one additional relevant book for such a question, even when the primary book's notes already answer it. For several topics, combine the relevant routes. If no other book bears on the claim, record why a second source adds no applicable evidence instead of padding the answer.

For a simple definition, a narrow factual lookup, solver syntax or plotting, one relevant substantive note can suffice. An explicit user restriction to one book takes precedence; report that scope when it prevents an otherwise useful cross-check.

## What completes a cross-check

1. Read substantive evidence from each selected book: a chapter/topic note that states the relevant result with book section/pages, or a targeted PDF window when the note lacks that result. Read the source note before its PDF to resolve edition and pages.
2. Compare the assumptions, variables, normalization and intended outputs. Record whether the books agree, qualify one another, or address different settings. Attribute differences rather than forcing agreement.
3. A source note's section map is navigation, not a technical cross-check. Finding a title or page range alone leaves the check pending. Read a relevant PDF window even if COA notes already settle the main question when the other book's substantive evidence is missing.
4. Respect the harness PDF-reading limit. If the needed book is missing or targeted PDF reads are unavailable, use whatever substantive notes are available, mark the remaining check as unavailable, and name the book, section and PDF pages needed. The answer must not report that check as completed.

## Retrieval record

Before analysis, record `primary_book`, `cross_check_books`, `cross_check_reason` and `cross_check_status`, along with the selected concepts, notes and page windows. Use per-book statuses: `checked-note`, `checked-pdf`, `unavailable` or `not-needed`; the first two require an actual read supporting the relevant claim. A PDF read and a note read are distinct provenance records.

In the answer's sources-used list, name the books and notes actually read. Distinguish book pages cited through a note from PDF pages read in this run, and briefly state what a cross-check added or what remains unavailable. Preserve the two evidence tags defined by the agent: textbook claims name the book, and recommendations or extrapolations use inference.
