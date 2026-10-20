---
title: Model Evaluation and Prediction Uncertainty
type: topic-note
source: 01-source-etter.md
source_pdf: sources/etter-2018-underwater-acoustic-modeling-simulation.pdf
pdf_pages: [274-275, 455-461, 465-467]
status: verified
---

# Model Evaluation and Prediction Uncertainty

## Scope and reading record

Primary source: Etter, *Underwater Acoustic Modeling and Simulation*, fifth edition (2018). This note was checked against §6.13, PDF pp. 274-275; §§12.3-12.4, PDF pp. 455-461; and §12.6, PDF pp. 465-467. PDF page numbers use the edition and offset in `01-source-etter.md`.

Use this note first for model evaluation, quantitative accuracy assessment, verification versus validation, and prediction uncertainty. Pair it with `benchmark-cases.md` for a specific benchmark and the relevant COA chapter for the governing approximation. The procedure below does not certify any solver or learned surrogate.

## Verification, validity and intended use

Etter separates five evaluation categories: documentation, verification, validation, maintainability and usability. Evaluation procedures must fit the model and available evidence; no procedure is appropriate for all models. [textbook: Etter 2018 §12.6, PDF p. 465]

| Category | What the book asks the evaluator to examine | Evidence location |
|---|---|---|
| Verification | Whether the program represents the model and runs as expected; mathematical/logical consistency, intermediate numerical results, included variables and implementation | §12.6.2, PDF p. 466 |
| Theoretical validity | Underlying physics, stated and implied assumptions, their applicability and restrictiveness, and internal logic | §12.6.3, PDF p. 466 |
| Data validity | Accuracy and completeness of original data and their transformation in an empirical model | §12.6.3, PDF p. 466 |
| Operational validity | Effects of discrepancies between prediction and reality on decisions | §12.6.3, PDF p. 466 |
| Usability | Fitness for specified applications, including frequency, geometry and output requirements | §12.6.5, PDF p. 467 |

The book also notes that hardware precision can change numerical results and introduce artifacts. Program execution alone therefore addresses only part of verification, and verification alone does not settle theoretical or operational validity. [textbook: Etter 2018 §§12.6.2-12.6.3, PDF p. 466]

## Benchmarks and reference choice

Analytical benchmarks use idealized, exactly solvable environments when comprehensive experimental data are unavailable. The examples here include upslope wedge propagation and a plane-parallel waveguide with a range-dependent sound-speed profile. Their value is controlled evaluation of numerical methods, with the physical content of the reference explicitly identified. [textbook: Etter 2018 §12.3, PDF pp. 455-457]

For a project evaluation, record whether the reference is an analytical solution, a separately assessed numerical calculation, or measurements, and which assumptions and environmental uncertainties it carries. Agreement with a reference having the same approximation cannot by itself validate omitted physics. This is evaluation guidance inferred from the benchmark discussion and validity categories. [inference]

## Two different accuracy questions

- **Difference techniques:** compare predicted and reference loss in dB at a range or over a range interval. Etter places these primarily in research comparisons. [textbook: Etter 2018 §12.4, PDF p. 458]
- **Figure-of-merit techniques:** fix a dB/FOM level and compare corresponding ranges or detection zones. These address sensitivity of operational decisions to prediction error. The same TL discrepancy need not have the same range consequence everywhere. [textbook: Etter 2018 §12.4, PDF pp. 458-459]

Neither distinction selects a universal dB threshold. Choose the quantity and acceptance criterion for the intended use. For coherent fields or broadband synthesis, add complex-field, phase and arrival diagnostics rather than treating a TL-only comparison as evidence about those outputs. This extension is project guidance, not an accuracy metric prescribed in §12.4. [inference]

Calibration estimates unknown context-specific inputs from observations. Treating the resulting estimates as exact ignores residual parameter uncertainty; the book describes predictive distributions as a way to retain it. Increasing model complexity can also increase sensitivity to input errors and uncertain parameters. [textbook: Etter 2018 §12.4, PDF pp. 459-460]

## Separate environmental uncertainty from numerical error

In §6.13, environmental uncertainty denotes incomplete knowledge of the waveguide sound-speed field and boundary conditions, explicitly distinguished from numerical wave-equation solution errors. Ensemble propagation estimates field statistics by solving multiple environmental realizations; convergence of those statistics is a separate requirement. The book surveys stochastic differential-equation and polynomial-chaos approaches as alternatives to separate deterministic realizations, with limitations from coefficient errors, correlation scales and expansion size. [textbook: Etter 2018 §6.13, PDF pp. 274-275]

The operational error-budget discussion writes

\[
e_p=e_d+e_m \qquad \text{(Etter Eq. 12.3)},
\]

where \(e_p\) is prediction error, \(e_d\) input-data error, and \(e_m\) model error; the text assumes the last two are independent random variables. This is an assumed decomposition, not proof of independence in a particular experiment. [textbook: Etter 2018 §12.6.3, PDF p. 466]

A useful project report therefore distinguishes: implementation checks; numerical resolution/error evidence; environmental sampling and statistical convergence; and physical validity for the intended outputs. Separating them is an application of the book's categories, not a claim that this note has performed those checks. [inference]

## Cross-book use

- Read `topics/colosi-stochastic-propagation.md` when an evaluation involves random-medium regimes or coherence; do not use an environmental ensemble to explain a numerical discretization artifact.
- Read `topics/collins-pe-extensions.md` and `chapters/ch06-parabolic-equations.md` when PE formulation, range dependence or source initialization limits the comparison.
- Read `topics/brekhovskikh-waveguide-approximations.md` when an analytical or asymptotic waveguide approximation supplies the reference.
- Read `benchmark-cases.md` for the actual canonical environment parameters. This note does not reproduce or resolve the numerical values of the book's benchmark figures.

These are retrieval recommendations. A technical conclusion that compares books requires reading the selected substantive notes or targeted pages from each book. [inference]

## Further targeted reads

- Quantitative comparisons and calibration: §12.4, PDF pp. 458-461.
- Verification, validity and usability: §12.6, PDF pp. 465-467.
- Environmental uncertainty and polynomial chaos: §6.13, PDF pp. 274-275.
- Benchmark examples: §12.3, PDF pp. 455-457; validate case parameters against the canonical case note before reuse.
