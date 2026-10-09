---
title: COA Chapter 4 - Wavenumber Integration Techniques
type: chapter-note
chapter: 4
book_pages: 233-336
pdf_pages: 251-353
source_pdf: /home/jay/Zotero/storage/B4W6S79R/Jensen 等 - 2011 - Computational Ocean Acoustics.pdf
status: expanded
---

# COA Chapter 4 - Wavenumber Integration Techniques

## Summary
This chapter develops wavenumber-integration methods for horizontally stratified media by expressing the field as a spectral integral over horizontal wavenumber and solving the depth-separated wave equation layer by layer. It is the main COA home for Fast Field Program style thinking, layered fluid-elastic treatments, aliasing and contour issues, and stratified-ocean scattering or reverberation.

## Core problem
How to compute wave fields accurately in layered or horizontally stratified environments by keeping an exact spectral representation in horizontal wavenumber instead of choosing a ray, modal, or forward-marching reduction.

## Method-selection snapshot
- Best for range-independent or horizontally stratified environments where layered spectral structure is the natural language.
- Best when bottom reflection physics, elastic layers, or stratified reverberation matter and one wants a full-wave reference within those assumptions.
- Weak when strong range dependence, strongly local geometry, or genuinely 3D complexity dominates the physics.

## Major subsections

### Why wavenumber integration exists
The chapter opens by placing WI as the direct numerical implementation of integral-transform solutions for layered waveguides, and contrasts it with normal-mode residue methods.

**Key equations and topics**
- Spectral-integral representation of the field
- Relation to Fast Field Program terminology
- Direct quadrature versus mode-sum contour approaches
- Historical link from Pekeris-style layered solutions to numerical FFP solvers

**Physical interpretation**
- WI keeps the layered wave physics exact within the stratified assumption and delays approximation to the numerical quadrature stage.
- It is best thought of as a spectral decomposition of horizontal structure rather than a marching or asymptotic technique.

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch05-normal-modes.md`
- `solvers/solver-scooter.md`

### Mathematical derivation and the depth-separated wave equation
The chapter's foundation is to transform the Helmholtz problem into a family of ordinary differential equations in depth.

**Key equations and topics**
- Integral-transform solution in cylindrical geometry
- Forward Hankel transform
- Depth-separated wave equation
- Depth-dependent Green's function
- Inverse Hankel transform to recover the total field

**Why it matters**
- Once the problem is written as a depth equation for each horizontal wavenumber, layered media can be handled systematically.
- This is the main bridge between Ch. 2 waveguide theory and operational FFP-style solvers.

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `solvers/solver-scooter.md`
- `solvers/solver-oases.md`

### Fluid, pseudo-linear, and elastic layer representations
A major strength of WI is that different layer physics can be expressed in the same transform framework.

**Key equations and topics**
- Homogeneous fluid layers
- n^2-linear or pseudo-linear fluid layers with Airy-function solutions
- Homogeneous elastic layers with compressional and shear potentials
- Point-source kernels in fluid and elastic media
- Upgoing and downgoing conical-wave decomposition

**Physical interpretation**
- WI is not restricted to ideal fluid stacks; it naturally accommodates elastic bottoms and more realistic layer physics.
- The layer solutions make it easy to see how compressional and shear content enter the propagation problem.

**Cross-links**
- `chapters/ch05-normal-modes.md`
- `chapters/ch07-fd-fe-methods.md`
- `solvers/solver-oases.md`

### Boundary conditions and attenuation in layered media
The next block imposes interface physics and introduces lossy media in spectral form.

**Key equations and topics**
- Fluid-fluid, fluid-solid, and solid-solid boundary conditions
- Continuity and vanishing-stress conditions
- Complex wavenumbers for attenuation
- Compression and shear quality factors
- Physically admissible attenuation constraints

**Why it matters**
- In layered propagation, interface conditions are where the real coupling physics lives.
- Attenuation is not a cosmetic tweak; it controls leakage, bottom loss, and the finiteness of some spectral responses.

**Cross-links**
- `chapters/ch01-fundamentals.md`
- `chapters/ch02-wave-propagation-theory.md`
- `solvers/solver-oases.md`

### Numerical solution of the depth equation: DGM and stability
The implementation core of the chapter is how to solve the layered depth problem stably over the full wavenumber spectrum.

**Key equations and topics**
- Numerical solution of the depth equation
- Direct Global Matrix (DGM) approach
- Local-to-global coefficient mapping
- Numerical stability in the evanescent regime
- Stable versus unstable assembly choices
- Advantages and disadvantages of DGM

**Best-fit scenarios**
- Many-layer problems where the field is needed at many depths or ranges
- Cases where unconditional stability in strongly evanescent regimes is important
- General-purpose layered solvers rather than minimal problem-specific codes

**Limitations**
- Memory use grows with the number of layers
- Local-to-global assembly is more elaborate than simpler recursive schemes

**Cross-links**
- `chapters/ch07-fd-fe-methods.md`
- `solvers/solver-scooter.md`
- `solvers/solver-oases.md`

### Propagator matrices, invariant embedding, and recursive FFP-style computation
The chapter also reviews recursive alternatives to DGM that trade generality and stability differently.

**Key equations and topics**
- Propagator matrix approach
- Recursive transfer between interfaces
- Invariant embedding interpretation
- Computational efficiency versus numerical fragility tradeoff
- Link to practical Fast Field Program implementations

**Physical interpretation**
- These schemes are attractive because the local matrices are small and recursion is memory-efficient.
- Their main challenge is not conceptual but numerical: stability and conditioning in layered evanescent behavior.

**Cross-links**
- `solvers/solver-scooter.md`
- `workflows/model-selection.md`

### Wavenumber quadrature, aliasing, and contour handling
Once the depth solution exists, the spectral integral still has to be evaluated credibly.

**Key equations and topics**
- Wavenumber integration by numerical quadrature
- Sampling and truncation choices
- Aliasing from poor spectral discretization
- Contour integration and alternative numerical paths
- Coupling between frequency sampling and wavenumber sampling

**Why it matters**
- Many visible WI artifacts are quadrature artifacts, not propagation physics.
- Spectral sampling is as central to credibility here as spatial mesh choice is in FD or FE methods.

**Cross-links**
- `chapters/ch08-broadband-modeling.md`
- `workflows/model-selection.md`
- `solvers/solver-scooter.md`

### Range dependence, 3D WI, and stratified-ocean scattering
The later material extends the method beyond the simplest layered forward problem.

**Key equations and topics**
- Range-dependent propagation extensions
- Three-dimensional wavenumber integration
- Stratified-ocean scattering and reverberation
- Use of WI machinery for reverberation-oriented calculations

**Best-fit scenarios**
- Canonical reverberation and layered scattering studies
- Problems where one wants a spectral full-wave reference before using more approximate range-dependent tools
- Cross-checking modal or PE results in layered baselines

**Limitations**
- As range dependence and 3D structure become stronger, WI becomes less natural and more cumbersome than PE or other specialized methods.
- The layered assumption remains the dominant modeling boundary.

**Cross-links**
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch10-signals-in-noise.md`
- `solvers/solver-scooter.md`
- `solvers/solver-oases.md`

