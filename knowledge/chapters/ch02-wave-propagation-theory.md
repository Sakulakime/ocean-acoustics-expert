---
title: COA Chapter 2 - Wave Propagation Theory
type: chapter-note
chapter: 2
book_pages: 65-154
pdf_pages: 84-172
source_pdf: /home/jay/Zotero/storage/B4W6S79R/Jensen 等 - 2011 - Computational Ocean Acoustics.pdf
status: expanded
---

# COA Chapter 2 - Wave Propagation Theory

## Summary
This chapter derives the governing wave framework behind the rest of COA: nonlinear and linear wave equations, pressure and potential formulations, the Helmholtz equation, Green's functions, radiation conditions, layered waveguides, Pekeris-style canonical problems, deep-ocean waveguides, and reciprocity. It is the main theoretical hinge between environmental description and computational propagation methods.

## Core problem
How to formulate underwater sound mathematically so that later methods can be understood as exact solutions, approximations, or reorganizations of the same underlying wave problem.

## Method-selection snapshot
- Best when the question is about governing equations, field variables, Green's functions, reciprocity, or canonical waveguide theory.
- Best when one must compare propagation methods in terms of what equation or boundary-value problem they are actually solving.
- Weak when the real need is already a solver-specific numerical recipe rather than the theoretical foundation.

## Major subsections

### Nonlinear and linear wave equations
The chapter starts from fluid mechanics and the adiabatic equation of state, then shows how the acoustic wave equation emerges by linearization.

**Key equations and topics**
- Conservation of mass
- Euler's equation
- Adiabatic equation of state
- Nonlinear wave equation
- Linear wave equation under small-perturbation assumptions
- Role of ambient density and sound speed

**Physical interpretation**
- The nonlinear formulation explains where finite-amplitude and harmonic-generation effects come from.
- The linearization is not just mathematical convenience; it is the approximation that makes most operational underwater acoustics tractable.

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch08-broadband-modeling.md`

### Equivalent field variables: pressure, particle velocity, and acoustic potentials
The same physics is then expressed in several mathematically useful variables.

**Key equations and topics**
- Wave equation for pressure
- Wave equation for particle velocity
- Velocity potential formulation
- Displacement potential formulation
- Plane-wave impedance relation
- Source representation in inhomogeneous equations

**Why it matters**
- Different computational methods are built around different field variables even when they describe the same underlying physics.
- Boundary conditions are often easier to enforce in one formulation than another.

**Cross-links**
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch07-fd-fe-methods.md`

### Helmholtz equation and the narrowband viewpoint
The next step is the time-to-frequency reduction that underlies most narrowband ocean-acoustic modeling.

**Key equations and topics**
- Fourier transform from time to frequency
- Helmholtz equation
- Medium wavenumber as k(r)=omega/c(r)
- Narrowband versus wideband treatment
- Boundary-value character of the frequency-domain problem

**Physical interpretation**
- Most of COA is organized around the Helmholtz equation, not because time-domain physics is unimportant, but because many ocean problems are naturally narrowband or can be decomposed frequency by frequency.
- WI, normal modes, and PE all inherit their theoretical legitimacy from this reduction.

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`
- `chapters/ch06-parabolic-equations.md`

### Homogeneous media, coordinate systems, and Green's functions
The chapter then builds intuition in the simplest possible settings.

**Key equations and topics**
- Cartesian, cylindrical, and spherical coordinate systems
- Plane, cylindrical, and spherical waves
- Geometrical spreading in simple media
- Point-source Green's function in free space
- Source strength normalization
- Symmetry of the Green's function

**Why it matters**
- These canonical solutions are the baseline from which waveguide and boundary effects are measured.
- Green's functions become the reusable building block for much of the rest of the book.

**Cross-links**
- `chapters/ch03-ray-methods.md`
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch09-ambient-noise.md`

### Bounded media, Green's theorem, and radiation conditions
Once boundaries are present, the problem becomes a true boundary-value problem rather than a free-space one.

**Key equations and topics**
- General Green's function in bounded media
- Green's theorem for acoustic boundary-value problems
- Surface and volume integral representation
- Radiation condition in unbounded domains
- Mirror-image construction in a fluid halfspace

