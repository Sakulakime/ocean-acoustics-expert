---
title: COA Chapter 5 - Normal Modes
type: chapter-note
chapter: 5
book_pages: 337-456
pdf_pages: 354-472
source_pdf: sources/jensen-2011-computational-ocean-acoustics.pdf
status: expanded
---

# COA Chapter 5 - Normal Modes

## Summary
Normal-mode methods represent the underwater field as a superposition of discrete and sometimes continuous waveguide modes. They are one of the most interpretable full-wave frameworks for low- to moderate-frequency propagation, dispersion, and range-dependent waveguide physics.

## Core problem
How to express ocean acoustic propagation in a waveguide through modal structure, then use that structure for propagation prediction, physical interpretation, and signal analysis.

## Method-selection snapshot
- Best when the environment is waveguide-like and modal structure is physically informative.
- Best for low- to moderate-frequency propagation, dispersion, group speed, and mode-coupling analysis.
- Weak when high-frequency path geometry is the main interest or when strong range dependence breaks simple adiabatic assumptions.

## Major subsections

### Modal expansion and Green's-function representation
The chapter begins by rewriting the waveguide field as a sum over modes, making propagation a problem of modal eigenvalues, eigenfunctions, and excitation weights.

**Key equations and topics**
- Separation of variables in stratified waveguides
- Modal expansion of the Green's function
- Horizontal wavenumbers as modal propagation constants
- Orthogonality and normalization of mode shapes
- Source excitation coefficients

**Physical interpretation**
- Each mode is a stable vertical standing-wave structure that propagates horizontally with its own phase speed.
- The received field is a coherent superposition of these modal contributions.

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch08-broadband-modeling.md`

### Canonical waveguides and physical modal intuition
Simple waveguides expose how boundary conditions, sound-speed structure, and bottom properties shape the modal spectrum.

**Key equations and topics**
- Pressure-release and rigid-boundary examples
- Deep-water and shallow-water modal behavior
- Cutoff behavior and mode count versus frequency
- Relation between grazing structure and modal order

**Why it matters**
- This is the main physical bridge between abstract eigenfunctions and observable multipath or interference structure.
- It explains why shallow-water fields can often be understood in terms of a small number of dominant trapped modes.

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch03-ray-methods.md`

### Numerical mode computation and mode counting
This is the implementation core of the chapter: how to compute modes reliably in realistic environments.

**Key equations and topics**
- Shooting methods and boundary-value formulations
- Numerical approaches for eigenvalue search
- Prufer transformation and mode counting
- Sensitivity to discretization and boundary treatment

**Best-fit scenarios**
- Stratified environments with realistic SSP and bottom structure
- Studies that need modal amplitudes, phases, and group properties

**Limitations**
- Mode identification can be subtle near cutoff or in lossy media
- Numerical details can distort weak or closely spaced modes

**Cross-links**
- `chapters/ch07-fd-fe-methods.md`
- `workflows/model-selection.md`

### Perturbation theory, group velocity, and dispersion
Once the modes are known, perturbation and asymptotic tools explain how environmental changes alter phase and arrival structure.

**Key equations and topics**
- Modal perturbation theory
- Sensitivity of eigenvalues and mode shapes
- Group velocity and modal dispersion
- Travel-time spreading across modes
- Waveguide invariant structure in realistic environments

**Why it matters**
- This subsection is central for broadband pulse distortion and arrival-time interpretation.
- It explains why modal propagation often maps naturally into waveform spreading and interference structure.

**Cross-links**
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`

### Elastic media and realistic bottoms
The chapter extends modal ideas beyond simple fluid waveguides into more realistic seabed physics.

**Key equations and topics**
- Elastic-media modes
- Bottom coupling and leakage
- Compressional and shear effects in the seabed
- Loss and complex modal wavenumbers

**Best-fit scenarios**
- Shelf and shallow-water propagation with bottom interaction
- Problems where bottom physics changes attenuation or replica structure

**Limitations**
- Elastic detail increases modeling and interpretation burden
- Mode labeling and physical attribution become less transparent

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch07-fd-fe-methods.md`

### Range dependence, adiabatic modes, and mode coupling
This is the main warning label for applying modes in realistic oceans. As the environment changes with range, modal amplitudes and identities can evolve.

**Key equations and topics**
- Adiabatic approximation
- Coupled-mode equations
- One-way coupling formulations
- Validity of adiabatic treatment
- Mode conversion in range-dependent waveguides

**Why it matters**
- Many shallow-water and shelf-break problems live or fail here.
- Adiabatic modes are attractive computationally, but they must be justified rather than assumed.

**Cross-links**
- `chapters/ch06-parabolic-equations.md`
- `workflows/model-selection.md`

### Three-dimensional environments and realistic waveguide invariants
The later parts generalize modal thinking to more realistic geometries and to invariant-based interpretation.

**Key equations and topics**
- Normal modes for 3D varying environments
- Horizontal refraction in modal settings
- Waveguide invariant and interference striation structure
- Dispersion interpretation in realistic environments

**Best-fit scenarios**
- Structured analysis of interference patterns
- Broadband or array-processing problems tied to modal dispersion

**Cross-links**
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`

## Key sections from the TOC
- 5.3 Modal Expansion of the Green's Function
- 5.7 Numerical Approaches
- 5.9 Modal Perturbation Theory
- 5.10 Elastic Media
- 5.11 Normal Modes for Range-Dependent Environments
- 5.13 Normal Modes for 3-D Varying Environments
- 5.14 Waveguide Invariant and Dispersion for Realistic Environments

## Research takeaways
- Normal modes are often the clearest full-wave language for waveguide physics, especially in shallow water and deep sound channels.
- Broadband interpretation depends heavily on modal group velocity and dispersion, not just transmission loss.
- In range-dependent environments, the main methodological question is often not "modes or not" but "adiabatic or coupled modes".

## Comparison to neighboring chapters
- Compared with `chapters/ch03-ray-methods.md`, modes give weaker path intuition but much better low-frequency coherent waveguide fidelity.
- Compared with `chapters/ch06-parabolic-equations.md`, modes are often more interpretable in stratified waveguides but less natural for strongly range-dependent forward marching.
- Compared with `chapters/ch08-broadband-modeling.md`, this chapter supplies one of the main narrowband foundations that broadband synthesis builds on.

## Good follow-on notes
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`
- `solvers/solver-kraken.md`
- `workflows/model-selection.md`