## Key sections from the TOC
- 4.1 Introduction
- 4.2 Mathematical Derivation
- 4.2.1 Integral Transform Solution
- 4.2.2 Homogeneous Fluid Layers
- 4.2.3 n^2-Linear Fluid Layers
- 4.2.4 Homogeneous Elastic Layers
- 4.2.5 Boundary Conditions
- 4.2.6 Attenuation
- 4.3 Numerical Solution of the Depth Equation
- 4.3.1 Direct Global Matrix Approach
- 4.3.2 Propagator Matrix Approach
- 4.5 Wavenumber Integration
- 4.5.3 Wavenumber Discretization: Aliasing
- 4.7 Range-Dependent Propagation
- 4.8 3-D Wavenumber Integration
- 4.9 Scattering and Reverberation in a Stratified Ocean

## Research takeaways
- Ch. 4 is the main spectral full-wave chapter for layered ocean acoustics and the conceptual home of FFP-style solvers.
- The practical choice inside WI is often not just solver family but stability strategy: DGM, propagator matrices, or related recursive formulations.
- Aliasing, truncation, and evanescent-regime stability are first-order modeling issues, not implementation footnotes.

## Comparison to neighboring chapters
- Compared with `chapters/ch03-ray-methods.md`, WI gives up high-frequency path intuition in exchange for full-wave layered fidelity.
- Compared with `chapters/ch05-normal-modes.md`, it evaluates the spectral integral directly rather than reorganizing the solution around modal residues.
- Compared with `chapters/ch06-parabolic-equations.md`, it is more exact for stratified media but less natural for strongly range-dependent forward problems.

## Good follow-on notes
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch05-normal-modes.md`
- `chapters/ch06-parabolic-equations.md`
- `chapters/ch07-fd-fe-methods.md`
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`
- `solvers/solver-scooter.md`
- `solvers/solver-oases.md`
- `workflows/model-selection.md`