**Physical interpretation**
- This is the chapter's core statement that ocean acoustics is fundamentally a boundary-conditioned wave problem.
- It also explains why boundary-element formulations and integral-representation methods are so natural later.

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch07-fd-fe-methods.md`

### Halfspace solutions and transmission-loss normalization
The chapter includes simple but operationally important solutions for halfspace problems and defines TL carefully.

**Key equations and topics**
- Point source in a fluid halfspace
- Image-source interpretation
- Pressure-release boundary treatment
- Transmission-loss definition
- Source normalization and impedance-aware comparison

**Why it matters**
- TL is not a purely empirical output variable; it is tied to specific normalization choices.
- The halfspace examples show how even simple boundaries can qualitatively reshape the field.

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch03-ray-methods.md`
- `chapters/ch06-parabolic-equations.md`

### Layered media and range-independent waveguides
The chapter then turns toward the canonical ocean-acoustic geometry used throughout COA.

**Key equations and topics**
- Layered media with discrete interface conditions
- Continuously varying versus piecewise-stratified media
- Horizontally stratified waveguides
- Integral-transform techniques and separation of variables
- Plane-propagation setup for layered ocean environments

**Best-fit scenarios**
- Range-independent environments
- Canonical waveguide theory
- Problems where the vertical structure carries most of the physics

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`

### Pekeris waveguide, waveguide invariants, and deep-ocean structure
The later chapter material uses canonical waveguides to develop the language of ocean waveguide propagation.

**Key equations and topics**
- Pekeris waveguide as the canonical shallow-water model
- Deep-ocean waveguides
- Waveguide-invariant ideas
- Relation between canonical waveguide structure and multipath/interference behavior

**Physical interpretation**
- The Pekeris problem is simple enough to analyze and rich enough to explain much of shallow-water intuition.
- Deep-ocean channel structure connects the theory directly to long-range sound-channel propagation.

**Cross-links**
- `chapters/ch03-ray-methods.md`
- `chapters/ch05-normal-modes.md`
- `chapters/ch10-signals-in-noise.md`

### Reciprocity as a structural principle
The appendix-level reciprocity material is conceptually central and used repeatedly later.

**Key equations and topics**
- Principle of reciprocity
- Symmetry of Green's functions under source-receiver interchange
- Implications for time reversal, matched fields, and passive reconstruction

**Why it matters**
- Reciprocity underlies many arguments about replica fields, passive field recovery, and reversible propagation structure.
- It provides a compact theoretical bridge from propagation theory to signal-processing methods.

**Cross-links**
- `chapters/ch09-ambient-noise.md`
- `chapters/ch10-signals-in-noise.md`

## Key sections from the TOC
- 2.1 The Wave Equation
- 2.1.1 The Nonlinear Wave Equation
- 2.1.2 The Linear Wave Equation
- 2.1.2.1 Wave Equation for Pressure
- 2.1.2.2 Wave Equation for Particle Velocity
- 2.1.2.3 Wave Equation for Velocity Potential
- 2.1.2.4 Wave Equation for Displacement Potential
- 2.1.2.5 Source Representation
- 2.2 The Helmholtz Equation
- 2.3 Homogeneous Media
- 2.3.2 Source in Unbounded Medium
- 2.3.3 Source in Bounded Medium
- 2.3.4 Point Source in Fluid Halfspace
- 2.3.5 Transmission Loss
- 2.4 Layered Media and Waveguides
- 2.4.1 Integral Transform Techniques
- 2.4.5 The Pekeris Waveguide
- 2.4.6 Waveguide Invariants
- 2.5 Deep-Ocean Waveguides
- Appendix 1: Principle of Reciprocity

## Numerical and research takeaways
- Ch. 2 is the theory spine of COA: most later methods are best understood as particular ways of solving or approximating the Helmholtz boundary-value problem.
- Green's functions, TL normalization, and reciprocity are not side results; they are durable organizing ideas used across propagation and signal processing.
- The real divide in ocean-acoustic modeling is often not between methods but between classes of boundary-value problems: homogeneous, layered, waveguide, and range-dependent.

## Comparison to neighboring chapters
- Compared with `chapters/ch01-fundamentals.md`, this chapter is less about environment description and more about mathematical structure.
- Compared with `chapters/ch04-wavenumber-integration.md` and `chapters/ch05-normal-modes.md`, it provides the shared starting point before those methods diverge computationally.
- Compared with `chapters/ch07-fd-fe-methods.md`, it emphasizes analytical structure and canonical problems rather than direct discretization.

## Good follow-on notes
- `chapters/ch03-ray-methods.md`
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch05-normal-modes.md`
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch09-ambient-noise.md`
- `chapters/ch10-signals-in-noise.md`
- `workflows/model-selection.md`
