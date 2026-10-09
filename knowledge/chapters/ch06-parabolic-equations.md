---
title: COA Chapter 6 - Parabolic Equations
type: chapter-note
chapter: 6
book_pages: 457-530
pdf_pages: 473-545
source_pdf: /home/jay/Zotero/storage/B4W6S79R/Jensen 等 - 2011 - Computational Ocean Acoustics.pdf
status: expanded
---

# COA Chapter 6 - Parabolic Equations

## Summary
Parabolic-equation methods approximate Helmholtz propagation by a forward-marching wave equation, making them the main practical full-wave tool for range-dependent ocean acoustics. They balance physical fidelity and computational cost better than many alternatives in long-range operational settings.

## Core problem
How to compute coherent underwater propagation efficiently in range-dependent environments while retaining interference, diffraction, and phase structure beyond geometric acoustics.

## Method-selection snapshot
- Best for forward propagation in range-dependent environments where coherent full-wave structure matters.
- Best for long-range transmission-loss prediction, replica-field generation, and practical shallow-water modeling.
- Weak when strong backscatter, large-angle violation, or globally exact two-way behavior is essential.

## Major subsections

### Derivation of the PE and the one-way approximation
The chapter starts from Helmholtz propagation and factors the wave operator into forward and backward parts, then keeps the forward branch.

**Key equations and topics**
- Helmholtz starting point
- One-way factorization of the wave operator
- Standard PE derivation
- Generalized and wide-angle PE forms
- Square-root operator approximation

**Physical interpretation**
- PE keeps forward wave evolution while discarding most backward-traveling content.
- It is a wave method, not just a geometric approximation, so it can capture interference and diffraction within its validity range.

**Cross-links**
- `chapters/ch02-wave-propagation-theory.md`
- `chapters/ch03-ray-methods.md`

### Phase errors and angular limitations
This subsection defines when the PE is trustworthy and when it is being pushed beyond its assumptions.

**Key equations and topics**
- Small-angle versus wide-angle approximations
- Phase error accumulation with range
- Angular validity of rational or polynomial approximations
- Limits for steep rays and strong bottom interaction

**Why it matters**
- PE accuracy is often limited less by coding and more by mismatch between propagation angles and the chosen approximation.
- Wide-angle claims should always be tied to the actual PE form used.

**Cross-links**
- `workflows/model-selection.md`
- `chapters/ch05-normal-modes.md`

### Elastic PE and boundary complexity
The chapter extends PE ideas to more realistic seabed conditions and multi-physics settings.

**Key equations and topics**
- Elastic PE extensions
- Bottom interaction and interface handling
- Compressional and shear effects
- Practical treatment of layered sediments

**Best-fit scenarios**
- Range-dependent environments with bottom sensitivity
- Shelf and shallow-water propagation where seabed physics changes the field materially

**Limitations**
- Elastic PE adds physical scope but also approximation complexity
- Validation against other solvers becomes more important as interfaces get richer

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch07-fd-fe-methods.md`

### Starting fields and source representation
Because PE marches forward in range, it needs an initial field that injects the source consistently.

**Key equations and topics**
- Numerical and analytical starter fields
- Source initialization for monopoles and beams
- Starter-field consistency with PE approximation
- Effects of poor initialization on phase and amplitude

**Why it matters**
- A bad starter can contaminate the whole march, especially near the source or in coherent processing tasks.
- Starter design is one of the hidden practical details that separates usable PE runs from misleading ones.

**Cross-links**
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`

### Split-step Fourier solutions
This is one of the main numerical workhorses of PE modeling.

**Key equations and topics**
- Split-step FFT marching
- Alternation between spatial and spectral domains
- Refraction and diffraction handled in separate substeps
- Error behavior and step-size sensitivity

**Best-fit scenarios**
- Long-range forward propagation in range-dependent media
- Operational runs where speed matters without giving up coherent phase

**Limitations**
- Numerical dispersion and step-size choices can matter greatly
- Spectral assumptions interact with boundary treatment and grid design

**Cross-links**
- `chapters/ch04-wavenumber-integration.md`
- `chapters/ch08-broadband-modeling.md`

### FD and FE implementations of PE
The chapter also presents discretized PE formulations beyond split-step FFT methods.

**Key equations and topics**
- Finite-difference PE
- Finite-element PE
- Matrix-based marching schemes
- Tradeoffs in boundary treatment, irregular geometry, and stability

**Best-fit scenarios**
- Problems where geometry or boundary conditions weaken pure split-step convenience
- Situations that need more direct control over local discretization

**Cross-links**
- `chapters/ch07-fd-fe-methods.md`
- `workflows/model-selection.md`

### Energy conservation and numerical credibility
This subsection is the chapter's practical caution: even when the PE is conceptually suitable, numerical marching can still create unphysical behavior.

**Key equations and topics**
- Energy conservation issues in PEs
- Marching-induced loss or gain
- Diagnostics for numerical consistency
- Interaction between approximation and implementation error

**Why it matters**
- PE is often trusted as an engineering default, so hidden numerical drift can quietly affect conclusions.
- Phase-coherent downstream tasks are especially sensitive to such errors.

**Cross-links**
- `chapters/ch10-signals-in-noise.md`
- `workflows/model-selection.md`

### Three-dimensional PE
The later material generalizes PE to azimuthal or cross-range variation and more realistic geometries.

**Key equations and topics**
- 3D PE formulations
- Horizontal refraction and out-of-plane effects
- Increased computational burden and approximation choices
- Practical examples of 3D propagation

**Best-fit scenarios**
- Cases where 2D vertical-slice assumptions are not enough
- Operational environments with cross-range structure or horizontal ducting effects

**Limitations**
- Cost rises quickly
- One-way assumptions and approximation choices remain central even in 3D

**Cross-links**
- `chapters/ch05-normal-modes.md`
- `chapters/ch10-signals-in-noise.md`

## Key sections from the TOC
- 6.2 Derivation of Parabolic Equations
- 6.2.4 Phase Errors and Angular Limitations
- 6.4 Starting Fields
- 6.5 Solutions by FFTs
- 6.6 Solutions by FDs and FEs
- 6.7 The Problem of Energy Conservation in PEs
- 6.8 Three-Dimensional PEs

## Research takeaways
- PE is often the default engineering solver for range-dependent ocean acoustics because it keeps coherent wave physics at workable cost.
- The real decision is not just "use PE" but which angular approximation, starter field, dimensionality, and boundary treatment fit the scenario.
- Replica-field applications inherit PE phase assumptions directly, so solver choice and numerical settings matter downstream.

## Comparison to neighboring chapters
- Compared with `chapters/ch03-ray-methods.md`, PE is slower and less intuitive but far better for diffraction and coherent interference.
- Compared with `chapters/ch05-normal-modes.md`, PE is more natural for strong range dependence, while modes remain more interpretable in stratified waveguides.
- Compared with `chapters/ch08-broadband-modeling.md`, this chapter provides one of the main narrowband engines used before Fourier synthesis.

## Good follow-on notes
- `chapters/ch05-normal-modes.md`
- `chapters/ch08-broadband-modeling.md`
- `chapters/ch10-signals-in-noise.md`
- `solvers/solver-ram.md`
- `workflows/model-selection.md`
