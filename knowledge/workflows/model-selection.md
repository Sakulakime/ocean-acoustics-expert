---
title: Propagation Model Selection Workflow
type: workflow
status: active
---

# Propagation Model Selection Workflow

Use this note when the question is not only "how does the method work" but "which method should I use for this scenario".

Select the primary and cross-check books using `book-selection.md` before applying these heuristics. Method comparison is a complex question: complete the relevant cross-book checks even when one method note already gives an answer. Use `topics/etter-model-evaluation.md` to distinguish verification, validity, uncertainty and fitness for the required output.

## Default comparison axes

1. Geometry and dimensionality
2. Range dependence
3. Frequency regime and bandwidth
4. Need for coherent phase accuracy
5. Boundary complexity and elastic effects
6. Computational cost and turnaround time
7. Required outputs: TL only, impulse response, arrivals, full field, array replicas

## Fast heuristics

### Ray methods
Best when:
- frequency is high enough for geometric-acoustics assumptions to be meaningful
- arrival structure and travel-time intuition matter
- rapid exploratory modeling is needed

Weak when:
- diffraction and interference dominate
- caustics, shadow zones, or low-frequency wave effects are critical
- coherent full-field prediction is needed with strong wave phenomena

### Wavenumber integration
Best when:
- medium is layered or horizontally stratified
- exact spectral treatment is needed
- reflection, elastic bottoms, and reverberation/scattering in stratified settings matter

Weak when:
- environment is strongly range dependent
- 3D complexity dominates and the setup departs from stratified assumptions

### Normal modes
Best when:
- the environment is waveguide-like and modal structure is informative
- low to moderate frequency propagation matters
- dispersion, group speed, and mode coupling are central to the analysis

Weak when:
- high-frequency asymptotics are more natural
- strong range dependence makes a simple adiabatic view unreliable without coupling treatment

### Parabolic equations
Best when:
- forward propagation in range-dependent environments is the main need
- full-wave effects matter more than ray simplicity
- long-range propagation with manageable cost is needed

Weak when:
- strong backscatter is central
- angular limitations of the chosen PE approximation are violated
- the question demands globally exact two-way solutions

### FD / FE / BE methods
Best when:
- local geometry, scattering, elastic coupling, or boundary detail is the focus
- one needs direct numerical treatment beyond asymptotic simplifications

Weak when:
- very large domains make brute-force discretization too costly
- a more specialized propagation family already matches the problem assumptions well

## Recommended answer structure

When answering a model-selection question, compare methods under these headings:
- Physical assumptions
- Governing approximation
- Environment fit
- Numerical cost
- Phase and interference fidelity
- Broadband implications
- Signal-processing consequences

## Typical routing examples

- Shallow-water range-dependent TL -> read COA Ch. 1, Ch. 2 and Ch. 6; add `topics/collins-pe-extensions.md` for PE interface corrections
- Deep-water arrival analysis -> read Ch. 2, Ch. 3, Ch. 5
- Layered elastic-bottom reverberation -> read Ch. 4 and Ch. 7
- Broadband pulse propagation -> read COA Ch. 8, then Ch. 5 or Ch. 6; add `topics/colosi-stochastic-propagation.md` when random-medium coherence or pulse statistics matter
- Adiabatic validity -> read `topics/brekhovskikh-waveguide-approximations.md` and compare COA Ch. 5 under their respective assumptions
- Numerical-model validation -> start with `topics/etter-model-evaluation.md`, then the method note and the relevant benchmark case
- Matched-field processing sensitivity -> read Ch. 10 plus the propagation note producing the replica field
